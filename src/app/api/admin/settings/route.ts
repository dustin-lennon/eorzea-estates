import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  maintenanceMode: z.boolean(),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { maintenanceMode: parsed.data.maintenanceMode },
    create: { id: "singleton", maintenanceMode: parsed.data.maintenanceMode },
  })

  const res = NextResponse.json(settings)
  if (parsed.data.maintenanceMode) {
    res.cookies.set("x-maintenance-mode", "1", { path: "/", httpOnly: true, sameSite: "lax" })
  } else {
    res.cookies.delete("x-maintenance-mode")
  }
  return res
}
