/* Bramble & Basalt demo: offline support.
   Network first, so visitors always get the newest page. Anything they've already
   opened keeps working with no signal, and new pages fall back to offline.html. */
const CACHE = 'bb-v1';
const CORE = ['./', 'index.html', 'offline.html', 'css/style.css', 'js/main.js', 'js/chat.js', 'assets/icons.svg',
  'assets/fonts/inter-latin-var.woff2', 'assets/fonts/playfair-latin-var.woff2', 'assets/img/logo-mark.svg', 'assets/img/scene-path.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
        return res;
      })
      .catch(() => caches.match(r).then(hit => hit || (r.mode === 'navigate' ? caches.match('offline.html') : Response.error())))
  );
});
