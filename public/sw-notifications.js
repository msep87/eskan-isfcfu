/* Service Worker notification click & push handler for سامانه جامع خدمات دانشگاهی دانشگاه فرهنگیان اصفهان */

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const data = (event.notification && event.notification.data) || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i += 1) {
        const client = clientList[i];
        if ('focus' in client) {
          client.focus();
          try {
            client.postMessage({
              type: 'APP_NOTIFICATION_CLICK',
              category: data.category || 'general',
              itemId: data.itemId || '',
            });
          } catch {
            // ignore postMessage errors
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('push', function (event) {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'سامانه جامع خدمات دانشگاهی', body: event.data.text() };
  }

  const title = payload.title || 'سامانه جامع خدمات دانشگاهی دانشگاه فرهنگیان';
  const options = {
    body: payload.body || 'اعلان جدیدی برای شما ثبت شده است.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    dir: 'rtl',
    lang: 'fa',
    tag: payload.tag || 'cfuis-push',
    renotify: true,
    vibrate: [180, 80, 180],
    data: {
      url: payload.url || '/',
      category: payload.category || 'general',
      itemId: payload.itemId || '',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
