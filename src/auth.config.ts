import type { NextAuthConfig } from "next-auth"
import Discord from "next-auth/providers/discord"
import type { UserRole } from "@/types/roles"

export const authConfig: NextAuthConfig = {
  providers: [Discord],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (token.role) session.user.role = token.role as UserRole
      return session
    },
  },
}
