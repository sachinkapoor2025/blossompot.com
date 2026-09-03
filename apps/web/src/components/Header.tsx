"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { categoryHref } from "@/lib/category-urls";
import {
  navItems,
  cityLinks,
  cityNavHref,
  cityNavMenuLabel,
  countriesMenu,
} from "@/lib/site";
import { SearchBar } from "@/components/SearchBar";
import { SiteLogoLink } from "@/components/SiteLogo";
import { DeliveryLocationChip } from "@/components/DeliveryLocationChip";
import { DeliveryLocationBanner } from "@/components/DeliveryLocationBanner";

function CitiesMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`btn-nav gap-1 ${open ? "btn-nav-active" : ""}`}
      >
        Cities
        <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 pt-1.5 z-[100]">
          <div className="min-w-[220px] max-h-[min(70vh,360px)] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
            <Link
              href="/locations"
              className="block px-4 py-2.5 text-sm font-semibold text-nav hover:bg-blue-50 whitespace-nowrap"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              All locations
            </Link>
            {cityLinks.map((c) => (
              <Link
                key={c.slug}
                href={cityNavHref(c)}
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-nav whitespace-nowrap"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
              >
                {cityNavMenuLabel(c)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CountriesMenu({
  active,
  onNavigate,
}: {
  active: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`btn-nav gap-1 ${active || open ? "btn-nav-active" : ""}`}
      >
        {countriesMenu.label}
        <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 pt-1.5 z-[100]">
          <div className="min-w-[240px] rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
            {countriesMenu.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-nav whitespace-nowrap"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BurgerIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function VendorIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z"
      />
    </svg>
  );
}

function VendorLink() {
  return (
    <Link
      href="/vendor"
      className="flex h-10 w-10 shrink-0 items-center justify-center text-nav hover:text-primary"
      aria-label="Vendor Account"
    >
      <VendorIcon />
    </Link>
  );
}

function AccountLink() {
  return (
    <Link
      href="/account"
      className="flex h-10 w-10 shrink-0 items-center justify-center text-nav hover:text-primary"
      aria-label="Account"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </Link>
  );
}

function WishlistLink() {
  return (
    <Link
      href="/wishlist"
      className="flex h-10 w-10 shrink-0 items-center justify-center text-nav hover:text-primary"
      aria-label="Wishlist"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </Link>
  );
}

function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center text-primary hover:text-nav"
      aria-label="Cart"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute top-1 right-0.5 bg-accent text-white text-[10px] rounded-full min-w-4 h-4 px-0.5 flex items-center justify-center font-bold">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

function DesktopHeaderAction({
  href,
  label,
  children,
  wide,
}: {
  href: string;
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-2.5 sm:px-3 text-primary hover:text-nav text-center ${
        wide ? "min-w-[5.25rem]" : "min-w-[4.5rem]"
      }`}
    >
      {children}
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  );
}

function DesktopCartAction() {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" className="relative flex flex-col items-center gap-1 px-3 text-primary hover:text-nav min-w-[4.5rem]">
      <span className="relative">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-accent text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {itemCount}
          </span>
        )}
      </span>
      <span className="text-xs font-medium leading-none">Cart</span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const [menuOpen, setMenuOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [countriesOpen, setCountriesOpen] = useState(false);

  const isActive = (href: string, category?: string) => {
    if (href === "/") return pathname === "/" && !activeCategory;
    if (category) {
      return (
        (pathname === "/products" && activeCategory === category) ||
        pathname === categoryHref(category)
      );
    }
    return pathname.startsWith(href.split("?")[0]) && href !== "/";
  };

  const isCountriesActive = countriesMenu.items.some((item) => pathname === item.href);

  const closeMenu = () => {
    setMenuOpen(false);
    setCitiesOpen(false);
    setCountriesOpen(false);
  };

  useEffect(() => {
    setMenuOpen(false);
    setCitiesOpen(false);
    setCountriesOpen(false);
  }, [pathname, activeCategory]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={`border-b border-primary/10 bg-white/90 backdrop-blur-md sticky top-0 shadow-sm shadow-primary/5 overflow-visible ${menuOpen ? "z-[70]" : "z-50"}`}>
      <DeliveryLocationBanner />
      {/* Mobile top bar */}
      <div className="md:hidden min-w-0 overflow-x-clip">
        <div className="flex items-center gap-0.5 px-1.5 py-2">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-nav hover:text-primary"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <BurgerIcon />
          </button>

          <SiteLogoLink size="headerMobile" className="min-w-0" priority onClick={closeMenu} />

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <VendorLink />
            <AccountLink />
            <WishlistLink />
            <CartLink />
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 border-t border-slate-100 bg-white px-3 py-2">
          <DeliveryLocationChip compact />
          <div className="min-w-0 flex-1">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Desktop top bar */}
      <div className="hidden md:grid max-w-7xl mx-auto px-4 py-2.5 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6">
        <SiteLogoLink size="desktop" priority />

        <div className="w-full max-w-2xl mx-auto">
          <SearchBar />
        </div>

        <div className="flex items-start justify-end shrink-0 gap-2">
          <div className="pt-1">
            <DeliveryLocationChip />
          </div>
          <DesktopHeaderAction href="/vendor" label="Vendor Account" wide>
            <VendorIcon />
          </DesktopHeaderAction>
          <DesktopHeaderAction href="/account" label="Account">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </DesktopHeaderAction>
          <DesktopHeaderAction href="/wishlist" label="Wish Lists">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </DesktopHeaderAction>
          <DesktopCartAction />
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:block border-t border-slate-100 bg-white overflow-visible">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`btn-nav ${isActive(item.href, "category" in item ? item.category : undefined) ? "btn-nav-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            <CitiesMenu />
            <CountriesMenu active={isCountriesActive} />
          </div>
        </div>
      </nav>

      {/* Mobile slide-out menu */}
      {menuOpen && (
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
              onClick={closeMenu}
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
                  href={item.href}
                  onClick={closeMenu}
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
                {citiesOpen && (
                  <div className="mt-1 ml-2 border-l-2 border-slate-100 pl-2 space-y-1">
                    <Link
                      href="/locations"
                      onClick={closeMenu}
                      className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-nav hover:bg-blue-50"
                    >
                      All locations
                    </Link>
                    {cityLinks.map((c) => (
                      <Link
                        key={c.slug}
                        href={cityNavHref(c)}
                        onClick={closeMenu}
                        className="block rounded-lg px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-nav"
                      >
                        {cityNavMenuLabel(c)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setCountriesOpen((v) => !v)}
                  className={`w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold ${
                    isCountriesActive || countriesOpen
                      ? "bg-nav text-white"
                      : "text-primary hover:bg-blue-50 hover:text-nav"
                  }`}
                >
                  {countriesMenu.label}
                  <span className={`text-xs transition-transform ${countriesOpen ? "rotate-180" : ""}`}>▼</span>
                </button>
                {countriesOpen && (
                  <div className="mt-1 ml-2 border-l-2 border-slate-100 pl-2 space-y-1">
                    {countriesMenu.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={`block rounded-lg px-4 py-2.5 text-sm ${
                          pathname === item.href
                            ? "bg-blue-50 text-nav font-semibold"
                            : "text-slate-700 hover:bg-blue-50 hover:text-nav"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/vendor"
                onClick={closeMenu}
                className="block rounded-lg px-4 py-3 text-sm font-semibold text-primary hover:bg-rose-50"
              >
                Vendor Account
              </Link>
              <Link
                href="/become-a-vendor"
                onClick={closeMenu}
                className="block rounded-lg px-4 py-3 text-sm font-semibold text-primary hover:bg-rose-50"
              >
                Become a Vendor
              </Link>
            </nav>

            <div className="grid shrink-0 grid-cols-3 border-t border-slate-100 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <Link
                href="/account"
                onClick={closeMenu}
                className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-primary hover:bg-slate-50"
              >
                Account
              </Link>
              <Link
                href="/wishlist"
                onClick={closeMenu}
                className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-primary hover:bg-slate-50"
              >
                Wishlist
              </Link>
              <Link
                href="/cart"
                onClick={closeMenu}
                className="flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold text-primary hover:bg-slate-50"
              >
                Cart
              </Link>
            </div>
          </aside>
      )}
    </header>
  );
}
