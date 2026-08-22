import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Forgot a Special Occasion? | BlossomPot",
  description: "Last-minute flowers, cakes, and gift combos when you forgot a birthday or anniversary.",
  path: "/forgot-occasion",
});

export default function ForgotOccasionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
