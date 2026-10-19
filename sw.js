/* Bramble & Basalt demo: offline support.
   Pages: network first, but on a weak signal (no answer in 3 s) show the copy saved
   on the last visit while the fresh one downloads in the background. Pages never
   opened fall back to offline.html.
   CSS, JS, fonts and images: served from the cache at once and refreshed in the
   background (stale-while-revalidate). Anything else: network, cache if offline. */
const CACHE = 'bb-v2';
const CORE = ['offline.html', 'css/style.css', 'js/main.js', 'assets/icons.svg', 'assets/favicon.svg', 'assets/img/scene-path.svg',
  'assets/fonts/inter-latin-var.woff2', 'assets/fonts/playfair-latin-var.woff2'];
const PAGE_TIMEOUT = 3000;
const ASSET = /\.(?:css|js|woff2?|svg|png|jpe?g|gif|webp|avif|ico)$/i;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Saves a good response once it arrives, keeping the worker alive until it's stored.
// The copy is taken as soon as the response lands, before the page reads the body.
function keep(e, req, res) {
  e.waitUntil(res.then(r => {
    if (r.status !== 200) return;
    const copy = r.clone();
    return caches.open(CACHE).then(c => c.put(req, copy));
  }).catch(() => {}));
  return res;
}

// Pages carry no server-side state, so ?utm_… or ?p=… variants share one saved copy.
const saved = req => caches.match(req).then(hit => hit || caches.match(req, { ignoreSearch: true }));

async function page(e) {
  const net = keep(e, e.request, Promise.resolve(e.preloadResponse).then(pre => pre || fetch(e.request)));
  const slow = new Promise(resolve => setTimeout(resolve, PAGE_TIMEOUT, 'slow'));
  const first = await Promise.race([net.catch(() => 'down'), slow]);
  if (first instanceof Response) return first;
  const hit = await saved(e.request);
  if (hit) return hit;
  try { return await net; } catch { return (await caches.match('offline.html')) || Response.error(); }
}

function asset(e) {
  const net = keep(e, e.request, fetch(e.request));
  return caches.match(e.request).then(hit => hit || net).catch(() => Response.error());
}

function other(e) {
  return keep(e, e.request, fetch(e.request)).catch(() => caches.match(e.request).then(hit => hit || Response.error()));
}

self.addEventListener('fetch', e => {
  const r = e.request;
  const url = new URL(r.url);
  if (r.method !== 'GET' || url.origin !== self.location.origin) return;
  if (r.mode === 'navigate') e.respondWith(page(e));
  else if (ASSET.test(url.pathname)) e.respondWith(asset(e));
  else e.respondWith(other(e));
});
