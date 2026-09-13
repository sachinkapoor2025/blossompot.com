import { trustFacts, trustHighlights } from "@/lib/trust";
import { TrustBadges } from "@/components/TrustBadges";

export function WhyTrustUsSection() {
  return (
    <section className="bg-surface border-y border-line" aria-labelledby="why-trust-heading">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">{trustFacts.seasonLabel}</p>
          <h2 id="why-trust-heading" className="text-2xl md:text-3xl font-bold text-ink mb-3">
            Why customers trust BlossomPot
          </h2>
          <p className="text-muted text-sm md:text-base leading-relaxed">
            BlossomPot delivers {trustFacts.catalog.toLowerCase()}. {trustFacts.fulfillment}.{" "}
            {trustFacts.support}.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {trustHighlights.map((item) => {
            const inner = (
              <>
                <span className="text-2xl mb-2 block" aria-hidden>
                  {item.icon}
                </span>
                <h3 className="font-bold text-ink text-sm mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.detail}</p>
              </>
            );
            return "href" in item && item.href ? (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-line bg-ivory p-5 hover:border-accent hover:shadow-sm transition"
              >
                {inner}
              </a>
            ) : (
              <div key={item.title} className="rounded-xl border border-line bg-ivory p-5">
                {inner}
              </div>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto">
          <TrustBadges />
        </div>
      </div>
    </section>
  );
}
