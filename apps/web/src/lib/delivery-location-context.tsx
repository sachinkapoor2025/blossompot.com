"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import { applyDeliveryCheck, type DeliveryCheckState } from "./country-switch";
import { disabledCountryFallback, useGboDeliveryCountries } from "./gbo-delivery-countries";
import {
  DELIVERY_LOCATION_EVENT,
  readDeliveryLocation,
  toShoppingDeliveryLocation,
  writeDeliveryLocation,
  type StoredDeliveryLocation,
} from "./delivery-location";

type CheckResponse = {
  serviceable: boolean;
  location?: { postalLabel?: string };
  vendors?: { vendorId: string }[];
  message?: string;
};

type DeliveryLocationContextValue = {
  location: StoredDeliveryLocation | null;
  ready: boolean;
  checking: boolean;
  serviceable: boolean | null;
  vendorSlugs: string[];
  message: string | null;
  /** Set when the latest serviceability request failed. Not a successful check. */
  checkError: string | null;
  /** Country selected by the user before the destination path has caught up. */
  pendingCountry: string | null;
  selectorOpen: boolean;
  selectorCountryPrefill: string | null;
  openSelector: (opts?: { countryCode?: string }) => void;
  closeSelector: () => void;
  setLocation: (location: StoredDeliveryLocation) => Promise<CheckResponse>;
  checkLocation: (location: StoredDeliveryLocation) => Promise<CheckResponse>;
  clearPendingIfSettled: (pathIso: string | null) => void;
};

const DeliveryLocationContext = createContext<DeliveryLocationContextValue | null>(null);

export function DeliveryLocationProvider({ children }: { children: ReactNode }) {
  const [location, setStored] = useState<StoredDeliveryLocation | null>(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [serviceable, setServiceable] = useState<boolean | null>(null);
  const [vendorSlugs, setVendorSlugs] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [pendingCountry, setPendingCountry] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorCountryPrefill, setSelectorCountryPrefill] = useState<string | null>(null);
  const { countries, loaded: countriesLoaded, fromConfig, defaultCountry } = useGboDeliveryCountries();
  const selectionRef = useRef(0);
  const checkLocationRef = useRef<(location: StoredDeliveryLocation, requestId: number) => Promise<CheckResponse>>(
    async () => ({ serviceable: false })
  );

  const publishCheck = useCallback((applied: DeliveryCheckState) => {
    setServiceable(applied.serviceable);
    setVendorSlugs(applied.vendorSlugs);
    setMessage(applied.message);
    setCheckError(applied.error);
  }, []);

  const checkLocation = useCallback(async (next: StoredDeliveryLocation, requestId?: number) => {
    const id = requestId ?? ++selectionRef.current;
    setChecking(true);
    const blank: DeliveryCheckState = { serviceable: null, vendorSlugs: [], message: null, error: null };
    try {
      const data = await api<CheckResponse>("/location/check-serviceability", {
        method: "POST",
        revalidate: false,
        body: JSON.stringify({
          countryCode: next.countryCode,
          postalCode: next.postalCode,
        }),
      });
      if (id !== selectionRef.current) return data;
      publishCheck(
        applyDeliveryCheck(blank, {
          latest: true,
          ok: true,
          serviceable: data.serviceable,
          vendorSlugs: (data.vendors ?? []).map((v) => v.vendorId),
          message: data.message ?? null,
        })
      );
      setStored(next);
      return data;
    } catch (err) {
      if (id !== selectionRef.current) throw err;
      const error = err instanceof Error ? err.message : "Could not check this location";
      publishCheck(applyDeliveryCheck(blank, { latest: true, ok: false, error }));
      throw err;
    } finally {
      if (id === selectionRef.current) setChecking(false);
    }
  }, [publishCheck]);

  checkLocationRef.current = checkLocation;

  const setLocation = useCallback(
    async (next: StoredDeliveryLocation) => {
      const normalized = toShoppingDeliveryLocation({
        ...next,
        countryCode: next.countryCode.trim().toUpperCase(),
      });
      const id = ++selectionRef.current;
      writeDeliveryLocation(normalized);
      setStored(normalized);
      setPendingCountry(normalized.countryCode);
      setServiceable(null);
      setVendorSlugs([]);
      setMessage(null);
      setCheckError(null);
      return checkLocation(normalized, id);
    },
    [checkLocation]
  );

  const clearPendingIfSettled = useCallback((pathIso: string | null) => {
    setPendingCountry((current) => (current && pathIso === current ? null : current));
  }, []);

  useEffect(() => {
    if (!countriesLoaded || !fromConfig || !location) return;
    const fallback = disabledCountryFallback(location.countryCode, countries, defaultCountry);
    if (!fallback) return;
    void setLocation({ countryCode: fallback, postalCode: "", postalDisplay: fallback });
  }, [countries, countriesLoaded, defaultCountry, fromConfig, location, setLocation]);

  useEffect(() => {
    const existing = readDeliveryLocation();
    if (existing) {
      const id = ++selectionRef.current;
      void checkLocationRef.current(existing, id)
        .catch(() => undefined)
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
    const onChange = () => {
      const latest = readDeliveryLocation();
      if (latest) return;
      selectionRef.current += 1;
      setStored(null);
      setPendingCountry(null);
      setServiceable(null);
      setVendorSlugs([]);
      setMessage(null);
      setCheckError(null);
      setChecking(false);
    };
    window.addEventListener(DELIVERY_LOCATION_EVENT, onChange);
    return () => window.removeEventListener(DELIVERY_LOCATION_EVENT, onChange);
  }, []);

  const value = useMemo<DeliveryLocationContextValue>(
    () => ({
      location,
      ready,
      checking,
      serviceable,
      vendorSlugs,
      message,
      checkError,
      pendingCountry,
      selectorOpen,
      selectorCountryPrefill,
      openSelector: (opts) => {
        setSelectorCountryPrefill(opts?.countryCode?.trim().toUpperCase() || null);
        setSelectorOpen(true);
      },
      closeSelector: () => {
        setSelectorOpen(false);
        setSelectorCountryPrefill(null);
      },
      setLocation,
      checkLocation,
      clearPendingIfSettled,
    }),
    [location, ready, checking, serviceable, vendorSlugs, message, checkError, pendingCountry, selectorOpen, selectorCountryPrefill, setLocation, checkLocation, clearPendingIfSettled]
  );

  return <DeliveryLocationContext.Provider value={value}>{children}</DeliveryLocationContext.Provider>;
}

export function useDeliveryLocation() {
  const ctx = useContext(DeliveryLocationContext);
  if (!ctx) throw new Error("useDeliveryLocation must be used within DeliveryLocationProvider");
  return ctx;
}

export function useOptionalDeliveryLocation() {
  return useContext(DeliveryLocationContext);
}
