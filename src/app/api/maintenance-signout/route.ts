import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  await auth.api.signOut({ headers: req.headers })
  return NextResponse.redirect(new URL("/maintenance", req.url))
}
