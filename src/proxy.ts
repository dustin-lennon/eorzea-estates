import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const protectedRoutes = ["/submit", "/dashboard", "/estate"]

export default auth((req) => {
  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  )

  // Allow GET to /estate/[id] (public detail page); only protect /estate/[id]/edit
  if (
    req.nextUrl.pathname.match(/^\/estate\/[^/]+$/) &&
    req.method === "GET"
  ) {
    return NextResponse.next()
  }

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes require ADMIN role (moderation page also accessible to MODERATOR)
  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.nextUrl.origin)
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    const role = req.auth.user?.role
    const isModerationPage = req.nextUrl.pathname.startsWith("/admin/moderation")
    if (role !== "ADMIN" && !(isModerationPage && role === "MODERATOR")) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
