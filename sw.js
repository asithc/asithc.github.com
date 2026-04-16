/*!
 * sw.js — cache the static pieces of asith.cc that almost never change
 * so repeat visits don't re-download them.
 *
 * Design choices:
 *   - Navigation requests (HTML) bypass the SW entirely. That keeps edits to
 *     copy / layout visible on the next refresh; no "why is my change not
 *     showing up?" at 2am.
 *   - Same-origin assets use stale-while-revalidate: serve from cache
 *     immediately, fetch a fresh copy in the background so tomorrow's load
 *     is already up to date.
 *   - The cache key includes ?v=N query strings, so bumping a version
 *     automatically produces a cache miss and refetch — no manual busting.
 *   - A version tag in CACHE_NAME lets us wipe the old cache wholesale
 *     whenever we change SW strategy.
 */
const CACHE_NAME = 'asith-v3-2026-04';

// Small, hand-picked list of assets that carry most of the repeat-visit cost.
// We don't pre-cache every image; stale-while-revalidate will populate the
// cache organically as the user browses.
const PRECACHE_URLS = [
    '/css/style.css?v=5.23',
    '/js/script.js?v=20260415',
    '/js/anim-pause.js?v=1.0',
    '/fonts/libre-baskerville-400.woff2',
    '/fonts/libre-baskerville-400-italic.woff2',
    '/fonts/libre-baskerville-700.woff2',
    '/images/asith-logo.svg',
    '/images/asith-avatar.webp'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                // addAll is atomic: if any asset 404s, the whole install fails
                // and the old SW stays active — which is what we want.
                return cache.addAll(PRECACHE_URLS);
            })
            .then(function () { return self.skipWaiting(); })
            .catch(function () {
                // Precache failed — don't block install; the SW still works
                // for runtime caching even without precached assets.
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) {
                if (k !== CACHE_NAME) return caches.delete(k);
            }));
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (event) {
    var req = event.request;

    // Only GET. POST / PUT / etc. always hit the network.
    if (req.method !== 'GET') return;

    var url;
    try { url = new URL(req.url); }
    catch (e) { return; }

    // Cross-origin (GTM, GA, Google Fonts if anything slips through,
    // unpkg / CDNs) — don't cache. Let the browser + upstream handle it.
    if (url.origin !== self.location.origin) return;

    // Don't cache HTML navigations. Always network-fresh so content edits
    // ship the moment they're deployed.
    if (req.mode === 'navigate' || req.destination === 'document') return;

    // Don't cache analytics beacons or any /api-like endpoint.
    if (url.pathname.indexOf('/api/') === 0) return;

    event.respondWith(
        caches.match(req).then(function (cached) {
            var network = fetch(req).then(function (res) {
                // Only cache successful, basic (same-origin, not opaque) responses.
                if (res && res.status === 200 && res.type === 'basic') {
                    var clone = res.clone();
                    caches.open(CACHE_NAME)
                        .then(function (c) { return c.put(req, clone); })
                        .catch(function () { /* cache put failures aren't fatal */ });
                }
                return res;
            }).catch(function () {
                // Network failed (offline / flaky). Cached copy is better than
                // nothing; if we have none, the promise rejects and the browser
                // shows its normal offline error — same as without a SW.
                return cached;
            });

            return cached || network;
        })
    );
});
