import { cache } from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

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
