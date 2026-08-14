import type { Metadata } from "next";
import { GoogleAdsConversionHelper } from "@/components/GoogleAdsConversionHelper";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleAdsConversionHelper />
      {children}
    </>
  );
}
