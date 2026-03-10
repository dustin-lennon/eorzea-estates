import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Image from "next/image"
import { UserRoleSelect } from "./user-role-select"
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
      createdAt: true,
      _count: { select: { estates: true, characters: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Users & Roles</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Promote users to Moderator or Admin. You cannot change your own role.
      </p>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Discord</th>
              <th className="text-left px-4 py-3 font-medium">Estates</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
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
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{user.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.discordUsername ?? "—"}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
