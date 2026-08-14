import { GoogleAdsConversionHelper } from "@/components/GoogleAdsConversionHelper";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleAdsConversionHelper />
      {children}
    </>
  );
}
