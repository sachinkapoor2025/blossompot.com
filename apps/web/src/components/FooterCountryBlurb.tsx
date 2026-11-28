"use client";

import { usePathname } from "next/navigation";
import { applyInlineLinks } from "@/lib/inline-links";
import { localizeCopyForCountry } from "@/lib/location-seo-urls";
import { useStorefrontCountryIso } from "@/lib/use-storefront-country";

export function FooterCountryBlurb() {
  const iso = useStorefrontCountryIso() ?? "US";
  const pathname = usePathname() || "/";
  return (
    <p className="text-slate-600 leading-relaxed mb-3">
      {applyInlineLinks(
        localizeCopyForCountry(
          "Flowers, cakes, and thoughtful gifts delivered across the Worldwide. Premium online gifting for every celebration.",
          iso
        ),
        [],
        { currentPath: pathname }
      )}
    </p>
  );
}
