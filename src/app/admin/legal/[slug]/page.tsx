import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { LEGAL_DEFAULTS, type LegalSlug } from "@/lib/legal-defaults"
import { LegalEditor } from "./legal-editor"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function AdminLegalEditorPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/")

  const { slug } = await params
  const defaults = LEGAL_DEFAULTS[slug as LegalSlug]
  if (!defaults) notFound()

  const saved = await prisma.legalPage.findUnique({ where: { slug } })
  const content = saved?.content ?? defaults.content

  return (
    <div>
      <Link
        href="/admin/legal"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5 w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Legal Pages
      </Link>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{defaults.title}</h1>
          {saved ? (
            <p className="text-sm text-muted-foreground mt-0.5">
              Last saved {new Date(saved.updatedAt).toLocaleString()}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">
              Showing default content — save to persist changes
            </p>
          )}
        </div>
        <Link
          href={`/${slug}`}
          target="_blank"
          className="text-sm brand-link"
        >
          View live page ↗
        </Link>
      </div>

      <LegalEditor slug={slug} initialContent={content} />
    </div>
  )
}
