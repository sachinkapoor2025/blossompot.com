import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  commitSignedInUser,
  isExplicitLogout,
  loadStoredAuth,
  login,
  logout,
  restoreSession,
  setSessionSdkLoaderForTests,
  shouldLoadCognitoSdk,
  storeAuth,
  type AuthUser,
} from "./cognito";

const root = dirname(fileURLToPath(import.meta.url));
const LOGOUT_MARKER_KEY = "hr_ecom_logged_out";
const AUTH_KEY = "hr_ecom_auth";

describe("cognito sdk deferral", { concurrency: false }, () => {
  it("keeps the Cognito SDK out of the auth module's static imports", () => {
    const source = readFileSync(join(root, "cognito.ts"), "utf8");
    assert.equal(source.includes('from "amazon-cognito-identity-js"'), false);
    assert.match(source, /import\("\.\/cognito-sdk"\)/);
  });

  it("does not load the SDK for an anonymous visitor", () => {
    assert.equal(
      shouldLoadCognitoSdk({ configured: true, hasBrowserSession: false, storedToken: null }),
      false
    );
  });

  it("does not load the SDK when the stored token is still valid", () => {
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    assert.equal(
      shouldLoadCognitoSdk({ configured: true, hasBrowserSession: true, storedToken: token }),
      false
    );
  });

  it("loads the SDK when a Cognito browser session has no usable token", () => {
    assert.equal(
      shouldLoadCognitoSdk({ configured: true, hasBrowserSession: true, storedToken: null }),
      true
    );
    const expired = jwt({ exp: Math.floor(Date.now() / 1000) - 10 });
    assert.equal(
      shouldLoadCognitoSdk({ configured: true, hasBrowserSession: true, storedToken: expired }),
      true
    );
  });

  it("loads the exit-intent popup only after it is eligible", () => {
    const widgets = readFileSync(join(root, "../components/ClientDeferredWidgets.tsx"), "utf8");
    assert.equal(widgets.includes('from "@/components/ExitIntentPopup"'), false);
    assert.match(widgets, /import\("@\/components\/ExitIntentPopup"\)/);
  });

  describe("cognito logout race", { concurrency: false }, () => {
  const originalEnv = {
    pool: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    client: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    dev: process.env.NEXT_PUBLIC_DEV_AUTH,
  };
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = new Map();
    const memory = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    };
    Object.defineProperty(globalThis, "window", { value: globalThis, configurable: true });
    Object.defineProperty(globalThis, "localStorage", { value: memory, configurable: true });
    delete process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    delete process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    delete process.env.NEXT_PUBLIC_DEV_AUTH;
    setSessionSdkLoaderForTests(null);
  });

  afterEach(() => {
    restoreEnv("NEXT_PUBLIC_COGNITO_USER_POOL_ID", originalEnv.pool);
    restoreEnv("NEXT_PUBLIC_COGNITO_CLIENT_ID", originalEnv.client);
    restoreEnv("NEXT_PUBLIC_DEV_AUTH", originalEnv.dev);
    setSessionSdkLoaderForTests(null);
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { localStorage?: unknown }).localStorage;
    delete (globalThis as { document?: unknown }).document;
  });

  it("blocks restoration when a logout marker exists beside LastAuthUser and a refresh token", async () => {
    const email = "shopper@example.com";
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    storage.set(LOGOUT_MARKER_KEY, "1");
    storage.set("CognitoIdentityServiceProvider.client.LastAuthUser", email);
    storage.set(`CognitoIdentityServiceProvider.client.${email}.refreshToken`, "still-valid-refresh");
    storage.set(AUTH_KEY, JSON.stringify(account(email, token)));
    configureCognito();

    assert.equal(
      shouldLoadCognitoSdk({ configured: true, hasBrowserSession: true, storedToken: token }),
      false
    );
    assert.equal(loadStoredAuth(), null);
    assert.equal(await restoreSession(), null);
    assert.equal(storage.get(AUTH_KEY)?.includes(email), true);
  });

  it("does not restore the previous user when session init overlaps a pending logout", async () => {
    const previous = account("shopper@example.com", jwt({ exp: Math.floor(Date.now() / 1000) - 10 }));
    let restores = 0;
    let releaseSdk: (sdk: SessionStub) => void = () => {};
    const sdkGate = new Promise<SessionStub>((resolve) => {
      releaseSdk = resolve;
    });
    setSessionSdkLoaderForTests(() => sdkGate);
    configureCognito();
    storage.set(lastAuthKey(), previous.email);
    storage.set(refreshKey(previous.email), "still-valid-refresh");
    storeAuth(previous);

    const first = restoreSession();
    const second = restoreSession();
    logout();
    releaseSdk(sdkStub({
      restoreCognitoSession: async () => {
        restores += 1;
        storeAuth(previous);
        return previous;
      },
    }));

    assert.equal(await first, null);
    assert.equal(await second, null);
    assert.equal(restores, 0);
    assert.equal(loadStoredAuth(), null);
    assert.equal(isExplicitLogout(), true);
    assert.equal(storage.has(AUTH_KEY), false);
  });

  it("clears the logout marker on a successful sign-in and allows later recovery", async () => {
    const email = "shopper@example.com";
    const signedIn = account(email, jwt({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    storage.set(LOGOUT_MARKER_KEY, "1");
    storage.set(AUTH_KEY, JSON.stringify(account(email, "dev:old")));

    const committed = commitSignedInUser(signedIn);
    assert.equal(isExplicitLogout(), false);
    assert.equal(loadStoredAuth()?.token, committed.token);

    logout();
    assert.equal(isExplicitLogout(), true);
    configureCognito();
    setSessionSdkLoaderForTests(async () => sdkStub({}));
    await assert.rejects(() => login(email, "wrong"), /rejected sign-in/);
    assert.equal(isExplicitLogout(), true);

    setSessionSdkLoaderForTests(async () => sdkStub({
      signIn: async () => signedIn,
    }));
    const again = await login(email, "secret");
    assert.equal(isExplicitLogout(), false);
    assert.equal(again.email, email);
    assert.equal(loadStoredAuth()?.email, email);

    storage.delete(AUTH_KEY);
    storage.set(lastAuthKey(), email);
    storage.set(refreshKey(email), "still-valid-refresh");
    let restores = 0;
    const refreshed = account(email, jwt({ exp: Math.floor(Date.now() / 1000) + 7200 }));
    setSessionSdkLoaderForTests(async () => sdkStub({
      restoreCognitoSession: async () => {
        restores += 1;
        storeAuth(refreshed);
        return refreshed;
      },
    }));
    const recovered = await restoreSession();
    assert.equal(restores, 1);
    assert.equal(recovered?.token, refreshed.token);
    assert.equal(loadStoredAuth()?.token, refreshed.token);
  });

  it("stays signed out when Cognito sign-out fails", async () => {
    const previous = account("shopper@example.com", jwt({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    let restores = 0;
    configureCognito();
    setSessionSdkLoaderForTests(async () => sdkStub({
      signOutCurrentUser() {
        throw new Error("network");
      },
      restoreCognitoSession: async () => {
        restores += 1;
        storeAuth(previous);
        return previous;
      },
    }));
    storage.set(lastAuthKey(), previous.email);
    storage.set(refreshKey(previous.email), "still-valid-refresh");
    storeAuth(previous);

    logout();
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(storage.has(AUTH_KEY), false);
    assert.equal(isExplicitLogout(), true);
    assert.equal(loadStoredAuth(), null);
    assert.equal(await restoreSession(), null);
    assert.equal(restores, 0);
    storage.set(AUTH_KEY, JSON.stringify(previous));
    assert.equal(loadStoredAuth(), null);
    assert.equal(await restoreSession(), null);
  });

  it("still refreshes an expired token when the shopper has not logged out", async () => {
    const email = "shopper@example.com";
    const expired = account(email, jwt({ exp: Math.floor(Date.now() / 1000) - 120 }));
    const refreshed = account(email, jwt({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    let restores = 0;
    configureCognito();
    setSessionSdkLoaderForTests(async () => sdkStub({
      restoreCognitoSession: async () => {
        restores += 1;
        storeAuth(refreshed);
        return refreshed;
      },
    }));
    storage.set(lastAuthKey(), email);
    storage.set(refreshKey(email), "still-valid-refresh");
    storage.set(AUTH_KEY, JSON.stringify(expired));

    assert.equal(isExplicitLogout(), false);
    assert.equal(
      shouldLoadCognitoSdk({ configured: true, hasBrowserSession: true, storedToken: expired.token }),
      true
    );
    const recovered = await restoreSession();
    assert.equal(restores, 1);
    assert.equal(recovered?.token, refreshed.token);
    assert.equal(loadStoredAuth()?.token, refreshed.token);
  });

  it("does not sign the user in from malformed stored auth", () => {
    storage.set(AUTH_KEY, "{not-json");
    assert.equal(loadStoredAuth(), null);
    assert.equal(storage.get(AUTH_KEY), "{not-json");

    storage.set(AUTH_KEY, JSON.stringify(account("shopper@example.com", "not-a-jwt")));
    assert.equal(loadStoredAuth(), null);
    assert.equal(storage.has(AUTH_KEY), false);
    assert.equal(isExplicitLogout(), false);
  });

  it("keeps a valid stored session until logout, including dev tokens", async () => {
    const email = "shopper@example.com";
    const token = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    storeAuth(account(email, token));
    assert.equal(loadStoredAuth()?.email, email);
    assert.equal(loadStoredAuth()?.token, token);

    logout();
    assert.equal(loadStoredAuth(), null);
    assert.equal(isExplicitLogout(), true);
    assert.equal(storage.has(AUTH_KEY), false);

    process.env.NEXT_PUBLIC_DEV_AUTH = "true";
    const devUser = await login(email, "local");
    assert.equal(devUser.token.startsWith("dev:"), true);
    assert.equal(isExplicitLogout(), false);
    assert.equal(loadStoredAuth()?.token, devUser.token);

    logout();
    storage.set(AUTH_KEY, JSON.stringify(devUser));
    assert.equal(loadStoredAuth(), null);
  });

  it("stores logout in a cookie when localStorage refuses the marker write", async () => {
    let cookie = "";
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        get cookie() {
          return cookie;
        },
        set cookie(value: string) {
          const pair = value.split(";")[0]?.trim() ?? "";
          const name = pair.split("=")[0] ?? "";
          const kept = cookie
            .split(";")
            .map((part) => part.trim())
            .filter((part) => part && !part.startsWith(`${name}=`));
          const expired = /Max-Age=0/i.test(value) || pair.endsWith("=");
          cookie = expired ? kept.join("; ") : [...kept, pair].filter(Boolean).join("; ");
        },
      },
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          if (key === LOGOUT_MARKER_KEY) throw new Error("quota");
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });

    const email = "shopper@example.com";
    const previous = account(email, jwt({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    configureCognito();
    storage.set(lastAuthKey(), email);
    storage.set(refreshKey(email), "still-valid-refresh");
    storeAuth(previous);

    logout();

    assert.equal(storage.has(LOGOUT_MARKER_KEY), false);
    assert.equal(storage.has(AUTH_KEY), false);
    assert.match(cookie, /hr_ecom_logged_out=1/);
    assert.equal(isExplicitLogout(), true);
    assert.equal(loadStoredAuth(), null);

    let restores = 0;
    setSessionSdkLoaderForTests(async () => sdkStub({
      restoreCognitoSession: async () => {
        restores += 1;
        storeAuth(previous);
        return previous;
      },
    }));
    assert.equal(await restoreSession(), null);
    assert.equal(restores, 0);

    const signedIn = account(email, jwt({ exp: Math.floor(Date.now() / 1000) + 7200 }));
    commitSignedInUser(signedIn);
    assert.equal(cookie.includes("hr_ecom_logged_out=1"), false);
    assert.equal(isExplicitLogout(), false);
    assert.equal(loadStoredAuth()?.token, signedIn.token);
  });
  });
});

function jwt(payload: { exp: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${body}.sig`;
}

type SessionStub = {
  restoreCognitoSession: () => Promise<AuthUser | null>;
  signOutCurrentUser: () => void;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: () => Promise<never>;
  confirmRegistration: () => Promise<never>;
  resendCode: () => Promise<never>;
  startForgotPassword: () => Promise<never>;
  confirmNewPassword: () => Promise<never>;
};

function sdkStub(overrides: Partial<SessionStub>): SessionStub {
  return {
    restoreCognitoSession: async () => null,
    signOutCurrentUser() {},
    signIn: async () => Promise.reject(new Error("rejected sign-in")),
    signUp: async () => Promise.reject(new Error("unused")),
    confirmRegistration: async () => Promise.reject(new Error("unused")),
    resendCode: async () => Promise.reject(new Error("unused")),
    startForgotPassword: async () => Promise.reject(new Error("unused")),
    confirmNewPassword: async () => Promise.reject(new Error("unused")),
    ...overrides,
  };
}

function account(email: string, token: string): AuthUser {
  return { email, token, isAdmin: false, isSuperAdmin: false, isEmailMarketer: false };
}

function configureCognito(): void {
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = "pool";
  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = "client";
}

function lastAuthKey(): string {
  return "CognitoIdentityServiceProvider.client.LastAuthUser";
}

function refreshKey(email: string): string {
  return `CognitoIdentityServiceProvider.client.${email}.refreshToken`;
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
