"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AddToCartControl } from "@/components/AddToCartControl";
import { ProductAddonsPicker } from "@/components/ProductAddonsPicker";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { WishlistButton } from "@/components/WishlistButton";
import { TrustBadges } from "@/components/TrustBadges";
import { RakshaBandhanCountdown } from "@/components/RakshaBandhanCountdown";
import { ProductReviewsPreview } from "@/components/ProductReviewsPreview";
import { StickyAddToCartBar } from "@/components/StickyAddToCartBar";
import { useSessionId, useDebouncedLeadCapture, useLeadCapture } from "@/lib/session";
import { trackProductView } from "@/lib/track";
import { useCurrency } from "@/lib/currency-context";
import { getDiscountPercent } from "@/lib/pricing";
import { LeadCaptureInput } from "@/components/LeadCaptureInput";
import { ExploreMoreSection } from "@/components/ExploreMoreSection";
import { HomeProductCard } from "@/components/HomeProductCard";
import { useCart } from "@/lib/cart-context";
import { productPageFaqs } from "@/lib/content/product-faqs";
import { testimonials } from "@/lib/site";
import {
  LOW_STOCK_THRESHOLD,
  isFastSelling,
  getUnitsSold,
  estimatedDeliveryLabel,
  sumAddonPrices,
  getProductAddon,
  isFlashComboProduct,
  isFlashComboSaleActive,
  flashComboSaleEndsAt,
  FLASH_COMBO_SHIPPING_USD,
} from "@blossompot/shared";
import { EstimatedDeliveryNote } from "@/components/EstimatedDeliveryNote";
import { ProductCareAccordions } from "@/components/ProductCareAccordions";
import { ScheduleDeliveryPicker } from "@/components/ScheduleDeliveryPicker";
import type { Product, ProductAddonSelection } from "@blossompot/shared";
import { FastSellingBanner } from "@/components/FastSellingBadge";
import { looksLikeHtml, shortPlainDescription } from "@/lib/html-text";
import { getProductIncludes } from "@/lib/product-includes";

type Tab = "description" | "reviews" | "faq";

/** "What's included" checklist under the title — hampers, single, combo, kids, etc. */
function ProductIncludesPreview({ product }: { product: Product }) {
  const items = getProductIncludes(product);
  if (items.length === 0) return null;
  const heading =
    product.categorySlug === "rakhi-hampers" ? "What's included in this hamper" : "What's included";
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm font-semibold text-primary mb-2">{heading}</p>
      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-nav shrink-0">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled or clipboard blocked */
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label="Share product"
      title={copied ? "Link copied!" : "Share"}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded border-2 border-nav bg-white text-nav hover:bg-blue-50 transition active:scale-95"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
    </button>
  );
}

export function ProductDetailClient({
  product,
  relatedProducts = [],
}: {
  product: Product;
  relatedProducts?: Product[];
}) {
  const sessionId = useSessionId();
  const captureLead = useDebouncedLeadCapture(sessionId);
  const captureLeadNow = useLeadCapture(sessionId);
  const { cart, itemCount } = useCart();
  const { format } = useCurrency();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tab, setTab] = useState<Tab>("description");
  const [productUrl, setProductUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState(product.images ?? []);
  const [addons, setAddons] = useState<ProductAddonSelection[]>([]);

  useEffect(() => {
    setGalleryImages(product.images ?? []);
  }, [product.slug, product.images]);

  useEffect(() => {
    setAddons([]);
  }, [product.slug]);

  useEffect(() => {
    trackProductView(product.slug);
    setProductUrl(window.location.href);
  }, [product.slug]);

  /** SSR/ISR can serve stale image lists — always sync gallery from live API on the client. */
  useEffect(() => {
    let cancelled = false;
    void api<{ product: Product }>(`/products/${product.slug}`, { revalidate: false })
      .then((data) => {
        if (cancelled) return;
        const fresh = data.product.images ?? [];
        if (fresh.length > 0) setGalleryImages(fresh);
      })
      .catch(() => {
        /* keep SSR images */
      });
    return () => {
      cancelled = true;
    };
  }, [product.slug]);

  const price = format(product.price, product.currency);
  const addonsUsdTotal = sumAddonPrices(
    addons.map((s) => {
      const def = getProductAddon(s.id);
      return {
        id: s.id,
        name: def?.name ?? s.id,
        price: def?.priceUsd ?? 0,
        quantity: s.quantity,
      };
    })
  );
  /** Add-on catalog is USD; show combined display when shopper has extras selected. */
  const displayTotal =
    addonsUsdTotal > 0 && product.currency === "USD"
      ? format(product.price + addonsUsdTotal, product.currency)
      : addonsUsdTotal > 0
        ? format(product.price, product.currency)
        : price;
  const comparePrice =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? format(product.compareAtPrice, product.currency)
      : null;
  const discount = getDiscountPercent(product.price, product.compareAtPrice);
  const summary = shortPlainDescription(product.description);
  const descriptionIsHtml = looksLikeHtml(product.description);
  const cartQuantity =
    cart?.items.filter((i) => i.productSlug === product.slug).reduce((s, i) => s + i.quantity, 0) ?? 0;
  const inCart = cartQuantity > 0;
  const showAddons = product.allowsAddons === true;
  const lowStock = product.inventory > 0 && product.inventory <= LOW_STOCK_THRESHOLD;
  const fastSelling = isFastSelling(product);
  const unitsSold = getUnitsSold(product);

  const contactFields = () => ({
    name: name.trim() || undefined,
    email: email.trim() || undefined,
    phone: phone.trim() || undefined,
  });

  const captureContactNow = async () => {
    const fields = contactFields();
    if (!fields.name && !fields.email && !fields.phone) return;
    await captureLeadNow({
      ...fields,
      page: `/products/${product.slug}`,
      productSlug: product.slug,
      source: "product",
    });
  };

  const getContact = () => {
    void captureContactNow();
    return contactFields();
  };

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-10 items-start">
        <div>
          <ProductImageGallery images={galleryImages} alt={product.name} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-3 leading-tight">{product.name}</h1>

          {isFlashComboProduct(product.slug) && isFlashComboSaleActive() && (
            <p className="text-sm font-semibold text-accent bg-rose-50 border border-rose-100 rounded-md px-3 py-2 mb-3">
              24-hour flash sale — ends {flashComboSaleEndsAt().toLocaleString()}. Includes 1
              packet Roli + 1 packet Chawal. Shipping{" "}
              {format(FLASH_COMBO_SHIPPING_USD, "USD")}. Coupon codes do not apply.
            </p>
          )}
          {isFlashComboProduct(product.slug) && !isFlashComboSaleActive() && (
            <p className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 mb-3">
              This 24-hour flash offer has ended.
            </p>
          )}

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
            {comparePrice && <span className="text-lg text-slate-400 line-through">{comparePrice}</span>}
            <span className="text-2xl sm:text-3xl font-bold text-primary">{displayTotal}</span>
            {addonsUsdTotal > 0 && product.currency === "USD" ? (
              <span className="text-sm text-slate-500">
                includes +{format(addonsUsdTotal, "USD")} add-ons
              </span>
            ) : null}
            {discount !== null && (
              <span className="text-sm font-semibold text-green-600">{discount}% OFF</span>
            )}
          </div>

          <p className="text-slate-600 text-sm sm:text-base mb-3 leading-relaxed">{summary}</p>
          <ProductIncludesPreview product={product} />

          <div className="mb-3">
            <RakshaBandhanCountdown variant="inline" />
          </div>

          {fastSelling && <FastSellingBanner unitsSold={unitsSold} />}

          {lowStock && (
            <p className="text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-100 rounded-md px-3 py-2 mb-3">
              Only {product.inventory} left in stock — order soon for Raksha Bandhan delivery
            </p>
          )}

          <EstimatedDeliveryNote variant="banner" prefix="Estimated delivery:" className="mb-4" />

          <TrustBadges variant="compact" className="mb-5" />

          <ProductCareAccordions product={product} />

          {showAddons ? (
            <ProductAddonsPicker selected={addons} onChange={setAddons} className="mb-4" />
          ) : null}

          {inCart ? (
            <div className="mb-3">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Link
                  href="/cart"
                  className="flex items-center gap-2 text-green-700 hover:text-green-800 shrink-0"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-green-600 text-white">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {itemCount} {itemCount === 1 ? "item" : "items"} in cart
                  </span>
                </Link>

                <div className="flex-1 min-w-[13rem] max-w-[18rem]">
                  <AddToCartControl
                    productSlug={product.slug}
                    disabled={
                      product.inventory <= 0 ||
                      (isFlashComboProduct(product.slug) && !isFlashComboSaleActive())
                    }
                    fullWidth
                    variant="detail"
                    getContact={getContact}
                    addons={addons}
                  />
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                  <WishlistButton product={product} variant="toolbar" />
                  {productUrl ? <ShareButton title={product.name} url={productUrl} /> : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-md">
                <Link
                  href="/cart"
                  className="inline-flex items-center justify-center rounded-md border-2 border-nav bg-white text-nav font-bold text-sm uppercase tracking-wide py-3 hover:bg-blue-50 transition"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center rounded-md bg-accent text-white font-bold text-sm uppercase tracking-wide py-3 hover:opacity-90 transition"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <div className="flex items-stretch gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <AddToCartControl
                    productSlug={product.slug}
                    disabled={
                      product.inventory <= 0 ||
                      (isFlashComboProduct(product.slug) && !isFlashComboSaleActive())
                    }
                    fullWidth
                    variant="detail"
                    getContact={getContact}
                    addons={addons}
                  />
                </div>
                <WishlistButton product={product} variant="toolbar" />
                {productUrl ? <ShareButton title={product.name} url={productUrl} /> : <div className="w-12 shrink-0" />}
              </div>
            </div>
          )}

          <ScheduleDeliveryPicker className="mb-5" />

        </div>
      </div>

      <section className="mt-10 pt-8 border-t border-slate-200">
        <div className="flex gap-6 border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => setTab("description")}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === "description"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            Description
          </button>
          <button
            type="button"
            onClick={() => setTab("reviews")}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === "reviews"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            Reviews ({testimonials.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("faq")}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === "faq"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-primary"
            }`}
          >
            FAQ
          </button>
        </div>

        {tab === "description" ? (
          <div className="space-y-8">
            {descriptionIsHtml ? (
              <article
                className="product-html-description text-slate-700 leading-relaxed max-w-4xl prose prose-slate prose-a:text-nav prose-strong:text-primary prose-ul:my-3 prose-li:my-0.5"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <article className="text-slate-700 leading-relaxed space-y-4 max-w-4xl">
                {product.description.split(/(?<=\.)\s+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </article>
            )}

            {product.tags && product.tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Related searches</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Explore More sits immediately after Related searches for description-tab readers. */}
            <ExploreMoreSection />

            <div className="max-w-md space-y-3">
              <LeadCaptureInput
                label="Your name (helps us assist you)"
                placeholder="Start typing your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onDebouncedChange={(value) =>
                  captureLead({
                    name: value,
                    email: email || undefined,
                    phone: phone || undefined,
                    page: `/products/${product.slug}`,
                    productSlug: product.slug,
                    source: "product",
                  })
                }
              />
              <LeadCaptureInput
                label="Email (optional — for order updates)"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onDebouncedChange={(value) =>
                  captureLead({
                    name: name || undefined,
                    email: value,
                    phone: phone || undefined,
                    page: `/products/${product.slug}`,
                    productSlug: product.slug,
                    source: "product",
                  })
                }
              />
              <LeadCaptureInput
                label="Phone (optional — WhatsApp support)"
                placeholder="+1 555 000 0000"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onDebouncedChange={(value) =>
                  captureLead({
                    name: name || undefined,
                    email: email || undefined,
                    phone: value,
                    page: `/products/${product.slug}`,
                    productSlug: product.slug,
                    source: "product",
                  })
                }
              />
            </div>

          </div>
        ) : tab === "reviews" ? (
          <ProductReviewsPreview />
        ) : (
          <dl className="space-y-5 max-w-2xl">
            {productPageFaqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-slate-900">{f.q}</dt>
                <dd className="text-slate-600 mt-2 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Always in the document (not tab-gated) so crawlers and other tabs still get internal links. */}
        {tab !== "description" ? <ExploreMoreSection /> : null}
      </section>

      {relatedProducts.length > 0 && (
        <section className="mt-10 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-bold text-primary mb-4">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
            {relatedProducts.map((p) => (
              <HomeProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 pt-8 border-t border-slate-200">
        <h2 className="text-lg font-bold text-primary mb-4">Common questions</h2>
        <dl className="space-y-4 max-w-2xl">
          {productPageFaqs.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-slate-800 text-sm">{f.q}</dt>
              <dd className="text-sm text-slate-600 mt-1 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
    <StickyAddToCartBar product={product} getContact={getContact} addons={addons} />
    </>
  );
}
