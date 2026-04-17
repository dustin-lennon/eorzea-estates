import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const protectedRoutes = ["/submit", "/dashboard", "/estate", "/messages"]

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Pass pathname to server components via request header (used for maintenance check in root layout)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", pathname)
  const next = () => NextResponse.next({ request: { headers: requestHeaders } })

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdmin = pathname.startsWith("/admin")
  const isMaintenanceActive =
    process.env.MAINTENANCE_MODE === "true" ||
    req.cookies.get("x-maintenance-mode")?.value === "1"

  // Skip DB session lookup entirely for requests that don't need auth
  if (!isProtected && !isAdmin && !isMaintenanceActive) {
    // Allow GET to /estate/[id] (public detail page) without auth
    return next()
  }

  const session = await auth.api.getSession({ headers: req.headers })

  // Maintenance mode: env var hard override OR DB toggle (signalled via cookie)
  if (isMaintenanceActive) {
    const allowedPaths = ["/maintenance", "/login", "/api/auth", "/api/maintenance-signout"]
    const isAllowed = allowedPaths.some((p) => pathname.startsWith(p))
    if (!isAllowed && session?.user?.role !== "ADMIN") {
      if (session?.user) {
        return NextResponse.redirect(new URL("/api/maintenance-signout", req.nextUrl.origin))
      }
      return NextResponse.redirect(new URL("/maintenance", req.nextUrl.origin))
    }
  }

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
  if (isAdmin) {
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
