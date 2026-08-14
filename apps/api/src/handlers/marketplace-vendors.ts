import { v4 as uuidv4 } from "uuid";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  marketplaceVendorApplicationSchema,
  updateMarketplaceVendorStatusSchema,
  vendorLoginSchema,
  vendorProductUpsertSchema,
  adminApproveVendorProductSchema,
  vendorOrderActionSchema,
  vendorCommissionConfigSchema,
  marketplaceVendorKeys,
  productKeys,
  orderKeys,
  CURRENT_VENDOR_AGREEMENT_VERSION,
  calculateMarketplacePricing,
  resolveCommissionRule,
  suggestSellPriceFromCost,
  scoreVendorHealth,
  type MarketplaceVendor,
  type VendorCommissionConfig,
  type Product,
} from "@blossompot/shared";
import { requireAdmin, requireSuperAdmin } from "../lib/auth";
import { docClient, CONFIG_TABLE, PRODUCTS_TABLE, ORDERS_TABLE, now } from "../lib/db";
import { ok, created, badRequest, forbidden, unauthorized, notFound } from "../lib/response";
import { sendEmail } from "../lib/email";
import {
  hashPassword,
  verifyPassword,
  newSessionToken,
  putVendorSession,
  requireMarketplaceVendor,
  deleteVendorSession,
  sessionExpiryIso,
  slugifyBusinessName,
} from "../lib/vendor-auth";

type StoredVendor = MarketplaceVendor & {
  PK: string;
  SK: string;
  passwordHash?: string;
  passwordSalt?: string;
};

function parseBody(event: APIGatewayProxyEventV2) {
  try {
    return JSON.parse(event.body ?? "{}");
  } catch {
    return null;
  }
}

const DEFAULT_COMMISSION: VendorCommissionConfig = {
  global: { mode: "percentage", value: 20 },
  byCategory: {
    flowers: { mode: "percentage", value: 20 },
    "flower-bouquets": { mode: "percentage", value: 20 },
    cakes: { mode: "percentage", value: 25 },
    "gift-hampers": { mode: "percentage", value: 15 },
  },
  byVendorSlug: {},
  paymentProcessingFeePercent: 2.9,
  paymentProcessingFeeFixed: 0.3,
};

async function getCommissionConfig(): Promise<VendorCommissionConfig> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: {
        PK: marketplaceVendorKeys.commissionsPk(),
        SK: marketplaceVendorKeys.commissionsSk(),
      },
    })
  );
  if (!result.Item) return DEFAULT_COMMISSION;
  const parsed = vendorCommissionConfigSchema.safeParse(result.Item);
  return parsed.success ? parsed.data : DEFAULT_COMMISSION;
}

function toPublicVendor(v: StoredVendor): MarketplaceVendor {
  const { passwordHash: _h, passwordSalt: _s, PK: _pk, SK: _sk, ...rest } = v;
  return rest as MarketplaceVendor;
}

async function listVendors(): Promise<StoredVendor[]> {
  const items: StoredVendor[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: CONFIG_TABLE,
        FilterExpression: "begins_with(PK, :p) AND SK = :sk",
        ExpressionAttributeValues: {
          ":p": marketplaceVendorKeys.pkPrefix(),
          ":sk": marketplaceVendorKeys.sk(),
        },
        ExclusiveStartKey,
      })
    );
    items.push(...((result.Items ?? []) as StoredVendor[]));
    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);
  return items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

async function getVendorById(vendorId: string): Promise<StoredVendor | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: {
        PK: marketplaceVendorKeys.pk(vendorId),
        SK: marketplaceVendorKeys.sk(),
      },
    })
  );
  return (result.Item as StoredVendor) ?? null;
}

async function getVendorIdByEmail(email: string): Promise<string | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: {
        PK: marketplaceVendorKeys.emailPk(email),
        SK: marketplaceVendorKeys.emailSk(),
      },
    })
  );
  return (result.Item?.vendorId as string) ?? null;
}

async function notifyVendor(email: string, subject: string, html: string) {
  try {
    await sendEmail({
      to: email,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
  } catch (err) {
    console.error("vendor notify failed", err);
  }
}

async function notifyAdminVendors(subject: string, html: string) {
  const to = process.env.NOTIFY_EMAIL || "order@blossompot.com";
  try {
    await sendEmail({
      to,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
  } catch (err) {
    console.error("admin vendor notify failed", err);
  }
}

async function getVendorBySlug(vendorSlug: string): Promise<StoredVendor | null> {
  const lookup = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: {
        PK: marketplaceVendorKeys.slugPk(vendorSlug),
        SK: marketplaceVendorKeys.slugSk(),
      },
    })
  );
  const vendorId = lookup.Item?.vendorId as string | undefined;
  if (!vendorId) return null;
  return getVendorById(vendorId);
}

/** Public: vendor recruitment application. */
export async function applyMarketplaceVendor(event: APIGatewayProxyEventV2) {
  const body = parseBody(event);
  if (!body) return badRequest("Invalid JSON");
  const parsed = marketplaceVendorApplicationSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const input = parsed.data;
  const existingId = await getVendorIdByEmail(input.email);
  if (existingId) return badRequest("An application already exists for this email");

  const vendorId = uuidv4();
  let vendorSlug = slugifyBusinessName(input.businessName);
  const slugClash = await docClient.send(
    new GetCommand({
      TableName: CONFIG_TABLE,
      Key: {
        PK: marketplaceVendorKeys.slugPk(vendorSlug),
        SK: marketplaceVendorKeys.slugSk(),
      },
    })
  );
  if (slugClash.Item) vendorSlug = `${vendorSlug}-${vendorId.slice(0, 6)}`;

  const ts = now();
  const vendor: StoredVendor = {
    PK: marketplaceVendorKeys.pk(vendorId),
    SK: marketplaceVendorKeys.sk(),
    vendorId,
    vendorSlug,
    status: "pending",
    businessName: input.businessName,
    contactName: input.contactName,
    email: input.email.toLowerCase(),
    phone: input.phone,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 || undefined,
    city: input.city,
    state: input.state,
    zip: input.zip,
    website: input.website || undefined,
    instagram: input.instagram,
    facebook: input.facebook,
    businessType: input.businessType,
    productCategories: input.productCategories,
    deliveryZone: {
      zipCodes: input.deliveryZips,
      cities: [input.city],
      sameDay: input.sameDayAvailable,
      nextDay: true,
      cutoffTimeLocal: "14:00",
      deliveryFee: input.deliveryFee,
      freeDeliveryThreshold: undefined,
    },
    sameDayAvailable: input.sameDayAvailable,
    businessHours: input.businessHours,
    yearsInBusiness: input.yearsInBusiness,
    taxId: input.taxId,
    paymentNotes: input.paymentNotes,
    minimumOrderValue: input.minimumOrderValue,
    deliveryFee: input.deliveryFee,
    leadTimeHours: input.leadTimeHours,
    notes: input.notes,
    logoUrl: input.logoUrl || undefined,
    storePhotoUrls: input.storePhotoUrls,
    documentUrls: input.documentUrls,
    agreementVersion: input.agreementVersion || CURRENT_VENDOR_AGREEMENT_VERSION,
    agreementAcceptedAt: ts,
    createdAt: ts,
    updatedAt: ts,
  };

  await docClient.send(new PutCommand({ TableName: CONFIG_TABLE, Item: vendor }));
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: marketplaceVendorKeys.emailPk(input.email),
        SK: marketplaceVendorKeys.emailSk(),
        vendorId,
        vendorSlug,
      },
    })
  );
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: marketplaceVendorKeys.slugPk(vendorSlug),
        SK: marketplaceVendorKeys.slugSk(),
        vendorId,
      },
    })
  );

  await notifyAdminVendors(
    `New vendor application: ${input.businessName}`,
    `<p><strong>${input.businessName}</strong> applied to join BlossomPot.</p>
     <p>${input.contactName} · ${input.email} · ${input.phone}</p>
     <p>${input.city}, ${input.state} ${input.zip} · ${input.businessType}</p>
     <p><a href="https://www.blossompot.com/admin/vendors">Review in admin</a></p>`
  );
  await notifyVendor(
    input.email,
    "We received your BlossomPot vendor application",
    `<p>Hi ${input.contactName},</p>
     <p>Thanks for applying to partner with BlossomPot as <strong>${input.businessName}</strong>.</p>
     <p>Our team will review your application. You will receive an email when your status changes.</p>
     <p>— BlossomPot Vendor Partnerships</p>`
  );

  return created({
    vendorId,
    vendorSlug,
    status: vendor.status,
    message: "Application submitted. We will email you after review.",
  });
}

export async function listMarketplaceVendorsAdmin(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const qs = event.queryStringParameters ?? {};
  let vendors = (await listVendors()).map(toPublicVendor);
  if (qs.status) vendors = vendors.filter((v) => v.status === qs.status);
  if (qs.state) vendors = vendors.filter((v) => v.state.toLowerCase() === qs.state!.toLowerCase());
  if (qs.businessType) vendors = vendors.filter((v) => v.businessType === qs.businessType);
  if (qs.q) {
    const q = qs.q.toLowerCase();
    vendors = vendors.filter(
      (v) =>
        v.businessName.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.vendorSlug.includes(q)
    );
  }

  const stats = {
    total: vendors.length,
    pending: vendors.filter((v) => v.status === "pending" || v.status === "under_review").length,
    active: vendors.filter((v) => v.status === "active" || v.status === "approved").length,
    suspended: vendors.filter((v) => v.status === "suspended").length,
    rejected: vendors.filter((v) => v.status === "rejected").length,
  };

  return ok({ vendors, stats });
}

export async function getMarketplaceVendorAdmin(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const vendorId = event.pathParameters?.vendorId;
  if (!vendorId) return badRequest("vendorId required");
  const vendor = await getVendorById(vendorId);
  if (!vendor) return notFound("Vendor not found");
  return ok({ vendor: toPublicVendor(vendor) });
}

export async function updateMarketplaceVendorStatusAdmin(event: APIGatewayProxyEventV2) {
  const auth = requireAdmin(event);
  if (!auth) return forbidden();
  const vendorId = event.pathParameters?.vendorId;
  if (!vendorId) return badRequest("vendorId required");
  const body = parseBody(event);
  if (!body) return badRequest("Invalid JSON");
  const parsed = updateMarketplaceVendorStatusSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const vendor = await getVendorById(vendorId);
  if (!vendor) return notFound("Vendor not found");

  const ts = now();
  const nextStatus = parsed.data.status;
  const updates: Partial<StoredVendor> = {
    status: nextStatus,
    updatedAt: ts,
    reviewedAt: ts,
    reviewedBy: auth.email,
    reviewNotes: parsed.data.reviewNotes,
  };

  if (
    (nextStatus === "approved" || nextStatus === "active") &&
    parsed.data.temporaryPassword
  ) {
    const { hash, salt } = hashPassword(parsed.data.temporaryPassword);
    updates.passwordHash = hash;
    updates.passwordSalt = salt;
    if (nextStatus === "approved") updates.status = "active";
  }

  const merged = { ...vendor, ...updates };
  await docClient.send(new PutCommand({ TableName: CONFIG_TABLE, Item: merged }));

  const loginHint =
    parsed.data.temporaryPassword && (nextStatus === "approved" || nextStatus === "active")
      ? `<p>Your vendor portal login:</p><p>Email: <strong>${vendor.email}</strong><br/>Temporary password: <strong>${parsed.data.temporaryPassword}</strong></p>
         <p><a href="https://www.blossompot.com/vendor/login">Open vendor portal</a></p>`
      : "";

  await notifyVendor(
    vendor.email,
    `BlossomPot vendor status: ${merged.status}`,
    `<p>Hi ${vendor.contactName},</p>
     <p>Your BlossomPot vendor application for <strong>${vendor.businessName}</strong> is now <strong>${merged.status}</strong>.</p>
     ${parsed.data.reviewNotes ? `<p>Notes: ${parsed.data.reviewNotes}</p>` : ""}
     ${loginHint}
     <p>— BlossomPot Vendor Partnerships</p>`
  );

  return ok({ vendor: toPublicVendor(merged) });
}

export async function vendorLogin(event: APIGatewayProxyEventV2) {
  const body = parseBody(event);
  if (!body) return badRequest("Invalid JSON");
  const parsed = vendorLoginSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const vendorId = await getVendorIdByEmail(parsed.data.email);
  if (!vendorId) return unauthorized("Invalid email or password");
  const vendor = await getVendorById(vendorId);
  if (!vendor?.passwordHash || !vendor.passwordSalt) {
    return unauthorized("Account not activated yet. Wait for approval email.");
  }
  if (vendor.status === "suspended" || vendor.status === "rejected" || vendor.status === "pending") {
    return forbidden(`Account status is ${vendor.status}`);
  }
  if (!verifyPassword(parsed.data.password, vendor.passwordSalt, vendor.passwordHash)) {
    return unauthorized("Invalid email or password");
  }

  const token = newSessionToken();
  const expiresAt = sessionExpiryIso();
  await putVendorSession({
    token,
    vendorId: vendor.vendorId,
    vendorSlug: vendor.vendorSlug,
    email: vendor.email,
    expiresAt,
  });

  return ok({
    token,
    expiresAt,
    vendor: toPublicVendor(vendor),
  });
}

export async function vendorLogout(event: APIGatewayProxyEventV2) {
  const session = await requireMarketplaceVendor(event);
  if (!session) return unauthorized();
  await deleteVendorSession(session.token);
  return ok({ ok: true });
}

export async function vendorMe(event: APIGatewayProxyEventV2) {
  const session = await requireMarketplaceVendor(event);
  if (!session) return unauthorized();
  const vendor = await getVendorById(session.vendorId);
  if (!vendor) return notFound();
  return ok({ vendor: toPublicVendor(vendor) });
}

export async function vendorDashboard(event: APIGatewayProxyEventV2) {
  const session = await requireMarketplaceVendor(event);
  if (!session) return unauthorized();

  const ordersResult = await docClient.send(
    new ScanCommand({
      TableName: ORDERS_TABLE,
      FilterExpression: "contains(vendorSlugs, :vs)",
      ExpressionAttributeValues: { ":vs": session.vendorSlug },
    })
  );
  const orders = (ordersResult.Items ?? []) as Array<{
    status?: string;
    total?: number;
    currency?: string;
    createdAt?: string;
  }>;

  const productsResult = await docClient.send(
    new ScanCommand({
      TableName: PRODUCTS_TABLE,
      FilterExpression: "vendorSlug = :vs",
      ExpressionAttributeValues: { ":vs": session.vendorSlug },
    })
  );
  const products = (productsResult.Items ?? []) as Product[];

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => (o.createdAt ?? "").startsWith(today));
  const byStatus = (s: string) => orders.filter((o) => o.status === s).length;

  const vendor = await getVendorById(session.vendorId);
  const health = scoreVendorHealth(vendor?.performance ?? {});

  return ok({
    summary: {
      todayOrders: todayOrders.length,
      pendingOrders: byStatus("paid") + byStatus("accepted"),
      processingOrders: byStatus("processing"),
      shippedOrders: byStatus("shipped") + byStatus("in_transit") + byStatus("out_for_delivery"),
      completedOrders: byStatus("delivered") + byStatus("complete"),
      cancelledOrders: byStatus("cancelled") + byStatus("refunded"),
      productCount: products.length,
      pendingProductApprovals: products.filter((p) => p.vendorApprovalStatus === "pending_approval")
        .length,
      totalSales: orders
        .filter((o) => o.status !== "cancelled" && o.status !== "refunded" && o.status !== "pending_payment")
        .reduce((s, o) => s + (o.total ?? 0), 0),
      health,
    },
    productsPreview: products.slice(0, 8).map((p) => ({
      slug: p.slug,
      name: p.name,
      vendorApprovalStatus: p.vendorApprovalStatus,
      price: p.price,
      vendorCost: p.vendorCost,
      published: p.published,
    })),
  });
}

export async function vendorListProducts(event: APIGatewayProxyEventV2) {
  const session = await requireMarketplaceVendor(event);
  if (!session) return unauthorized();
  const result = await docClient.send(
    new ScanCommand({
      TableName: PRODUCTS_TABLE,
      FilterExpression: "vendorSlug = :vs",
      ExpressionAttributeValues: { ":vs": session.vendorSlug },
    })
  );
  return ok({ products: result.Items ?? [] });
}

export async function vendorUpsertProduct(event: APIGatewayProxyEventV2) {
  const session = await requireMarketplaceVendor(event);
  if (!session) return unauthorized();
  const body = parseBody(event);
  if (!body) return badRequest("Invalid JSON");
  const parsed = vendorProductUpsertSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const input = parsed.data;
  const commissions = await getCommissionConfig();
  const rule = resolveCommissionRule(commissions, {
    vendorSlug: session.vendorSlug,
    categorySlug: input.categorySlug,
  });
  const suggestedSell =
    input.suggestedRetailPrice ??
    suggestSellPriceFromCost(input.vendorCost, rule.mode === "percentage" ? rule.value : 20);

  const slugBase = slugifyBusinessName(input.name);
  const slug = `${session.vendorSlug}-${slugBase}`.slice(0, 80);
  const ts = now();
  const approvalStatus = input.submitForApproval ? "pending_approval" : "draft";

  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );

  const vendor = await getVendorById(session.vendorId);
  const product: Product & { PK: string; SK: string; GSI1PK?: string; GSI1SK?: string; fulfilledByName?: string } = {
    PK: productKeys.pk(slug),
    SK: productKeys.sk(),
    GSI1PK: productKeys.gsi1pk(input.categorySlug),
    GSI1SK: productKeys.gsi1sk(slug),
    slug,
    name: input.name,
    description: input.description,
    price: existing.Item?.price ?? suggestedSell,
    currency: "USD",
    categorySlug: input.categorySlug,
    images: input.images,
    inventory: input.inventory,
    tags: input.tags,
    vendorSlug: session.vendorSlug,
    vendorCost: input.vendorCost,
    suggestedRetailPrice: input.suggestedRetailPrice,
    minSellPrice: input.minSellPrice,
    prepTimeHours: input.prepTimeHours,
    vendorApprovalStatus: approvalStatus,
    fulfilledByName: vendor?.businessName,
    published: false,
    createdAt: (existing.Item?.createdAt as string) ?? ts,
    updatedAt: ts,
  };

  await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: product }));

  if (approvalStatus === "pending_approval") {
    await notifyAdminVendors(
      `Vendor product pending approval: ${input.name}`,
      `<p>${session.vendorSlug} submitted <strong>${input.name}</strong> (cost $${input.vendorCost}).</p>
       <p><a href="https://www.blossompot.com/admin/vendors">Review products</a></p>`
    );
  }

  return created({ product });
}

export async function adminListVendorProducts(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const qs = event.queryStringParameters ?? {};
  const result = await docClient.send(
    new ScanCommand({
      TableName: PRODUCTS_TABLE,
      FilterExpression: "attribute_exists(vendorSlug) AND vendorSlug <> :empty",
      ExpressionAttributeValues: { ":empty": "" },
    })
  );
  let products = (result.Items ?? []) as Product[];
  if (qs.approvalStatus) {
    products = products.filter((p) => p.vendorApprovalStatus === qs.approvalStatus);
  }
  if (qs.vendorSlug) {
    products = products.filter((p) => p.vendorSlug === qs.vendorSlug);
  }
  return ok({ products });
}

export async function adminApproveVendorProduct(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  const slug = event.pathParameters?.slug;
  if (!slug) return badRequest("slug required");
  const body = parseBody(event);
  if (!body) return badRequest("Invalid JSON");
  const parsed = adminApproveVendorProductSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const existing = await docClient.send(
    new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
    })
  );
  const product = existing.Item as Product | undefined;
  if (!product?.vendorSlug) return notFound("Vendor product not found");

  if (parsed.data.approvalStatus === "approved" && !parsed.data.sellPrice && !product.price) {
    return badRequest("sellPrice is required when approving");
  }

  const ts = now();
  const published = parsed.data.approvalStatus === "approved";
  await docClient.send(
    new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { PK: productKeys.pk(slug), SK: productKeys.sk() },
      UpdateExpression:
        "SET vendorApprovalStatus = :a, published = :p, updatedAt = :u" +
        (parsed.data.sellPrice ? ", price = :price" : "") +
        (parsed.data.seoTitle ? ", seoTitle = :st" : "") +
        (parsed.data.seoDescription ? ", seoDescription = :sd" : ""),
      ExpressionAttributeValues: {
        ":a": parsed.data.approvalStatus,
        ":p": published,
        ":u": ts,
        ...(parsed.data.sellPrice ? { ":price": parsed.data.sellPrice } : {}),
        ...(parsed.data.seoTitle ? { ":st": parsed.data.seoTitle } : {}),
        ...(parsed.data.seoDescription ? { ":sd": parsed.data.seoDescription } : {}),
      },
    })
  );

  const vendor = product.vendorSlug ? await getVendorBySlug(product.vendorSlug) : null;
  if (vendor) {
    await notifyVendor(
      vendor.email,
      `Product ${parsed.data.approvalStatus}: ${product.name}`,
      `<p>Your product <strong>${product.name}</strong> was marked <strong>${parsed.data.approvalStatus}</strong>.</p>
       ${parsed.data.reviewNotes ? `<p>${parsed.data.reviewNotes}</p>` : ""}`
    );
  }

  return ok({ ok: true, slug, approvalStatus: parsed.data.approvalStatus, published });
}

export async function vendorListOrders(event: APIGatewayProxyEventV2) {
  const session = await requireMarketplaceVendor(event);
  if (!session) return unauthorized();

  const result = await docClient.send(
    new ScanCommand({
      TableName: ORDERS_TABLE,
      FilterExpression: "contains(vendorSlugs, :vs)",
      ExpressionAttributeValues: { ":vs": session.vendorSlug },
    })
  );

  const orders = ((result.Items ?? []) as Array<Record<string, unknown>>)
    .map((o) => {
      const items = ((o.items as Array<Record<string, unknown>>) ?? []).filter(
        (i) => i.vendorSlug === session.vendorSlug
      );
      const commissions = undefined;
      return {
        orderId: o.orderId,
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt,
        preferredDeliveryDate: o.preferredDeliveryDate,
        shippingAddress: {
          firstName: (o.shippingAddress as { firstName?: string })?.firstName,
          city: (o.shippingAddress as { city?: string })?.city,
          state: (o.shippingAddress as { state?: string })?.state,
          postalCode: (o.shippingAddress as { postalCode?: string })?.postalCode,
          line1: (o.shippingAddress as { line1?: string })?.line1,
          line2: (o.shippingAddress as { line2?: string })?.line2,
          giftMessage: (o.shippingAddress as { giftMessage?: string })?.giftMessage,
        },
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          vendorCost: i.vendorCost,
          slug: i.slug,
        })),
        vendorPayable: items.reduce(
          (s, i) => s + Number(i.vendorCost ?? 0) * Number(i.quantity ?? 1),
          0
        ),
        commissions,
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  return ok({ orders });
}

export async function vendorUpdateOrder(event: APIGatewayProxyEventV2) {
  const session = await requireMarketplaceVendor(event);
  if (!session) return unauthorized();
  const orderId = event.pathParameters?.orderId;
  if (!orderId) return badRequest("orderId required");
  const body = parseBody(event);
  if (!body) return badRequest("Invalid JSON");
  const parsed = vendorOrderActionSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.message);

  const result = await docClient.send(
    new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { PK: orderKeys.pk(orderId), SK: orderKeys.sk() },
    })
  );
  const order = result.Item as
    | {
        vendorSlugs?: string[];
        status?: string;
        statusHistory?: Array<Record<string, unknown>>;
      }
    | undefined;
  if (!order) return notFound("Order not found");
  if (!order.vendorSlugs?.includes(session.vendorSlug)) return forbidden("Not your order");

  const action = parsed.data.action;
  const statusMap: Record<string, string> = {
    accepted: "accepted",
    preparing: "processing",
    ready: "processing",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    rejected: "on_hold",
  };
  const nextStatus = statusMap[action] ?? order.status;
  const ts = now();
  const history = [
    ...(order.statusHistory ?? []),
    {
      status: nextStatus,
      at: ts,
      note: `Vendor ${session.vendorSlug}: ${action}${parsed.data.note ? ` — ${parsed.data.note}` : ""}`,
    },
  ];

  await docClient.send(
    new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { PK: orderKeys.pk(orderId), SK: orderKeys.sk() },
      UpdateExpression:
        "SET #s = :s, statusHistory = :h, updatedAt = :u" +
        (parsed.data.trackingNumber ? ", trackingNumber = :t" : "") +
        (parsed.data.carrier ? ", carrier = :c" : ""),
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":s": nextStatus,
        ":h": history,
        ":u": ts,
        ...(parsed.data.trackingNumber ? { ":t": parsed.data.trackingNumber } : {}),
        ...(parsed.data.carrier ? { ":c": parsed.data.carrier } : {}),
      },
    })
  );

  await notifyAdminVendors(
    `Vendor ${session.vendorSlug} marked order ${orderId} as ${action}`,
    `<p>Vendor action: <strong>${action}</strong> on order ${orderId}.</p>`
  );

  return ok({ orderId, action, status: nextStatus });
}

export async function getVendorCommissionsAdmin(event: APIGatewayProxyEventV2) {
  if (!requireAdmin(event)) return forbidden();
  return ok({ commissions: await getCommissionConfig() });
}

export async function putVendorCommissionsAdmin(event: APIGatewayProxyEventV2) {
  if (!requireSuperAdmin(event)) return forbidden("Super admin required");
  const body = parseBody(event);
  if (!body) return badRequest("Invalid JSON");
  const parsed = vendorCommissionConfigSchema.safeParse({ ...body, updatedAt: now() });
  if (!parsed.success) return badRequest(parsed.error.message);
  await docClient.send(
    new PutCommand({
      TableName: CONFIG_TABLE,
      Item: {
        PK: marketplaceVendorKeys.commissionsPk(),
        SK: marketplaceVendorKeys.commissionsSk(),
        ...parsed.data,
      },
    })
  );
  return ok({ commissions: parsed.data });
}

export async function previewVendorPricing(event: APIGatewayProxyEventV2) {
  const session = await requireMarketplaceVendor(event);
  const admin = requireAdmin(event);
  if (!session && !admin) return unauthorized();
  const body = parseBody(event);
  if (!body) return badRequest("Invalid JSON");
  const vendorCost = Number(body.vendorCost);
  const sellPrice = Number(body.sellPrice);
  if (!Number.isFinite(vendorCost) || !Number.isFinite(sellPrice)) {
    return badRequest("vendorCost and sellPrice required");
  }
  const commissions = await getCommissionConfig();
  const rule = resolveCommissionRule(commissions, {
    vendorSlug: body.vendorSlug ?? session?.vendorSlug,
    categorySlug: body.categorySlug,
  });
  return ok({
    breakdown: calculateMarketplacePricing({
      vendorCost,
      sellPrice,
      deliveryFee: Number(body.deliveryFee ?? 0),
      commissionMode: rule.mode,
      commissionValue: rule.value,
      paymentProcessingFeePercent: commissions.paymentProcessingFeePercent,
      paymentProcessingFeeFixed: commissions.paymentProcessingFeeFixed,
    }),
    rule,
  });
}

export async function getVendorAgreement(_event: APIGatewayProxyEventV2) {
  return ok({
    version: CURRENT_VENDOR_AGREEMENT_VERSION,
    title: "BlossomPot Vendor Partnership Agreement",
    summary: [
      "BlossomPot acquires customers and processes payments.",
      "You fulfill approved orders to the delivery standard in this agreement.",
      "You provide partner/wholesale pricing when possible so we can promote your products.",
      "Commission is configurable by category and vendor; payouts follow completed orders.",
      "You must maintain product quality, accurate availability, and timely communication.",
      "BlossomPot remains the customer-facing brand; do not solicit customers off-platform for these orders.",
    ],
    effectiveDate: "2026-08-14",
  });
}

/** Public: which marketplace vendors can deliver to a ZIP (coverage gate for catalog). */
export async function marketplaceCoverageByZip(event: APIGatewayProxyEventV2) {
  const zip = (event.queryStringParameters?.zip ?? "").trim();
  if (zip.length < 3) return badRequest("zip query required");
  const vendors = (await listVendors()).filter(
    (v) =>
      (v.status === "active" || v.status === "approved") &&
      (v.deliveryZone?.zipCodes?.some((z) => z === zip || z.startsWith(zip.slice(0, 5))) ||
        v.zip === zip)
  );
  return ok({
    zip,
    available: vendors.length > 0,
    vendorSlugs: vendors.map((v) => v.vendorSlug),
    count: vendors.length,
  });
}
