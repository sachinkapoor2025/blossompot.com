import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { OverseasGiftGrid } from "@/components/OverseasGiftGrid";
import { api } from "@/lib/api";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { gboGiftToProduct, type GboGift, type Product } from "@blossompot/shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COUNTRY = "US";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Overseas Gift Baskets — International Delivery | BlossomPot",
    description:
      "Send gift baskets worldwide. Delivery is included. Shop the Gift Baskets Overseas catalog on BlossomPot.",
    path: "/overseas",
    absoluteTitle: true,
  }),
  robots: { index: false, follow: false },
};

function withoutVendorCost(product: Product): Product {
  const { vendorCost: _cost, ...rest } = product;
  return rest as Product;
}

export default async function OverseasGiftsPage() {
  let products: Product[] = [];
  let error = "";
  try {
    const data = await api<{ gifts: GboGift[]; count?: number }>(`/gbo/gifts?country=${COUNTRY}`, {
      revalidate: 120,
    });
    products = (data.gifts ?? []).map((gift) => withoutVendorCost(gboGiftToProduct(COUNTRY, gift)));
  } catch (err) {
    error = err instanceof Error ? err.message : "Gift catalog is temporarily unavailable.";
  }

  const path = "/overseas";
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Overseas gifts" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href ?? path })))} />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold text-primary mb-3">Overseas gift baskets</h1>
      <p className="text-slate-600 max-w-3xl mb-8 leading-relaxed">
        International gift baskets with delivery included in the price. Add to cart and checkout as usual
        — we place the order with our worldwide fulfillment partner after payment.
      </p>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error} Confirm the Gift Baskets Overseas API token is set on the API, then refresh.
        </p>
      ) : (
        <OverseasGiftGrid products={products} />
      )}
    </div>
  );
}
