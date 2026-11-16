import Image from "next/image";
import type { SpecialDayContent } from "@/lib/special-days";

export function SpecialDayHero({ day }: { day: SpecialDayContent }) {
  return (
    <section className="relative isolate min-h-[16.5rem] overflow-hidden bg-[#9e2d55] sm:min-h-[22rem] lg:min-h-[26rem]">
      <Image
        src={day.heroSrc}
        alt={day.heroAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#3d1022]/80 to-transparent px-4 py-5">
        <p className="mx-auto max-w-7xl text-xs font-semibold uppercase tracking-[0.18em] text-white">{day.date}</p>
      </div>
    </section>
  );
}
