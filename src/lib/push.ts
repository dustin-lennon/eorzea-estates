import webPush from "web-push"
import prisma from "@/lib/prisma"

function initVapid() {
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@eorzeaestates.com"
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webPush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!initVapid()) return []
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async (err: unknown) => {
        // Remove stale subscriptions (410 Gone)
        if (typeof err === "object" && err !== null && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null)
        }
        throw err
      })
    )
  )

  return results
}
