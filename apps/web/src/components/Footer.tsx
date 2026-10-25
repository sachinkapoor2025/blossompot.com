"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { site, navItems, whatsappChatUrl, whatsappLinkLabel } from "@/lib/site";
import { PaymentMethodIcons } from "@/components/PaymentMethodIcons";
import { ShopLocationLink } from "@/components/ShopLocationLink";
import { SiteLogoLink } from "@/components/SiteLogo";
import { useAuth } from "@/lib/auth-context";
import { trustFacts } from "@/lib/trust";
import { wishlistEntryHref } from "@/lib/wishlist-href";
import { FooterDeliverTo, FooterDeliverToFallback } from "@/components/FooterDeliverTo";
import { FooterCountryBlurb } from "@/components/FooterCountryBlurb";

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
    href: "https://www.instagram.com/blossompot_official/",
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
    href: "https://www.facebook.com/profile.php?id=61594220485535",
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
    href: "https://x.com/Blossompot10",
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
    href: "https://in.pinterest.com/blossompot10/_profile/",
    label: "BlossomPot on Pinterest",
    className: "rounded-full bg-[#E60023]",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.988c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@blossompot",
    label: "BlossomPot on YouTube",
    className: "rounded-[22%] bg-white",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#FF0000"
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        />
        <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

const footerShopLinks = [
  ...navItems.filter((item) => "category" in item && item.category),
  ...navItems.filter((item) => item.href === "/gift-catalog"),
];

const linkClass = "text-slate-700 hover:text-primary hover:underline";
const listClass = "space-y-2 text-sm leading-6 text-slate-700";
const columnRule = "xl:border-r xl:border-[#E8CCD7]";

const helpPrimary = [
  { href: "/remember", label: "Never Forget an Occasion" },
  { href: "/forgot-occasion", label: "Forgot a Special Occasion?" },
  { href: "/flower-guide", label: "Flower Guide" },
  { href: "/blog", label: "Blog & Guides" },
  { href: "/shipping", label: "Shipping & Delivery" },
  { href: "/faq", label: "FAQ" },
  { href: "/reviews", label: "Customer Reviews" },
] as const;

const helpMore = [
  { href: "/about", label: "About Us" },
  { href: "/vendor", label: "Vendor Account" },
  { href: "/become-a-vendor", label: "Become a Vendor" },
  { href: "/returns", label: "Returns & Guarantee" },
  { href: "/contact", label: "Contact Us" },
] as const;

function ColumnHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
      {icon}
      {children}
    </h2>
  );
}

function ShopLinks() {
  return (
    <ul className={listClass}>
      {footerShopLinks.map((item) => (
        <li key={item.href}>
          <ShopLocationLink
            href={item.href}
            category={"category" in item && typeof item.category === "string" ? item.category : undefined}
            className={linkClass}
          >
            {item.label}
          </ShopLocationLink>
        </li>
      ))}
      <li>
        <ShopLocationLink href="/products" catalog className="font-medium text-primary hover:underline">
          All Products →
        </ShopLocationLink>
      </li>
    </ul>
  );
}

function HelpLinks({ idPrefix }: { idPrefix: string }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = `${idPrefix}-more-help`;
  return (
    <div>
      <ul className={listClass}>
        {helpPrimary.slice(0, 2).map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={linkClass}>
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <ShopLocationLink href="/flowers" category="flowers" className={linkClass}>
            Send Flowers
          </ShopLocationLink>
        </li>
        {helpPrimary.slice(2).map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={linkClass}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <ul id={moreId} className={`${listClass} mt-2 ${moreOpen ? "" : "hidden"}`}>
        {helpMore.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={linkClass}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-0"
        aria-expanded={moreOpen}
        aria-controls={moreId}
        onClick={() => setMoreOpen((open) => !open)}
      >
        {moreOpen ? "Show less ↑" : "More Help →"}
      </button>
    </div>
  );
}

function AccountLinks({ signedIn }: { signedIn: boolean }) {
  return (
    <ul className={listClass}>
      <li><Link href="/account" className={linkClass}>Account</Link></li>
      <li><Link href={wishlistEntryHref(signedIn)} className={linkClass}>Wish Lists</Link></li>
      <li><Link href="/cart" className={linkClass}>Cart</Link></li>
      <li><Link href="/account?tab=orders" className={linkClass}>Track Order</Link></li>
    </ul>
  );
}

function PartnerLinks() {
  return (
    <ul className={listClass}>
      <li><Link href="/vendor" className={linkClass}>Vendor Account</Link></li>
      <li><Link href="/become-a-vendor" className={linkClass}>Become a Vendor</Link></li>
    </ul>
  );
}

function FooterAccordion({
  id,
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-[#E8CCD7]">
      <h2 className="text-sm font-semibold text-primary">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-3 py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
        >
          <span className="flex items-center gap-1.5">
            {icon}
            {title}
          </span>
          <ChevronIcon open={open} />
        </button>
      </h2>
      <div id={id} className={open ? "pb-4" : "hidden"}>
        {children}
      </div>
    </div>
  );
}

function BrandColumn() {
  return (
    <div className="min-w-0">
      <SiteLogoLink size="mobile" className="mb-3" />
      <FooterCountryBlurb />
      <div className="space-y-2 text-sm text-slate-700">
        <p>
          <a href={`mailto:${site.supportEmail}`} className="inline-flex items-center gap-2 hover:text-primary">
            <MailIcon />
            {site.supportEmail}
          </a>
        </p>
        <p>
          <a
            href={whatsappChatUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 break-all hover:text-primary"
          >
            <WhatsAppIcon />
            {whatsappLinkLabel()}
          </a>
        </p>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-sm text-slate-600">Follow Us</p>
        <ul className="flex flex-wrap items-center gap-1" aria-label="Social media">
          {SOCIAL_LINKS.map((social) => (
            <li key={social.name}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                title={social.label}
                style={social.style}
                className={`flex h-7 w-7 shrink-0 items-center justify-center transition-transform hover:scale-105 ${social.className}`}
              >
                {social.icon}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Footer() {
  const { user } = useAuth();
  const signedIn = Boolean(user);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggleSection = (id: string) => setOpenSection((current) => (current === id ? null : id));

  return (
    <footer className="mt-auto border-t border-[#E8CCD7] bg-[#f8eef2] text-slate-700">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-8 max-md:pr-[4.75rem]">
        <div className="md:hidden">
          <BrandColumn />
        </div>

        <div className="hidden md:grid md:grid-cols-2 md:items-start md:gap-x-8 md:gap-y-8 lg:grid-cols-3 xl:grid-cols-[19fr_13fr_17fr_25fr_13fr_13fr] xl:items-stretch xl:gap-x-0 xl:gap-y-0">
          <div className={`min-w-0 md:col-span-2 lg:col-span-1 xl:col-span-1 xl:pr-6 ${columnRule}`}>
            <BrandColumn />
          </div>
          <div className={`min-w-0 xl:px-6 ${columnRule}`}>
            <ColumnHeading icon={<GiftIcon />}>Shop Gifts</ColumnHeading>
            <ShopLinks />
          </div>
          <div className={`min-w-0 xl:px-6 ${columnRule}`}>
            <ColumnHeading icon={<InfoIcon />}>Help &amp; Info</ColumnHeading>
            <HelpLinks idPrefix="footer-help-wide" />
          </div>
          <div className={`min-w-0 md:col-span-2 lg:col-span-1 xl:col-span-1 xl:px-6 ${columnRule}`}>
            <Suspense fallback={<FooterDeliverToFallback />}>
              <FooterDeliverTo idPrefix="footer-cities-wide" />
            </Suspense>
          </div>
          <div className={`min-w-0 xl:px-6 ${columnRule}`}>
            <ColumnHeading icon={<AccountIcon />}>My Account</ColumnHeading>
            <AccountLinks signedIn={signedIn} />
          </div>
          <div className="min-w-0 xl:pl-6">
            <ColumnHeading icon={<PartnersIcon />}>For Partners</ColumnHeading>
            <PartnerLinks />
          </div>
        </div>

        <div className="md:hidden">
          <div className="mt-6 border-t border-[#E8CCD7]" />
          <FooterAccordion
            id="footer-shop"
            title="Shop Gifts"
            icon={<GiftIcon />}
            open={openSection === "shop"}
            onToggle={() => toggleSection("shop")}
          >
            <ShopLinks />
          </FooterAccordion>
          <FooterAccordion
            id="footer-help"
            title="Help & Info"
            icon={<InfoIcon />}
            open={openSection === "help"}
            onToggle={() => toggleSection("help")}
          >
            <HelpLinks idPrefix="footer-help-mobile" />
          </FooterAccordion>
          <FooterAccordion
            id="footer-deliver"
            title="Deliver to"
            icon={<PinIcon />}
            open={openSection === "deliver"}
            onToggle={() => toggleSection("deliver")}
          >
            <Suspense fallback={<FooterDeliverToFallback />}>
              <FooterDeliverTo idPrefix="footer-cities-mobile" showHeading={false} />
            </Suspense>
          </FooterAccordion>
          <FooterAccordion
            id="footer-account"
            title="My Account"
            icon={<AccountIcon />}
            open={openSection === "account"}
            onToggle={() => toggleSection("account")}
          >
            <AccountLinks signedIn={signedIn} />
          </FooterAccordion>
          <FooterAccordion
            id="footer-partners"
            title="For Partners"
            icon={<PartnersIcon />}
            open={openSection === "partners"}
            onToggle={() => toggleSection("partners")}
          >
            <PartnerLinks />
          </FooterAccordion>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-[#E8CCD7] pt-6 md:flex-row md:items-center">
          <div className="min-w-0 md:flex-1">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <CardIcon />
              Accepted payments
            </p>
            <PaymentMethodIcons />
          </div>
          <div className="hidden h-12 w-px shrink-0 bg-[#E8CCD7] md:block" aria-hidden />
          <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-slate-600 md:flex-1 md:justify-end">
            <ShieldIcon />
            <span className="max-w-md">
              Secure checkout with encrypted payment processing.
              <span className="md:block"> Prices shown in USD or INR at checkout.</span>
            </span>
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary/10 bg-[#f1dce4]">
        <div className="max-w-7xl mx-auto px-4 py-4 max-md:pr-[4.75rem] max-md:pb-24 flex flex-col gap-2 text-xs text-slate-500">
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
              © {new Date().getFullYear()} {site.name}.com. All rights reserved. Thoughtful gifts,
              beautifully delivered.
            </p>
            <p className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/privacy" className="hover:text-primary underline underline-offset-2">
                Privacy
              </Link>
              <Link href="/press" className="hover:text-primary underline underline-offset-2">
                Press
              </Link>
              <Link href="/llms" className="hidden">
                LLMs.txt
              </Link>
              <Link href="/humans" className="hidden">
                Humans.txt
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 7 9-7" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 2.1 16.8L1 23l6.4-1.1A11 11 0 0 0 20.5 3.5zM12 20.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.8.6.6-3.7-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.3a.5.5 0 0 0 0-.5c0-.1-.5-1.3-.7-1.7s-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3 2.5 2.5 0 0 0-.8 1.8 4.3 4.3 0 0 0 .9 2.3 9.8 9.8 0 0 0 3.8 3.3 4.3 4.3 0 0 0 2.5.7 2.1 2.1 0 0 0 1.4-.7 1.7 1.7 0 0 0 .4-1.2c0-.1 0-.3-.2-.4z" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="10" width="18" height="11" rx="1.5" />
      <path d="M12 10v11M3 14h18M12 10c-2-4-6-4-6-1s4 1 6 1zm0 0c2-4 6-4 6-1s-4 1-6 1z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm.2 5.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zM11 11h2v6h-2z" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2a7 7 0 0 1 14 0" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3l8 3v6c0 5-3.4 7.6-8 9-4.6-1.4-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function PartnersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
