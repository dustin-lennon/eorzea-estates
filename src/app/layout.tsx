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

const siteUrl = process.env.NEXTAUTH_URL ?? "https://eorzeaestates.com"

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Eorzea Estates",
  url: siteUrl,
  description:
    "A community-curated directory of Final Fantasy XIV player estates, venues, apartments, and free company houses.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/directory?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
}

export const metadata: Metadata = {
  title: {
    default: "Eorzea Estates — FFXIV Housing Directory",
    template: "%s | Eorzea Estates",
  },
  description:
    "A community-curated directory of Final Fantasy XIV player estates, venues, apartments, and free company houses.",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Eorzea Estates",
    url: siteUrl,
    locale: "en_US",
    title: "Eorzea Estates — FFXIV Housing Directory",
    description:
      "A community-curated directory of Final Fantasy XIV player estates, venues, apartments, and free company houses.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eorzea Estates — FFXIV Housing Directory",
    description:
      "A community-curated directory of Final Fantasy XIV player estates, venues, apartments, and free company houses.",
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
  const bypassPaths = ["/login", "/api/auth", "/maintenance", "/images"]
  if (!bypassPaths.some((p) => pathname.startsWith(p))) {
    let maintenanceOn = false
    let isAdmin = false
    let hasUser = false
    try {
      const [settings, session] = await Promise.all([
        prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
        auth(),
      ])
      maintenanceOn = settings?.maintenanceMode ?? false
      isAdmin = session?.user?.role === "ADMIN"
      hasUser = !!session?.user
    } catch {
      // DB unavailable (e.g. CI/test environment) — skip maintenance check
    }
    if (maintenanceOn && !isAdmin) {
      if (hasUser) {
        await signOut({ redirectTo: "/maintenance" })
      } else {
        redirect("/maintenance")
      }
    }
  }

  const isMaintenancePage = pathname.startsWith("/maintenance")

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}>
        <Providers>
          {isMaintenancePage ? (
            children
          ) : (
            <>
              <Navbar />
              <main className="flex-1 flex flex-col">{children}</main>
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
