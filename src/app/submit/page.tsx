import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { EstateSubmitForm } from "./estate-submit-form"

export const metadata: Metadata = { title: "Submit Estate" }

export default async function SubmitPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const characters = await prisma.ffxivCharacter.findMany({
    where: { userId: session.user.id, verified: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, characterName: true, server: true },
  })

  if (characters.length === 0) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">No Verified Characters</h1>
        <p className="text-muted-foreground mb-6">
          You need at least one verified FFXIV character before submitting an estate.
        </p>
        <Button asChild>
          <Link href="/dashboard/verify">Verify a Character</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Submit Your Estate</h1>
        <p className="text-muted-foreground mt-1">
          Share your housing creation with the community. All fields marked with * are required.
        </p>
      </div>
      <EstateSubmitForm characters={characters} />
    </div>
  )
}
