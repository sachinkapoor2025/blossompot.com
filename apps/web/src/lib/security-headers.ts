/**
 * Storefront security headers. Applied from next.config.ts.
 * CSP is intentionally conservative — do not block Stripe, Razorpay, GTM, or Cognito.
 */
export const STOREFRONT_SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/**
 * CSP that matches current third parties. If a new script host is added,
 * update this list before deploy or the page will break.
 */
export const STOREFRONT_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://connect.facebook.net https://js.stripe.com https://checkout.razorpay.com https://www.clarity.ms",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.facebook.com",
  "form-action 'self' https:",
].join("; ");
