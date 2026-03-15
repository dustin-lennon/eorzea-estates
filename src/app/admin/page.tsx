import Link from "next/link"
import prisma from "@/lib/prisma"
import { Users, FileText, ShieldCheck, Flag } from "lucide-react"

export default async function AdminDashboardPage() {
  const [userCount, estateCount, moderatorCount, flaggedCount] = await prisma.$transaction([
    prisma.user.count(),
    prisma.estate.count(),
    prisma.user.count({ where: { role: "MODERATOR" } }),
    prisma.estate.count({ where: { flagged: true } }),
  ])

  const stats = [
    { label: "Total Users", value: userCount },
    { label: "Total Estates", value: estateCount },
    { label: "Moderators", value: moderatorCount },
    { label: "Flagged Estates", value: flaggedCount },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <Link
          href="/admin/users"
          className="flex items-center gap-3 bg-card border rounded-xl p-5 hover:bg-accent transition-colors"
        >
          <Users className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Users & Roles</p>
            <p className="text-xs text-muted-foreground">Manage moderator roles</p>
          </div>
        </Link>
        <Link
          href="/admin/moderation"
          className="flex items-center gap-3 bg-card border rounded-xl p-5 hover:bg-accent transition-colors"
        >
          <Flag className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Moderation</p>
            <p className="text-xs text-muted-foreground">Review flagged estates</p>
          </div>
        </Link>
        <Link
          href="/admin/legal"
          className="flex items-center gap-3 bg-card border rounded-xl p-5 hover:bg-accent transition-colors"
        >
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Legal Pages</p>
            <p className="text-xs text-muted-foreground">Edit Privacy Policy, ToS, Cookies</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
