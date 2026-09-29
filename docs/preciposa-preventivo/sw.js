/* Service worker: mette in cache il guscio dell'app così funziona offline.
   La pagina è cifrata: la password resta nel localStorage del dispositivo,
   quindi dopo il primo sblocco si apre anche senza rete. */

const CACHE = 'preciposa-61ab5a41cc';
const RISORSE = [
  './',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(RISORSE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(chiavi.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== 'GET' || new URL(richiesta.url).origin !== self.location.origin) return;

  // Documenti: prima la rete (per prendere gli aggiornamenti), poi la cache.
  if (richiesta.mode === 'navigate') {
    // `cache: 'reload'` salta la cache HTTP del browser: senza, una pagina
    // ancora "fresca" per GitHub Pages terrebbe l'utente su una versione
    // vecchia dell'app anche dopo la pubblicazione.
    evento.respondWith(
      fetch(new Request(richiesta.url, { cache: 'reload', credentials: 'same-origin' }))
        .then((risposta) => {
          const copia = risposta.clone();
          caches.open(CACHE).then((cache) => cache.put('./', copia));
          return risposta;
        })
        .catch(() => caches.match('./').then((r) => r || caches.match(richiesta)))
    );
    return;
  }

  // Tutto il resto: prima la cache, con aggiornamento in sottofondo.
  evento.respondWith(
    caches.match(richiesta).then((salvata) => salvata || fetch(richiesta).then((risposta) => {
      const copia = risposta.clone();
      caches.open(CACHE).then((cache) => cache.put(richiesta, copia));
      return risposta;
    }))
  );
});
