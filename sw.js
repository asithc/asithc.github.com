// Service Worker - Self-unregistering
// This file clears all caches and unregisters itself

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(function() {
            // Unregister this service worker
            return self.registration.unregister();
        }).then(function() {
            console.log('Service worker unregistered and caches cleared');
            // Claim clients to take control immediately
            return self.clients.claim();
        })
    );
});

// Don't cache anything - pass through all requests
self.addEventListener('fetch', function(event) {
    event.respondWith(fetch(event.request));
});
