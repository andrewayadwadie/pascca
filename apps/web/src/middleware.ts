// Article 21 [NN]: en is the default locale. Without this, "/" 404s — there is no page at the
// app root, only under "/[locale]" — which would make "en is the default" false in practice.
// This is deliberately minimal (no next-intl locale-negotiation middleware): a fixed redirect to
// /en, plus the legacy /pasca-menu/ → /en/menu 301 this feature adds (FR-017, research R11) —
// centralising the one other redirect this repo has, rather than splitting redirect logic
// between here and next.config.ts's redirects() (research R11's rationale).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/pasca-menu" || pathname === "/pasca-menu/") {
    return NextResponse.redirect(new URL("/en/menu", request.url), 301);
  }

  return NextResponse.redirect(new URL("/en", request.url));
}

export const config = {
  // "{/}?" is next/path-to-regexp's optional-trailing-slash syntax — matches "/pasca-menu" and
  // "/pasca-menu/" as the SAME entry, so this middleware sees the request directly instead of
  // Next's own internal handling adding an extra redirect hop first.
  matcher: ["/", "/pasca-menu{/}?"],
};
