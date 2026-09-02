import { CountryFlowerDeliveryPage } from "@/components/CountryFlowerDeliveryPage";
import { countryFlowerDeliveryMetadata } from "@/lib/content/country-flower-delivery";

export const metadata = countryFlowerDeliveryMetadata("uae");
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FlowerDeliveryUaePage() {
  return <CountryFlowerDeliveryPage country="uae" />;
}
