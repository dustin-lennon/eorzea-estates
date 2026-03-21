import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Image from "next/image"
import Link from "next/link"
import { UserRoleSelect } from "./user-role-select"
import { PathfinderToggle } from "./pathfinder-toggle"
import { DesignerToggle } from "./designer-toggle"
import { PATHFINDER_LIMIT } from "@/lib/pathfinder"
import type { UserRole } from "@/types/roles"

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/")

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      discordUsername: true,
      role: true,
      pathfinder: true,
      designer: true,
      createdAt: true,
      _count: { select: { estates: true, characters: true } },
      characters: { where: { verified: true }, select: { characterName: true, avatarUrl: true }, take: 1 },
      accounts: { select: { provider: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const pathfinderCount = users.filter((u) => u.pathfinder).length
  const atLimit = pathfinderCount >= PATHFINDER_LIMIT

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Users & Roles</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Promote users to Moderator or Admin. Grant the Pathfinder badge to beta testers. You cannot change your own role.
      </p>

      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <span>Pathfinders:</span>
        <span className={`font-semibold ${atLimit ? "text-destructive" : "text-foreground"}`}>
          {pathfinderCount} / {PATHFINDER_LIMIT}
        </span>
        {atLimit && <span className="text-destructive text-xs">(limit reached)</span>}
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Auth</th>
              <th className="text-left px-4 py-3 font-medium">FFXIV Character</th>
              <th className="text-left px-4 py-3 font-medium">Estates</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Pathfinder</th>
              <th className="text-left px-4 py-3 font-medium">Designer</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ?? "User"}
                        width={32}
                        height={32}
                        className="rounded-full shrink-0"
                        unoptimized
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <Link href={`/profile/${user.id}`} className="brand-link font-medium">
                        {user.name ?? user.email ?? "Unknown"}
                      </Link>
                      {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {user.accounts.length > 0
                    ? user.accounts.map((a) => a.provider).join(", ")
                    : user.email ? "email" : "—"}
                </td>
                <td className="px-4 py-3">
                  {user.characters[0] ? (
                    <div className="flex items-center gap-2">
                      {user.characters[0].avatarUrl && (
                        <Image
                          src={user.characters[0].avatarUrl}
                          alt={user.characters[0].characterName}
                          width={24}
                          height={24}
                          className="rounded-full shrink-0"
                          unoptimized
                        />
                      )}
                      <span className="text-sm">{user.characters[0].characterName}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user._count.estates}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <UserRoleSelect
                    userId={user.id}
                    currentRole={user.role as UserRole}
                    isSelf={user.id === session.user.id}
                  />
                </td>
                <td className="px-4 py-3">
                  <PathfinderToggle
                    userId={user.id}
                    isPathfinder={user.pathfinder}
                    atLimit={atLimit}
                  />
                </td>
                <td className="px-4 py-3">
                  <DesignerToggle
                    userId={user.id}
                    isDesigner={user.designer}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
