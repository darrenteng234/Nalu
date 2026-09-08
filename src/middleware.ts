import { NextRequest, NextResponse } from "next/server";
import { LOCALE_CODES, DEFAULT_LOCALE } from "@/lib/i18n/locales";

/**
 * Root "/" → a locale (Accept-Language aware, default English).
 * Content slug-history 301s are handled in the page (needs DB), not here.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/") {
    const header = req.headers.get("accept-language") ?? "";
    const preferred = header.split(",").map((p) => p.split(";")[0].trim().slice(0, 2).toLowerCase());
    const match = preferred.find((p) => LOCALE_CODES.includes(p)) ?? DEFAULT_LOCALE;
    const url = req.nextUrl.clone();
    url.pathname = `/${match}`;
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
