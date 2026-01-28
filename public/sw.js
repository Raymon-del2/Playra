const CACHE_NAME = 'playra-v1';

self.addEventListener('install', (event) => {
    // Activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Take control of all pages immediately
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // This is a basic service worker to valid PWA requirements
    // In the future, we can add offline caching logic here
});
