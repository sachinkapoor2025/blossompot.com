/**
 * Production analytics & site-verification IDs.
 * Hardcoded so Amplify/build env injection is not required for verification or tracking.
 * Env vars still override these when set (useful for local testing).
 */
export const analyticsConfig = {
  gtmId: "GTM-KQLBTVVK",
  ga4Id: "G-8YRF0X8YV9",
  /** Google Ads conversion tag (gtag.js) — hardcoded, not Amplify env. */
  googleAdsId: "AW-18198485613",
  metaPixelId: "1459099935879507",
  clarityId: "xdpv6v2lq9",
  /** Meta tag content for Google Search Console (also backed by /public/google882629f2a0f6ec6d.html). */
  googleSiteVerification: "google882629f2a0f6ec6d",
  /** Bing Webmaster Tools meta tag — set when you have the code from Bing. */
  bingSiteVerification: "",
  bingUetId: "",
} as const;

function envOrDefault(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value || fallback;
}

export function getAnalyticsIds() {
  return {
    gtmId: envOrDefault("NEXT_PUBLIC_GTM_ID", analyticsConfig.gtmId),
    ga4Id: envOrDefault("NEXT_PUBLIC_GA4_ID", analyticsConfig.ga4Id),
    googleAdsId: envOrDefault("NEXT_PUBLIC_GOOGLE_ADS_ID", analyticsConfig.googleAdsId),
    metaPixelId: envOrDefault("NEXT_PUBLIC_META_PIXEL_ID", analyticsConfig.metaPixelId),
    clarityId: envOrDefault("NEXT_PUBLIC_CLARITY_ID", analyticsConfig.clarityId),
    bingUetId: envOrDefault("NEXT_PUBLIC_BING_UET_ID", analyticsConfig.bingUetId),
  };
}

export function getSiteVerification() {
  return {
    google: envOrDefault(
      "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
      analyticsConfig.googleSiteVerification
    ),
    bing: envOrDefault("NEXT_PUBLIC_BING_SITE_VERIFICATION", analyticsConfig.bingSiteVerification),
  };
}
