import { humansPlainText } from "@/lib/llms-document";
import { htmlVisitorRedirect, plainTextResponse } from "@/lib/plain-text-route";

/** humans.txt — credits file. Browsers are redirected to the readable /humans page. */
export async function GET(request: Request) {
  const redirect = htmlVisitorRedirect(request, "/humans");
  if (redirect) return redirect;
  return plainTextResponse(humansPlainText(), "public, max-age=86400");
}
