import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fallbackImageElement,
  galleryMainImage,
  galleryZoomImage,
  listingCardImage,
  optimizedImageUrl,
} from "./storefront-image";

const cdn = "https://static-assets-prod.fnp.com/images/pr/usa/m/v300/anything-for-you-premium.jpg";
const upload = "/uploads/tf-usa/TFFF2603/TFFF2603.jpg";

describe("storefront image optimizer urls", () => {
  it("asks Next for a sized image and leaves the catalog URL unchanged", () => {
    const out = optimizedImageUrl(cdn, 640);
    const parsed = new URL(out, "http://127.0.0.1:3002");
    assert.equal(parsed.pathname, "/_next/image");
    assert.equal(parsed.searchParams.get("url"), cdn);
    assert.equal(parsed.searchParams.get("w"), "640");
    assert.equal(parsed.searchParams.get("q"), "75");
    assert.equal(new URL(parsed.searchParams.get("url") ?? "").search, "");
  });

  it("sizes a same-origin upload without rewriting the file path", () => {
    const parsed = new URL(optimizedImageUrl(upload, 384), "http://127.0.0.1:3002");
    assert.equal(parsed.searchParams.get("url"), upload);
    assert.equal(parsed.searchParams.get("w"), "384");
  });

  it("keeps svg and data urls on the original source", () => {
    assert.equal(optimizedImageUrl("/logo.svg", 640), "/logo.svg");
    assert.equal(optimizedImageUrl("data:image/gif;base64,aaaa", 640), "data:image/gif;base64,aaaa");
  });

  it("offers a smaller candidate for mobile cards and a larger one for the gallery", () => {
    const card = listingCardImage(cdn);
    assert.match(card.srcSet ?? "", / 384w/);
    assert.match(card.srcSet ?? "", / 640w/);
    assert.match(card.sizes ?? "", /45vw/);
    const gallery = galleryMainImage(upload);
    assert.match(gallery.srcSet ?? "", / 640w/);
    assert.match(gallery.srcSet ?? "", / 1080w/);
    assert.equal(galleryZoomImage(upload).includes("w=1200"), true);
  });
});

function imageStub(values: {
  src: string;
  currentSrc?: string;
  original?: string;
  fellBack?: string;
  srcset?: string;
}): HTMLImageElement {
  return {
    dataset: {
      ...(values.original != null ? { original: values.original } : {}),
      ...(values.fellBack != null ? { fellBack: values.fellBack } : {}),
    },
    currentSrc: values.currentSrc ?? values.src,
    src: values.src,
    srcset: values.srcset ?? "sized 384w",
  } as HTMLImageElement;
}

describe("optimized image fallback", () => {
  const original = "/uploads/tf-usa/TFFF2603/TFFF2603.jpg";
  const optimized = `/_next/image?url=${encodeURIComponent(original)}&w=384&q=75`;

  it("replaces a failed optimizer request with the original image once", () => {
    const img = imageStub({ src: optimized, original, srcset: `${optimized} 384w` });
    assert.equal(fallbackImageElement(img), true);
    assert.equal(img.src, original);
    assert.equal(img.srcset, "");
    assert.equal(img.dataset.fellBack, "1");
    assert.equal(fallbackImageElement(img), false);
    assert.equal(img.src, original);
  });

  it("leaves an image alone when it is already the original", () => {
    const img = imageStub({ src: original, original });
    assert.equal(fallbackImageElement(img), false);
    assert.equal(img.src, original);
    assert.equal(img.srcset, "sized 384w");
  });
});
