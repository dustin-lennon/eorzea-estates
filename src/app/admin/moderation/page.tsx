import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { ModerationActions } from "./moderation-actions"

export default async function ModerationPage() {
  const session = await auth()
  if (!session?.user?.role || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    redirect("/")
  }

  const flaggedEstates = await prisma.estate.findMany({
    where: { flagged: true },
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
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Moderation Queue</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Review flagged estates. Approve to clear the flag, Reject to unpublish, Remove to delete.
      </p>

      {flaggedEstates.length === 0 ? (
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
      )}
    </div>
  )
}
