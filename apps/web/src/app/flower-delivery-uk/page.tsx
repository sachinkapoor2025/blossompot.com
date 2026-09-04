import { CountryFlowerDeliveryPage } from "@/components/CountryFlowerDeliveryPage";
import { countryFlowerDeliveryMetadata } from "@/lib/content/country-flower-delivery";

export const metadata = countryFlowerDeliveryMetadata("uk");
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FlowerDeliveryUkPage() {
  return <CountryFlowerDeliveryPage country="uk" />;
}
