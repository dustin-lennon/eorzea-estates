import Link from "next/link"
import prisma from "@/lib/prisma"
import { LEGAL_SLUGS, LEGAL_DEFAULTS, type LegalSlug } from "@/lib/legal-defaults"
import { FileText, ChevronRight } from "lucide-react"

export default async function AdminLegalPage() {
  const savedPages = await prisma.legalPage.findMany({
    select: { slug: true, updatedAt: true },
  })
  const savedMap = Object.fromEntries(savedPages.map((p) => [p.slug, p]))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Legal Pages</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Edit the content of your legal pages. Changes are saved to the database and take effect immediately.
      </p>

      <div className="border rounded-xl divide-y overflow-hidden">
        {LEGAL_SLUGS.map((slug) => {
          const saved = savedMap[slug]
          return (
            <Link
              key={slug}
              href={`/admin/legal/${slug}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">{LEGAL_DEFAULTS[slug as LegalSlug].title}</p>
                  <p className="text-xs text-muted-foreground">
                    {saved
                      ? `Last edited ${new Date(saved.updatedAt).toLocaleDateString()}`
                      : "Not yet saved — using default content"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
