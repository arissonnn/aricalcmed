/**
 * sw.js — Service Worker
 * Cache-first para funcionar offline.
 */
const CACHE = 'drogas-uti-v10';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      './index.html',
      './css/style.css',
      './js/constants.js',
      './js/database.js',
      './js/calculations.js',
      './js/storage.js',
      './js/render.js',
      './js/print.js',
      './js/app.js',
      './js/data/drugs.json',
      './qrcode.png',
      './manifest.json'
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
