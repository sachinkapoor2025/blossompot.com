"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  isDevAuthEnabled,
  isUnconfirmedError,
  formatAuthError,
} from "@/lib/cognito";
import { AccountDashboard } from "@/components/account/AccountDashboard";

type AuthMode = "login" | "register" | "confirm" | "forgot" | "reset";

function AccountLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/account";
  const {
    user,
    login,
    register,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    confirmForgotPassword,
    logout,
    isAdmin,
    loading: authLoading,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const finishLogin = async () => {
    const authUser = await login(email, password);
    if (redirect.startsWith("/admin") && !authUser.isAdmin) {
      setError("You don't have permission to access that area.");
      logout();
      return;
    }
    router.push(redirect.startsWith("/account") ? redirect : "/account");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "forgot") {
        const delivery = await forgotPassword(email);
        setMode("reset");
        setConfirmCode("");
        setPassword("");
        setConfirmPassword("");
        const destination = delivery.destination ? ` to ${delivery.destination}` : ` to ${email}`;
        setMessage(
          `Password reset code sent${destination}. Enter the code and your new password below. Check spam/junk if it does not arrive within a few minutes.`
        );
        return;
      }

      if (mode === "reset") {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        await confirmForgotPassword(email, confirmCode, password);
        setMessage("Password updated. Signing you in…");
        await finishLogin();
        return;
      }

      if (mode === "confirm") {
        await confirmSignUp(email, confirmCode);
        setMessage("Email verified! Signing you in...");
        await finishLogin();
        return;
      }

      if (mode === "login") {
        await finishLogin();
        return;
      }

      const { userConfirmed, deliveryDestination, deliveryMedium } = await register(email, password, name);
      if (userConfirmed) {
        setMessage("Account created! Signing you in...");
        await finishLogin();
      } else {
        setMode("confirm");
        setConfirmCode("");
        const destination = deliveryDestination ? ` to ${deliveryDestination}` : ` for ${email}`;
        const channel = deliveryMedium ? ` by ${deliveryMedium.toLowerCase()}` : "";
        setMessage(
          `Verification code sent${channel}${destination}. Enter the code below to activate your account. Check your inbox and spam/junk folder if it does not arrive within a few minutes.`
        );
      }
    } catch (err) {
      if (mode === "login" && isUnconfirmedError(err)) {
        setMode("confirm");
        setConfirmCode("");
        setMessage(formatAuthError(err));
        setError("");
      } else if (mode === "forgot") {
        // With PreventUserExistenceErrors, Cognito may still error; show a neutral success path
        const code =
          err && typeof err === "object"
            ? (err as { code?: string; name?: string }).code ?? (err as { name?: string }).name
            : undefined;
        if (code === "UserNotFoundException") {
          setMode("reset");
          setMessage(
            `If an account exists for ${email}, a reset code has been sent. Enter it below with your new password.`
          );
          setError("");
        } else {
          setError(formatAuthError(err));
        }
      } else {
        setError(formatAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    setError("");
    setMessage("");
    setResending(true);
    try {
      if (mode === "reset" || mode === "forgot") {
        const delivery = await forgotPassword(email);
        const destination = delivery.destination ? ` to ${delivery.destination}` : ` to ${email}`;
        setMessage(`Password reset code resent${destination}. Check inbox and spam/junk.`);
        setMode("reset");
      } else {
        await resendConfirmationCode(email);
        setMessage(
          `Verification code requested for ${email}. Check your inbox and spam/junk folder if it does not arrive within a few minutes.`
        );
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setMessage("");
    setConfirmCode("");
    setConfirmPassword("");
    if (next === "forgot" || next === "reset") setPassword("");
  };

  if (authLoading) {
    return <div className="p-16 text-center text-slate-600">Loading account...</div>;
  }

  if (user) {
    return (
      <AccountDashboard
        user={user}
        token={user.token}
        isAdmin={isAdmin}
        onLogout={() => {
          logout();
          router.push("/");
        }}
      />
    );
  }

  const title =
    mode === "confirm"
      ? "Verify Your Email"
      : mode === "forgot"
        ? "Forgot Password"
        : mode === "reset"
          ? "Reset Password"
          : mode === "login"
            ? "Login"
            : "Create Account";

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>

      {isDevAuthEnabled() && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Dev mode: use any email. Include <code>admin</code> in email for admin access (e.g.{" "}
          <strong>admin@shop.com</strong>).
        </p>
      )}

      {mode === "login" && (
        <p className="text-slate-600 text-sm mb-6">
          Secure login with encrypted password protection. Your account details are kept private and safe.
        </p>
      )}

      {mode === "register" && (
        <p className="text-slate-600 text-sm mb-6">
          Secure login with encrypted password protection. Your account details are kept private and safe.
        </p>
      )}

      {mode === "forgot" && (
        <p className="text-slate-600 text-sm mb-6">
          Enter your account email. We&apos;ll send a password reset code so you can choose a new password.
        </p>
      )}

      {mode === "reset" && (
        <p className="text-slate-600 text-sm mb-4">
          Enter the code from your email for <strong>{email || "your account"}</strong>, then choose a new
          password.
        </p>
      )}

      {mode === "confirm" && (
        <p className="text-slate-600 text-sm mb-4">
          Enter the 6-digit code from your email to verify <strong>{email || "your account"}</strong>.
        </p>
      )}

      {(mode === "confirm" || mode === "reset") && (
        <p className="text-amber-800 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          Didn&apos;t receive the code? Check your <strong>spam or junk</strong> folder — auth emails sometimes
          land there. You can also tap &quot;Resend code&quot; below.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        )}

        {(mode === "login" || mode === "register" || mode === "forgot") && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              required
              autoComplete="email"
            />
            {(mode === "login" || mode === "register") && (
              <input
                type="password"
                placeholder="Password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                minLength={8}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            )}
          </>
        )}

        {mode === "confirm" && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              required
              autoComplete="email"
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Verification code"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ""))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest"
              maxLength={6}
              required
              autoComplete="one-time-code"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              minLength={8}
              required
              autoComplete="current-password"
            />
          </>
        )}

        {mode === "reset" && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              required
              autoComplete="email"
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Reset code from email"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ""))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-center text-lg tracking-widest"
              maxLength={6}
              required
              autoComplete="one-time-code"
            />
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              minLength={8}
              required
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-nav text-white py-3 rounded-lg font-semibold hover:bg-primary transition disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : mode === "confirm"
              ? "Verify & sign in"
              : mode === "forgot"
                ? "Send reset code"
                : mode === "reset"
                  ? "Update password & sign in"
                  : mode === "login"
                    ? "Login"
                    : "Register"}
        </button>
      </form>

      {(mode === "confirm" || mode === "reset") && (
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resending || !email}
            className="text-sm text-nav underline hover:text-primary disabled:opacity-50"
          >
            {resending ? "Sending..." : mode === "reset" ? "Resend reset code" : "Resend verification code"}
          </button>
          {mode === "confirm" && (
            <p className="text-sm text-slate-500">
              Wrong email?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-nav underline hover:text-primary"
              >
                Register again
              </button>
            </p>
          )}
          {mode === "reset" && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="block text-sm text-slate-600 underline"
            >
              Back to login
            </button>
          )}
        </div>
      )}

      {mode === "login" && (
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            className="block text-sm text-nav underline hover:text-primary"
          >
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className="block text-sm text-nav underline hover:text-primary"
          >
            Need an account? Register
          </button>
          <button
            type="button"
            onClick={() => switchMode("confirm")}
            className="block text-sm text-slate-600 underline"
          >
            Have a verification code?
          </button>
        </div>
      )}

      {mode === "forgot" && (
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="mt-4 text-sm text-nav underline hover:text-primary"
        >
          Back to login
        </button>
      )}

      {mode === "register" && (
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="mt-4 text-sm text-nav underline hover:text-primary"
        >
          Already have an account? Login
        </button>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Loading...</div>}>
      <AccountLoginForm />
    </Suspense>
  );
}
