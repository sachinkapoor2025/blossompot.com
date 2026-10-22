import { ReadableSummary } from "@/components/ReadableSummary";
import { humansReadable } from "@/lib/llms-document";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Humans.txt",
  description: "Credits and site information for BlossomPot.",
  path: "/humans",
});

export default function HumansPage() {
  return (
    <ReadableSummary
      doc={humansReadable()}
      plainHref="/humans.txt?format=plain"
      plainLabel="Plain text credits file"
    />
  );
}
