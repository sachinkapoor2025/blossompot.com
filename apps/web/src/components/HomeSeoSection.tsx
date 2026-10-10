import { CountrySeoArticle } from "@/components/CountrySeoArticle";
import { countrySeoContent } from "@/lib/content/country-seo-registry";

/** Indexable homepage article. Pass the admin default country, not the shopper's cookie. */
export function HomeSeoSection({ countryIso = "US" }: { countryIso?: string }) {
  return <CountrySeoArticle article={countrySeoContent(countryIso, "home")} />;
}
