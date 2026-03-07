import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { LodestoneVerifyForm } from "./lodestone-verify-form"

export const metadata: Metadata = { title: "Add Character" }

export default async function VerifyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Check for any in-progress (unverified) verification for this user
  const pending = await prisma.lodestoneVerification.findFirst({
    where: {
      verified: false,
      character: { userId: session.user.id },
    },
    include: { character: true },
  })

  const isExpired = pending ? pending.expiresAt <= new Date() : false

  return (
    <div className="container mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Add FFXIV Character</h1>
      <p className="text-muted-foreground mb-6">
        Link a Lodestone character to your account to receive a verified badge on your listings.
        You can add as many characters as you own.
      </p>
      <LodestoneVerifyForm
        pendingCharacterId={pending && !isExpired ? pending.character.id : null}
        pendingCode={pending && !isExpired ? pending.code : null}
        pendingCharacterName={pending && !isExpired ? pending.character.characterName : null}
        pendingAvatarUrl={pending && !isExpired ? pending.character.avatarUrl : null}
      />
    </div>
  )
}
