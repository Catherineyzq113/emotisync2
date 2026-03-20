import webpush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:catherine@emotisync.app';

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

export interface PushPayload {
  title: string;
  body: string;
  emoji: string;
  taskName: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPush(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<void> {
  await webpush.sendNotification(
    subscription as webpush.PushSubscription,
    JSON.stringify(payload)
  );
}
