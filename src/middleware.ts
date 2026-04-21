import { NextResponse, type NextRequest } from "next/server"

const protectedRoutes = ["/submit", "/dashboard", "/estate", "/messages"]

async function getSession(req: NextRequest) {
  try {
    const res = await fetch(new URL("/api/auth/get-session", req.nextUrl.origin), {
      headers: { cookie: req.headers.get("cookie") ?? "" },
    })
    if (!res.ok) return null
    return res.json() as Promise<{ user: { role: string } } | null>
  } catch {
    return null
  }
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", pathname)
  const next = () => NextResponse.next({ request: { headers: requestHeaders } })

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdmin = pathname.startsWith("/admin")
  const isMaintenanceActive =
    process.env.MAINTENANCE_MODE === "true" ||
    req.cookies.get("x-maintenance-mode")?.value === "1"

  if (!isProtected && !isAdmin && !isMaintenanceActive) {
    return next()
  }

  const session = await getSession(req)

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

  if (pathname.match(/^\/estate\/[^/]+$/) && req.method === "GET") {
    return next()
  }

  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

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
