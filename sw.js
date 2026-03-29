// ── Barrales & Accesorios · Service Worker ──────────────────────
const CACHE = 'bya-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Nunito:wght@400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/nunitosans/v15/pe03MImSLYBVagnos8YeNfh_.woff2',
  'https://barralesyaccesorios.com.ar/wp-content/uploads/2024/09/Logotipo-Blanco.png'
];

// Instalar: cachea todos los assets principales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      // addAll falla si uno falla; usamos add individual para ser tolerantes
      Promise.allSettled(ASSETS.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

// Activar: borra caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first, con fallback a red
self.addEventListener('fetch', e => {
  // Solo interceptamos GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      // No está en cache → intentar red y guardar
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') return response;
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        // Sin red y sin cache: para navegación devuelve index.html
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
