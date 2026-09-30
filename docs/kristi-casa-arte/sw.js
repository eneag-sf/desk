/* Service worker: tiene in cache il guscio dell'app così funziona senza rete.
   La pagina è cifrata: la password resta nel localStorage del dispositivo,
   quindi dopo il primo sblocco si apre anche offline.

   Il nome della cache cambia a ogni build (hash del contenuto): una
   pubblicazione nuova installa un service worker nuovo, che prende subito il
   controllo e cancella le cache vecchie. */

const CACHE = 'kristicasaarte-7c135be5fb';
const RISORSE = [
  './',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo-app.png',
  './icons/logo-splash.png',
  './icons/logo-scritta.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      // `reload`: la copia in cache deve essere quella appena pubblicata,
      // non quella che la cache HTTP del browser crede ancora fresca.
      .then((cache) => cache.addAll(RISORSE.map((url) => new Request(url, { cache: 'reload' }))))
      .catch(() => { /* offline al primo avvio: pazienza, si riempie dopo */ })
      .then(() => self.skipWaiting())
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
  // `cache: 'reload'` salta la cache HTTP del browser: senza, una pagina
  // ancora "fresca" per GitHub Pages terrebbe l'app sulla versione vecchia.
  if (richiesta.mode === 'navigate') {
    evento.respondWith(
      fetch(new Request(richiesta.url, { cache: 'reload', credentials: 'same-origin' }))
        .then((risposta) => {
          if (risposta.ok) {
            const copia = risposta.clone();
            caches.open(CACHE).then((cache) => cache.put('./', copia));
          }
          return risposta;
        })
        .catch(() => caches.match('./').then((r) => r || caches.match(richiesta)))
    );
    return;
  }

  // Tutto il resto: prima la cache, poi la rete (e la si mette da parte).
  evento.respondWith(
    caches.match(richiesta).then((salvata) => salvata || fetch(richiesta).then((risposta) => {
      if (risposta.ok) {
        const copia = risposta.clone();
        caches.open(CACHE).then((cache) => cache.put(richiesta, copia));
      }
      return risposta;
    }))
  );
});
