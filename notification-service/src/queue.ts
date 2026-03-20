import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { sendPush, PushSubscriptionData } from './push';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });

const SUBSCRIPTION_KEY = 'emotisync:subscription';

export const notificationQueue = new Queue('notifications', {
  connection: redis,
});

export function startWorker(): void {
  const worker = new Worker(
    'notifications',
    async (job) => {
      const { taskName, emoji, delayMinutes } = job.data;

      const raw = await redis.get(SUBSCRIPTION_KEY);
      if (!raw) {
        console.warn('EmotiSync: No push subscription stored — skipping notification');
        return;
      }

      const subscription: PushSubscriptionData = JSON.parse(raw);

      const isImmediate = delayMinutes === 0;
      const payload = {
        title: 'EmotiSync',
        body: isImmediate
          ? `${emoji} ${taskName}`
          : `⏰ Time for: ${taskName} ${emoji}`,
        emoji,
        taskName,
      };

      await sendPush(subscription, payload).catch((err: NodeJS.ErrnoException) => {
        // 410 = subscription expired or invalid; clean it up
        if (err.statusCode === 410) {
          console.warn('EmotiSync: Push subscription expired, removing from Redis');
          redis.del(SUBSCRIPTION_KEY).catch(() => {});
        } else {
          console.error('EmotiSync: Failed to send push:', err);
        }
      });
    },
    { connection: redis }
  );

  worker.on('failed', (job, err) => {
    console.error(`EmotiSync: Job ${job?.id} failed:`, err);
  });
}

export async function storeSubscription(subscription: PushSubscriptionData): Promise<void> {
  await redis.set(SUBSCRIPTION_KEY, JSON.stringify(subscription));
}

export async function scheduleNotification(
  taskName: string,
  emoji: string,
  delayMinutes: number,
  afterEmotion: string | null
): Promise<void> {
  const delayMs = Math.max(0, delayMinutes) * 60 * 1000;
  await notificationQueue.add(
    'send-push',
    { taskName, emoji, delayMinutes, afterEmotion },
    { delay: delayMs, removeOnComplete: true, removeOnFail: 100 }
  );
}
