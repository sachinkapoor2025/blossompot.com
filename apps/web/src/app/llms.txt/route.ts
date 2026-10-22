import { llmsPlainText } from "@/lib/llms-document";
import { htmlVisitorRedirect, plainTextResponse } from "@/lib/plain-text-route";

/**
 * llms.txt — machine-readable site summary for AI assistants.
 * Browsers are redirected to the readable /llms page.
 * Spec: https://llmstxt.org/
 */
export async function GET(request: Request) {
  const redirect = htmlVisitorRedirect(request, "/llms");
  if (redirect) return redirect;
  return plainTextResponse(llmsPlainText(), "public, s-maxage=3600, stale-while-revalidate=86400");
}
