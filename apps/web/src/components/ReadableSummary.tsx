import Link from "next/link";
import type { ReadableDoc, SummaryBlock, SummaryLink } from "@/lib/llms-document";

function isFileHref(href: string): boolean {
  const path = href.split("?")[0];
  return path.endsWith(".txt") || path.endsWith(".xml");
}

function SummaryLinks({ items }: { items: SummaryLink[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={`${item.href}-${item.label}`}>
          {isFileHref(item.href) ? (
            <a href={item.href} className="text-primary underline underline-offset-2">
              {item.label}
            </a>
          ) : (
            <Link href={item.href} className="text-primary underline underline-offset-2">
              {item.label}
            </Link>
          )}
          {item.detail ? <span> — {item.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function SummaryBlockView({ block }: { block: SummaryBlock }) {
  if (block.kind === "paragraphs") {
    return (
      <div className="space-y-3">
        {block.text.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    );
  }
  if (block.kind === "bullets") {
    return (
      <ul className="list-disc space-y-2 pl-5">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.kind === "links") return <SummaryLinks items={block.items} />;
  if (block.kind === "groups") {
    return (
      <div className="space-y-5">
        {block.items.map((item) => (
          <section key={item.title}>
            <h3 className="text-lg font-semibold text-primary">{item.title}</h3>
            <p className="mt-1">{item.detail}</p>
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {block.items.map((item) => (
        <section key={item.q}>
          <h3 className="text-lg font-semibold text-slate-900">{item.q}</h3>
          <p className="mt-1">{item.a}</p>
        </section>
      ))}
    </div>
  );
}

export function ReadableSummary({
  doc,
  plainHref,
  plainLabel,
}: {
  doc: ReadableDoc;
  plainHref: string;
  plainLabel: string;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 text-slate-700 leading-relaxed">
      <p className="mb-6 text-sm">
        <a href={plainHref} className="text-primary underline underline-offset-2">
          {plainLabel}
        </a>
      </p>
      <h1 className="text-3xl font-bold text-primary">{doc.title}</h1>
      {doc.tagline ? <p className="mt-3 text-lg text-slate-800">{doc.tagline}</p> : null}
      {doc.lede ? <p className="mt-4">{doc.lede}</p> : null}
      <div className="mt-10 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.title} className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">{section.title}</h2>
            {section.blocks.map((block, index) => (
              <SummaryBlockView key={`${section.title}-${index}`} block={block} />
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
