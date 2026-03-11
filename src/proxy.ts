import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const protectedRoutes = ["/submit", "/dashboard", "/estate"]

export default auth((req) => {
  const pathname = req.nextUrl.pathname

  // Maintenance mode: env var hard override OR DB toggle (signalled via cookie)
  const dbMaintenanceCookie = req.cookies.get("x-maintenance-mode")?.value
  if (process.env.MAINTENANCE_MODE === "true" || dbMaintenanceCookie === "1") {
    const allowedPaths = ["/maintenance", "/login", "/api/auth", "/api/maintenance-signout"]
    const isAllowed = allowedPaths.some((p) => pathname.startsWith(p))
    if (!isAllowed && req.auth?.user?.role !== "ADMIN") {
      if (req.auth?.user) {
        return NextResponse.redirect(new URL("/api/maintenance-signout", req.nextUrl.origin))
      }
      return NextResponse.redirect(new URL("/maintenance", req.nextUrl.origin))
    }
  }

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Pass pathname to server components via request header (used for maintenance check in root layout)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", pathname)
  const next = () => NextResponse.next({ request: { headers: requestHeaders } })

  // Allow GET to /estate/[id] (public detail page); only protect /estate/[id]/edit
  if (pathname.match(/^\/estate\/[^/]+$/) && req.method === "GET") {
    return next()
  }

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes require ADMIN role (moderation page also accessible to MODERATOR)
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.nextUrl.origin)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    const role = req.auth.user?.role
    const isModerationPage = pathname.startsWith("/admin/moderation")
    if (role !== "ADMIN" && !(isModerationPage && role === "MODERATOR")) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin))
    }
  }

  return next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico).*)"],
}
