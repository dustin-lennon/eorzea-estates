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
