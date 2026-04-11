/**
 * Better Auth instance.
 *
 * This file replaces NextAuth (src/auth.ts + src/auth.config.ts) once the
 * Phase 4 cutover is complete.  During the dual-run period (Phase 3) it
 * coexists alongside NextAuth — the [...all] route handler is live but all
 * existing call sites still use NextAuth via @/auth.
 *
 * Prerequisites:
 *   Phase 1 (schema migration) and Phase 2 (credential migration script)
 *   must be deployed before this instance handles real sign-ins.
 */

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import prisma from "@/lib/prisma"
import type { UserRole } from "@/types/roles"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Database sessions (not JWT) — all active NextAuth JWT sessions are
  // invalidated when this becomes the sole auth system in Phase 4.
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

  // email+password is built into Better Auth — enabled via top-level option
  emailAndPassword: {
    enabled: true,
    // Email must be verified before credentials sign-in is allowed.
    requireEmailVerification: true,
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

  // databaseHooks replace the NextAuth signIn + jwt callbacks.
  // account.create.after fires when an OAuth account is first linked —
  // used to set emailVerified and sync the initial Discord avatar.
  // NOTE: The exact context shape for OAuth profile data must be verified
  // against BA docs on staging before the Phase 4 cutover ships.
  databaseHooks: {
    account: {
      create: {
        after: async (account) => {
          const userId = account.userId
          if (!userId) return

          // Mark emailVerified=true on first OAuth sign-in (mirrors the
          // NextAuth signIn callback that set emailVerified: new Date())
          if (account.providerId === "discord" || account.providerId === "google") {
            await prisma.$executeRaw`
              UPDATE "User"
              SET "emailVerified" = true
              WHERE id = ${userId}
                AND ("emailVerified" = false OR "emailVerified" IS NULL)
            `
          }

          // Sync Discord avatar on first account link unless the user has a
          // verified Lodestone character (that image takes priority).
          // TODO (Phase 4): Verify the BA account object exposes the raw OAuth
          // profile so we can get the CDN avatar URL. If not, use a separate
          // sign-in hook or pull the profile from the access_token.
          if (account.providerId === "discord" && account.accountId) {
            const hasLodestone = await prisma.ffxivCharacter.findFirst({
              where: { userId, verified: true },
              select: { id: true },
            })
            if (!hasLodestone && account.accessToken) {
              // Fetch fresh Discord profile to get the avatar hash
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
