import Link from "next/link";
import { flowerGuideNav } from "@/lib/content/flower-guide";

export function FlowerGuideNav({ current }: { current?: string }) {
  return (
    <nav aria-label="Flower Guide" className="border-b border-primary/10 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex gap-1 overflow-x-auto py-3 text-sm">
          <li>
            <Link
              href="/flower-guide"
              className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium ${
                current === "/flower-guide" ? "bg-primary text-white" : "text-slate-600 hover:bg-petal hover:text-primary"
              }`}
            >
              Overview
            </Link>
          </li>
          {flowerGuideNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium ${
                  current === item.href || (current && current.startsWith(`${item.href}/`))
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-petal hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
