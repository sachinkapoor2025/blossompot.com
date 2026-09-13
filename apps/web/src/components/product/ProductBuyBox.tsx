import type { ReactNode } from "react";

/** Visual grouping for title, proof, price, and urgency — no purchase logic. */
export function ProductBuyBox({ children }: { children: ReactNode }) {
  return <div className="mb-1">{children}</div>;
}
