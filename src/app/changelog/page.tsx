import { Metadata } from "next"
import { BackButton } from "@/components/back-button"
import { ChangelogRenderer } from "@/components/changelog-renderer"

export const dynamic = "force-static"

export const metadata: Metadata = { title: "Changelog" }

export default function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <BackButton />
      <h1 className="text-2xl font-bold mb-8">Changelog</h1>
      <ChangelogRenderer content={process.env.CHANGELOG_CONTENT ?? ""} />
    </div>
  )
}
