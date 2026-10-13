"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATALOG_LOAD_ERROR_MESSAGE, runCatalogRetry } from "@/lib/catalog-load-state";

export function CatalogLoadError({
  message = CATALOG_LOAD_ERROR_MESSAGE,
}: {
  message?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>{message}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => runCatalogRetry(() => router.refresh()))}
        className="mt-2 font-semibold text-nav hover:underline disabled:opacity-60"
      >
        {pending ? "Trying again…" : "Try again"}
      </button>
    </div>
  );
}
