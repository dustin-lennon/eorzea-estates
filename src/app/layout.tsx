import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth, signOut } from "@/auth"
import prisma from "@/lib/prisma"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Eorzea Estates — FFXIV Housing Directory",
    template: "%s | Eorzea Estates",
  },
  description:
    "A community-curated directory of Final Fantasy XIV player estates, venues, apartments, and free company houses.",
  openGraph: {
    type: "website",
    siteName: "Eorzea Estates",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // DB-based maintenance mode (runtime toggle via admin settings)
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""
  const bypassPaths = ["/login", "/api/auth", "/maintenance"]
  if (!bypassPaths.some((p) => pathname.startsWith(p))) {
    try {
      const [settings, session] = await Promise.all([
        prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
        auth(),
      ])
      if (settings?.maintenanceMode && session?.user?.role !== "ADMIN") {
        if (session?.user) {
          // Signed-in non-admin: sign out and redirect to maintenance
          await signOut({ redirectTo: "/maintenance" })
        } else {
          // Unauthenticated first-time visitors: redirect to maintenance
          redirect("/maintenance")
        }
      }
    } catch {
      // DB unavailable (e.g. CI/test environment) — skip maintenance check
    }
  }

  const isMaintenancePage = pathname.startsWith("/maintenance")

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}>
        <Providers>
          {isMaintenancePage ? (
            children
          ) : (
            <>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </>
          )}
          <Toaster richColors position="bottom-right" />
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
