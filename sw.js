// Weather Wahine service worker: lets the Home Screen app open offline.
// - App files: network first (so updates arrive), cached copy if offline or slow.
// - Open-Meteo forecasts: network first; the last good response per beach is kept and served
//   when offline, marked with an "sw-fetched-at" header so the page can say how old it is.
const VERSION = "ww-v1";
const SHELL = ["./", "./index.html", "./tides-data.js", "./manifest.webmanifest",
  "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/favicon-32.png"];
const API = /^https:\/\/(api|marine-api)\.open-meteo\.com\//;
const TIMEOUT_MS = { app: 3000, api: 6000 };

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (API.test(req.url)) e.respondWith(networkFirst(req, TIMEOUT_MS.api, true));
  else if (url.origin === self.location.origin) e.respondWith(networkFirst(req, TIMEOUT_MS.app, false));
});

async function networkFirst(req, timeoutMs, stamp) {
  const cache = await caches.open(VERSION);
  const network = fetch(req).then(async (res) => {
    if (res.ok) {
      const copy = stamp ? await stamped(res.clone()) : res.clone();
      await cache.put(req, copy);
    }
    return res;
  });
  const cached = () => cache.match(req, { ignoreSearch: !stamp });
  try {
    // Use the network unless it is slower than the timeout (poor signal at the beach).
    const res = await Promise.race([network, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs))]);
    if (res.ok || !(await cached())) return res;
    return (await cached()) || res;
  } catch (err) {
    network.catch(() => {});                       // let a slow request finish and refresh the cache
    const hit = await cached();
    if (hit) return hit;
    return network;                                // nothing cached: wait for the network after all
  }
}

async function stamped(res) {
  const headers = new Headers(res.headers);
  headers.set("sw-fetched-at", new Date().toISOString());
  headers.set("access-control-expose-headers", "sw-fetched-at");
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers });
}
