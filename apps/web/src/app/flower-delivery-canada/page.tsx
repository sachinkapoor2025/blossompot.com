import { CountryFlowerDeliveryPage } from "@/components/CountryFlowerDeliveryPage";
import { countryFlowerDeliveryMetadata } from "@/lib/content/country-flower-delivery";

export const metadata = countryFlowerDeliveryMetadata("canada");
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FlowerDeliveryCanadaPage() {
  return <CountryFlowerDeliveryPage country="canada" />;
}
