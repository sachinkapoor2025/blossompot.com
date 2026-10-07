import Link from "next/link";

/** The FNP workbook importer is no longer an admin menu. Existing FNP products stay in the catalog. */
export default function RetiredFnpImportPage() {
  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-2xl font-bold">FNP import has moved</h1>
      <p className="text-sm text-slate-600">
        FNP products stay in the catalog and are managed with the other vendors. This page no longer imports or
        changes them.
      </p>
      <p className="text-sm">
        <Link href="/admin/vendors/fnp" className="font-medium text-nav underline">
          Manage FNP
        </Link>
        {" · "}
        <Link href="/admin/products/new" className="font-medium text-nav underline">
          Add Product
        </Link>
      </p>
    </div>
  );
}
