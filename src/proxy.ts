import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const studentPaths = ["/qr", "/history", "/vote"];
const staffPaths = ["/scan"];
const adminPaths = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    studentPaths.some((p) => pathname.startsWith(p)) ||
    staffPaths.some((p) => pathname.startsWith(p)) ||
    adminPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;

  if (adminPaths.some((p) => pathname.startsWith(p)) && role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  if (staffPaths.some((p) => pathname.startsWith(p)) && role !== "CLUB_STAFF") {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  if (
    studentPaths.some((p) => pathname.startsWith(p)) &&
    role !== "STUDENT"
  ) {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  return NextResponse.next();
}

function homeForRole(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "CLUB_STAFF") return "/scan";
  return "/qr";
}

export const config = {
  matcher: ["/qr/:path*", "/history/:path*", "/vote/:path*", "/scan/:path*", "/admin/:path*"],
};
