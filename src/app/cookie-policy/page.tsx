import { BackButton } from "@/components/back-button"
import prisma from "@/lib/prisma"
import { LEGAL_DEFAULTS } from "@/lib/legal-defaults"
import { LegalPageRenderer } from "@/components/legal-page-renderer"

export default async function CookiePolicyPage() {
  const saved = await prisma.legalPage.findUnique({ where: { slug: "cookie-policy" } })
  const content = saved?.content ?? LEGAL_DEFAULTS["cookie-policy"].content
  const updatedAt = saved?.updatedAt

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated:{" "}
        {updatedAt
          ? new Date(updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : "March 8, 2026"}
      </p>

      <LegalPageRenderer content={content} />
    </div>
  )
}
