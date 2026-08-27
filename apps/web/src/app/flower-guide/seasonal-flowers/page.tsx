import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { FlowerGuideShell } from "@/components/flower-guide/FlowerGuideShell";
import { monthlyCalendar, seasonalHub, seasonPages } from "@/lib/content/flower-guide";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: seasonalHub.seoTitle,
  description: seasonalHub.seoDescription,
  path: "/flower-guide/seasonal-flowers",
  absoluteTitle: true,
});

export default function SeasonalFlowersPage() {
  return (
    <FlowerGuideShell current="/flower-guide/seasonal-flowers">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Flower Guide", path: "/flower-guide" },
          { name: "Seasonal Flowers", path: "/flower-guide/seasonal-flowers" },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Flower Guide", href: "/flower-guide" },
            { label: "Seasonal Flowers" },
          ]}
        />
        <h1 className="font-display text-4xl text-primary">{seasonalHub.h1}</h1>
        <p className="mt-4 text-slate-700 leading-relaxed">{seasonalHub.intro}</p>
        <ul className="mt-8 grid sm:grid-cols-2 gap-3">
          {seasonPages.map((s) => (
            <li key={s.slug}>
              <Link href={`/flower-guide/${s.slug}`} className="block rounded-2xl border border-[#eadfd8] bg-white p-5 hover:border-nav">
                <p className="font-semibold text-primary">{s.name}</p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-3">{s.intro}</p>
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="font-display text-3xl text-primary mt-12">Monthly flower calendar</h2>
        <p className="mt-2 text-slate-600">
          Northern Hemisphere months are the default for the USA, Canada, the UK and most of Europe.
          Australia is listed separately because the seasons are reversed.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-[#eadfd8]">
                <th className="py-2 pr-3">Month</th>
                <th className="py-2 pr-3">USA / Canada / UK / Europe</th>
                <th className="py-2 pr-3">Australia</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {monthlyCalendar.map((row) => (
                <tr key={row.month} className="border-b border-[#eadfd8]/70 align-top">
                  <td className="py-3 pr-3 font-medium text-primary">{row.month}</td>
                  <td className="py-3 pr-3 text-slate-700">{row.north}</td>
                  <td className="py-3 pr-3 text-slate-700">{row.australia}</td>
                  <td className="py-3 text-slate-500">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FlowerGuideShell>
  );
}
