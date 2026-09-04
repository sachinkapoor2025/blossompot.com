import { CountryFlowerDeliveryPage } from "@/components/CountryFlowerDeliveryPage";
import { countryFlowerDeliveryMetadata } from "@/lib/content/country-flower-delivery";

export const metadata = countryFlowerDeliveryMetadata("australia");
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FlowerDeliveryAustraliaPage() {
  return <CountryFlowerDeliveryPage country="australia" />;
}
