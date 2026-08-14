"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clearVendorToken, getVendorToken } from "@/lib/vendor-session";
import { SiteLogoLink } from "@/components/SiteLogo";

const nav = [
  { href: "/vendor", label: "Dashboard", exact: true },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/orders", label: "Orders" },
  { href: "/vendor/insights", label: "Insights" },
];

export default function VendorLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/vendor/login";
  const [ready, setReady] = useState(isLogin);
  const [name, setName] = useState("");

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    const token = getVendorToken();
    if (!token) {
      router.replace("/vendor/login");
      return;
    }
    api<{ vendor: { businessName: string } }>("/marketplace/vendors/me", { token })
      .then((r) => {
        setName(r.vendor.businessName);
        setReady(true);
      })
      .catch(() => {
        clearVendorToken();
        router.replace("/vendor/login");
      });
  }, [isLogin, pathname, router]);

  async function logout() {
    const token = getVendorToken();
    if (token) {
      try {
        await api("/marketplace/vendors/logout", { method: "POST", token });
      } catch {
        /* ignore */
      }
    }
    clearVendorToken();
    router.push("/vendor/login");
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Loading vendor portal…
      </div>
    );
  }

  if (isLogin) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <SiteLogoLink size="mobile" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Vendor Account</p>
              <p className="text-sm font-semibold text-primary">{name || "Partner"}</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    active ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/become-a-vendor"
              className="rounded-full px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              Partner info
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
