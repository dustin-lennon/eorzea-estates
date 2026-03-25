import type { MetadataRoute } from "next"

const PRODUCTION_URL = "https://eorzeaestates.com"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXTAUTH_URL ?? PRODUCTION_URL
  const isProduction = siteUrl === PRODUCTION_URL

  if (!isProduction) {
    return { rules: [{ userAgent: "*", disallow: "/" }] }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/submit/", "/admin/", "/maintenance/"],
      },
    ],
    sitemap: `${PRODUCTION_URL}/sitemap.xml`,
  }
}
