import { ReadableSummary } from "@/components/ReadableSummary";
import { llmsReadable } from "@/lib/llms-document";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { loadEnabledShoppingCountryCodes } from "@/lib/storefront-country";

export const metadata = pageMetadata({
  title: "Site summary",
  description: `${site.name} summary for readers: flowers, cakes, gifts, delivery, and key pages.`,
  path: "/llms",
});

export default async function LlmsPage() {
  const enabledCountries = await loadEnabledShoppingCountryCodes();
  return (
    <ReadableSummary
      doc={llmsReadable(enabledCountries)}
      plainHref="/llms.txt?format=plain"
      plainLabel="Plain text for AI assistants"
    />
  );
}
