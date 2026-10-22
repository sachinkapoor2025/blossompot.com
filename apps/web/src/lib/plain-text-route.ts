/** Send browsers to the readable page. AI clients and ?format=plain keep text/plain. */
export function htmlVisitorRedirect(request: Request, pagePath: string): Response | null {
  const url = new URL(request.url);
  if (url.searchParams.get("format") === "plain") return null;
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) return null;
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(pagePath, url).toString(),
      Vary: "Accept",
      "Cache-Control": "private, no-store",
    },
  });
}

export function plainTextResponse(body: string, cacheControl: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Vary: "Accept",
      "Cache-Control": cacheControl,
    },
  });
}
