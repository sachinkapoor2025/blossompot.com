import { CountryFlowerDeliveryPage } from "@/components/CountryFlowerDeliveryPage";
import { countryFlowerDeliveryMetadata } from "@/lib/content/country-flower-delivery";
import { notFoundIfShoppingCountryDisabled } from "@/lib/shopping-country-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  await notFoundIfShoppingCountryDisabled("/flower-delivery-usa");
  return countryFlowerDeliveryMetadata("usa");
}

export default function FlowerDeliveryUsaPage() {
  return <CountryFlowerDeliveryPage country="usa" />;
}
