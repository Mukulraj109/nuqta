/* eslint-disable no-restricted-globals */

// Expo notification service worker for web push notifications
self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Nuqta';
  const options = {
    body: data.body || '',
    icon: data.icon || '/assets/images/icon.png',
    badge: data.badge || '/assets/images/icon.png',
    data: data.data || {},
    tag: data.tag || undefined,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const data = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If a window is already open, focus it and send the notification data
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: data,
          });
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
