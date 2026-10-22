import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { isAuthTokenExpired } from "./jwt-expiry";
import {
  captureSessionGeneration,
  commitSignedInUser,
  isExplicitLogout,
  isSessionGenerationCurrent,
  loadStoredAuth,
  storeAuth,
  type AuthUser,
  type ForgotPasswordDelivery,
  type RegisterResult,
} from "./cognito";

let pool: CognitoUserPool | null | undefined;

function getPool(): CognitoUserPool | null {
  if (pool !== undefined) return pool;
  const poolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID?.trim();
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
  pool = poolId && clientId ? new CognitoUserPool({ UserPoolId: poolId, ClientId: clientId }) : null;
  return pool;
}

function authUserFromSession(
  email: string,
  session: { getIdToken: () => { getJwtToken: () => string; decodePayload: () => Record<string, unknown> } }
): AuthUser {
  const token = session.getIdToken().getJwtToken();
  const payload = session.getIdToken().decodePayload();
  const groups: string[] = (payload["cognito:groups"] as string[] | undefined) ?? [];
  const isSuperAdmin = groups.includes("super-admin");
  return {
    email,
    name: payload.name as string | undefined,
    token,
    isSuperAdmin,
    isAdmin: groups.includes("admin") || isSuperAdmin,
    isEmailMarketer: groups.includes("email") || isSuperAdmin,
  };
}

function recoveryAbandoned(generation: number): boolean {
  return isExplicitLogout() || !isSessionGenerationCurrent(generation);
}

/** Refresh the Cognito browser session. The caller decides when this module is imported. */
export function restoreCognitoSession(): Promise<AuthUser | null> {
  const generation = captureSessionGeneration();
  if (recoveryAbandoned(generation)) return Promise.resolve(null);

  const userPool = getPool();
  const stored = (() => {
    try {
      const raw = localStorage.getItem("hr_ecom_auth");
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  })();

  if (!userPool) return Promise.resolve(recoveryAbandoned(generation) ? null : loadStoredAuth());

  const current = userPool.getCurrentUser();
  if (!current) {
    if (recoveryAbandoned(generation)) return Promise.resolve(null);
    if (stored && isAuthTokenExpired(stored.token)) storeAuth(null);
    return Promise.resolve(loadStoredAuth());
  }

  return new Promise((resolve) => {
    current.getSession(
      (
        err: Error | null,
        session: {
          isValid: () => boolean;
          getIdToken: () => { getJwtToken: () => string; decodePayload: () => Record<string, unknown> };
        } | null
      ) => {
        if (recoveryAbandoned(generation)) {
          resolve(null);
          return;
        }
        if (err || !session?.isValid()) {
          if (stored?.token && !isAuthTokenExpired(stored.token)) {
            resolve({
              ...stored,
              isEmailMarketer: Boolean(stored.isEmailMarketer ?? stored.isSuperAdmin),
            });
            return;
          }
          storeAuth(null);
          resolve(null);
          return;
        }
        const email = stored?.email || current.getUsername();
        const authUser = authUserFromSession(email, session);
        if (recoveryAbandoned(generation)) {
          resolve(null);
          return;
        }
        storeAuth(authUser);
        resolve(authUser);
      }
    );
  });
}

export function signIn(email: string, password: string): Promise<AuthUser> {
  const userPool = getPool();
  if (!userPool) return Promise.reject(new Error("Auth not configured. Set Cognito env vars or enable dev auth."));

  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const details = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(details, {
      onSuccess: (session) => {
        const authUser = authUserFromSession(email, session);
        resolve(commitSignedInUser(authUser));
      },
      onFailure: (err) => reject(err),
    });
  });
}

export function signUp(email: string, password: string, name?: string): Promise<RegisterResult> {
  const userPool = getPool();
  if (!userPool) return Promise.reject(new Error("Auth not configured."));

  const attrs: CognitoUserAttribute[] = [new CognitoUserAttribute({ Name: "email", Value: email })];
  if (name) attrs.push(new CognitoUserAttribute({ Name: "name", Value: name }));

  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attrs, [], (err, result) => {
      if (err) reject(err);
      else {
        const delivery = result?.codeDeliveryDetails;
        resolve({
          userConfirmed: result?.userConfirmed ?? false,
          deliveryDestination: delivery?.Destination,
          deliveryMedium: delivery?.DeliveryMedium,
        });
      }
    });
  });
}

export function signOutCurrentUser() {
  getPool()?.getCurrentUser()?.signOut();
}

export function confirmRegistration(email: string, code: string): Promise<void> {
  const userPool = getPool();
  if (!userPool) return Promise.reject(new Error("Auth not configured."));
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code.trim(), true, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function resendCode(email: string): Promise<void> {
  const userPool = getPool();
  if (!userPool) return Promise.reject(new Error("Auth not configured."));
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.resendConfirmationCode((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function startForgotPassword(email: string): Promise<ForgotPasswordDelivery> {
  const userPool = getPool();
  if (!userPool) return Promise.reject(new Error("Auth not configured."));
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email.trim().toLowerCase(), Pool: userPool });
    user.forgotPassword({
      onSuccess: () => resolve({}),
      onFailure: (err) => reject(err),
      inputVerificationCode: (data) => {
        resolve({
          deliveryMedium: data?.DeliveryMedium,
          destination: data?.Destination,
        });
      },
    });
  });
}

export function confirmNewPassword(email: string, code: string, newPassword: string): Promise<void> {
  const userPool = getPool();
  if (!userPool) return Promise.reject(new Error("Auth not configured."));
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email.trim().toLowerCase(), Pool: userPool });
    user.confirmPassword(code.trim(), newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}
