import { faqs } from "./site";
import { countryDisplayName } from "./location-seo-urls";

export type FaqItem = { q: string; a: string };

function destinationLabel(countryIso: string): string {
  return countryDisplayName(countryIso);
}

/**
 * Storefront FAQs for the selected delivery country.
 * Coverage copy follows live policy: worldwide delivery windows shown at checkout.
 */
export function faqsForCountry(countryIso: string | null | undefined): FaqItem[] {
  const iso = (countryIso ?? "US").trim().toUpperCase() || "US";
  const destination = destinationLabel(iso);
  const timing =
    iso === "US"
      ? "Delivery windows depend on the product and the US recipient address. Estimated timing is shown on the product page and at checkout."
      : `Delivery windows for ${destination} depend on the product and the recipient address. Estimated timing is shown on the product page and at checkout.`;

  const where =
    iso === "US"
      ? "We deliver gifts worldwide. Enter the US recipient address at checkout to see available delivery windows."
      : `We deliver gifts worldwide, including ${destination}. Choose ${destination} as the recipient country (header country picker or checkout) to see gifts, timing, and currency for that destination.`;

  return faqs.map((item) => {
    if (item.q === "How long does delivery take?") return { q: item.q, a: timing };
    if (item.q === "Where does BlossomPot deliver?") return { q: item.q, a: where };
    if (item.q === "Can I send a gift worldwide?") {
      return {
        q: item.q,
        a: `Yes. BlossomPot delivers worldwide, including ${destination}. Availability and estimated delivery times vary by location — they are shown after you select the recipient country.`,
      };
    }
    return { q: item.q, a: item.a };
  });
}
