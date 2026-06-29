const CACHE = 'salvapp-v2';
const PRECACHE_URLS = [
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon.png',
  '/icon-180.png',
  '/icon-120.png',
  'https://cdn.tailwindcss.com/3.4.17',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.log('Precache partial failure', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === 'https://script.google.com') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const client = clientList[0];
        client.focus();
        if ('navigate' in client) client.navigate(client.url);
      } else {
        clients.openWindow('/index.html');
      }
    })
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ workouts: [], bodyweights: [], pics: [], macros: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
