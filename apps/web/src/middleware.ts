// Article 21 [NN]: en is the default locale. Without this, "/" 404s — there is no page at the
// app root, only under "/[locale]" — which would make "en is the default" false in practice.
// This is deliberately minimal (no next-intl yet, no locale negotiation): a fixed redirect to
// /en. The first i18n feature replaces this with real locale detection.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL("/en", request.url));
}

export const config = {
  matcher: "/",
};
