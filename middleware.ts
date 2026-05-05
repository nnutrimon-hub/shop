import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ADMIN_PATHS = ["/admin", "/api/admin"];
const AUTH_PATHS = ["/accounts", "/api/orders", "/api/cart", "/api/payment"];

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(
  req: NextRequest & { auth?: { user?: { role?: string } } | null }
) {
  const { pathname } = req.nextUrl;

  // ── CSRF: reject non-GET requests from unexpected origins ────────────────
  if (!SAFE_METHODS.has(req.method)) {
    const origin = req.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && origin && origin !== appUrl) {
      return NextResponse.json(
        { error: "CSRF шалгалт амжилтгүй" },
        { status: 403 }
      );
    }
  }

  const session = (
    req as unknown as { auth?: { user?: { role?: string } } | null }
  ).auth;

  // ── Protect /admin/* and /api/admin/* ────────────────────────────────────
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath) {
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    const role = session?.user?.role ?? "user";
    if (!["admin", "superadmin", "moderator"].includes(role)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // ── Protect /accounts/* and user-only API routes ─────────────────────────
  const isAuthRequired = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthRequired && !session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
    }
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/accounts/:path*",
    "/api/orders/:path*",
    "/api/cart/:path*",
    "/api/payment/:path*",
  ],
};
