import type { Metadata } from "next";
import VendorLayoutClient from "./VendorLayoutClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <VendorLayoutClient>{children}</VendorLayoutClient>;
}
