// EmotiSync Service Worker — handles push notifications and lifecycle events
// Must be plain JS, no imports, no TypeScript, no modules

self.addEventListener('install', function(event) {
  // Activate immediately without waiting for existing SW to finish
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  // Take control of all open tabs without requiring a reload
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'EmotiSync',
      body: event.data.text(),
      emoji: '✨',
      taskName: '',
    };
  }

  const title = payload.title || 'EmotiSync';
  const options = {
    body: payload.body || 'Time to check in with yourself.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'emotisync-task',          // replaces existing notification instead of stacking
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      taskName: payload.taskName || '',
      url: '/',
    },
    actions: [
      { action: 'open', title: 'Open EmotiSync' },
      { action: 'dismiss', title: 'Later' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus an existing EmotiSync tab if one is open
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
