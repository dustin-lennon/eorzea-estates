import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const protectedRoutes = ["/submit", "/dashboard", "/estate", "/messages"]

export default async function middleware(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })

  const pathname = req.nextUrl.pathname

  // Pass pathname to server components via request header (used for maintenance check in root layout)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", pathname)
  const next = () => NextResponse.next({ request: { headers: requestHeaders } })

  // Maintenance mode: env var hard override OR DB toggle (signalled via cookie)
  const dbMaintenanceCookie = req.cookies.get("x-maintenance-mode")?.value
  if (process.env.MAINTENANCE_MODE === "true" || dbMaintenanceCookie === "1") {
    const allowedPaths = ["/maintenance", "/login", "/api/auth", "/api/maintenance-signout"]
    const isAllowed = allowedPaths.some((p) => pathname.startsWith(p))
    if (!isAllowed && session?.user?.role !== "ADMIN") {
      if (session?.user) {
        return NextResponse.redirect(new URL("/api/maintenance-signout", req.nextUrl.origin))
      }
      return NextResponse.redirect(new URL("/maintenance", req.nextUrl.origin))
    }
  }

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Allow GET to /estate/[id] (public detail page); only protect /estate/[id]/edit
  if (pathname.match(/^\/estate\/[^/]+$/) && req.method === "GET") {
    return next()
  }

  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes require ADMIN role (moderation page also accessible to MODERATOR)
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", req.nextUrl.origin)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
    const role = session.user?.role
    const isModerationPage = pathname.startsWith("/admin/moderation")
    if (role !== "ADMIN" && !(isModerationPage && role === "MODERATOR")) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin))
    }
  }

  return next()
}

export const config = {
  matcher: ["/((?!api|monitoring|_next/static|_next/image|images|favicon.ico).*)"],
}
