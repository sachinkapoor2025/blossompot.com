"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { setVendorToken } from "@/lib/vendor-session";
import { SiteLogoLink } from "@/components/SiteLogo";

export default function VendorLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api<{ token: string }>("/marketplace/vendors/login", {
        method: "POST",
        body: JSON.stringify({
          email: String(fd.get("email") ?? "").trim(),
          password: String(fd.get("password") ?? ""),
        }),
      });
      setVendorToken(res.token);
      router.replace("/vendor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <SiteLogoLink size="desktop" className="mb-6" />
        <h1 className="text-2xl font-bold text-primary mb-1">Vendor login</h1>
        <p className="text-sm text-slate-600 mb-6">
          Access your BlossomPot partner dashboard after approval.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Not a partner yet?{" "}
          <Link href="/become-a-vendor" className="text-primary font-medium hover:underline">
            Become a vendor
          </Link>
        </p>
      </div>
    </div>
  );
}
