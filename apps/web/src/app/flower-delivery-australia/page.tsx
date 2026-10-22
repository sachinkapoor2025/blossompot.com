import { CountryFlowerDeliveryPage } from "@/components/CountryFlowerDeliveryPage";
import { countryFlowerDeliveryMetadata } from "@/lib/content/country-flower-delivery";
import { notFoundIfShoppingCountryDisabled } from "@/lib/shopping-country-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  await notFoundIfShoppingCountryDisabled("/flower-delivery-australia");
  return countryFlowerDeliveryMetadata("australia");
}

export default function FlowerDeliveryAustraliaPage() {
  return <CountryFlowerDeliveryPage country="australia" />;
}
