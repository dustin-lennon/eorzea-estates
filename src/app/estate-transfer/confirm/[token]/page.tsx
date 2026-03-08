import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { AcceptTransferButton } from "./accept-transfer-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ESTATE_TYPES } from "@/lib/ffxiv-data"

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function EstateTransferConfirmPage({ params }: PageProps) {
  const { token } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/api/auth/signin?callbackUrl=/estate-transfer/confirm/${token}`)
  }

  const transfer = await prisma.estatePendingTransfer.findUnique({
    where: { token },
    include: {
      estate: {
        select: {
          id: true,
          name: true,
          type: true,
          district: true,
          server: true,
          dataCenter: true,
        },
      },
    },
  })

  if (!transfer) return notFound()

  const isExpired = transfer.expiresAt < new Date()
  const isWrongUser = transfer.newOwnerId !== session.user.id

  const estateTypeLabel =
    ESTATE_TYPES.find((t) => t.value === transfer.estate.type)?.label ?? transfer.estate.type

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Estate Ownership Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isExpired ? (
            <div className="text-center space-y-2">
              <p className="text-destructive font-medium">This transfer link has expired.</p>
              <p className="text-sm text-muted-foreground">
                The link was valid for 7 days. If you believe you should still receive this estate,
                please contact the previous owner.
              </p>
            </div>
          ) : isWrongUser ? (
            <div className="text-center space-y-2">
              <p className="text-destructive font-medium">This transfer is not for your account.</p>
              <p className="text-sm text-muted-foreground">
                You are logged in as a different user than the intended recipient. Please log in with
                the correct account.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">You have been invited to accept ownership of:</p>
                <p className="text-xl font-semibold">{transfer.estate.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{estateTypeLabel}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {transfer.estate.server} &middot; {transfer.estate.dataCenter}
                    {transfer.estate.district ? ` · ${transfer.estate.district}` : ""}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Accepting this transfer will republish the listing under your account. You can
                manage or unpublish it from your dashboard at any time.
              </p>

              <p className="text-xs text-muted-foreground">
                Offer expires: {transfer.expiresAt.toLocaleDateString(undefined, { dateStyle: "long" })}
              </p>

              <AcceptTransferButton token={token} estateId={transfer.estate.id} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
