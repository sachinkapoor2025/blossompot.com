"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FNP_IMPORT_COMMIT_BATCH_SIZE,
  type FnpCategoryOverride,
  type FnpImportPlan,
  type FnpImportPlanRow,
} from "@blossompot/shared";
import { useApiClient } from "@/lib/auth-context";

type CatalogCategory = { slug: string; name: string; published: boolean };

type PreviewResponse = FnpImportPlan & {
  writes: false;
  writeBlocked: boolean;
  writeBlockedReason: string | null;
  batchSize: number;
  catalogCategories: CatalogCategory[];
};

type CommitRow = FnpImportPlanRow & {
  outcome?: { status: string; message: string; productSlug?: string };
};

type CommitResponse = {
  batchId: string;
  published: false;
  counts: {
    imported: number;
    skipped: number;
    failed: number;
    blocked: number;
    conflicts: number;
  };
  rows: CommitRow[];
};

type HistoryBatch = {
  batchId: string;
  createdAt: string;
  createdBy: string;
  environment: string;
  imported: number;
  skipped: number;
  failed: number;
  blocked: number;
  conflicts: number;
};

type MappingDraft = {
  workbook: string;
  mode: "" | "map" | "create";
  slug: string;
  name: string;
};

const CSV_HEADER = [
  "Row",
  "Status",
  "S. No",
  "Name",
  "Category",
  "List price",
  "MRP",
  "Product URL",
  "Image URL",
  "Errors",
  "Warnings",
  "Import message",
];

function csvEscape(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename: string, records: string[][]) {
  const lines = [CSV_HEADER.map(csvEscape).join(","), ...records.map((record) => record.map(csvEscape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function reportRecords(rows: CommitRow[]): string[][] {
  return rows
    .filter((row) => (row.outcome?.status ?? row.status) !== "ready" && row.status !== "empty" && row.outcome?.status !== "imported")
    .filter((row) => row.status !== "empty")
    .map((row) => [
      String(row.row),
      row.outcome?.status ?? row.status,
      row.sourceSerial,
      row.name,
      row.categorySlug ?? row.unmatchedCategory ?? "",
      row.price == null ? "" : String(row.price),
      row.compareAtPrice == null ? "" : String(row.compareAtPrice),
      row.sourceUrl,
      row.imageUrl,
      row.errors.join("; "),
      row.warnings.join("; "),
      row.outcome?.message ?? "",
    ]);
}

export default function FnpImportPage() {
  const apiClient = useApiClient();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [busy, setBusy] = useState<"preview" | "commit" | "retry" | null>(null);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState("");
  const [history, setHistory] = useState<HistoryBatch[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [lastBatchId, setLastBatchId] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [appliedOverrides, setAppliedOverrides] = useState<FnpCategoryOverride[]>([]);
  const [drafts, setDrafts] = useState<Record<string, MappingDraft>>({});
  const [commitProblems, setCommitProblems] = useState<CommitRow[]>([]);

  const loadHistory = useCallback(() => {
    setHistoryError("");
    apiClient<{ batches: HistoryBatch[] }>("/admin/imports/fnp")
      .then((data) => setHistory(data.batches ?? []))
      .catch((err) => {
        setHistory([]);
        setHistoryError(err instanceof Error ? err.message : "Could not load import history.");
      });
  }, [apiClient]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function onFile(file: File | undefined) {
    setPreview(null);
    setConfirmed(false);
    setProgress("");
    setMessage("");
    setSelected(new Set());
    setAppliedOverrides([]);
    setDrafts({});
    setCommitProblems([]);
    if (!file) {
      setRows([]);
      setFileName("");
      return;
    }
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets.Products ?? workbook.Sheets[workbook.SheetNames[0] ?? ""];
    if (!sheet) {
      setMessage("The workbook has no sheets.");
      return;
    }
    const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
    setRows(parsed);
    setFileName(file.name);
    setMessage(`${parsed.length} rows read from ${file.name}. Preview checks them without writing.`);
  }

  async function runPreview(overrides: FnpCategoryOverride[]) {
    setBusy("preview");
    setMessage("");
    setProgress("");
    setCommitProblems([]);
    try {
      const result = await apiClient<PreviewResponse>("/admin/imports/fnp/preview", {
        method: "POST",
        body: JSON.stringify({ rows, categoryOverrides: overrides }),
      });
      setPreview(result);
      setAppliedOverrides(overrides);
      setSelected(new Set(result.rows.filter((row) => row.status === "ready").map((row) => row.row)));
      setDrafts((current) => {
        const next = { ...current };
        for (const name of result.unmatchedCategories) {
          if (!next[name]) next[name] = { workbook: name, mode: "", slug: "", name: "" };
        }
        return next;
      });
      setMessage(
        `${result.total} rows: ${result.ready} ready, ${result.blocked} blocked, ${result.duplicate} duplicates, ${result.conflict} conflicts.`
      );
    } catch (err) {
      setPreview(null);
      setMessage(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setBusy(null);
    }
  }

  function overridesFromDrafts(): FnpCategoryOverride[] {
    return Object.values(drafts).flatMap((draft): FnpCategoryOverride[] => {
      if (draft.mode === "map" && draft.slug) {
        const catalog = preview?.catalogCategories.find((category) => category.slug === draft.slug);
        return [{ workbook: draft.workbook, slug: draft.slug, name: catalog?.name ?? draft.slug, create: false }];
      }
      if (draft.mode === "create" && draft.name.trim()) {
        return [{ workbook: draft.workbook, slug: draft.name.trim(), name: draft.name.trim(), create: true }];
      }
      return [];
    });
  }

  async function runCommit() {
    if (!preview) return;
    const ready = preview.rows.filter((row) => row.status === "ready" && selected.has(row.row));
    if (ready.length === 0) {
      setMessage("Select at least one ready product to import.");
      return;
    }
    setBusy("commit");
    setMessage("");
    setCommitProblems([]);
    let batchId = "";
    let imported = 0;
    let failed = 0;
    const problems: CommitRow[] = [];
    try {
      for (let index = 0; index < ready.length; index += FNP_IMPORT_COMMIT_BATCH_SIZE) {
        const chunk = ready.slice(index, index + FNP_IMPORT_COMMIT_BATCH_SIZE);
        const chunkNumber = Math.floor(index / FNP_IMPORT_COMMIT_BATCH_SIZE) + 1;
        const chunkCount = Math.ceil(ready.length / FNP_IMPORT_COMMIT_BATCH_SIZE);
        setProgress(`Committing batch ${chunkNumber} of ${chunkCount} (${chunk.length} products).`);
        const result = await apiClient<CommitResponse>("/admin/imports/fnp/commit", {
          method: "POST",
          body: JSON.stringify({
            ...(batchId ? { batchId } : {}),
            categoryOverrides: appliedOverrides,
            entries: chunk.map((row) => ({ row: row.row, input: row.input })),
          }),
        });
        batchId = result.batchId;
        for (const row of result.rows) {
          if (row.outcome?.status === "imported") imported += 1;
          else if (row.outcome?.status === "error") failed += 1;
          if (row.outcome && row.outcome.status !== "imported" && row.outcome.status !== "empty") problems.push(row);
        }
      }
      setLastBatchId(batchId);
      setCommitProblems(problems);
      setProgress("");
      setMessage(
        `Commit finished. ${imported} imported unpublished, ${failed} failed. Existing products were left unchanged. Batch ${batchId}.`
      );
      loadHistory();
    } catch (err) {
      setCommitProblems(problems);
      setProgress("");
      setMessage(
        err instanceof Error
          ? `${err.message} ${imported} products were already imported in this run.`
          : "Commit failed."
      );
    } finally {
      setBusy(null);
    }
  }

  async function runRetry() {
    if (!lastBatchId) return;
    setBusy("retry");
    setMessage("");
    try {
      const result = await apiClient<CommitResponse & { retried: number; message?: string }>(
        "/admin/imports/fnp/retry",
        {
          method: "POST",
          body: JSON.stringify({ batchId: lastBatchId }),
        }
      );
      setMessage(result.message ?? `Retried ${result.retried} failed rows. Imported total ${result.counts.imported}.`);
      loadHistory();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Retry failed.");
    } finally {
      setBusy(null);
    }
  }

  const exceptions = (preview?.rows ?? []).filter((row) => row.status !== "ready" && row.status !== "empty");
  const readyRows = (preview?.rows ?? []).filter((row) => row.status === "ready");
  const selectedCount = readyRows.filter((row) => selected.has(row.row)).length;
  const commitDisabled =
    !preview || selectedCount === 0 || preview.writeBlocked || !confirmed || busy !== null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">FNP USA import</h1>
          <p className="text-sm text-slate-600 mt-1">
            Preview the categorized workbook, choose which ready rows to import, then commit unpublished products in
            batches of {FNP_IMPORT_COMMIT_BATCH_SIZE}. Production writes stay disabled. Existing products are never
            overwritten.
          </p>
        </div>
        <Link href="/admin/products" className="text-sm underline">
          Back to products
        </Link>
      </div>

      <section className="border rounded-lg bg-white p-4 space-y-3">
        <label className="block text-sm font-medium">
          Categorized workbook (.xlsx or .csv)
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="mt-2 block w-full text-sm"
            onChange={(event) => {
              void onFile(event.currentTarget.files?.[0]);
            }}
          />
        </label>
        <p className="text-sm text-slate-600">
          {fileName ? `${fileName}: ${rows.length} rows` : "Choose the categorized product workbook."}
        </p>
        <button
          type="button"
          disabled={rows.length === 0 || busy !== null}
          onClick={() => void runPreview(appliedOverrides)}
          className="bg-nav text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {busy === "preview" ? "Previewing…" : "Preview"}
        </button>
      </section>

      {preview && (
        <section className="border rounded-lg bg-white p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-sm">
            <Summary label="Total" value={preview.total} />
            <Summary label="Ready" value={preview.ready} />
            <Summary label="Blocked" value={preview.blocked} />
            <Summary label="Duplicates" value={preview.duplicate} />
            <Summary label="Conflicts" value={preview.conflict} />
            <Summary label="New categories" value={preview.categoriesToCreate.length} />
          </div>
          {preview.writeBlocked && (
            <p className="text-sm text-red-700">Commit is disabled. {preview.writeBlockedReason}</p>
          )}
          {preview.categoriesToCreate.length > 0 && (
            <p className="text-sm text-slate-700">
              Commit will create these categories unpublished: {preview.categoriesToCreate.join(", ")}.
            </p>
          )}

          {preview.unmatchedCategories.length > 0 && (
            <div className="space-y-3 border rounded-lg p-3">
              <h2 className="text-sm font-semibold">Unmatched categories</h2>
              <p className="text-sm text-slate-600">
                These workbook categories are not in the approved map. Map each one to an existing category, or create
                a new unpublished category. Nothing is created until you apply the mapping and commit.
              </p>
              {preview.unmatchedCategories.map((name) => {
                const draft = drafts[name] ?? { workbook: name, mode: "" as const, slug: "", name: "" };
                return (
                  <div key={name} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_minmax(0,1fr)] items-center">
                    <div className="text-sm font-medium">{name}</div>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={draft.mode === "create" ? "__create__" : draft.slug}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDrafts((current) => ({
                          ...current,
                          [name]: {
                            workbook: name,
                            mode: value === "__create__" ? "create" : value ? "map" : "",
                            slug: value === "__create__" ? "" : value,
                            name: current[name]?.name ?? "",
                          },
                        }));
                      }}
                    >
                      <option value="">Choose…</option>
                      {(preview.catalogCategories ?? []).map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.name}
                          {category.published ? "" : " (unpublished)"}
                        </option>
                      ))}
                      <option value="__create__">Create unpublished category</option>
                    </select>
                    {draft.mode === "create" ? (
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="New category name"
                        value={draft.name}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [name]: { ...draft, name: event.target.value },
                          }))
                        }
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Existing category</span>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void runPreview(overridesFromDrafts())}
                className="border px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Apply category mapping
              </button>
            </div>
          )}

          {readyRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Ready to import ({selectedCount} selected)</h2>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="text-sm underline"
                    onClick={() => setSelected(new Set(readyRows.slice(0, 5).map((row) => row.row)))}
                  >
                    Select first 5 ready
                  </button>
                  <button
                    type="button"
                    className="text-sm underline"
                    onClick={() => {
                      const allSelected = selectedCount === readyRows.length;
                      setSelected(allSelected ? new Set() : new Set(readyRows.map((row) => row.row)));
                    }}
                  >
                    {selectedCount === readyRows.length ? "Clear selection" : "Select all ready"}
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[28rem] border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left border-b">
                      <th className="py-2 px-2">Import</th>
                      <th className="py-2 pr-3">Image</th>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3">Price</th>
                      <th className="py-2 pr-3">MRP</th>
                      <th className="py-2 pr-3">Product URL</th>
                      <th className="py-2">Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readyRows.map((row) => (
                      <tr key={`${row.row}-${row.slug}`} className="border-b align-top">
                        <td className="py-2 px-2">
                          <input
                            type="checkbox"
                            checked={selected.has(row.row)}
                            aria-label={`Import ${row.name}`}
                            onChange={(event) => {
                              const on = event.target.checked;
                              setSelected((current) => {
                                const next = new Set(current);
                                if (on) next.add(row.row);
                                else next.delete(row.row);
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          {row.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.imageUrl} alt="" className="h-12 w-12 object-cover rounded bg-slate-100" />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {row.name}
                          {row.sourceSerial ? (
                            <div className="text-xs text-slate-500">S. No {row.sourceSerial}</div>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3">
                          {row.categoryName ?? row.categorySlug}
                          {row.categoryAction === "create" ? (
                            <div className="text-xs text-slate-500">new, unpublished</div>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3">{row.price ?? "—"}</td>
                        <td className="py-2 pr-3">{row.compareAtPrice ?? "—"}</td>
                        <td className="py-2 pr-3 max-w-[12rem] truncate">
                          <a href={row.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                            {row.sourceUrl.replace(/^https?:\/\/(www\.)?/, "")}
                          </a>
                        </td>
                        <td className="py-2 text-xs text-slate-600">{row.warnings.join(" ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.currentTarget.checked)}
              className="mt-1"
            />
            <span>
              Commit only the selected rows to this non-production database. Products stay unpublished, inventory stays
              0, and an existing product is left unchanged.
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={commitDisabled}
              onClick={() => void runCommit()}
              className="bg-nav text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {busy === "commit" ? "Committing…" : `Commit ${selectedCount} unpublished`}
            </button>
            <button
              type="button"
              disabled={!lastBatchId || busy !== null}
              onClick={() => void runRetry()}
              className="border px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {busy === "retry" ? "Retrying…" : "Retry failed rows"}
            </button>
            <button
              type="button"
              disabled={exceptions.length === 0}
              onClick={() => downloadCsv("fnp-import-preview-errors.csv", reportRecords(exceptions))}
              className="border px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              Download error report
            </button>
          </div>
          {progress && <p className="text-sm">{progress}</p>}
          {commitProblems.length > 0 && (
            <button
              type="button"
              onClick={() => downloadCsv("fnp-import-commit-errors.csv", reportRecords(commitProblems))}
              className="border px-4 py-2 rounded-lg text-sm"
            >
              Download commit error report ({commitProblems.length})
            </button>
          )}
          {exceptions.length > 0 && (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Row</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.slice(0, 40).map((row) => (
                    <tr key={`${row.row}-${row.sourceKey ?? row.name}`} className="border-b align-top">
                      <td className="py-2 pr-3">{row.row}</td>
                      <td className="py-2 pr-3">{row.status}</td>
                      <td className="py-2 pr-3">{row.name}</td>
                      <td className="py-2 pr-3">{row.categorySlug ?? row.unmatchedCategory ?? "—"}</td>
                      <td className="py-2">{row.errors.join(" ") || row.warnings[0] || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {exceptions.length > 40 && (
                <p className="text-xs text-slate-500 mt-2">
                  Showing 40 of {exceptions.length} rows that need attention. Download the error report for the full
                  list.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {message && <p className="text-sm">{message}</p>}

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Import history</h2>
        {historyError ? (
          <p className="text-sm text-red-700">{historyError}</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-600">No import batches in this database yet.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {history.map((batch) => (
              <li key={batch.batchId}>
                {batch.createdAt} · {batch.environment} · imported {batch.imported}, failed {batch.failed}, blocked{" "}
                {batch.blocked}, conflicts {batch.conflicts} · {batch.batchId}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-lg px-3 py-2">
      <div className="text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
