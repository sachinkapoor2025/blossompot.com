import { indexNowKey } from "@/lib/indexnow";

/** Serves the IndexNow key when INDEXNOW_KEY is configured. */
export async function GET() {
  const key = indexNowKey();
  if (!key) {
    return new Response("IndexNow is not configured", { status: 404 });
  }
  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
