import type { MetadataRoute } from "next"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://eorzeaestates.com"

  const [estates, characters, users] = await Promise.all([
    prisma.estate.findMany({
      where: { published: true, deletedAt: null },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.ffxivCharacter.findMany({
      where: { verified: true },
      select: { id: true, createdAt: true },
    }),
    prisma.user.findMany({
      select: { id: true, createdAt: true },
    }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/directory`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/designers`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/changelog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.4 },
    { url: `${siteUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
    { url: `${siteUrl}/terms-of-service`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
    { url: `${siteUrl}/cookie-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
  ]

  const estateRoutes: MetadataRoute.Sitemap = estates.map((e) => ({
    url: `${siteUrl}/estate/${e.id}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const characterRoutes: MetadataRoute.Sitemap = characters.map((c) => ({
    url: `${siteUrl}/character/${c.id}`,
    lastModified: c.createdAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const profileRoutes: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${siteUrl}/profile/${u.id}`,
    lastModified: u.createdAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  return [...staticRoutes, ...estateRoutes, ...characterRoutes, ...profileRoutes]
}
