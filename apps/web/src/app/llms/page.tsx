import { ReadableSummary } from "@/components/ReadableSummary";
import { llmsReadable } from "@/lib/llms-document";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Site summary",
  description: `${site.name} summary for readers: flowers, cakes, gifts, delivery, and key pages.`,
  path: "/llms",
});

export default function LlmsPage() {
  return (
    <ReadableSummary
      doc={llmsReadable()}
      plainHref="/llms.txt?format=plain"
      plainLabel="Plain text for AI assistants"
    />
  );
}
