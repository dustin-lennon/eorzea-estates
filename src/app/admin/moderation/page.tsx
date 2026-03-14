import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { ModerationActions } from "./moderation-actions"

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function ModerationPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    redirect("/")
  }

  const { tab } = await searchParams
  const activeTab = tab === "deleted" ? "deleted" : "flagged"

  const [flaggedEstates, deletedEstates] = await Promise.all([
    prisma.estate.findMany({
      where: { flagged: true, deletedAt: null },
      orderBy: { flaggedAt: "asc" },
      select: {
        id: true,
        name: true,
        flagReason: true,
        flaggedAt: true,
        moderationStatus: true,
        owner: { select: { id: true, name: true, discordUsername: true } },
        flaggedBy: { select: { id: true, name: true, discordUsername: true } },
      },
    }),
    prisma.estate.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        name: true,
        flagReason: true,
        deletedAt: true,
        owner: { select: { id: true, name: true, discordUsername: true } },
        flaggedBy: { select: { id: true, name: true, discordUsername: true } },
      },
    }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Moderation Queue</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Review flagged estates. Dismiss to clear the report, Unpublish to take it down, Remove to soft-delete.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        <Link
          href="/admin/moderation"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "flagged"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Flagged
          {flaggedEstates.length > 0 && (
            <span className="ml-2 text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
              {flaggedEstates.length}
            </span>
          )}
        </Link>
        <Link
          href="/admin/moderation?tab=deleted"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "deleted"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Deleted
          {deletedEstates.length > 0 && (
            <span className="ml-2 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
              {deletedEstates.length}
            </span>
          )}
        </Link>
      </div>

      {activeTab === "flagged" && (
        flaggedEstates.length === 0 ? (
          <div className="border rounded-xl p-10 text-center text-muted-foreground">
            No flagged estates. All clear!
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Estate</th>
                  <th className="text-left px-4 py-3 font-medium">Owner</th>
                  <th className="text-left px-4 py-3 font-medium">Reported By</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 font-medium">Flagged</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {flaggedEstates.map((estate) => (
                  <tr key={estate.id} className="hover:bg-muted/30 transition-colors align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/estate/${estate.id}`}
                        className="font-medium hover:underline text-primary"
                        target="_blank"
                      >
                        {estate.name}
                      </Link>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {estate.moderationStatus}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {estate.owner.discordUsername ?? estate.owner.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {estate.flaggedBy
                        ? (estate.flaggedBy.discordUsername ?? estate.flaggedBy.name ?? "Unknown")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {estate.flagReason ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {estate.flaggedAt
                        ? new Date(estate.flaggedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ModerationActions estateId={estate.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === "deleted" && (
        deletedEstates.length === 0 ? (
          <div className="border rounded-xl p-10 text-center text-muted-foreground">
            No deleted estates.
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Estate</th>
                  <th className="text-left px-4 py-3 font-medium">Owner</th>
                  <th className="text-left px-4 py-3 font-medium">Reported By</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 font-medium">Removed</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deletedEstates.map((estate) => (
                  <tr key={estate.id} className="hover:bg-muted/30 transition-colors align-top">
                    <td className="px-4 py-3">
                      <span className="font-medium text-muted-foreground">{estate.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {estate.owner.discordUsername ?? estate.owner.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {estate.flaggedBy
                        ? (estate.flaggedBy.discordUsername ?? estate.flaggedBy.name ?? "Unknown")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {estate.flagReason ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {estate.deletedAt
                        ? new Date(estate.deletedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ModerationActions estateId={estate.id} showRestore />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
