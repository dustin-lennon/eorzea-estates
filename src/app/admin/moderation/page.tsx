import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "@/components/user-avatar"
import { ModerationActions } from "./moderation-actions"
import { VerificationActions } from "./verification-actions"
import { ClaimActions } from "./claim-actions"
import { FcOverrideRequestActions } from "./fc-override-request-actions"
import { getCharacterFCId, getFCName, getFCMasterLodestoneId, getCharacterById } from "@/lib/lodestone"

interface PageProps {
  searchParams: Promise<{ tab?: string; page?: string }>
}

export default async function ModerationPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.role || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
    redirect("/")
  }

  const { tab, page: pageParam } = await searchParams
  const activeTab =
    tab === "deleted" ? "deleted" :
    tab === "verification" ? "verification" :
    tab === "claims" ? "claims" :
    tab === "fc-overrides" ? "fc-overrides" :
    tab === "log" ? "log" :
    "flagged"

  const PAGE_SIZE = 50
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const logSkip = (currentPage - 1) * PAGE_SIZE

  const [flaggedEstates, deletedEstates, verificationQueue, claimQueue, rawOverrideRequests] = await prisma.$transaction([
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
    prisma.estateVerification.findMany({
      where: { status: "QUEUED" },
      orderBy: { submittedAt: "asc" },
      include: {
        estate: {
          select: {
            id: true,
            name: true,
            type: true,
            character: { select: { characterName: true } },
            owner: { select: { name: true, discordUsername: true } },
          },
        },
      },
    }),
    prisma.estateClaimRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { submittedAt: "asc" },
      include: {
        estate: { select: { id: true, name: true, server: true, dataCenter: true } },
        claimant: { select: { name: true, discordUsername: true } },
        character: { select: { characterName: true, server: true } },
      },
    }),
    prisma.fcOverrideRequest.findMany({
      where: { status: "PENDING" },
      orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
      include: {
        user: { select: { id: true, name: true, discordUsername: true, image: true, customAvatarUrl: true } },
        character: { select: { id: true, characterName: true, server: true, avatarUrl: true, lodestoneId: true } },
        estate: { select: { id: true } },
      },
    }),
  ])

  // Fetch live FC info for each override request — sequential to avoid Lodestone rate limits
  const overrideRequests: (typeof rawOverrideRequests[number] & { fcName: string | null; masterName: string | null; fcLookupFailed: boolean })[] = []
  for (const req of rawOverrideRequests) {
    let fcId: string | null = null
    let fcLookupFailed = false
    try {
      fcId = await getCharacterFCId(parseInt(req.character.lodestoneId))
    } catch {
      fcLookupFailed = true
    }
    const fcName = fcId ? await getFCName(fcId).catch(() => null) : null
    const masterId = fcId ? await getFCMasterLodestoneId(fcId).catch(() => null) : null
    const master = masterId ? await getCharacterById(parseInt(masterId)).catch(() => null) : null
    overrideRequests.push({ ...req, fcName, masterName: master?.Name ?? null, fcLookupFailed })
  }

  // Fetch log entries only when that tab is active
  const rawLogEntries = activeTab === "log"
    ? await prisma.moderationLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: logSkip,
        take: PAGE_SIZE + 1,
        select: {
          id: true,
          action: true,
          entityName: true,
          note: true,
          createdAt: true,
          actor: { select: { name: true, discordUsername: true } },
        },
      })
    : []
  const hasNextPage = rawLogEntries.length > PAGE_SIZE
  const logEntries = hasNextPage ? rawLogEntries.slice(0, PAGE_SIZE) : rawLogEntries

  // Compute rowspan counts per user for the override table
  const userRowspans = new Map<string, number>()
  for (const req of overrideRequests) {
    userRowspans.set(req.user.id, (userRowspans.get(req.user.id) ?? 0) + 1)
  }
  const seenUsers = new Set<string>()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Moderation Queue</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Review flagged estates, verifications, claims, and FC override requests. The Log tab records all moderation actions taken.
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
        <Link
          href="/admin/moderation?tab=verification"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "verification"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Verification
          {verificationQueue.length > 0 && (
            <span className="ml-2 text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
              {verificationQueue.length}
            </span>
          )}
        </Link>
        <Link
          href="/admin/moderation?tab=claims"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "claims"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Claims
          {claimQueue.length > 0 && (
            <span className="ml-2 text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
              {claimQueue.length}
            </span>
          )}
        </Link>
        <Link
          href="/admin/moderation?tab=fc-overrides"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "fc-overrides"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          FC Overrides
          {overrideRequests.length > 0 && (
            <span className="ml-2 text-xs bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
              {overrideRequests.length}
            </span>
          )}
        </Link>
        <Link
          href="/admin/moderation?tab=log"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "log"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Log
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

      {activeTab === "verification" && (
        verificationQueue.length === 0 ? (
          <div className="border rounded-xl p-10 text-center text-muted-foreground">
            No pending verifications. All clear!
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Estate</th>
                  <th className="text-left px-4 py-3 font-medium">Owner</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Character</th>
                  <th className="text-left px-4 py-3 font-medium">AI Confidence</th>
                  <th className="text-left px-4 py-3 font-medium">AI Reason</th>
                  <th className="text-left px-4 py-3 font-medium">Screenshot</th>
                  <th className="text-left px-4 py-3 font-medium">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {verificationQueue.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/estate/${v.estate.id}`}
                        className="font-medium hover:underline text-primary"
                        target="_blank"
                      >
                        {v.estate.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.estate.owner.discordUsername ?? v.estate.owner.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.estate.type}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.estate.character?.characterName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {v.aiConfidence ? (
                        <Badge
                          variant={
                            v.aiConfidence === "high"
                              ? "default"
                              : v.aiConfidence === "medium"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {v.aiConfidence}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-muted-foreground text-xs line-clamp-3">
                        {v.aiReason ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={v.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="relative h-16 w-28 rounded overflow-hidden border hover:opacity-80 transition-opacity">
                          <Image
                            src={v.screenshotUrl}
                            alt="Verification screenshot"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(v.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <VerificationActions verificationId={v.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {activeTab === "claims" && (
        claimQueue.length === 0 ? (
          <div className="border rounded-xl p-10 text-center text-muted-foreground">
            No pending claims. All clear!
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Estate</th>
                  <th className="text-left px-4 py-3 font-medium">Server</th>
                  <th className="text-left px-4 py-3 font-medium">Claimant</th>
                  <th className="text-left px-4 py-3 font-medium">Character</th>
                  <th className="text-left px-4 py-3 font-medium">Screenshot</th>
                  <th className="text-left px-4 py-3 font-medium">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {claimQueue.map((claim) => (
                  <tr key={claim.id} className="hover:bg-muted/30 transition-colors align-top">
                    <td className="px-4 py-3">
                      <Link href={`/estate/${claim.estate.id}`} className="font-medium hover:underline text-primary" target="_blank">
                        {claim.estate.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {claim.estate.server} ({claim.estate.dataCenter})
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {claim.claimant.discordUsername ?? claim.claimant.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {claim.character.characterName} · {claim.character.server}
                    </td>
                    <td className="px-4 py-3">
                      <a href={claim.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="relative h-16 w-28 rounded overflow-hidden border hover:opacity-80 transition-opacity">
                          <Image src={claim.screenshotUrl} alt="Claim screenshot" fill className="object-cover" unoptimized />
                        </div>
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(claim.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <ClaimActions claimId={claim.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === "fc-overrides" && (
        overrideRequests.length === 0 ? (
          <div className="border rounded-xl p-10 text-center text-muted-foreground">
            No pending FC override requests. All clear!
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Requesting User</th>
                  <th className="text-left px-4 py-3 font-medium">Character</th>
                  <th className="text-left px-4 py-3 font-medium">FC Info</th>
                  <th className="text-left px-4 py-3 font-medium">Screenshot</th>
                  <th className="text-left px-4 py-3 font-medium">Message</th>
                  <th className="text-left px-4 py-3 font-medium">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {overrideRequests.map((req) => {
                  const isFirstForUser = !seenUsers.has(req.user.id)
                  if (isFirstForUser) seenUsers.add(req.user.id)
                  const rowSpan = isFirstForUser ? userRowspans.get(req.user.id) : undefined

                  return (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors align-top">
                      {isFirstForUser && (
                        <td className="px-4 py-3 align-top" rowSpan={rowSpan}>
                          <div className="flex items-center gap-2">
                            <UserAvatar src={req.user.customAvatarUrl ?? req.user.image} name={req.user.name} size={32} />
                            <div>
                              <p className="font-medium">{req.user.name ?? "Unknown"}</p>
                              {req.user.discordUsername && (
                                <p className="text-xs text-muted-foreground">{req.user.discordUsername}</p>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {req.character.avatarUrl && (
                            <Image
                              src={req.character.avatarUrl}
                              alt={req.character.characterName}
                              width={24}
                              height={24}
                              className="rounded-full shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-medium">{req.character.characterName}</p>
                            <p className="text-xs text-muted-foreground">{req.character.server}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {req.fcName ? (
                          <div>
                            <p className="font-medium">{req.fcName}</p>
                            <p className="text-xs text-muted-foreground">
                              Master: {req.masterName ?? "Unknown"}
                            </p>
                          </div>
                        ) : req.fcLookupFailed ? (
                          <span className="text-muted-foreground text-xs">Lodestone unavailable</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not in FC</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {req.screenshotUrl ? (
                          <a href={req.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block">
                            <div className="relative h-16 w-28 rounded overflow-hidden border hover:opacity-80 transition-opacity">
                              <Image
                                src={req.screenshotUrl}
                                alt="Override evidence screenshot"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-muted-foreground text-xs line-clamp-3 whitespace-pre-wrap">
                          {req.message ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <FcOverrideRequestActions requestId={req.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === "log" && (
        <div>
          {logEntries.length === 0 ? (
            <div className="border rounded-xl p-10 text-center text-muted-foreground">
              No moderation actions logged yet.
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                    <th className="text-left px-4 py-3 font-medium">Target</th>
                    <th className="text-left px-4 py-3 font-medium">Actor</th>
                    <th className="text-left px-4 py-3 font-medium">Note</th>
                    <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors align-top">
                      <td className="px-4 py-3">
                        <ModerationActionBadge action={entry.action} />
                      </td>
                      <td className="px-4 py-3 font-medium">{entry.entityName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {entry.actor.discordUsername ?? entry.actor.name ?? "Unknown"}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-muted-foreground text-xs line-clamp-2 whitespace-pre-wrap">
                          {entry.note ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>Page {currentPage}</span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/moderation?tab=log&page=${currentPage - 1}`}
                  className="px-3 py-1 border rounded hover:bg-muted/50 transition-colors text-foreground"
                >
                  Previous
                </Link>
              )}
              {hasNextPage && (
                <Link
                  href={`/admin/moderation?tab=log&page=${currentPage + 1}`}
                  className="px-3 py-1 border rounded hover:bg-muted/50 transition-colors text-foreground"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModerationActionBadge({ action }: { action: string }) {
  const config: Record<string, { label: string; className: string }> = {
    ESTATE_APPROVED:       { label: "Flag Dismissed",         className: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800" },
    ESTATE_REJECTED:       { label: "Unpublished",            className: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800" },
    ESTATE_REMOVED:        { label: "Removed",                className: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800" },
    ESTATE_RESTORED:       { label: "Restored",               className: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800" },
    VERIFICATION_APPROVED: { label: "Verified",               className: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800" },
    VERIFICATION_REJECTED: { label: "Verification Rejected",  className: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800" },
    CLAIM_APPROVED:        { label: "Claim Approved",         className: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800" },
    CLAIM_REJECTED:        { label: "Claim Rejected",         className: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800" },
    FC_OVERRIDE_APPROVED:  { label: "FC Override Approved",   className: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800" },
    FC_OVERRIDE_DENIED:    { label: "FC Override Denied",     className: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800" },
  }
  const { label, className } = config[action] ?? { label: action, className: "text-muted-foreground bg-muted border-border" }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  )
}
