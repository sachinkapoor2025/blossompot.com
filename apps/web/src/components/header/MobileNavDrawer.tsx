"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { wishlistEntryHref } from "@/lib/wishlist-href";
import { navItems } from "@/lib/site";

const MobileCitiesPanel = dynamic(
  () => import("@/components/header/HeaderCityMenus").then((m) => m.MobileCitiesPanel),
  { ssr: false }
);

function WishlistMenuLink({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  return (
    <Link
      href={wishlistEntryHref(Boolean(user))}
      onClick={onNavigate}
      className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-primary hover:bg-slate-50"
    >
      Wishlist
    </Link>
  );
}

export function MobileNavDrawer({
  onClose,
  navHref,
  isActive,
  citiesOpen,
  setCitiesOpen,
  cityQuery,
  setCityQuery,
  cityMenuIso,
  setCityMenuIso,
}: {
  onClose: () => void;
  navHref: (item: (typeof navItems)[number]) => string;
  isActive: (href: string, category?: string) => boolean;
  citiesOpen: boolean;
  setCitiesOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  cityQuery: string;
  setCityQuery: (value: string) => void;
  cityMenuIso: string;
  setCityMenuIso: (iso: string) => void;
}) {
  return (
    <aside
      className="md:hidden fixed inset-0 z-[70] flex h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-white"
      style={{ height: "100svh" }}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="font-semibold text-primary">Menu</span>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-nav"
          aria-label="Close menu"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={navHref(item)}
            onClick={onClose}
            className={`block rounded-lg px-4 py-3 text-sm font-semibold ${
              isActive(item.href, "category" in item ? item.category : undefined)
                ? "bg-nav text-white"
                : "text-primary hover:bg-blue-50 hover:text-nav"
            }`}
          >
            {item.label}
          </Link>
        ))}

        <div>
          <button
            type="button"
            onClick={() => setCitiesOpen((v) => !v)}
            className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold ${
              citiesOpen ? "bg-nav text-white" : "text-primary hover:bg-blue-50 hover:text-nav"
            }`}
          >
            Cities
            <span className={`text-xs transition-transform ${citiesOpen ? "rotate-180" : ""}`}>▼</span>
          </button>
          {citiesOpen ? (
            <MobileCitiesPanel
              cityMenuIso={cityMenuIso}
              setCityMenuIso={setCityMenuIso}
              cityQuery={cityQuery}
              setCityQuery={setCityQuery}
              onCloseMenu={onClose}
            />
          ) : null}
        </div>

        <Link
          href="/vendor"
          onClick={onClose}
          className="block rounded-lg px-4 py-3 text-sm font-semibold text-primary hover:bg-rose-50"
        >
          Vendor Account
        </Link>
        <Link
          href="/become-a-vendor"
          onClick={onClose}
          className="block rounded-lg px-4 py-3 text-sm font-semibold text-primary hover:bg-rose-50"
        >
          Become a Vendor
        </Link>
      </nav>

      <div className="grid shrink-0 grid-cols-3 border-t border-slate-100 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Link
          href="/account"
          onClick={onClose}
          className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-primary hover:bg-slate-50"
        >
          Account
        </Link>
        <WishlistMenuLink onNavigate={onClose} />
        <Link
          href="/cart"
          onClick={onClose}
          className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-primary hover:bg-slate-50"
        >
          Cart
        </Link>
      </div>
    </aside>
  );
}
