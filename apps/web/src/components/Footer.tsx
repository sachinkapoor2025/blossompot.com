import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { site, navItems, giftSetsMenu, whatsappChatUrl } from "@/lib/site";
import { PaymentMethodIcons } from "@/components/PaymentMethodIcons";
import { SiteLogoLink } from "@/components/SiteLogo";
import { trustFacts } from "@/lib/trust";
import { footerGeoLinks } from "@/lib/content/geo/locations";

const INSTAGRAM_GRADIENT: CSSProperties = {
  background:
    "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
};

const SOCIAL_LINKS: {
  name: string;
  href: string;
  label: string;
  className: string;
  style?: CSSProperties;
  icon: ReactNode;
}[] = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/blos.sompot/",
    label: "BlossomPot on Instagram",
    className: "rounded-[22%]",
    style: INSTAGRAM_GRADIENT,
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="#fff" strokeWidth="2" />
        <circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="2" />
        <circle cx="17.4" cy="6.6" r="1.2" fill="#fff" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61593676012563",
    label: "BlossomPot on Facebook",
    className: "rounded-full bg-[#1877F2]",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0013.843 3c-2.386 0-4.027 1.455-4.027 4.061v2.431H7.574v3.209h2.242v8.196h3.581z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/blossom-chary-13038b42b/",
    label: "BlossomPot on LinkedIn",
    className: "rounded-full bg-[#0A66C2]",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://x.com/blossomchaon16",
    label: "BlossomPot on X (Twitter)",
    className: "rounded-full bg-black",
    icon: (
      <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.995-9.14L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    href: "https://in.pinterest.com/blossomdgv/_profile/",
    label: "BlossomPot on Pinterest",
    className: "rounded-full bg-[#E60023]",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.988c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="border-t border-primary/15 bg-[#f8eef2] text-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 text-sm">
          {/* Brand + contact — full width on mobile, one column on desktop */}
          <div className="col-span-2 lg:col-span-3">
            <SiteLogoLink size="desktop" className="mb-5" />
            <p className="text-slate-600 leading-relaxed mb-4 max-w-xs">
              Flowers, cakes, and thoughtful gifts delivered across the USA. Premium online gifting for every celebration.
            </p>
            <div className="space-y-2 text-slate-700">
              <p>
                <span className="text-slate-500 text-xs uppercase tracking-wide block mb-0.5">Email</span>
                <a href={`mailto:${site.supportEmail}`} className="font-medium text-primary hover:underline">
                  {site.supportEmail}
                </a>
              </p>
              <p>
                <span className="text-slate-500 text-xs uppercase tracking-wide block mb-0.5">WhatsApp</span>
                <a
                  href={whatsappChatUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {site.whatsappDisplay}
                </a>
              </p>
            </div>
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Follow us</p>
              <ul className="flex flex-wrap items-center gap-2.5 sm:gap-3" aria-label="Social media">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.name}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      title={social.label}
                      style={social.style}
                      className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center hover:scale-105 transition-transform ${social.className}`}
                    >
                      {social.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Shop */}
          <div className="min-w-0 lg:col-span-2">
            <p className="font-semibold text-primary mb-3 sm:mb-4">Shop Gifts</p>
            <ul className="space-y-2 text-slate-600">
              {giftSetsMenu.items.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="hover:text-primary hover:underline">
                    {n.label}
                  </Link>
                </li>
              ))}
              {navItems
                .filter((n) => "category" in n)
                .map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="hover:text-primary hover:underline">
                      {n.label}
                    </Link>
                  </li>
                ))}
              <li>
                <Link href="/products" className="hover:text-primary hover:underline">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div className="min-w-0 lg:col-span-2">
            <p className="font-semibold text-primary mb-3 sm:mb-4">Help &amp; Info</p>
            <ul className="space-y-2 text-slate-600">
              <li><Link href="/same-day-delivery" className="hover:text-primary hover:underline">Same-Day Delivery</Link></li>
              <li><Link href="/flowers" className="hover:text-primary hover:underline">Send Flowers</Link></li>
              <li><Link href="/flower-guide" className="hover:text-primary hover:underline">Flower Guide</Link></li>
              <li><Link href="/blog" className="hover:text-primary hover:underline">Blog &amp; Guides</Link></li>
              <li><Link href="/shipping" className="hover:text-primary hover:underline">Shipping &amp; Delivery</Link></li>
              <li><Link href="/faq" className="hover:text-primary hover:underline">FAQ</Link></li>
              <li><Link href="/reviews" className="hover:text-primary hover:underline">Customer Reviews</Link></li>
              <li><Link href="/about" className="hover:text-primary hover:underline">About Us</Link></li>
              <li><Link href="/vendor" className="hover:text-primary hover:underline">Vendor Account</Link></li>
              <li><Link href="/become-a-vendor" className="hover:text-primary hover:underline">Become a Vendor</Link></li>
              <li><Link href="/returns" className="hover:text-primary hover:underline">Returns &amp; Guarantee</Link></li>
              <li><Link href="/contact" className="hover:text-primary hover:underline">Contact Us</Link></li>
            </ul>
          </div>

          {/* Geo hubs — top states + index */}
          <div className="col-span-2 lg:col-span-5 min-w-0">
            <p className="font-semibold text-primary mb-3 sm:mb-4">Deliver to</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-slate-600">
              {footerGeoLinks(12).map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="hover:text-primary hover:underline">
                    {c.label}
                  </Link>
                </li>
              ))}
              <li className="col-span-2 sm:col-span-3">
                <Link href="/locations" className="hover:text-primary hover:underline font-medium">
                  International locations →
                </Link>
              </li>
              <li className="col-span-2 sm:col-span-3">
                <Link href="/delivery-locations" className="hover:text-primary hover:underline font-medium">
                  All USA delivery locations →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Payments row */}
        <div className="mt-10 pt-8 border-t border-primary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Accepted payments</p>
            <PaymentMethodIcons />
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Secure checkout with encrypted payment processing. Prices shown in USD or INR at checkout.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary/10 bg-[#f1dce4]">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-3 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            Operated by {trustFacts.operator}.{" "}
            <Link href="/about" className="text-primary hover:underline underline-offset-2">
              About our team
            </Link>
            {" · "}
            <Link href="/reviews" className="text-primary hover:underline underline-offset-2">
              Share your review
            </Link>
            {" · "}
            <Link href="/returns" className="text-primary hover:underline underline-offset-2">
              Satisfaction guarantee
            </Link>
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>
              © {new Date().getFullYear()} {site.name}.com. All rights reserved. Premium gifting across
              every mile.
            </p>
            <p className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/terms" className="hover:text-primary underline underline-offset-2">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-primary underline underline-offset-2">
                Privacy
              </Link>
              <Link href="/press" className="hover:text-primary underline underline-offset-2">
                Press
              </Link>
              <Link href="/llms.txt" className="hover:text-primary underline underline-offset-2">
                LLMs.txt
              </Link>
              <Link href="/humans.txt" className="hover:text-primary underline underline-offset-2">
                Humans.txt
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
