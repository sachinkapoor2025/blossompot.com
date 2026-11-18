import { llmsPlainText } from "@/lib/llms-document";
import { htmlVisitorRedirect, plainTextResponse } from "@/lib/plain-text-route";
import { loadEnabledShoppingCountryCodes } from "@/lib/storefront-country";

/**
 * llms.txt — machine-readable site summary for AI assistants.
 * Browsers are redirected to the readable /llms page.
 * Spec: https://llmstxt.org/
 */
export async function GET(request: Request) {
  const redirect = htmlVisitorRedirect(request, "/llms");
  if (redirect) return redirect;
  const enabledCountries = await loadEnabledShoppingCountryCodes();
  return plainTextResponse(llmsPlainText(enabledCountries), "public, s-maxage=3600, stale-while-revalidate=86400");
}
