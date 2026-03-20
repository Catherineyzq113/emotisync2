/**
 * EmotiSync Notification Service — Dev Mode (no Redis, no Docker)
 * Uses in-memory storage and setTimeout for local testing.
 * For production, use src/index.ts with Redis + BullMQ.
 */
import express, { Request, Response } from 'express';
import webpush from 'web-push';

const app = express();
app.use(express.json());

// In-memory subscription store (single user dev mode)
let storedSubscription: webpush.PushSubscription | null = null;

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:catherine@emotisync.app';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('❌ VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in environment');
  process.exit(1);
}

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', mode: 'dev-inmemory' });
});

app.post('/subscribe', (req: Request, res: Response) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Invalid subscription' });
    return;
  }
  storedSubscription = { endpoint, keys } as webpush.PushSubscription;
  console.log('✅ Push subscription stored');
  res.json({ ok: true });
});

app.post('/schedule', (req: Request, res: Response) => {
  const { taskName, emoji, delayMinutes, afterEmotion } = req.body;

  if (!taskName || typeof delayMinutes !== 'number') {
    res.status(400).json({ error: 'taskName and delayMinutes are required' });
    return;
  }

  const delayMs = Math.max(0, delayMinutes) * 60 * 1000;
  const isImmediate = delayMinutes === 0;
  const firesIn = isImmediate ? 'immediately' : `in ${delayMinutes} minute(s)`;

  console.log(`📅 Scheduled "${taskName}" ${emoji || '✨'} ${firesIn}`);

  setTimeout(async () => {
    if (!storedSubscription) {
      console.warn('⚠️  No subscription stored — notification not sent');
      return;
    }

    const payload = JSON.stringify({
      title: 'EmotiSync',
      body: isImmediate
        ? `New tasks ready for you ${emoji || '✨'}`
        : `Time for: ${taskName} ${emoji || '✨'}`,
      emoji: emoji || '✨',
      taskName,
    });

    await webpush.sendNotification(storedSubscription, payload).catch((err: any) => {
      if (err.statusCode === 410) {
        console.warn('⚠️  Subscription expired, clearing');
        storedSubscription = null;
      } else {
        console.error('❌ Push failed:', err.message);
      }
    });

    console.log(`🔔 Push sent: "${taskName}"`);
  }, delayMs);

  res.json({ ok: true, firesIn });
});

const PORT = parseInt(process.env.PORT || '4000', 10);
app.listen(PORT, () => {
  console.log(`\n🚀 EmotiSync notification service (dev mode) on port ${PORT}`);
  console.log(`   No Redis or Docker required — in-memory scheduling\n`);
});
