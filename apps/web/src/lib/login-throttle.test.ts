import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { recordFailedLogin, loginLockMessage, clearFailedLogins } from "./login-throttle";

describe("login throttle", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    (globalThis as { sessionStorage: Storage }).sessionStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    };
    clearFailedLogins();
  });

  it("locks after five failed attempts", () => {
    for (let i = 0; i < 4; i++) {
      assert.equal(recordFailedLogin(), null);
    }
    const locked = recordFailedLogin();
    assert.ok(locked);
    assert.match(locked ?? "", /Too many failed sign-in attempts/);
    assert.ok(loginLockMessage());
  });
});
