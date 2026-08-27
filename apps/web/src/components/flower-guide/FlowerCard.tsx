import Link from "next/link";
import { SafeStoreImage } from "@/components/SafeStoreImage";
import type { FlowerDirectoryEntry, FlowerGuide } from "@/lib/content/flower-guide";

type CardFlower = Pick<
  FlowerDirectoryEntry,
  "slug" | "name" | "shortDescription" | "colours" | "season" | "meaning" | "status" | "image"
>;

function isPublic(status: CardFlower["status"]) {
  return status === "published" || status === "reviewed";
}

export function FlowerCard({
  flower,
  shopHref,
}: {
  flower: CardFlower | FlowerGuide;
  shopHref?: string;
}) {
  const href = isPublic(flower.status) ? `/flower-guide/${flower.slug}` : undefined;
  const image = "images" in flower ? flower.images[0] : flower.image;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#eadfd8] bg-white shadow-sm hover:shadow-md transition">
      <div className="relative aspect-[4/3] bg-petal overflow-hidden">
        {image ? (
          <SafeStoreImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="h-full w-full object-cover group-hover:scale-[1.03] transition duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-slate-400">
            Guide coming soon
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-xl text-primary leading-tight">{flower.name}</h3>
        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{flower.shortDescription}</p>
        <p className="mt-3 text-xs text-slate-500">
          <span className="font-medium text-slate-700">Colours:</span>{" "}
          {flower.colours.slice(0, 4).join(", ")}
        </p>
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-700">Season:</span> {flower.season.join(", ")}
        </p>
        <p className="text-xs text-slate-500 line-clamp-1">
          <span className="font-medium text-slate-700">Meaning:</span>{" "}
          {"meaning" in flower && typeof flower.meaning === "string" ? flower.meaning : flower.meaning?.[0]}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {href ? (
            <Link href={href} className="text-sm font-semibold text-nav hover:underline">
              Read flower guide
            </Link>
          ) : (
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Guide in research</span>
          )}
          {shopHref ? (
            <Link href={shopHref} className="text-sm font-semibold text-accent hover:underline">
              Shop this flower
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
