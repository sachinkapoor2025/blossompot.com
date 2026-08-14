import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge 301: apex → www.
 * Build an absolute URL explicitly — cloning nextUrl on Amplify SSR can keep
 * internal port :3000 and break production (Location: https://www.blossompot.com:3000/).
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (host === "blossompot.com") {
    const dest = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      "https://www.blossompot.com"
    );
    return NextResponse.redirect(dest, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
