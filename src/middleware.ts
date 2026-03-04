import { auth } from "@/auth"
import { NextResponse } from "next/server"

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

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
