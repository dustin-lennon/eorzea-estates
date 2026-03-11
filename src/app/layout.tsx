import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { SpeedInsights } from "@vercel/speed-insights/next"

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors position="bottom-right" />
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
