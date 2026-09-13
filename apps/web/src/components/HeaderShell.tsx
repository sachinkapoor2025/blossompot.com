"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";

function HeaderFallback() {
  return (
    <header className="border-b border-line bg-surface h-24">
      <div className="store-wrap py-3">
        <div className="h-11 w-36 bg-ivory rounded animate-pulse" />
      </div>
    </header>
  );
}

export function HeaderShell() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/ses-email") || pathname.startsWith("/vendor")) return null;

  return (
    <Suspense fallback={<HeaderFallback />}>
      <Header />
    </Suspense>
  );
}
