import { CountryFlowerDeliveryPage } from "@/components/CountryFlowerDeliveryPage";
import { countryFlowerDeliveryMetadata } from "@/lib/content/country-flower-delivery";

export const metadata = countryFlowerDeliveryMetadata("usa");
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FlowerDeliveryUsaPage() {
  return <CountryFlowerDeliveryPage country="usa" />;
}
