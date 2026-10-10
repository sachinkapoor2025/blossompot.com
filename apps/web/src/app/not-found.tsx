import Link from "next/link";
import { BackToHome } from "@/components/BackToHome";
import { notFoundMetadata } from "@/lib/not-found-metadata";

export const metadata = notFoundMetadata;

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-nav">404</p>
      <h1 className="mt-2 text-3xl font-bold text-primary">Page not found</h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        This URL is not a page on BlossomPot. Check the address, or continue shopping from the
        homepage.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="btn-nav bg-primary">
          Back to Home
        </Link>
        <Link href="/products" className="btn-nav">
          Browse gifts
        </Link>
      </div>
      <div className="mt-10">
        <BackToHome />
      </div>
    </div>
  );
}
