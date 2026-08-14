import { createHash, randomBytes, timingSafeEqual, scryptSync } from "crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { marketplaceVendorKeys } from "@blossompot/shared";
import { docClient, CONFIG_TABLE, now } from "./db";

const SESSION_TTL_DAYS = 14;

export type VendorSession = {
  token: string;
  vendorId: string;
  vendorSlug: string;
  email: string;
  expiresAt: string;
};

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 32).toString("hex");
  return { hash, salt: s };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const { hash } = hashPassword(password, salt);
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(expectedHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function slugifyBusinessName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `vendor-${randomBytes(3).toString("hex")}`;
}

export async function putVendorSession(session: VendorSession): Promise<void> {
  const expiresUnix = Math.floor(new Date(session.expiresAt).getTime() / 1000);
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: marketplaceVendorKeys.sessionPk(session.token),
        SK: marketplaceVendorKeys.sessionSk(),
        ...session,
        expiresAtUnix: expiresUnix,
      },
    })
  );
}

export async function getVendorSession(token: string): Promise<VendorSession | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: {
        PK: marketplaceVendorKeys.sessionPk(token),
        SK: marketplaceVendorKeys.sessionSk(),
      },
    })
  );
  const item = result.Item as VendorSession | undefined;
  if (!item?.vendorId) return null;
  if (item.expiresAt && new Date(item.expiresAt).getTime() < Date.now()) {
    await docClient.send(
      new DeleteCommand({
        TableName: CONFIG_TABLE,
        Key: {
          PK: marketplaceVendorKeys.sessionPk(token),
          SK: marketplaceVendorKeys.sessionSk(),
        },
      })
    );
    return null;
  }
  return item;
}

export async function deleteVendorSession(token: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: CONFIG_TABLE,
      Key: {
        PK: marketplaceVendorKeys.sessionPk(token),
        SK: marketplaceVendorKeys.sessionSk(),
      },
    })
  );
}

export function getVendorBearerToken(event: APIGatewayProxyEventV2): string | null {
  const authHeader = event.headers?.authorization ?? event.headers?.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (token.startsWith("dev:") || token.split(".").length === 3) return null; // cognito/dev
  return token;
}

export async function requireMarketplaceVendor(
  event: APIGatewayProxyEventV2
): Promise<VendorSession | null> {
  const token = getVendorBearerToken(event);
  if (!token) return null;
  return getVendorSession(token);
}

export function sessionExpiryIso(from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d.toISOString();
}

export function fingerprintPasswordSetup(email: string): string {
  return createHash("sha256").update(`vendor-setup:${email.toLowerCase()}`).digest("hex").slice(0, 12);
}
