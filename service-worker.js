const CACHE_NAME = 'calculadora-facundo-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './Img/icon.svg',
    './js/calculadora/main.js',
    './js/calculadora/app.js',
    './js/calculadora/calculator-engine.js',
    './js/calculadora/draggabilly.pkgd.min.js',
    './js/calculadora/draggable-buttons.js',
    './js/calculadora/event-handler.js',
    './js/calculadora/history.js',
    './js/calculadora/theme-switcher.js',
    './js/calculadora/ui-manager.js',
    './js/calculadora/utils.js',
    './scss/style.css',
    './js/modal/native-ui.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
    // Assets 100% nativos sin librerías externas pesadas
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
