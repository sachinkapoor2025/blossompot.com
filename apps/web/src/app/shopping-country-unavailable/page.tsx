import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/** Middleware rewrites a disabled shopping URL here so the response is the app 404. */
export default function ShoppingCountryUnavailablePage() {
  notFound();
}
