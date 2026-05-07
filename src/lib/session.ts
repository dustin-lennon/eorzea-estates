import { cache } from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// React cache() deduplicates this call within a single RSC render tree.
// Both layout.tsx and navbar.tsx call getServerSession() — only one DB
// query fires per request regardless of how many components use it.
export const getServerSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() })
  } catch {
    return null
  }
})

// Direct Prisma session lookup that bypasses Better Auth's AsyncLocalStorage
// context requirement. Use in API routes where BA's runWithRequestState fails
// in CF Workers (e.g. polled endpoints wrapped by Sentry instrumentation).
//
// Cookie format: better-auth.session_token = "<token>.<hmac-sha256-base64>"
export async function getSessionFromRequest(req: Request): Promise<{ userId: string } | null> {
  const cookieHeader = req.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/(?:^|;\s*)better-auth\.session_token=([^;]+)/)
  if (!match) return null

  const signed = decodeURIComponent(match[1])
  const lastDot = signed.lastIndexOf(".")
  if (lastDot === -1) return null

  const token = signed.slice(0, lastDot)
  const signature = signed.slice(lastDot + 1)

  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) return null

  // Verify HMAC-SHA256 signature (same algorithm as BA's makeSignature)
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
  if (expected !== signature) return null

  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  })
  if (!session || !session.expiresAt || session.expiresAt < new Date()) return null

  return { userId: session.userId }
}
