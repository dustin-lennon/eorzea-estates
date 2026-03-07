import type { NextAuthConfig } from "next-auth"
import Discord from "next-auth/providers/discord"

export const authConfig: NextAuthConfig = {
  providers: [Discord],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
}
