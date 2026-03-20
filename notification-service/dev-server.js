/**
 * EmotiSync Notification Service — Dev Mode (plain JS, no Redis, no Docker)
 * Run from repo root: node notification-service/dev-server.js
 */
'use strict';

// Load env from root .env.local
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const express = require('express');
const webpush = require('web-push');

const app = express();
app.use(express.json());

let storedSubscription = null;

const vapidPublicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail      = process.env.VAPID_EMAIL || 'mailto:catherine@emotisync.app';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('❌  NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in .env.local');
  process.exit(1);
}

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'dev-inmemory' });
});

app.post('/subscribe', (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  storedSubscription = { endpoint, keys };
  console.log('✅  Push subscription stored');
  res.json({ ok: true });
});

app.post('/schedule', (req, res) => {
  const { taskName, emoji, delayMinutes } = req.body;

  if (!taskName || typeof delayMinutes !== 'number') {
    return res.status(400).json({ error: 'taskName and delayMinutes are required' });
  }

  const delayMs   = Math.max(0, delayMinutes) * 60 * 1000;
  const isImmediate = delayMinutes === 0;
  const firesIn   = isImmediate ? 'immediately' : `in ${delayMinutes} minute(s)`;

  console.log(`📅  Scheduled "${taskName}" ${emoji || '✨'} ${firesIn}`);

  setTimeout(async () => {
    if (!storedSubscription) {
      console.warn('⚠️   No subscription stored — notification not sent');
      return;
    }
    const payload = JSON.stringify({
      title: 'EmotiSync',
      body: isImmediate
        ? `${emoji || '✨'} ${taskName}`
        : `⏰ Time for: ${taskName} ${emoji || '✨'}`,
      emoji:    emoji || '✨',
      taskName,
    });
    try {
      await webpush.sendNotification(storedSubscription, payload);
      console.log(`🔔  Push sent: "${taskName}"`);
    } catch (err) {
      if (err.statusCode === 410) {
        console.warn('⚠️   Subscription expired, clearing');
        storedSubscription = null;
      } else {
        console.error('❌  Push failed:', err.message);
      }
    }
  }, delayMs);

  res.json({ ok: true, firesIn });
});

const PORT = parseInt(process.env.PORT || '4000', 10);
app.listen(PORT, () => {
  console.log(`\n🚀  EmotiSync notification service (dev) running on port ${PORT}`);
  console.log(`    No Redis or Docker required\n`);
});
