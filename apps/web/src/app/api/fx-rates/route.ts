import { fetchLiveUsdInrRate, fetchLiveUsdRates } from "@blossompot/shared";
import { NextResponse } from "next/server";

/**
 * Same-origin FX proxy. The browser must not call api.frankfurter.app (CORS).
 * Rates are fetched server-side from public providers.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [inr, table] = await Promise.all([fetchLiveUsdInrRate(), fetchLiveUsdRates()]);
  const rates = { USD: 1, ...(table?.rates ?? {}), ...(inr ? { INR: inr.rate } : {}) };
  if (!inr && Object.keys(rates).length <= 1) {
    return NextResponse.json({ error: "Exchange rates unavailable" }, { status: 502 });
  }
  return NextResponse.json(
    {
      rate: inr?.rate ?? rates.INR,
      rates,
      source: table?.source ?? inr?.source ?? "fx-proxy",
      asOf: table?.asOf ?? inr?.asOf ?? new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    }
  );
}
