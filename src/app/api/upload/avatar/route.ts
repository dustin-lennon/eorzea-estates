import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { uploadUserAvatar } from "@/lib/storage"
import { createClient } from "@supabase/supabase-js"

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url } = await uploadUserAvatar(buffer, session.user.id)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { customAvatarUrl: url },
  })

  return NextResponse.json({ url })
}

export async function DELETE(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Best-effort delete — ignore errors (file may not exist)
  await supabase.storage.from("estate-images").remove([`user-avatars/${session.user.id}.webp`])

  await prisma.user.update({
    where: { id: session.user.id },
    data: { customAvatarUrl: null },
  })

  return NextResponse.json({ success: true })
}
