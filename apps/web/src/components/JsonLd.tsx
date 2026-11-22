/** Renders one or more JSON-LD script blocks for structured data. */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | null | Array<Record<string, unknown> | null>;
}) {
  const blocks = (Array.isArray(data) ? data : [data]).filter(
    (block): block is Record<string, unknown> => block != null
  );
  if (blocks.length === 0) return null;
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
