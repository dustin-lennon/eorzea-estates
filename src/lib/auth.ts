/**
 * Better Auth instance — replaces NextAuth (src/auth.ts + src/auth.config.ts).
 *
 * Server session access:
 *   import { auth } from "@/lib/auth"
 *   import { headers } from "next/headers"
 *   const session = await auth.api.getSession({ headers: await headers() })
 *
 * Client session (see @/lib/auth-client):
 *   const { data: session } = authClient.useSession()
 */

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import prisma from "@/lib/prisma"
import type { UserRole } from "@/types/roles"
import { sendPasswordResetEmail } from "@/lib/email"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Database sessions — all active NextAuth JWT sessions were invalidated
  // when this became the sole auth system in Phase 4.
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5-min client-side cache reduces DB reads in middleware
    },
  },

  socialProviders: {
    discord: {
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    },
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
  },

  // email+password is built into Better Auth (no plugin needed)
  emailAndPassword: {
    enabled: true,
    // Email must be verified before credentials sign-in is allowed.
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ to: user.email, url })
    },
  },

  // Replaces allowDangerousEmailAccountLinking on both Discord and Google
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["discord", "google"],
    },
  },

  // role and customAvatarUrl are stored on the User table.
  // Exposing them here makes them available on session.user automatically.
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER" as UserRole,
        input: false, // not settable by the user via BA's own endpoints
      },
      customAvatarUrl: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  // databaseHooks replace the NextAuth signIn callback.
  // account.create.after fires when an OAuth account is first linked.
  databaseHooks: {
    account: {
      create: {
        after: async (account) => {
          const userId = account.userId
          if (!userId) return

          // Mark emailVerified=true on first OAuth sign-in
          if (account.providerId === "discord" || account.providerId === "google") {
            await prisma.user.updateMany({
              where: { id: userId, emailVerified: false },
              data: { emailVerified: true },
            })
          }

          // Sync Discord avatar on first account link unless the user has a
          // verified Lodestone character (that image takes priority).
          if (account.providerId === "discord" && account.accountId && account.accessToken) {
            const hasLodestone = await prisma.ffxivCharacter.findFirst({
              where: { userId, verified: true },
              select: { id: true },
            })
            if (!hasLodestone) {
              try {
                const res = await fetch("https://discord.com/api/users/@me", {
                  headers: { Authorization: `Bearer ${account.accessToken}` },
                })
                if (res.ok) {
                  const profile = await res.json() as { id?: string; avatar?: string | null }
                  if (profile.id && profile.avatar) {
                    const freshImage = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                    await prisma.user.update({
                      where: { id: userId },
                      data: { image: freshImage },
                    })
                  }
                }
              } catch {
                // Non-fatal: avatar sync failure should not block sign-in
              }
            }
          }
        },
      },
    },
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
})

export type Session = typeof auth.$Infer.Session
