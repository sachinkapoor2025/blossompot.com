import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAuthTokenExpired } from "./jwt-expiry";

function jwtWithExp(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.sig`;
}

describe("isAuthTokenExpired", () => {
  it("treats missing and malformed tokens as expired", () => {
    assert.equal(isAuthTokenExpired(""), true);
    assert.equal(isAuthTokenExpired("not-a-jwt"), true);
  });

  it("does not expire local dev tokens", () => {
    assert.equal(isAuthTokenExpired("dev:shopper@example.com:customer"), false);
  });

  it("expires a JWT whose exp is in the past", () => {
    assert.equal(isAuthTokenExpired(jwtWithExp(1_700_000_000), 1_800_000_000), true);
  });

  it("keeps a JWT whose exp is still in the future", () => {
    assert.equal(isAuthTokenExpired(jwtWithExp(2_000_000_000), 1_800_000_000), false);
  });
});
