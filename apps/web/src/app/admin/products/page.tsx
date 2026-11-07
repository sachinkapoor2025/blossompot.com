"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApiClient, useAuth } from "@/lib/auth-context";
import type { Product } from "@blossompot/shared";
import {
  CATALOG_VENDOR_SLUGS,
  DEFAULT_PRODUCT_INVENTORY,
  assignProductCategories,
  defaultCatalogVendor,
  LOW_STOCK_THRESHOLD,
  getUnitsSold,
  isFastSelling,
  productHasShippingDims,
} from "@blossompot/shared";
import { optionalShippingDims } from "@/lib/admin-product-dims";
import { mergeSavedAdminProduct } from "@/lib/admin-product-row";
import {
  adminVendorFilterOptions,
  filterAdminProducts,
  type AdminVendorFilterOption,
} from "@/lib/admin-product-vendor-filter";
import { ProductCategoryFields } from "@/components/admin/ProductCategoryFields";
import { formatMoney, paginate } from "@/lib/admin-utils";
import { TableControls } from "@/components/admin/TableControls";

export default function AdminProductsPage() {
  const apiClient = useApiClient();
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vendorFilter = (searchParams.get("vendor") ?? "").trim().toLowerCase();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorOptions, setVendorOptions] = useState<AdminVendorFilterOption[]>(() =>
    CATALOG_VENDOR_SLUGS.map((slug) => ({
      vendorSlug: slug,
      vendorName: defaultCatalogVendor(slug).vendorName,
    }))
  );
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sampleFilter, setSampleFilter] = useState<"all" | "sample" | "real">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categorySlug: "",
    additionalCategorySlugs: [] as string[],
    inventory: String(DEFAULT_PRODUCT_INVENTORY),
    currency: "USD" as "USD" | "INR",
    sku: "",
    compareAtPrice: "",
    tags: "",
    published: true,
    weightOz: "",
    lengthIn: "",
    widthIn: "",
    heightIn: "",
  });
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const loadRequest = useRef(0);
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [tab, setTab] = useState<"list" | "create">("list");
  const [missingDimsCount, setMissingDimsCount] = useState(0);

  const load = useCallback(() => {
    const requestId = ++loadRequest.current;
    setLoading(true);
    setLoadError("");
    const qs =
      sampleFilter === "all" ? "" : `?sample=${sampleFilter === "sample" ? "true" : "false"}`;
    const productsPromise = apiClient<{ products: Product[] }>(`/admin/products${qs}`)
      .then((result) => {
        if (requestId !== loadRequest.current) return;
        if (!Array.isArray(result.products)) {
          setProducts([]);
          setLoadError("Product list response did not include products.");
          return;
        }
        setProducts(result.products);
        setSelected(new Set());
      })
      .catch((err: unknown) => {
        if (requestId !== loadRequest.current) return;
        setProducts([]);
        setLoadError(err instanceof Error && err.message ? err.message : "Could not load products.");
      });
    const categoriesPromise = apiClient<{ categories: { slug: string; name: string }[] }>("/categories")
      .then((result) => {
        if (requestId !== loadRequest.current) return;
        setCategories(Array.isArray(result.categories) ? result.categories : []);
      })
      .catch(() => {
        if (requestId !== loadRequest.current) return;
        setCategories([]);
      });
    return Promise.all([productsPromise, categoriesPromise]).finally(() => {
      if (requestId === loadRequest.current) setLoading(false);
    });
  }, [apiClient, sampleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiClient<{ vendors: Array<{ vendorSlug: string; vendorName: string }> }>("/admin/catalog-vendors")
      .then((data) => setVendorOptions(adminVendorFilterOptions(data.vendors)))
      .catch(() => {
        /* Built-in names stay available when the vendor list cannot be loaded. */
      });
  }, [apiClient]);

  useEffect(() => {
    apiClient<{ count: number }>("/admin/shipping/products-missing-dims")
      .then((d) => setMissingDimsCount(d.count))
      .catch(() => setMissingDimsCount(0));
  }, [apiClient, products]);

  const filtered = useMemo(
    () => filterAdminProducts(products, { vendor: vendorFilter, search }),
    [products, search, vendorFilter]
  );
  const vendorChoices = useMemo(() => {
    if (!vendorFilter || vendorFilter === "all" || vendorOptions.some((vendor) => vendor.vendorSlug === vendorFilter)) {
      return vendorOptions;
    }
    return [...vendorOptions, { vendorSlug: vendorFilter, vendorName: vendorFilter }];
  }, [vendorOptions, vendorFilter]);

  const setVendorFilter = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = slug.trim().toLowerCase();
    if (!next || next === "all") params.delete("vendor");
    else params.set("vendor", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setPage(1);
  };

  const { items: pageItems, totalPages, total } = paginate(filtered, page, pageSize);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      categorySlug: "",
      additionalCategorySlugs: [],
      inventory: String(DEFAULT_PRODUCT_INVENTORY),
      currency: "USD",
      sku: "",
      compareAtPrice: "",
      tags: "",
      published: true,
      weightOz: "",
      lengthIn: "",
      widthIn: "",
      heightIn: "",
    });
    setEditing(null);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const dims = optionalShippingDims({
      weightOz: form.weightOz,
      lengthIn: form.lengthIn,
      widthIn: form.widthIn,
      heightIn: form.heightIn,
    });
    if (!dims.ok) {
      setMessage(dims.message);
      return;
    }
    const categoriesAssigned = assignProductCategories({
      categorySlug: form.categorySlug,
      additionalCategorySlugs: form.additionalCategorySlugs,
      knownSlugs: new Set(categories.map((category) => category.slug)),
    });
    if (!categoriesAssigned.ok) {
      setMessage(categoriesAssigned.error);
      return;
    }
    try {
      const saved = await apiClient<{ product: Product }>(`/products/${editing.slug}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
          inventory: parseInt(form.inventory, 10),
          categorySlug: categoriesAssigned.categorySlug,
          additionalCategorySlugs: categoriesAssigned.additionalCategorySlugs ?? [],
          currency: form.currency,
          sku: form.sku || undefined,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          published: form.published,
          ...dims.dims,
        }),
      });
      setMessage(`Product "${form.name}" updated.`);
      resetForm();
      setTab("list");
      setProducts((current) => mergeSavedAdminProduct(current, saved.product));
      void load().finally(() => {
        setProducts((current) => mergeSavedAdminProduct(current, saved.product));
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    }
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      categorySlug: p.categorySlug,
      additionalCategorySlugs: p.additionalCategorySlugs ?? [],
      inventory: String(p.inventory),
      currency: p.currency,
      sku: p.sku ?? "",
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      tags: p.tags?.join(", ") ?? "",
      published: p.published !== false,
      weightOz: p.weightOz != null ? String(p.weightOz) : "",
      lengthIn: p.lengthIn != null ? String(p.lengthIn) : "",
      widthIn: p.widthIn != null ? String(p.widthIn) : "",
      heightIn: p.heightIn != null ? String(p.heightIn) : "",
    });
    setTab("create");
  };

  const deleteProduct = async (slug: string) => {
    if (!confirm("Delete this product?")) return;
    await apiClient(`/products/${slug}`, { method: "DELETE" });
    load();
  };

  const saveStock = async (slug: string, inventory: number) => {
    if (!Number.isFinite(inventory) || inventory < 0) {
      setMessage("Stock must be 0 or greater.");
      return;
    }
    try {
      const saved = await apiClient<{ product: Product }>(`/products/${slug}`, {
        method: "PUT",
        body: JSON.stringify({ inventory: Math.floor(inventory) }),
      });
      setMessage(`Stock updated for ${slug}.`);
      setProducts((current) => mergeSavedAdminProduct(current, saved.product));
      void load().finally(() => {
        setProducts((current) => mergeSavedAdminProduct(current, saved.product));
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Stock update failed");
    }
  };

  const stockBadge = (inventory: number) => {
    if (inventory <= 0) {
      return (
        <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-800">
          Sold out
        </span>
      );
    }
    if (inventory <= LOW_STOCK_THRESHOLD) {
      return (
        <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
          Low
        </span>
      );
    }
    return null;
  };

  const revalidateStorefrontProduct = async (slug: string) => {
    if (!token) return;
    try {
      await fetch("/api/revalidate/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug }),
      });
    } catch {
      /* non-blocking */
    }
  };

  const removeAllSampleProducts = async () => {
    const okConfirm = window.confirm(
      "Permanently delete ALL sample products and their sample reviews?\n\nType confirmation will be sent as REMOVE_ALL_SAMPLE_PRODUCTS."
    );
    if (!okConfirm) return;
    const typed = window.prompt('Type REMOVE_ALL_SAMPLE_PRODUCTS to confirm:');
    if (typed !== "REMOVE_ALL_SAMPLE_PRODUCTS") {
      setMessage("Cancelled — confirmation phrase did not match.");
      return;
    }
    try {
      const result = await apiClient<{ deletedProducts: number; deletedReviews: number }>(
        "/admin/products/sample",
        {
          method: "DELETE",
          body: JSON.stringify({ confirm: "REMOVE_ALL_SAMPLE_PRODUCTS" }),
        }
      );
      setMessage(
        `Removed ${result.deletedProducts} sample products and ${result.deletedReviews} sample reviews.`
      );
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to remove sample products");
    }
  };

  const convertSelectedToReal = async () => {
    const slugs = [...selected];
    if (slugs.length === 0) {
      setMessage("Select sample products first.");
      return;
    }
    try {
      for (const slug of slugs) {
        await apiClient(`/admin/products/${slug}/convert-from-sample`, {
          method: "POST",
          body: JSON.stringify({}),
        });
      }
      setMessage(`Converted ${slugs.length} sample product(s) to real.`);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Convert failed");
    }
  };

  const uploadImages = async (files: File[] | FileList, slug: string) => {
    const selectedFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (selectedFiles.length === 0) {
      setMessage("Select one or more image files.");
      return;
    }

    setUploadingSlug(slug);
    try {
      for (const file of selectedFiles) {
        const contentType = file.type || "image/jpeg";
        const presign = await apiClient<{ uploadUrl: string; publicUrl: string }>("/uploads/presign", {
          method: "POST",
          body: JSON.stringify({ filename: file.name, contentType, productSlug: slug }),
        });
        await fetch(presign.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } });
        await apiClient(`/products/${slug}/images`, {
          method: "POST",
          body: JSON.stringify({ imageUrl: presign.publicUrl }),
        });
      }
      setMessage(
        `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} uploaded for "${slug}". Visible on the website immediately after cache refresh.`
      );
      await revalidateStorefrontProduct(slug);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingSlug(null);
    }
  };

  const deleteProductImage = async (slug: string, imageUrl: string, imageNumber: number) => {
    if (!confirm(`Delete image ${imageNumber} from this product?`)) return;
    setDeletingImage(`${slug}:${imageUrl}`);
    try {
      await apiClient(`/products/${slug}/images`, {
        method: "DELETE",
        body: JSON.stringify({ imageUrl }),
      });
      setMessage(`Image ${imageNumber} deleted from "${slug}".`);
      await revalidateStorefrontProduct(slug);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Image delete failed");
    } finally {
      setDeletingImage(null);
    }
  };

  const ProductForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4 bg-white border rounded-xl p-5">
      <input
        placeholder="Product name *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border rounded-lg px-3 py-2"
        required
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border rounded-lg px-3 py-2"
        rows={3}
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">
            Price <span className="text-red-600">*</span>
          </span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 9.99"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9.]/g, "") })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
          <span className="mt-1 block text-xs text-slate-500">Selling price customers pay</span>
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Compare-at price</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 10.99 (optional)"
            value={form.compareAtPrice}
            onChange={(e) =>
              setForm({ ...form, compareAtPrice: e.target.value.replace(/[^0-9.]/g, "") })
            }
            className="w-full border rounded-lg px-3 py-2"
          />
          <span className="mt-1 block text-xs text-slate-500">
            List / MRP shown with strikethrough when higher than price
          </span>
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">SKU</span>
          <input
            type="text"
            placeholder="Optional"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Inventory</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 200"
            value={form.inventory}
            onChange={(e) => setForm({ ...form, inventory: e.target.value.replace(/[^0-9]/g, "") })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </label>
        <div className="space-y-3 sm:col-span-2">
          <ProductCategoryFields
            categories={categories}
            categorySlug={form.categorySlug}
            additionalCategorySlugs={form.additionalCategorySlugs}
            onCategorySlug={(categorySlug) => setForm({ ...form, categorySlug })}
            onAdditionalCategorySlugs={(additionalCategorySlugs) =>
              setForm({ ...form, additionalCategorySlugs })
            }
          />
        </div>
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Currency</span>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value as "USD" | "INR" })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </label>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Shipping dimensions</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            placeholder="Weight (oz)"
            type="number"
            step="any"
            value={form.weightOz}
            onChange={(e) => setForm({ ...form, weightOz: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <input
            placeholder="Length (in)"
            type="number"
            step="any"
            value={form.lengthIn}
            onChange={(e) => setForm({ ...form, lengthIn: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <input
            placeholder="Width (in)"
            type="number"
            step="any"
            value={form.widthIn}
            onChange={(e) => setForm({ ...form, widthIn: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <input
            placeholder="Height (in)"
            type="number"
            step="any"
            value={form.heightIn}
            onChange={(e) => setForm({ ...form, heightIn: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Used for USPS rate quotes and label purchase.</p>
      </div>
      <input
        placeholder="Tags (comma-separated)"
        value={form.tags}
        onChange={(e) => setForm({ ...form, tags: e.target.value })}
        className="w-full border rounded-lg px-3 py-2"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(e) => setForm({ ...form, published: e.target.checked })}
        />
        Published (live on storefront)
      </label>
      <div className="flex gap-2">
        <button type="submit" className="bg-accent text-white px-6 py-2 rounded-lg">
          {submitLabel}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setTab("list");
            }}
            className="border px-4 py-2 rounded-lg text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="px-4 py-2 rounded-lg text-sm border">
          Add Product
        </Link>
      </div>

      {missingDimsCount > 0 && (
        <div className="text-sm bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg flex flex-wrap items-center gap-2">
          <span>
            {missingDimsCount} product{missingDimsCount === 1 ? "" : "s"} missing shipping dimensions
          </span>
          <Link href="/admin/shipping" className="text-nav font-medium hover:underline">
            Review in Shipping settings →
          </Link>
        </div>
      )}

      {loadError && (
        <p className="text-sm bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg" role="alert">
          {loadError}
        </p>
      )}

      {message && <p className="text-sm bg-slate-50 border p-3 rounded-lg">{message}</p>}

      {tab === "list" && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            {(
              [
                ["all", "All Products"],
                ["real", "Real Products"],
                ["sample", "Sample Products"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSampleFilter(key);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  sampleFilter === key ? "bg-nav text-white" : "border bg-white text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={convertSelectedToReal}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium"
            >
              Convert selected → real
            </button>
            <button
              type="button"
              onClick={removeAllSampleProducts}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800"
            >
              Remove all sample products
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-slate-600" htmlFor="admin-product-vendor">
              Vendor
            </label>
            <select
              id="admin-product-vendor"
              value={vendorFilter && vendorFilter !== "all" ? vendorFilter : ""}
              onChange={(event) => setVendorFilter(event.target.value)}
              className="border rounded-lg bg-white px-3 py-2 text-sm"
            >
              <option value="">All vendors</option>
              {vendorChoices.map((vendor) => (
                <option key={vendor.vendorSlug} value={vendor.vendorSlug}>
                  {vendor.vendorName}
                </option>
              ))}
            </select>
          </div>
          <input
            type="search"
            placeholder="Search by name, slug, SKU…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <TableControls
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
          {loading ? (
            <p className="text-slate-500">Loading…</p>
          ) : (
            <div className="bg-white border rounded-lg overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        aria-label="Select page"
                        checked={
                          pageItems.length > 0 &&
                          pageItems.every((p) => selected.has(p.slug))
                        }
                        onChange={(e) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) pageItems.forEach((p) => next.add(p.slug));
                            else pageItems.forEach((p) => next.delete(p.slug));
                            return next;
                          });
                        }}
                      />
                    </th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Sold</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => {
                    const gallery = Array.isArray(p.images)
                      ? p.images.filter((imageUrl) => typeof imageUrl === "string" && imageUrl.trim())
                      : [];
                    return (
                    <tr key={p.slug} className="border-t align-top">
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={selected.has(p.slug)}
                          onChange={(e) => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(p.slug);
                              else next.delete(p.slug);
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium flex items-center gap-1.5 flex-wrap">
                          {p.name}
                          {p.isSampleProduct ? (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-100 text-violet-900">
                              Sample
                            </span>
                          ) : null}
                          {!productHasShippingDims(p) && (
                            <span
                              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900"
                              title="Missing shipping dimensions"
                            >
                              No dims
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{p.slug}</div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{gallery.length} image{gallery.length === 1 ? "" : "s"}</span>
                            {uploadingSlug === p.slug && <span className="text-nav">Uploading...</span>}
                          </div>
                          {gallery.length ? (
                            <div className="flex flex-wrap gap-2">
                              {gallery.map((imageUrl, index) => {
                                const deleteKey = `${p.slug}:${imageUrl}`;
                                return (
                                  <div
                                    key={`${imageUrl}-${index}`}
                                    className="relative w-16 rounded-lg border bg-slate-50 p-1"
                                  >
                                    <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                                      Image {index + 1}
                                    </span>
                                    <div className="h-12 w-full overflow-hidden rounded bg-white">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={imageUrl}
                                        alt={`${p.name} image ${index + 1}`}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => deleteProductImage(p.slug, imageUrl, index + 1)}
                                      disabled={deletingImage === deleteKey}
                                      className="mt-1 w-full text-[10px] text-red-600 hover:underline disabled:opacity-50"
                                    >
                                      {deletingImage === deleteKey ? "Deleting" : "Delete"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No product images yet.</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">{p.sku ?? "—"}</td>
                      <td className="py-3 px-4">{p.categorySlug}</td>
                      <td className="py-3 px-4">
                        {formatMoney(p.price, p.currency)}
                        {p.compareAtPrice && (
                          <div className="text-xs text-slate-400 line-through">
                            {formatMoney(p.compareAtPrice, p.currency)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <form
                          className="flex items-center gap-1"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = (e.currentTarget.elements.namedItem("stock") as HTMLInputElement)
                              .value;
                            void saveStock(p.slug, parseInt(input, 10));
                          }}
                        >
                          <input
                            name="stock"
                            type="number"
                            min={0}
                            defaultValue={p.inventory ?? 0}
                            key={`${p.slug}-${p.inventory}`}
                            className="w-20 border rounded px-2 py-1 text-sm"
                          />
                          <button
                            type="submit"
                            className="text-xs text-nav hover:underline whitespace-nowrap"
                          >
                            Save
                          </button>
                          {stockBadge(p.inventory ?? 0)}
                        </form>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{getUnitsSold(p)}</span>
                        {isFastSelling(p) && (
                          <span className="ml-1 text-[10px] font-bold text-orange-600 uppercase">Fast</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                            p.published !== false ? "bg-green-100 text-green-800" : "bg-slate-100"
                          }`}
                        >
                          {p.published !== false ? "Published" : "Draft"}
                        </span>
                        {(p.inventory ?? 0) <= 0 && p.published !== false && (
                          <span className="text-[10px] text-slate-500">Hidden from shop (sold out)</span>
                        )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="text-xs text-nav hover:underline mr-2"
                        >
                          Edit
                        </button>
                        <Link href={`/products/${p.slug}`} className="text-xs text-nav hover:underline mr-2">
                          View
                        </Link>
                        <label className="text-xs text-nav hover:underline cursor-pointer mr-2">
                          {uploadingSlug === p.slug ? "Uploading..." : "Add images"}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            disabled={uploadingSlug !== null}
                            onChange={(e) => {
                              if (e.currentTarget.files?.length) {
                                void uploadImages(e.currentTarget.files, p.slug);
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteProduct(p.slug)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "create" && editing && (
        <div className="space-y-8">
          <ProductForm onSubmit={saveEdit} submitLabel="Save changes" />
          <p className="text-sm text-slate-600">
            New products are added from{" "}
            <Link href="/admin/products/new" className="font-medium text-nav underline">
              Add Product
            </Link>
            . That import previews the whole batch and does not overwrite existing products.
          </p>
        </div>
      )}
    </div>
  );
}
