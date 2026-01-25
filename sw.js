// sw.js - Versão "Bunker" (Totalmente Offline)
const CACHE_NAME = 'participa-df-offline-v3';

// Lista exata dos arquivos que você tem na pasta
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './libs/leaflet.css',
  './libs/leaflet.js',
  // Novas imagens locais:
  './libs/images/marker-icon.png',
  './libs/images/marker-icon-2x.png',
  './libs/images/marker-shadow.png',
  './libs/images/marker-icon-red.png',
  './libs/images/marker-icon-orange.png'
];

// 1. Instalação: Baixa e guarda tudo
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 [SW] Cacheando arquivos locais...');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. Interceptação (A Mágica Offline)
self.addEventListener('fetch', event => {
  // Se for requisição para a API (Python), tenta rede primeiro, se falhar, deixa passar (o app.js trata o erro)
  if (event.request.url.includes('/api/')) {
    return; 
  }

  // Para arquivos estáticos (HTML, CSS, JS, Mapas), usa CACHE FIRST
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se achou no cache, retorna rápido!
        if (response) {
          return response;
        }
        // Se não achou (ex: tiles do mapa), tenta buscar na internet
        return fetch(event.request).catch(() => {
            // Se falhar e for imagem (tile do mapa), retorna nada ou placeholder
            // Isso evita o erro crítico no console
            return new Response('', { status: 408, statusText: 'Offline' });
        });
      })
  );
});