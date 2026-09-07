'use strict';

// Service worker for the Common Credo wallet PWA. Two jobs:
//  1. Make the app installable and openable offline by precaching the app
//     shell (the HTML/JS/CSS/manifest/icons).
//  2. Keep it up to date: stale-while-revalidate serves the cached shell
//     instantly, then refreshes the cache from the network in the background,
//     so a new deploy is picked up on the next launch.
//
// It deliberately does NOT touch the relays: those are WebSocket (wss://)
// connections, which are not `fetch` events at all, and are cross-origin
// besides -- the fetch handler only ever handles same-origin GETs. So going
// offline gives you the app UI and your locally stored records, but
// publishing and live status still need a connection, which the UI states.
//
// BUMP CACHE_VERSION on each release so `activate` drops the previous cache.

const CACHE_VERSION = 'cc-wallet-v1';

const SHELL = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never intercept cross-origin

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(req);
    const network = fetch(req)
      .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => null);
    // Stale-while-revalidate: cached first, else wait for network.
    return cached || (await network) || new Response('Offline and not cached.', { status: 503, statusText: 'Offline' });
  })());
});
