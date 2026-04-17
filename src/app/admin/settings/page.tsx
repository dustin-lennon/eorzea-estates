import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { MaintenanceToggle } from "./maintenance-toggle"
import { DisputeEmailInput } from "./dispute-email-input"

export default async function AdminSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== "ADMIN") redirect("/")

  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  })

  const maintenanceMode = settings?.maintenanceMode ?? false
  const disputeEmail = settings?.disputeEmail ?? "dispute@eorzeaestates.com"

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Manage site-wide configuration.
      </p>

      <div className="max-w-xl space-y-4">
        <MaintenanceToggle initialValue={maintenanceMode} />
        <DisputeEmailInput initialValue={disputeEmail} />

        {process.env.MAINTENANCE_MODE === "true" && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
            <strong>Hard override active:</strong> The{" "}
            <code className="font-mono">MAINTENANCE_MODE=true</code> environment variable is set.
            Maintenance mode cannot be disabled from this UI — update your environment variables.
          </div>
        )}
      </div>
    </div>
  )
}
