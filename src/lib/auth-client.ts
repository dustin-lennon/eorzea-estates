/**
 * Better Auth client-side helpers.
 *
 * Usage in client components:
 *   import { authClient } from "@/lib/auth-client"
 *
 *   const { data: session } = authClient.useSession()
 *   authClient.signIn.social({ provider: "discord", callbackURL: "/" })
 *   authClient.signIn.email({ email, password, callbackURL: "/" })
 *   authClient.signOut()
 *   const { refetch } = authClient.useSession() // replaces NextAuth update()
 */

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
})
