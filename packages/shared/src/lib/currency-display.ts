import {
  convertCurrencyAmount,
  roundForCurrency,
  type ShopCurrency,
} from "../currency";

export type DisplayCurrency = ShopCurrency;

export function normalizeDisplayCurrency(value: string): DisplayCurrency {
  return value === "INR" ? "INR" : "USD";
}

export function convertCurrency(
  amount: number,
  from: DisplayCurrency,
  to: DisplayCurrency,
  rate: number
): number {
  return roundForCurrency(convertCurrencyAmount(amount, from, to, rate), to);
}
