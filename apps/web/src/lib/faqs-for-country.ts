import { faqs } from "./site";
import { countryDisplayName } from "./location-seo-urls";

export type FaqItem = { q: string; a: string };

function destinationLabel(countryIso: string): string {
  return countryDisplayName(countryIso);
}

/**
 * Storefront FAQs for the selected delivery country.
 * Same-day and coverage copy follow live policy: worldwide delivery, same-day only
 * where the local cut-off and coverage allow it — not USA-only for every country.
 */
export function faqsForCountry(countryIso: string | null | undefined): FaqItem[] {
  const iso = (countryIso ?? "US").trim().toUpperCase() || "US";
  const destination = destinationLabel(iso);
  const sameDay =
    iso === "US"
      ? "Same-day gift options are available in select US cities when you order before the local cut-off. Look for the Same-Day collection or the delivery estimate on the product page."
      : `Same-day options appear in select ${destination} cities when coverage and the local cut-off allow it. Otherwise we use the standard worldwide delivery window shown at checkout for ${destination}.`;

  const where =
    iso === "US"
      ? "We deliver gifts worldwide. Enter the US recipient address at checkout to see available delivery windows."
      : `We deliver gifts worldwide, including ${destination}. Choose ${destination} as the recipient country (header country picker or checkout) to see gifts, timing, and currency for that destination.`;

  return faqs.map((item) => {
    if (item.q === "Do you offer same-day delivery?") return { q: item.q, a: sameDay };
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
