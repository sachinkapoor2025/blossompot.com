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
import { api } from "./api";
import {
  DELIVERY_LOCATION_EVENT,
  readDeliveryLocation,
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
  selectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
  setLocation: (location: StoredDeliveryLocation) => Promise<CheckResponse>;
  checkLocation: (location: StoredDeliveryLocation) => Promise<CheckResponse>;
};

const DeliveryLocationContext = createContext<DeliveryLocationContextValue | null>(null);

export function DeliveryLocationProvider({ children }: { children: ReactNode }) {
  const [location, setStored] = useState<StoredDeliveryLocation | null>(null);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [serviceable, setServiceable] = useState<boolean | null>(null);
  const [vendorSlugs, setVendorSlugs] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const applyCheck = useCallback((next: StoredDeliveryLocation, data: CheckResponse) => {
    setStored(next);
    setServiceable(data.serviceable);
    setVendorSlugs((data.vendors ?? []).map((v) => v.vendorId));
    setMessage(data.message ?? null);
  }, []);

  const checkLocation = useCallback(async (next: StoredDeliveryLocation) => {
    setChecking(true);
    try {
      const data = await api<CheckResponse>("/location/check-serviceability", {
        method: "POST",
        revalidate: false,
        body: JSON.stringify({
          countryCode: next.countryCode,
          postalCode: next.postalCode,
        }),
      });
      applyCheck(next, data);
      return data;
    } finally {
      setChecking(false);
    }
  }, [applyCheck]);

  const setLocation = useCallback(
    async (next: StoredDeliveryLocation) => {
      writeDeliveryLocation(next);
      return checkLocation(next);
    },
    [checkLocation]
  );

  useEffect(() => {
    const existing = readDeliveryLocation();
    if (existing) {
      void checkLocation(existing).finally(() => setReady(true));
    } else {
      setReady(true);
    }
    const onChange = () => {
      const latest = readDeliveryLocation();
      if (latest) void checkLocation(latest);
      else {
        setStored(null);
        setServiceable(null);
        setVendorSlugs([]);
        setMessage(null);
      }
    };
    window.addEventListener(DELIVERY_LOCATION_EVENT, onChange);
    return () => window.removeEventListener(DELIVERY_LOCATION_EVENT, onChange);
  }, [checkLocation]);

  const value = useMemo<DeliveryLocationContextValue>(
    () => ({
      location,
      ready,
      checking,
      serviceable,
      vendorSlugs,
      message,
      selectorOpen,
      openSelector: () => setSelectorOpen(true),
      closeSelector: () => setSelectorOpen(false),
      setLocation,
      checkLocation,
    }),
    [location, ready, checking, serviceable, vendorSlugs, message, selectorOpen, setLocation, checkLocation]
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
