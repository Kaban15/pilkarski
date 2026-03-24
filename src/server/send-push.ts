import webpush from "web-push";
import { db } from "@/server/db/client";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails("mailto:kontakt@pilkasport.pl", VAPID_PUBLIC, VAPID_PRIVATE);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
      ),
    ),
  );

  // Clean up expired/invalid subscriptions
  const toDelete: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected" && (result.reason as { statusCode?: number })?.statusCode === 410) {
      toDelete.push(subscriptions[i].id);
    }
  });
  if (toDelete.length > 0) {
    await db.pushSubscription.deleteMany({ where: { id: { in: toDelete } } });
  }
}
