import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { LodestoneVerifyForm } from "./lodestone-verify-form"

export const metadata: Metadata = { title: "Verify Character" }

export default async function VerifyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      lodestoneVerified: true,
      lodestoneCharacterName: true,
      lodestoneCharacterId: true,
    },
  })

  const pending = await prisma.lodestoneVerification.findUnique({
    where: { userId: session.user.id },
    select: { code: true, expiresAt: true, verified: true },
  })

  if (user?.lodestoneVerified) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-2">Character Already Verified</h1>
        <p className="text-muted-foreground">
          Your character <strong>{user.lodestoneCharacterName}</strong> is already verified.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Verify Your FFXIV Character</h1>
      <p className="text-muted-foreground mb-6">
        Link a Lodestone character to your account to receive a verified badge on your listings.
        This confirms your in-game identity — it doesn&apos;t verify estate ownership.
      </p>
      <LodestoneVerifyForm
        existingCode={pending?.verified === false ? pending.code : null}
        existingCharacterName={user?.lodestoneCharacterName ?? null}
      />
    </div>
  )
}
