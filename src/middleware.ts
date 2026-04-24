import { NextResponse, type NextRequest } from "next/server"

const protectedRoutes = ["/submit", "/dashboard", "/estate", "/messages"]

// Decodes session from Better Auth cookies without any network call.
// Avoids the loopback-fetch deadlock in CF Workers (workerd/miniflare rejects
// fetch() back to the same isolate before a response is returned).
//
// Cookie formats (BETTER_AUTH_URL https → "__Secure-" prefix):
//   session_token  → "<token>.<base64(HMAC-SHA256(token, secret))>"
//   session_data   → base64url(JSON{ session:{user:{role,...},...}, expiresAt, signature })
//                    where signature = base64urlnopad(HMAC-SHA256(JSON.stringify({...session,expiresAt}), secret))
async function getSession(req: NextRequest): Promise<{ user: { role: string } } | null> {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) return null

  const isSecure = process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false
  const pfx = isSecure ? "__Secure-" : ""

  const sessionTokenRaw = req.cookies.get(`${pfx}better-auth.session_token`)?.value
  if (!sessionTokenRaw) return null

  // Verify session_token: "<token>.<base64sig>"
  const dot = sessionTokenRaw.lastIndexOf(".")
  if (dot === -1) return null
  const token = sessionTokenRaw.slice(0, dot)
  const tokenSig = sessionTokenRaw.slice(dot + 1)

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  )

  try {
    const tokenSigBytes = Uint8Array.from(atob(tokenSig), (c) => c.charCodeAt(0))
    const validToken = await crypto.subtle.verify("HMAC", key, tokenSigBytes, new TextEncoder().encode(token))
    if (!validToken) return null
  } catch {
    return null
  }

  // Read role from session_data cookie cache (5-min cache; may be absent after inactivity)
  const sessionDataRaw = req.cookies.get(`${pfx}better-auth.session_data`)?.value
  if (!sessionDataRaw) {
    // cookieCache disabled (BA issue #4203) — session_data never written.
    // Role is unknown; pass authenticated requests through so server-side checks
    // (admin layout, API route handlers) enforce role-based access.
    return { user: { role: "UNKNOWN" } }
  }

  try {
    const b64 = sessionDataRaw.replace(/-/g, "+").replace(/_/g, "/")
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
    const decoded = JSON.parse(atob(padded)) as {
      session: {
        session: unknown
        user: { role: string; [k: string]: unknown }
        updatedAt: number
        version: string
      }
      expiresAt: number
      signature: string
    }

    if (!decoded?.session?.user || decoded.expiresAt < Date.now()) {
      return { user: { role: "USER" } }
    }

    // Verify session_data HMAC over JSON.stringify({ ...session, expiresAt })
    const dataToVerify = JSON.stringify({ ...decoded.session, expiresAt: decoded.expiresAt })
    const sig64 = decoded.signature.replace(/-/g, "+").replace(/_/g, "/")
    const sigPadded = sig64 + "=".repeat((4 - (sig64.length % 4)) % 4)
    const sigBytes = Uint8Array.from(atob(sigPadded), (c) => c.charCodeAt(0))

    const validData = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(dataToVerify))
    if (!validData) return { user: { role: "USER" } }

    return { user: { role: decoded.session.user.role } }
  } catch {
    return { user: { role: "USER" } }
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
    // UNKNOWN = authenticated but session_data cache absent (cookieCache disabled).
    // Pass through — admin layout and API routes enforce role via DB lookup.
    if (role !== "UNKNOWN") {
      const isModerationPage = pathname.startsWith("/admin/moderation")
      if (role !== "ADMIN" && !(isModerationPage && role === "MODERATOR")) {
        return NextResponse.redirect(new URL("/", req.nextUrl.origin))
      }
    }
  }

  return next()
}

export const config = {
  matcher: ["/((?!api|monitoring|_next/static|_next/image|images|favicon.ico).*)"],
}
