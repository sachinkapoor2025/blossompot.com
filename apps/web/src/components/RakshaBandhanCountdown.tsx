"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StayUpdatedPrompt } from "@/components/StayUpdatedPrompt";

const FESTIVAL_DATE = new Date("2026-08-28T00:00:00");
/** Order-by date for guaranteed pre-festival delivery */
const ORDER_DEADLINE = new Date("2026-08-20T23:59:59");

function daysUntil(target: Date): number {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

type Variant = "banner" | "inline";

export function RakshaBandhanCountdown({ variant = "banner" }: { variant?: Variant }) {
  const pathname = usePathname();
  const [daysToFestival, setDaysToFestival] = useState<number | null>(null);
  const [daysToOrder, setDaysToOrder] = useState<number | null>(null);

  useEffect(() => {
    setDaysToFestival(daysUntil(FESTIVAL_DATE));
    setDaysToOrder(daysUntil(ORDER_DEADLINE));
  }, []);

  if (variant === "banner" && pathname.startsWith("/admin")) return null;
  if (daysToFestival === null) return null;
  if (daysToFestival === 0 && daysToOrder === 0) return null;

  if (variant === "inline") {
    return (
      <p className="text-sm text-slate-700">
        <span className="font-semibold text-primary">Raksha Bandhan 2026:</span> August 28
        {daysToFestival > 0 && (
          <>
            {" "}
            · <span className="font-semibold text-accent">{daysToFestival} days left</span>
          </>
        )}
        {daysToOrder !== null && daysToOrder > 0 && daysToOrder <= 14 && (
          <span className="block text-xs text-orange-700 mt-0.5">
            Order within {daysToOrder} days for guaranteed pre-festival USA delivery
          </span>
        )}
      </p>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary to-nav text-white px-3 sm:px-4 py-2.5 text-sm">
      <div className="max-w-7xl mx-auto flex items-center gap-3 justify-between">
        <p className="min-w-0 flex-1 text-center sm:text-left text-[12px] sm:text-sm leading-snug">
          <span className="font-bold">Raksha Bandhan 2026</span> — August 28
          {daysToFestival > 0 && (
            <>
              {" "}
              · <span className="font-semibold">{daysToFestival} days to go</span>
            </>
          )}
          {daysToOrder !== null && daysToOrder > 0 && daysToOrder <= 21 && (
            <>
              {" "}
              · Order by Aug 20 for guaranteed delivery
            </>
          )}
          {" · "}
          <Link href="/raksha-bandhan" className="underline underline-offset-2 hover:text-white/90">
            Gift guide
          </Link>
        </p>
        <StayUpdatedPrompt />
      </div>
    </div>
  );
}
