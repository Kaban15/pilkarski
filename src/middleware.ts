import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/", "/login", "/register"];
const publicPrefixes = ["/clubs/", "/players/", "/coaches/", "/leagues/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and API/static
  if (
    publicRoutes.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/")
  ) {
    return NextResponse.next();
  }

  // Check JWT token directly (no Prisma dependency).
  // Cookie name prefix differs by protocol: HTTPS uses __Secure- prefix, HTTP does not.
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const token = await getToken({
    req,
    secret,
    salt: cookieName,
    cookieName,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    if (!token.isAdmin) {
      return NextResponse.redirect(new URL("/feed", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Public static assets and Next metadata routes bypass middleware —
  // forcing JWT verify on every asset adds ~140ms on Vercel Edge.
  // Folder excludes use trailing slash to avoid matching prefixes like
  // `/regions-anything` (auth bypass).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|regions/|images/).*)",
  ],
};
