import { HomeProductCard } from "@/components/HomeProductCard";
import { JsonLd } from "@/components/JsonLd";
import { getCountryFlowerDelivery, type CountryFlowerDeliverySlug } from "@/lib/content/country-flower-delivery";
import { pickCountryProducts } from "@/lib/country-flower-selection";
import { getFlowerGuideProducts } from "@/lib/flower-guide-cards";
import { toListingCardProducts } from "@/lib/product-loader";
import { itemListJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export { pickCountryProducts };

export async function CountryFlowerProductSection({
  country,
}: {
  country: CountryFlowerDeliverySlug;
}) {
  const page = getCountryFlowerDelivery(country);
  const featured = await getFlowerGuideProducts(country);
  const productsFirst = country === "usa";

  const productSection =
    featured.length > 0 ? (
      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-3">
          {productsFirst ? `Flower gifts for ${page.countryName}` : `Featured gifts for ${page.countryName}`}
        </h2>
        <p className="text-slate-700 mb-4 max-w-3xl leading-relaxed">
          {productsFirst
            ? `Shop flowers available for ${page.countryName} delivery. Open any product for current price, inventory, and delivery timing.`
            : `A rotating selection from the live ${site.name} catalog — flowers first, then cakes and hampers. Open any product for current price, inventory, and delivery timing.`}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {toListingCardProducts(featured).map((product) => (
            <HomeProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    ) : null;

  return (
    <>
      <JsonLd
        data={itemListJsonLd(
          page.h1,
          featured.map((p) => ({ name: p.name, path: `/products/${p.slug}` }))
        )}
      />
      {productSection}
    </>
  );
}
