// EmotiSync Push Notification Manager
// Handles subscription setup, OS push scheduling, and in-app toast events

export type NotifiableTask = {
  task: string;
  duration: number;
  emoji: string;
  after: string | null;
  beforeColor?: string;
  afterColor?: string;
};

export type ToastPayload = {
  id: number;
  taskName: string;
  emoji: string;
  duration: number;
  beforeColor: string;
  afterColor: string;
  label: string; // e.g. "Suggested for you" | "Up next" | "Time's up"
};

type ToastListener = (payload: ToastPayload) => void;
let _toastListener: ToastListener | null = null;

/** Register a callback to display in-app toast notifications */
export function onNotificationToast(listener: ToastListener): void {
  _toastListener = listener;
}

/** Converts a base64url-encoded VAPID public key to Uint8Array for the Push API */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(Array.from(rawData).map((char) => char.charCodeAt(0)));
}

/**
 * Requests push notification permission and creates/retrieves a push subscription.
 * Safe to call multiple times — deduplicates via getSubscription().
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(existing.toJSON()),
    }).catch(() => {});
    return existing;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.warn('EmotiSync: NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
    return null;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  }).catch((err) => console.warn('EmotiSync: Failed to register subscription:', err));

  return subscription;
}

/**
 * Schedules both an OS push notification and an in-app toast for a task.
 * @param task         - Task to notify about (includes optional color hints)
 * @param delayMinutes - Minutes until notification fires (0 = immediate)
 * @param label        - Optional override for the toast header label
 */
export function scheduleTaskNotification(
  task: NotifiableTask,
  delayMinutes: number,
  label?: string,
): void {
  if (typeof window === 'undefined') return;

  const delayMs = Math.max(0, delayMinutes) * 60 * 1000;
  const isImmediate = delayMinutes === 0;
  const toastLabel = label ?? (isImmediate ? 'Suggested for you' : "Time's up");

  // OS push via notification service
  if ('serviceWorker' in navigator) {
    navigator.permissions
      .query({ name: 'notifications' as PermissionName })
      .then((s) => {
        if (s.state !== 'granted') return;
        fetch('/api/notifications/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskName: task.task,
            emoji: task.emoji,
            duration: task.duration,
            afterEmotion: task.after,
            delayMinutes,
          }),
        }).catch(() => {});
      })
      .catch(() => {});
  }

  // In-app toast (fires via setTimeout — works while user is on the page)
  setTimeout(() => {
    if (!_toastListener) return;
    _toastListener({
      id: Date.now() + Math.random(),
      taskName: task.task,
      emoji: task.emoji,
      duration: task.duration,
      beforeColor: task.beforeColor || '#fde68a',
      afterColor: task.afterColor || '#fde68a',
      label: toastLabel,
    });
  }, delayMs);
}
