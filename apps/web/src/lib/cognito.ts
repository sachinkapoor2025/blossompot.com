"use client";

import { isAuthTokenExpired } from "./jwt-expiry";

const STORAGE_KEY = "hr_ecom_auth";
/** Survives reload so a Cognito refresh token cannot undo an explicit logout. */
const LOGOUT_MARKER_KEY = "hr_ecom_logged_out";
const LOGOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function cognitoPoolId(): string {
  return process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID?.trim() ?? "";
}

function cognitoClientId(): string {
  return process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim() ?? "";
}

function devAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_AUTH === "true";
}

export interface AuthUser {
  email: string;
  name?: string;
  token: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Cognito `email` group — /ses-email module */
  isEmailMarketer: boolean;
}

export interface RegisterResult {
  userConfirmed: boolean;
  deliveryDestination?: string;
  deliveryMedium?: string;
}

/**
 * Bumped on logout and on a successful sign-in.
 * In-flight refresh and sign-out calls captured the previous value and must not commit.
 */
let sessionGeneration = 0;

export function captureSessionGeneration(): number {
  return sessionGeneration;
}

export function isSessionGenerationCurrent(generation: number): boolean {
  return generation === sessionGeneration;
}

function bumpSessionGeneration(): number {
  sessionGeneration += 1;
  return sessionGeneration;
}

function hasLogoutCookie(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.cookie.split(";").some((part) => part.trim() === `${LOGOUT_MARKER_KEY}=1`);
  } catch {
    return false;
  }
}

function writeLogoutCookie(): void {
  try {
    document.cookie = `${LOGOUT_MARKER_KEY}=1; Path=/; SameSite=Lax; Max-Age=${LOGOUT_COOKIE_MAX_AGE}`;
  } catch {
    // Nothing durable remains. This document's generation bump still blocks in-flight recovery.
  }
}

function clearLogoutCookie(): void {
  try {
    document.cookie = `${LOGOUT_MARKER_KEY}=; Path=/; SameSite=Lax; Max-Age=0`;
  } catch {
    // A leftover cookie keeps the shopper signed out until a later sign-in clears it.
  }
}

export function isExplicitLogout(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(LOGOUT_MARKER_KEY) === "1") return true;
  } catch {
    // A cookie written on an earlier logout can still name this session.
  }
  return hasLogoutCookie();
}

function markExplicitLogout(): void {
  try {
    localStorage.setItem(LOGOUT_MARKER_KEY, "1");
  } catch {
    // Quota or a blocked localStorage write. The cookie is the reload fallback.
    writeLogoutCookie();
  }
}

function clearExplicitLogout(): void {
  try {
    localStorage.removeItem(LOGOUT_MARKER_KEY);
  } catch {
    // The cookie clear below still retires the fallback marker.
  }
  if (hasLogoutCookie()) clearLogoutCookie();
}

/** Successful sign-in is the only path that retires an explicit logout. */
export function commitSignedInUser(user: AuthUser): AuthUser {
  bumpSessionGeneration();
  clearExplicitLogout();
  storeAuth(user);
  return user;
}

type SessionSdk = Pick<
  typeof import("./cognito-sdk"),
  "restoreCognitoSession" | "signOutCurrentUser" | "signIn" | "signUp" | "confirmRegistration" | "resendCode" | "startForgotPassword" | "confirmNewPassword"
>;

let loadSessionSdk: () => Promise<SessionSdk> = () => import("./cognito-sdk");

/** Tests replace the dynamic import. Production keeps the real SDK loader. */
export function setSessionSdkLoaderForTests(loader: (() => Promise<SessionSdk>) | null): void {
  loadSessionSdk = loader ?? (() => import("./cognito-sdk"));
}

export function isCognitoConfigured(): boolean {
  return Boolean(cognitoPoolId() && cognitoClientId());
}

export function isDevAuthEnabled(): boolean {
  return devAuthEnabled() && !isCognitoConfigured();
}

/** Cognito writes this key without the SDK being imported. */
export function cognitoLastAuthUserKey(): string | null {
  const clientId = cognitoClientId();
  if (!clientId) return null;
  return `CognitoIdentityServiceProvider.${clientId}.LastAuthUser`;
}

export function hasCognitoBrowserSession(): boolean {
  const key = cognitoLastAuthUserKey();
  if (!key || typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(key));
  } catch {
    return false;
  }
}

/**
 * The SDK is needed to refresh or clear a Cognito browser session.
 * A still-valid stored token can drive the account UI without it.
 */
export function shouldLoadCognitoSdk(input: {
  configured: boolean;
  hasBrowserSession: boolean;
  storedToken?: string | null;
}): boolean {
  if (isExplicitLogout()) return false;
  if (!input.configured || !input.hasBrowserSession) return false;
  if (!input.storedToken) return true;
  return isAuthTokenExpired(input.storedToken);
}

function sdk() {
  return loadSessionSdk();
}

export function loadStoredAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  if (isExplicitLogout()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    const user: AuthUser = {
      ...parsed,
      isEmailMarketer: Boolean(parsed.isEmailMarketer ?? parsed.isSuperAdmin),
    };
    if (!user.token || isAuthTokenExpired(user.token)) {
      storeAuth(null);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

function sessionRecoveryBlocked(generation: number): boolean {
  return isExplicitLogout() || !isSessionGenerationCurrent(generation);
}

/** Refresh Cognito ID tokens when the stored JWT is expired or about to expire. */
export function restoreSession(): Promise<AuthUser | null> {
  if (isExplicitLogout()) return Promise.resolve(null);
  const generation = captureSessionGeneration();
  if (!isCognitoConfigured()) return Promise.resolve(loadStoredAuth());
  const stored = loadStoredAuth();
  if (!shouldLoadCognitoSdk({
    configured: true,
    hasBrowserSession: hasCognitoBrowserSession(),
    storedToken: stored?.token,
  })) {
    return Promise.resolve(stored);
  }
  return sdk().then((mod) => {
    if (sessionRecoveryBlocked(generation)) return null;
    return mod.restoreCognitoSession();
  }).then((user) => {
    if (sessionRecoveryBlocked(generation)) return null;
    return user;
  });
}

export function storeAuth(user: AuthUser | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

export function login(email: string, password: string): Promise<AuthUser> {
  if (!isCognitoConfigured() && devAuthEnabled()) {
    const isSuperAdmin = email.toLowerCase().includes("superadmin");
    const isAdmin = isSuperAdmin || email.toLowerCase().includes("admin");
    const isEmailMarketer =
      isSuperAdmin || email.toLowerCase().includes("email") || email.toLowerCase().includes("ses");
    const role = isSuperAdmin
      ? "super-admin"
      : isEmailMarketer && !isAdmin
        ? "email"
        : isAdmin
          ? "admin"
          : "customer";
    const user: AuthUser = {
      email,
      token: `dev:${email}:${role}`,
      isAdmin,
      isSuperAdmin,
      isEmailMarketer,
    };
    return Promise.resolve(commitSignedInUser(user));
  }

  if (!isCognitoConfigured()) {
    return Promise.reject(new Error("Auth not configured. Set Cognito env vars or enable dev auth."));
  }

  return sdk().then((mod) => mod.signIn(email, password).then((user) => commitSignedInUser(user)));
}

export function register(email: string, password: string, name?: string): Promise<RegisterResult> {
  if (!isCognitoConfigured() && devAuthEnabled()) {
    return Promise.resolve({ userConfirmed: true });
  }
  if (!isCognitoConfigured()) {
    return Promise.reject(new Error("Auth not configured."));
  }
  return sdk().then((mod) => mod.signUp(email, password, name));
}

export function logout() {
  const generation = bumpSessionGeneration();
  markExplicitLogout();
  storeAuth(null);
  if (!isCognitoConfigured()) return;
  void sdk()
    .then((mod) => {
      if (!isSessionGenerationCurrent(generation) || !isExplicitLogout()) return;
      try {
        mod.signOutCurrentUser();
      } catch {
        // A failed sign-out leaves the marker in place. The local session stays cleared.
      }
    })
    .catch(() => {
      // Import or network failure must not restore hr_ecom_auth.
    });
}

export function isUnconfirmedError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === "UserNotConfirmedException" ||
    (typeof e.message === "string" && e.message.toLowerCase().includes("not confirmed"))
  );
}

function getAuthErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  return (err as { code?: string; name?: string }).code ?? (err as { name?: string }).name;
}

export function formatAuthError(err: unknown): string {
  const code = getAuthErrorCode(err);
  if (isUnconfirmedError(err)) {
    return "Your email is not verified yet. Enter the code we sent you below.";
  }
  if (code === "CodeDeliveryFailureException") {
    return "Cognito could not send the verification email. Please try resend; if it still fails, contact support.";
  }
  if (code === "LimitExceededException") {
    return "Too many attempts. Please wait a few minutes, then try again.";
  }
  if (code === "UsernameExistsException") {
    return "An account already exists for this email. Log in, or use resend verification code if it is not verified yet.";
  }
  if (code === "InvalidPasswordException") {
    return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
  }
  if (code === "CodeMismatchException" || code === "ExpiredCodeException") {
    return "That reset code is invalid or expired. Request a new code and try again.";
  }
  if (code === "UserNotFoundException") {
    return "If an account exists for that email, a reset code has been sent.";
  }
  if (code === "InvalidParameterException") {
    return "Check that your email is verified and try again. Unverified accounts must confirm email first.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Authentication failed";
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  if (!isCognitoConfigured() && devAuthEnabled()) return Promise.resolve();
  if (!isCognitoConfigured()) return Promise.reject(new Error("Auth not configured."));
  return sdk().then((mod) => mod.confirmRegistration(email, code));
}

export function resendConfirmationCode(email: string): Promise<void> {
  if (!isCognitoConfigured() && devAuthEnabled()) return Promise.resolve();
  if (!isCognitoConfigured()) return Promise.reject(new Error("Auth not configured."));
  return sdk().then((mod) => mod.resendCode(email));
}

export type ForgotPasswordDelivery = {
  deliveryMedium?: string;
  destination?: string;
};

/** Step 1: ask Cognito to email a password-reset code. */
export function forgotPassword(email: string): Promise<ForgotPasswordDelivery> {
  if (!isCognitoConfigured() && devAuthEnabled()) {
    return Promise.resolve({ deliveryMedium: "EMAIL", destination: email });
  }
  if (!isCognitoConfigured()) return Promise.reject(new Error("Auth not configured."));
  return sdk().then((mod) => mod.startForgotPassword(email));
}

/** Step 2: confirm the emailed code and set a new password. */
export function confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
  if (!isCognitoConfigured() && devAuthEnabled()) return Promise.resolve();
  if (!isCognitoConfigured()) return Promise.reject(new Error("Auth not configured."));
  return sdk().then((mod) => mod.confirmNewPassword(email, code, newPassword));
}
