import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.union([
  z.object({ maintenanceMode: z.boolean() }),
  z.object({ disputeEmail: z.string().email() }),
])

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const data = parsed.data

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  })

  const res = NextResponse.json(settings)
  if ("maintenanceMode" in data) {
    if (data.maintenanceMode) {
      res.cookies.set("x-maintenance-mode", "1", { path: "/", httpOnly: true, sameSite: "lax" })
    } else {
      res.cookies.delete("x-maintenance-mode")
    }
  }
  return res
}
