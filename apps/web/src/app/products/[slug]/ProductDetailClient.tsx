"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AddToCartControl } from "@/components/AddToCartControl";
import { ProductAddonsPicker } from "@/components/ProductAddonsPicker";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { WishlistButton } from "@/components/WishlistButton";
import { TrustBadges } from "@/components/TrustBadges";
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
import { productFaqsForCategory, type ProductFaq } from "@/lib/content/product-faqs";
import {
  LOW_STOCK_THRESHOLD,
  isFastSelling,
  getUnitsSold,
  sumAddonPrices,
  getProductAddon,
  isFlashComboProduct,
  isFlashComboSaleActive,
  flashComboSaleEndsAt,
  FLASH_COMBO_SHIPPING_USD,
} from "@blossompot/shared";
import { EstimatedDeliveryNote } from "@/components/EstimatedDeliveryNote";
import { ProductCareAccordions } from "@/components/ProductCareAccordions";
import { LearnAboutFlower } from "@/components/flower-guide/LearnAboutFlower";
import { flowerGuideForProduct } from "@/lib/content/flower-guide/products";
import { ScheduleDeliveryPicker } from "@/components/ScheduleDeliveryPicker";
import type { Product, ProductAddonSelection } from "@blossompot/shared";
import { FastSellingBanner } from "@/components/FastSellingBadge";
import { looksLikeHtml, shortPlainDescription } from "@/lib/html-text";
import { getProductIncludes } from "@/lib/product-includes";
import { fulfillmentVendorSlug, isGboVendor, parseGboSlug, VENDOR_GBO } from "@blossompot/shared";
import { useDeliveryLocation } from "@/lib/delivery-location-context";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductProofLine } from "@/components/product/ProductProofLine";
import { ProductPriceBlock } from "@/components/product/ProductPriceBlock";
import { ProductDeliveryCard } from "@/components/product/ProductDeliveryCard";
import { useStorefrontHeaderOffset } from "@/components/product/useStorefrontHeaderOffset";
import { PdpPinnedAddToCart } from "@/components/product/PdpPinnedAddToCart";

const INCLUDES_PREVIEW_COUNT = 6;

/** "What's included" checklist — same data as before, with an optional Show more. */
function ProductIncludesPreview({ product }: { product: Product }) {
  const items = getProductIncludes(product);
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const heading =
    product.categorySlug === "gift-hampers" ? "What's included in this hamper" : "What's included";
  const canCollapse = items.length > INCLUDES_PREVIEW_COUNT;
  const visible = canCollapse && !expanded ? items.slice(0, INCLUDES_PREVIEW_COUNT) : items;
  return (
    <div className="mb-4 rounded-lg border border-line bg-surface px-4 py-3">
      <p className="text-sm font-semibold text-ink mb-2">{heading}</p>
      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-ink">
        {visible.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-accent shrink-0">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {canCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-nav underline underline-offset-2"
        >
          {expanded ? "Show less" : `Show ${items.length - INCLUDES_PREVIEW_COUNT} more`}
        </button>
      ) : null}
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
      onClick={(e) => {
        e.stopPropagation();
        void share();
      }}
      aria-label="Share product"
      title={copied ? "Link copied!" : "Share"}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded border-2 border-primary/30 bg-surface text-primary hover:bg-petal transition active:scale-95"
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

function DetailsBlock({
  id,
  title,
  children,
  defaultOpen = false,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      id={id}
      className="group border-b border-line py-3 first:border-t first:border-line"
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 select-none font-semibold text-ink text-sm sm:text-base [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-muted text-lg leading-none group-open:hidden" aria-hidden>
          +
        </span>
        <span className="text-muted text-lg leading-none hidden group-open:inline" aria-hidden>
          −
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export function ProductDetailClient({
  product,
  relatedProducts = [],
  faqs,
}: {
  product: Product;
  relatedProducts?: Product[];
  faqs?: ProductFaq[];
}) {
  const flowerGuide = flowerGuideForProduct(product);
  const pageFaqs = faqs ?? productFaqsForCategory(product.categorySlug);
  const productNoun = product.categorySlug.includes("cake")
    ? "cake"
    : product.categorySlug.includes("flower") || product.categorySlug.includes("bouquet")
      ? "flowers"
      : "gift";
  const sessionId = useSessionId();
  const captureLead = useDebouncedLeadCapture(sessionId);
  const captureLeadNow = useLeadCapture(sessionId);
  const { cart, itemCount } = useCart();
  const { format } = useCurrency();
  const delivery = useDeliveryLocation();
  const galleryStickyTop = useStorefrontHeaderOffset();
  const pdpSectionRef = useRef<HTMLDivElement>(null);
  const locationSet = Boolean(delivery.location);
  const vendorKey = product.internationalDelivery
    ? VENDOR_GBO
    : fulfillmentVendorSlug(product);
  const deliverable =
    !locationSet ||
    delivery.checking ||
    delivery.vendorSlugs.includes(vendorKey);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
  const youSave =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? format(product.compareAtPrice - product.price, product.currency)
      : null;
  const summary = shortPlainDescription(product.description);
  const descriptionIsHtml = looksLikeHtml(product.description);
  const cartQuantity =
    cart?.items.filter((i) => i.productSlug === product.slug).reduce((s, i) => s + i.quantity, 0) ?? 0;
  const inCart = cartQuantity > 0;
  const isGboProduct = isGboVendor(product.vendorSlug) || Boolean(parseGboSlug(product.slug));
  const showAddons = product.allowsAddons === true && !isGboProduct;
  const lowStock = product.inventory > 0 && product.inventory <= LOW_STOCK_THRESHOLD;
  const outOfStock = product.inventory <= 0;
  const fastSelling = isFastSelling(product);
  const unitsSold = getUnitsSold(product);
  const displayVariants = product.variants && product.variants.length > 0 ? product.variants : null;

  const addToCartDisabled =
    product.inventory <= 0 ||
    !deliverable ||
    (isFlashComboProduct(product.slug) && !isFlashComboSaleActive());

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
      <div ref={pdpSectionRef} className="grid md:grid-cols-2 gap-8 lg:gap-10 items-start">
        <div className="md:sticky md:self-start" style={{ top: galleryStickyTop }}>
          <ProductImageGallery
            images={galleryImages}
            alt={product.name}
            overlay={
              <>
                <WishlistButton product={product} variant="toolbar" />
                {productUrl ? <ShareButton title={product.name} url={productUrl} /> : null}
              </>
            }
          />
        </div>

        <div>
          <ProductBuyBox>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2 leading-tight">{product.name}</h1>

            <ProductProofLine unitsSold={unitsSold} fastSelling={fastSelling} />

            {product.fulfilledByName ? (
              <p className="text-xs text-muted mb-3">
                Fulfilled by {product.fulfilledByName}
                {isGboProduct ? null : " · Local partner"}
              </p>
            ) : null}

            {isFlashComboProduct(product.slug) && isFlashComboSaleActive() && (
              <p className="text-sm font-semibold text-promo bg-ivory border border-promo/20 rounded-md px-3 py-2 mb-3">
                24-hour flash sale — ends {flashComboSaleEndsAt().toLocaleString()}. See product details for
                what's included. Shipping{" "}
                {format(FLASH_COMBO_SHIPPING_USD, "USD")}. Coupon codes do not apply.
              </p>
            )}
            {isFlashComboProduct(product.slug) && !isFlashComboSaleActive() && (
              <p className="text-sm font-semibold text-ink bg-ivory border border-line rounded-md px-3 py-2 mb-3">
                This 24-hour flash offer has ended.
              </p>
            )}

            <ProductPriceBlock
              currentPrice={displayTotal}
              comparePrice={comparePrice}
              discountPercent={discount}
              youSave={youSave}
              addonsNote={
                addonsUsdTotal > 0 && product.currency === "USD"
                  ? `includes +${format(addonsUsdTotal, "USD")} add-ons`
                  : null
              }
            />

            {fastSelling && <FastSellingBanner unitsSold={unitsSold} />}

            {outOfStock ? (
              <p className="text-sm font-semibold text-ink bg-ivory border border-line rounded-md px-3 py-2 mb-3">
                Out of stock
              </p>
            ) : null}

            {lowStock && (
              <p className="text-sm font-semibold text-promo bg-ivory border border-promo/20 rounded-md px-3 py-2 mb-3">
                Only {product.inventory} left in stock — order soon for on-time delivery
              </p>
            )}
          </ProductBuyBox>

          <ProductDeliveryCard
            location={delivery.location}
            deliverable={deliverable}
            onOpenSelector={() => delivery.openSelector()}
            isGboProduct={isGboProduct}
            estimate={<EstimatedDeliveryNote variant="banner" prefix="Estimated delivery:" />}
            datePicker={
              <ScheduleDeliveryPicker
                className="!border-0 !bg-transparent !p-0 mb-0"
                compact
                productNoun={productNoun}
              />
            }
          />

          {displayVariants ? (
            <div className="mb-4">
              <p className="text-sm font-medium text-ink">Product details</p>
              <p className="text-xs text-muted mb-2">
                Informational only — these notes do not change the item added to your cart.
              </p>
              <ul className="flex flex-wrap gap-2">
                {displayVariants.map((v, i) => (
                  <li
                    key={`${v.label}-${i}`}
                    className="rounded-full border border-line bg-ivory px-3 py-1.5 text-xs font-medium text-ink"
                  >
                    {v.label}
                    {v.price != null ? ` · ${format(v.price, product.currency)}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {inCart ? (
            <div className="mb-3">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Link
                  href="/cart"
                  className="flex items-center gap-2 text-accent hover:text-accent/80 shrink-0"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-accent text-white">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {itemCount} {itemCount === 1 ? "item" : "items"} in cart
                  </span>
                </Link>

                <PdpPinnedAddToCart sectionRef={pdpSectionRef} className="flex-1 min-w-[13rem] max-w-[18rem]">
                  <AddToCartControl
                    productSlug={product.slug}
                    disabled={addToCartDisabled}
                    fullWidth
                    variant="detail"
                    getContact={getContact}
                    addons={addons}
                  />
                </PdpPinnedAddToCart>
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-md">
                <Link
                  href="/cart"
                  className="inline-flex items-center justify-center rounded-md border-2 border-primary bg-surface text-primary font-bold text-sm uppercase tracking-wide py-3 hover:bg-petal transition"
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
                <PdpPinnedAddToCart sectionRef={pdpSectionRef} className="flex-1 min-w-0">
                  <AddToCartControl
                    productSlug={product.slug}
                    disabled={addToCartDisabled}
                    fullWidth
                    variant="detail"
                    getContact={getContact}
                    addons={addons}
                  />
                </PdpPinnedAddToCart>
              </div>
            </div>
          )}

          {isGboProduct ? null : <TrustBadges variant="compact" className="mb-4" />}

          {summary ? (
            <p className="text-muted text-sm sm:text-base mb-3 leading-relaxed">{summary}</p>
          ) : null}

          <ProductIncludesPreview product={product} />

          {showAddons ? (
            <ProductAddonsPicker
              selected={addons}
              onChange={setAddons}
              className="mb-4"
              heading="Make it more special"
              description="Optional extras — candles, name printing, and cards. They are not required to add this gift to your cart."
            />
          ) : null}

          <section className="mt-10 pt-8 border-t border-line" aria-label="Product details">
            <DetailsBlock title="About this gift" defaultOpen>
          {descriptionIsHtml ? (
            <article
              className="product-html-description text-ink leading-relaxed max-w-4xl prose prose-slate prose-a:text-nav prose-strong:text-ink prose-ul:my-3 prose-li:my-0.5"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <article className="text-ink leading-relaxed space-y-4 max-w-4xl">
              {product.description.split(/(?<=\.)\s+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </article>
          )}
          {product.tags && product.tags.length > 0 ? (
            <div className="mt-6">
              <p className="text-xs font-semibold text-muted uppercase mb-3">Related searches</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(product.tags)).map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-petal text-ink text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </DetailsBlock>

        <div className="border-b border-line">
          <ProductCareAccordions product={product} className="mb-0" />
        </div>

        {flowerGuide ? (
          <DetailsBlock title={`Learn about ${flowerGuide.name}`}>
            <LearnAboutFlower guide={flowerGuide} />
          </DetailsBlock>
        ) : null}

        <DetailsBlock id="customer-reviews" title="Customer stories" defaultOpen>
          <ProductReviewsPreview />
        </DetailsBlock>

        <DetailsBlock title="Common questions">
          <dl className="space-y-4 max-w-2xl">
            {pageFaqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-ink text-sm">{f.q}</dt>
                <dd className="text-sm text-muted mt-1 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </DetailsBlock>

        <DetailsBlock title="Need help with this gift?">
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
        </DetailsBlock>
          </section>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-10 pt-8 border-t border-line">
          <h2 className="text-lg font-bold text-ink mb-4">You might also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-stretch">
            {relatedProducts.map((p) => (
              <HomeProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Always in the document so crawlers still get internal links. */}
      <ExploreMoreSection
        productSlug={product.slug}
        categorySlug={product.categorySlug}
        occasion={product.occasion}
      />
    </div>
    <StickyAddToCartBar
      product={product}
      getContact={getContact}
      addons={addons}
      disabled={!deliverable}
    />
    </>
  );
}
