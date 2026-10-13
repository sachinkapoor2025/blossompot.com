import Link from "next/link";

const PLACEHOLDERS = [
  {
    id: "diwali-placeholder",
    festival: "Diwali",
    prompt: "Delivery, packaging, and gifting satisfaction for Diwali orders to the USA.",
  },
  {
    id: "bhai-dooj-placeholder",
    festival: "Bhai Dooj",
    prompt: "Gifts sent to brothers and families in the USA for Bhai Dooj.",
  },
] as const;

/**
 * Festival review slots. We do not publish invented testimonials.
 * Genuine Google reviews stay in CustomerReviews; these cards wait for real festival feedback.
 */
export function FestivalGiftReviews() {
  return (
    <section
      className="border-b border-[#eadfd8] bg-white"
      aria-labelledby="festival-reviews-heading"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-nav">
            Diwali &amp; Bhai Dooj
          </p>
          <h2 id="festival-reviews-heading" className="text-2xl font-bold text-primary md:text-3xl">
            Festival gift reviews
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            Customer comments about Diwali and Bhai Dooj gifts, USA delivery, and packaging will
            appear here when they are submitted. These cards are placeholders — not fictional
            quotes.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PLACEHOLDERS.map((slot) => (
            <article
              key={slot.id}
              className="flex min-h-[11rem] flex-col rounded-2xl border border-dashed border-primary/25 bg-gradient-to-b from-[#fff8f5] to-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-nav">{slot.festival}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{slot.prompt}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Review placeholder — coming soon
              </p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/reviews" className="text-sm font-semibold text-nav hover:underline">
            Share a genuine review →
          </Link>
        </p>
      </div>
    </section>
  );
}
