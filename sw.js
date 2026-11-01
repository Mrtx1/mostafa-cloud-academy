/**
 * Mostafa Cloud Academy - Production Service Worker for Cloudflare Pages
 * Strategy: Precache App Shell + Stale-While-Revalidate + Offline Navigation Fallback
 */
'use strict';

const CACHE_VERSION = 'mostafa-cloud-pwa-v4.3.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE_ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  './icons/icon-192.png',
  './icons/icon-maskable-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

// 1. Install Event: Precache core application shell (HTML with inline CSS/JS & Manifest)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' }))
        )
      );
    })
  );
});

// 2. Activate Event: Purge outdated caches and take immediate control of open clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Message Event: Support manual skipWaiting & cache refresh from client
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch Event: Offline-First Stale-While-Revalidate for same-origin requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only intercept same-origin requests on Cloudflare Pages
  if (url.origin !== self.location.origin) return;

  // Handle HTML navigation requests (e.g. '/', '/index.html', '/?view=...')
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cachedIndex =
          (await cache.match('index.html')) ||
          (await cache.match('./')) ||
          (await cache.match(request));

        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put('index.html', response.clone());
              cache.put('./', response.clone());
            }
            return response;
          })
          .catch(() => null);

        // Return cached shell immediately for instant load, or await network on first visit
        return cachedIndex || (await networkFetch) || new Response(
          '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>وضع عدم الاتصال</title></head><body style="background:#0a0507;color:#f8fafc;font-family:sans-serif;text-align:center;padding:3rem;"><h1>أنت غير متصل بالإنترنت</h1><p>يرجى إعادة تحميل الصفحة عند توفر الاتصال لأول مرة.</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })()
    );
    return;
  }

  // Handle static assets (/manifest.webmanifest, /sw.js, icons, etc.)
  event.respondWith(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cachedResponse = await cache.match(request);

      const networkPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || (await networkPromise);
    })()
  );
});
