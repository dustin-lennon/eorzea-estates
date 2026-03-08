import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Eorzea Estates <noreply@eorzea-estates.com>"

export async function sendFCEstateUnpublishedEmail({
  to,
  ownerName,
  estateName,
  reason,
}: {
  to: string
  ownerName: string
  estateName: string
  reason: "ownership_transferred" | "no_new_owner"
}) {
  const body =
    reason === "ownership_transferred"
      ? `The FC master of your Free Company has changed. Your listing has been unpublished and a transfer invitation has been sent to the new FC master.`
      : `The FC master of your Free Company has changed and the new master does not have an account on Eorzea Estates. Your listing has been unpublished. If the situation changes, the new master can create an account and re-submit the estate.`

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your FC estate listing "${estateName}" has been unpublished`,
    html: `
      <p>Hi ${ownerName},</p>
      <p>${body}</p>
      <p><strong>Estate:</strong> ${estateName}</p>
      <p>If you believe this is an error, please re-verify your FC master status on your dashboard.</p>
      <p>— Eorzea Estates</p>
    `,
  })
}

export async function sendFCEstateTransferInviteEmail({
  to,
  newOwnerName,
  estateName,
  previousOwnerName,
  confirmUrl,
}: {
  to: string
  newOwnerName: string
  estateName: string
  previousOwnerName: string
  confirmUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `An FC estate listing has been transferred to you — action required`,
    html: `
      <p>Hi ${newOwnerName},</p>
      <p>You are now the Free Company master and an FC estate listing originally submitted by <strong>${previousOwnerName}</strong> has been assigned to your account.</p>
      <p><strong>Estate:</strong> ${estateName}</p>
      <p>The listing is currently unpublished. Click the link below to confirm the transfer and republish it:</p>
      <p><a href="${confirmUrl}">Accept Transfer & Republish Estate</a></p>
      <p>This link expires in 7 days. If you do not confirm, the listing will remain unpublished.</p>
      <p>— Eorzea Estates</p>
    `,
  })
}
