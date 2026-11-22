import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { cognitoUsername, formatAuthError } from "./cognito";

const originalEnv = process.env.NEXT_PUBLIC_APP_ENV;

afterEach(() => {
  if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_APP_ENV;
  else process.env.NEXT_PUBLIC_APP_ENV = originalEnv;
});

describe("cognito username", () => {
  it("lowercases and trims the email used for sign-in", () => {
    assert.equal(cognitoUsername("  Admin@BlossomPot.com  "), "admin@blossompot.com");
  });

  it("explains that a live-site session is not a dev-site login", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "dev";
    const message = formatAuthError({
      code: "NotAuthorizedException",
      message: "Incorrect username or password.",
    });
    assert.match(message, /dev site keeps its own accounts/);
    assert.match(message, /www\.blossompot\.com/);
  });

  it("keeps the production message to the credential failure", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "prod";
    assert.equal(
      formatAuthError({ code: "NotAuthorizedException", message: "Incorrect username or password." }),
      "Incorrect username or password."
    );
  });
});
