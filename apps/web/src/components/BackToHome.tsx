import Link from "next/link";

export function BackToHome({ className = "" }: { className?: string }) {
  return (
    <p className={className}>
      <Link href="/" className="text-nav font-semibold hover:underline">
        ← Back to Home
      </Link>
    </p>
  );
}
