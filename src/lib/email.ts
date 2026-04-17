import { Resend } from "resend"

const FROM = "Eorzea Estates <noreply@eorzeaestates.com>"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;border:1px solid #262626;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:20px 32px;border-bottom:1px solid #262626;">
              <img src="https://eorzeaestates.com/images/logo/navbar-email-dark.png" alt="Eorzea Estates" height="48" style="display:block;height:48px;width:auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:12px;color:#525252;">
                © Eorzea Estates · This is an automated message, please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendModerationUnpublishedEmail({
  to,
  ownerName,
  estateName,
  flagReason,
  disputeEmail,
}: {
  to: string
  ownerName: string
  estateName: string
  flagReason: string | null
  disputeEmail: string
}) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">Your estate listing has been unpublished</h2>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">Hi ${ownerName},</p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      Your estate listing <strong style="color:#f5f5f5;">${estateName}</strong> has been reviewed by our moderation team and has been unpublished.
    </p>
    ${flagReason ? `
    <div style="background:#1f1f1f;border-left:3px solid #c084fc;border-radius:4px;padding:16px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.5px;">Report reason</p>
      <p style="margin:8px 0 0;color:#e5e5e5;line-height:1.6;">${flagReason}</p>
    </div>` : ""}
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">
      If you believe this decision was made in error, you can appeal by contacting us at:
    </p>
    <p style="margin:0 0 20px;">
      <a href="mailto:${disputeEmail}" style="color:#c084fc;text-decoration:none;font-weight:600;">${disputeEmail}</a>
    </p>
    <p style="margin:0;color:#525252;font-size:13px;">— The Eorzea Estates Team</p>
  `
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your estate listing "${estateName}" has been unpublished`,
    html: baseTemplate(`Estate unpublished — ${estateName}`, body),
  })
}

export async function sendModerationRemovedEmail({
  to,
  ownerName,
  estateName,
  flagReason,
  disputeEmail,
}: {
  to: string
  ownerName: string
  estateName: string
  flagReason: string | null
  disputeEmail: string
}) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">Your estate listing has been removed</h2>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">Hi ${ownerName},</p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      Your estate listing <strong style="color:#f5f5f5;">${estateName}</strong> has been reviewed by our moderation team and has been removed from Eorzea Estates.
    </p>
    ${flagReason ? `
    <div style="background:#1f1f1f;border-left:3px solid #ef4444;border-radius:4px;padding:16px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.5px;">Report reason</p>
      <p style="margin:8px 0 0;color:#e5e5e5;line-height:1.6;">${flagReason}</p>
    </div>` : ""}
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">
      If you believe this decision was made in error, you have the right to dispute it by contacting us at:
    </p>
    <p style="margin:0 0 20px;">
      <a href="mailto:${disputeEmail}" style="color:#c084fc;text-decoration:none;font-weight:600;">${disputeEmail}</a>
    </p>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;font-size:13px;">
      Please include your estate name and account information in your message.
    </p>
    <p style="margin:0;color:#525252;font-size:13px;">— The Eorzea Estates Team</p>
  `
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your estate listing "${estateName}" has been removed`,
    html: baseTemplate(`Estate removed — ${estateName}`, body),
  })
}

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

  return getResend().emails.send({
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

export async function sendVerificationApprovedEmail({
  to,
  ownerName,
  estateName,
}: {
  to: string
  ownerName: string
  estateName: string
}) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">Ownership verified!</h2>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">Hi ${ownerName},</p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      Ownership of <strong style="color:#f5f5f5;">${estateName}</strong> has been verified.
      You can now publish your estate listing from your dashboard.
    </p>
    <p style="margin:0;color:#525252;font-size:13px;">— The Eorzea Estates Team</p>
  `
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Ownership verified — "${estateName}" is ready to publish`,
    html: baseTemplate(`Ownership verified — ${estateName}`, body),
  })
}

export async function sendVerificationQueuedEmail({
  to,
  ownerName,
  estateName,
}: {
  to: string
  ownerName: string
  estateName: string
}) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">Your verification is under review</h2>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">Hi ${ownerName},</p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      We received your ownership screenshot for <strong style="color:#f5f5f5;">${estateName}</strong>.
      Our automated system was unable to make a confident determination, so your submission has been passed to our moderation team for manual review.
    </p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      No action is needed on your part — we will notify you by email once a decision has been made.
    </p>
    <p style="margin:0;color:#525252;font-size:13px;">— The Eorzea Estates Team</p>
  `
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your verification for "${estateName}" is under review`,
    html: baseTemplate(`Verification under review — ${estateName}`, body),
  })
}

export async function sendVerificationRejectedEmail({
  to,
  ownerName,
  estateName,
  reason,
  screenshotUrl,
}: {
  to: string
  ownerName: string
  estateName: string
  reason: string
  screenshotUrl: string
}) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">Verification not approved</h2>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">Hi ${ownerName},</p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      We were unable to verify ownership of <strong style="color:#f5f5f5;">${estateName}</strong>.
    </p>
    <div style="background:#1f1f1f;border-left:3px solid #ef4444;border-radius:4px;padding:16px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
      <p style="margin:8px 0 0;color:#e5e5e5;line-height:1.6;">${reason}</p>
    </div>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">
      The screenshot you submitted is attached to this email for your reference.
      You can re-submit a new screenshot from your dashboard at any time.
    </p>
    <p style="margin:0;color:#525252;font-size:13px;">— The Eorzea Estates Team</p>
  `
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Verification not approved — "${estateName}"`,
    html: baseTemplate(`Verification rejected — ${estateName}`, body),
    attachments: [
      {
        filename: "verification-screenshot.webp",
        path: screenshotUrl,
        contentType: "image/webp",
      },
    ],
  })
}

export async function sendNewInquiryEmail({
  to,
  designerName,
  requestorName,
  conversationId,
}: {
  to: string
  designerName: string
  requestorName: string
  conversationId: string
}) {
  const url = `https://eorzeaestates.com/messages/${conversationId}`
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">New commission inquiry</h2>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">Hi ${designerName},</p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      <strong style="color:#f5f5f5;">${requestorName}</strong> has sent you a commission inquiry. Open the conversation to read their message and reply.
    </p>
    <a href="${url}" style="display:inline-block;background:#c084fc;color:#fff;text-decoration:none;font-weight:600;padding:10px 24px;border-radius:8px;margin-bottom:20px;">View Inquiry</a>
    <p style="margin:0;color:#525252;font-size:13px;">— The Eorzea Estates Team</p>
  `
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `New commission inquiry from ${requestorName}`,
    html: baseTemplate("New commission inquiry", body),
  })
}

export async function sendNewMessageEmail({
  to,
  recipientName,
  senderName,
  conversationId,
}: {
  to: string
  recipientName: string
  senderName: string
  conversationId: string
}) {
  const url = `https://eorzeaestates.com/messages/${conversationId}`
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">New message</h2>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">Hi ${recipientName},</p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      <strong style="color:#f5f5f5;">${senderName}</strong> sent you a message in your commission conversation.
    </p>
    <a href="${url}" style="display:inline-block;background:#c084fc;color:#fff;text-decoration:none;font-weight:600;padding:10px 24px;border-radius:8px;margin-bottom:20px;">View Message</a>
    <p style="margin:0;color:#525252;font-size:13px;">— The Eorzea Estates Team</p>
  `
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `New message from ${senderName}`,
    html: baseTemplate("New message", body),
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
  return getResend().emails.send({
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

export async function sendFcOverrideApprovedEmail({
  to,
  userName,
  characterName,
}: {
  to: string
  userName: string
  characterName: string
}) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">Officer override approved</h2>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">Hi ${userName},</p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      Your officer override request for <strong style="color:#f5f5f5;">${characterName}</strong> has been approved.
      You can now submit an FC estate listing on behalf of your Free Company from the
      <a href="https://eorzeaestates.com/submit" style="color:#c084fc;text-decoration:none;font-weight:600;">submission page</a>.
    </p>
    <p style="margin:0;color:#525252;font-size:13px;">— The Eorzea Estates Team</p>
  `
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Officer override approved — ${characterName} can now submit FC estates`,
    html: baseTemplate("Officer override approved", body),
  })
}

export async function sendFcOverrideDeniedEmail({
  to,
  userName,
  characterName,
  adminNote,
}: {
  to: string
  userName: string
  characterName: string
  adminNote?: string
}) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">Officer override request denied</h2>
    <p style="margin:0 0 12px;color:#a3a3a3;line-height:1.6;">Hi ${userName},</p>
    <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
      Your officer override request for <strong style="color:#f5f5f5;">${characterName}</strong> has been denied.
    </p>
    ${adminNote ? `
    <div style="background:#1f1f1f;border-left:3px solid #ef4444;border-radius:4px;padding:16px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.5px;">Note from moderator</p>
      <p style="margin:8px 0 0;color:#e5e5e5;line-height:1.6;">${adminNote}</p>
    </div>` : ""}
    <p style="margin:0;color:#525252;font-size:13px;">— The Eorzea Estates Team</p>
  `
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Officer override request denied — ${characterName}`,
    html: baseTemplate("Officer override request denied", body),
  })
}

export async function sendPasswordResetEmail({ to, url }: { to: string; url: string }) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Reset your Eorzea Estates password",
    html: baseTemplate(
      "Reset your password",
      `
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f5f5f5;">Reset your password</h2>
      <p style="margin:0 0 20px;color:#a3a3a3;line-height:1.6;">
        We received a request to reset your password. Click the button below to choose a new one.
        This link expires in 1 hour.
      </p>
      <a href="${url}" style="display:inline-block;background:#c084fc;color:#fff;text-decoration:none;font-weight:600;padding:10px 24px;border-radius:8px;margin-bottom:20px;">Reset Password</a>
      <p style="margin:0;font-size:13px;color:#737373;">If you did not request a password reset, you can safely ignore this email.</p>
      `,
    ),
  })
}

export async function sendVerificationCodeEmail(to: string, code: string) {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Eorzea Estates verification code",
    html: baseTemplate(
      "Verify your email",
      `
      <h2 style="margin:0 0 16px;font-size:20px;color:#e5e5e5;">Verify your email address</h2>
      <p style="margin:0 0 24px;color:#a3a3a3;">Enter the code below to verify your email and continue creating your account. This code expires in 15 minutes.</p>
      <div style="background:#1a1a1a;border:1px solid #404040;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#e5e5e5;font-family:monospace;">${code}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#737373;">If you did not request this code, you can safely ignore this email.</p>
      `,
    ),
  })
}
