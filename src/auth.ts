import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { authConfig } from "@/auth.config"
import type { UserRole } from "@/types/roles"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
        const password = String(credentials?.password ?? "")
        if (!email || !password) return null
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.password || !user.emailVerified) return null
        const valid = await bcrypt.compare(password, user.password)
        return valid ? user : null
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google and Discord both guarantee the email is verified.
      // Ensure emailVerified is set in the DB so password linking works correctly.
      if (account?.type === "oauth" && user.id) {
        await prisma.user.updateMany({
          where: { id: user.id, emailVerified: null },
          data: { emailVerified: new Date() },
        })

        // Sync Discord avatar on every sign-in so stale CDN URLs don't break.
        // Skip if the user has a verified Lodestone character (that image takes priority).
        if (account.provider === "discord" && profile) {
          const p = profile as { id?: string; avatar?: string | null }
          const freshImage = p.id && p.avatar
            ? `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.png`
            : null
          if (freshImage) {
            const hasLodestone = await prisma.ffxivCharacter.findFirst({
              where: { userId: user.id, verified: true },
              select: { id: true },
            })
            if (!hasLodestone) {
              await prisma.user.update({
                where: { id: user.id },
                data: { image: freshImage },
              })
            }
          }
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id
        token.role = (user.role ?? "USER") as UserRole
      }
      // Hydrate from DB on first load (role missing) or when client calls update()
      if (token.sub && (!token.role || trigger === "update")) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, name: true, image: true },
        })
        token.role = (dbUser?.role ?? "USER") as UserRole
        if (dbUser?.name) token.name = dbUser.name
        if (dbUser?.image) token.picture = dbUser.image
      }
      return token
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (token.role) session.user.role = token.role as UserRole
      if (token.name) session.user.name = token.name
      if (token.picture) session.user.image = token.picture as string
      return session
    },
  },
})
