import Link from "next/link";
import type { FlowerGuide } from "@/lib/content/flower-guide";

export function LearnAboutFlower({ guide }: { guide: FlowerGuide }) {
  return (
    <aside className="mb-5 rounded-2xl border border-primary/15 bg-petal p-4">
      <p className="text-xs uppercase tracking-wide text-nav font-semibold">Learn about this flower</p>
      <h2 className="font-display text-xl text-primary mt-1">{guide.name}</h2>
      <p className="mt-2 text-sm text-slate-700 leading-relaxed">{guide.glance}</p>
      <Link
        href={`/flower-guide/${guide.slug}`}
        className="mt-3 inline-block text-sm font-semibold text-nav hover:underline"
      >
        Read the {guide.name.toLowerCase()} guide →
      </Link>
    </aside>
  );
}
