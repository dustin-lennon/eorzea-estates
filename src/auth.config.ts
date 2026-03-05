import type { NextAuthConfig } from "next-auth"
import Discord from "next-auth/providers/discord"

export const authConfig: NextAuthConfig = {
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
}
