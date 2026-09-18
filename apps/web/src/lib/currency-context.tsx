"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_USD_INR_RATE,
  DEFAULT_USD_RATES,
  fetchLiveUsdInrRate,
  fetchLiveUsdRates,
  convertCurrency,
  currencyForCountryCode,
  displayCurrencyLocale,
  normalizeDisplayCurrency,
  type DisplayCurrency,
} from "@blossompot/shared";
import { getApiUrl } from "./env";
import { useOptionalDeliveryLocation } from "./delivery-location-context";

export type { DisplayCurrency };

const STORAGE_KEY = "hr_ecom_currency";
const MANUAL_KEY = "hr_ecom_currency_manual";
const RATE_CACHE_KEY = "hr_ecom_usd_inr_rate";
const RATE_CACHE_AT_KEY = "hr_ecom_usd_inr_rate_at";
const RATES_CACHE_KEY = "hr_ecom_usd_fx_rates";
const RATE_CACHE_TTL_MS = 60 * 60 * 1000;
const ENV_FALLBACK = Number(process.env.NEXT_PUBLIC_USD_INR_RATE) || DEFAULT_USD_INR_RATE;

interface CurrencyContextValue {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  usdInrRate: number;
  rateLoading: boolean;
  rateSource: string;
  convert: (amount: number, from: DisplayCurrency | string) => number;
  format: (amount: number, from: DisplayCurrency | string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readCachedRate(): number | null {
  if (typeof window === "undefined") return null;
  const cachedAt = sessionStorage.getItem(RATE_CACHE_AT_KEY);
  const cached = sessionStorage.getItem(RATE_CACHE_KEY);
  if (!cached || !cachedAt) return null;
  if (Date.now() - Number(cachedAt) > RATE_CACHE_TTL_MS) return null;
  const n = Number(cached);
  return n > 0 ? n : null;
}

function storeCachedRate(rate: number) {
  sessionStorage.setItem(RATE_CACHE_KEY, String(rate));
  sessionStorage.setItem(RATE_CACHE_AT_KEY, String(Date.now()));
}

async function fetchUsdInrRate(): Promise<{ rate: number; source: string }> {
  const sessionCached = readCachedRate();
  if (sessionCached) return { rate: sessionCached, source: "session-cache" };

  try {
    const res = await fetch(`${getApiUrl()}/config/usd-inr-rate`, { cache: "force-cache" });
    if (!res.ok) throw new Error("api rate failed");
    const data = (await res.json()) as { rate?: number; source?: string };
    if (!data.rate || data.rate <= 0) throw new Error("invalid api rate");
    const rate = Math.round(data.rate * 10_000) / 10_000;
    storeCachedRate(rate);
    return { rate, source: data.source ?? "api" };
  } catch {
    /* fall through */
  }

  try {
    const live = await fetchLiveUsdInrRate();
    if (live) {
      const rate = Math.round(live.rate * 10_000) / 10_000;
      storeCachedRate(rate);
      return { rate, source: live.source };
    }
  } catch {
    /* fall through */
  }

  return { rate: ENV_FALLBACK, source: "fallback" };
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const delivery = useOptionalDeliveryLocation();
  const [displayCurrency, setDisplayCurrencyState] = useState<DisplayCurrency>(() => {
    if (typeof window === "undefined") return "USD";
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeDisplayCurrency(saved) : "USD";
  });
  const [usdInrRate, setUsdInrRate] = useState(ENV_FALLBACK);
  const [usdRates, setUsdRates] = useState<Partial<Record<DisplayCurrency, number>>>(DEFAULT_USD_RATES);
  const [rateSource, setRateSource] = useState("loading");
  const [rateLoading, setRateLoading] = useState(true);

  const refreshRate = useCallback(async () => {
    const { rate, source } = await fetchUsdInrRate();
    setUsdInrRate(rate);
    setRateSource(source);
    setRateLoading(false);
    try {
      const cachedFx = sessionStorage.getItem(RATES_CACHE_KEY);
      if (cachedFx) {
        const parsed = JSON.parse(cachedFx) as Partial<Record<DisplayCurrency, number>>;
        setUsdRates({ ...DEFAULT_USD_RATES, ...parsed, INR: rate, USD: 1 });
      }
      const live = await fetchLiveUsdRates();
      if (live?.rates) {
        const next = { ...DEFAULT_USD_RATES, ...live.rates, INR: rate, USD: 1 };
        setUsdRates(next);
        sessionStorage.setItem(RATES_CACHE_KEY, JSON.stringify(next));
      }
    } catch {
      setUsdRates((prev) => ({ ...DEFAULT_USD_RATES, ...prev, INR: rate, USD: 1 }));
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (delivery && !delivery.ready) return;
      if (delivery?.location?.countryCode) {
        setDisplayCurrencyState(currencyForCountryCode(delivery.location.countryCode));
        return;
      }
      const manual = localStorage.getItem(MANUAL_KEY) === "true";
      if (manual) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setDisplayCurrencyState(normalizeDisplayCurrency(saved));
        return;
      }
      try {
        const res = await fetch("/api/geo", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { currency?: string; country?: string };
          const next = data.country
            ? currencyForCountryCode(data.country)
            : data.currency
              ? normalizeDisplayCurrency(data.currency)
              : "USD";
          setDisplayCurrencyState(next);
          localStorage.setItem(STORAGE_KEY, next);
        }
      } catch {
        /* keep prior / USD */
      }
    };

    void init();
    void refreshRate();

    const interval = setInterval(() => {
      void refreshRate();
    }, RATE_CACHE_TTL_MS);

    return () => clearInterval(interval);
  }, [refreshRate, delivery?.ready, delivery?.location?.countryCode]);

  const setDisplayCurrency = useCallback((c: DisplayCurrency) => {
    setDisplayCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
    localStorage.setItem(MANUAL_KEY, "true");
  }, []);

  const convert = useCallback(
    (amount: number, from: DisplayCurrency | string) =>
      convertCurrency(
        amount,
        normalizeDisplayCurrency(typeof from === "string" ? from : from),
        displayCurrency,
        usdInrRate,
        usdRates
      ),
    [displayCurrency, usdInrRate, usdRates]
  );

  const format = useCallback(
    (amount: number, from: DisplayCurrency | string) => {
      const value = convert(amount, from);
      return new Intl.NumberFormat(displayCurrencyLocale(displayCurrency), {
        style: "currency",
        currency: displayCurrency,
        maximumFractionDigits: displayCurrency === "INR" ? 0 : 2,
      }).format(value);
    },
    [convert, displayCurrency]
  );

  const value = useMemo(
    () => ({ displayCurrency, setDisplayCurrency, usdInrRate, rateLoading, rateSource, convert, format }),
    [displayCurrency, setDisplayCurrency, usdInrRate, rateLoading, rateSource, convert, format]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
