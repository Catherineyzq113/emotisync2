import express, { Request, Response } from 'express';
import { storeSubscription, scheduleNotification, startWorker } from './queue';

const app = express();
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// Health check — used by Railway/Fly.io
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'emotisync-notifications' });
});

// Store a push subscription from the browser
app.post('/subscribe', async (req: Request, res: Response) => {
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Invalid subscription object' });
    return;
  }

  await storeSubscription({ endpoint, keys }).catch((err) => {
    console.error('EmotiSync: Failed to store subscription:', err);
  });

  res.json({ ok: true });
});

// Schedule a push notification for a task
app.post('/schedule', async (req: Request, res: Response) => {
  const { taskName, emoji, delayMinutes, afterEmotion } = req.body;

  if (!taskName || typeof delayMinutes !== 'number') {
    res.status(400).json({ error: 'taskName and delayMinutes are required' });
    return;
  }

  await scheduleNotification(
    taskName,
    emoji || '✨',
    delayMinutes,
    afterEmotion || null
  ).catch((err) => {
    console.error('EmotiSync: Failed to schedule notification:', err);
  });

  const firesIn = delayMinutes === 0 ? 'immediately' : `in ${delayMinutes} minute(s)`;
  console.log(`EmotiSync: Scheduled "${taskName}" ${firesIn}`);
  res.json({ ok: true, firesIn });
});

const PORT = parseInt(process.env.PORT || '4000', 10);

app.listen(PORT, () => {
  console.log(`EmotiSync notification service running on port ${PORT}`);
  startWorker();
});
