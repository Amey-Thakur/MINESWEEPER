/*
 * sw.js - Service Worker
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 2026
 * License      : MIT
 *
 * Description  : Core service worker for offline support and asset caching.
 *                Implements a "Cache-First" strategy for static assets and a
 *                "Network-First" fallback for dynamic updates.
 *
 * DSA Note:
 * Time Complexity (Caching) : O(N) where N is the number of assets to register.
 * Time Complexity (Lookup)  : O(1) using browser's internal Cache API hash map.
 * Space Complexity          : O(M) for local persistence of M total asset bytes.
 */

const CACHE_NAME = 'minesweeper-pwa-v10';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/icons/mine.png',
    './assets/icons/pwa_wallpaper.jpg',
    './assets/icons/pwa_gameboard.png',
    './assets/icons/pwa_developer.png',
    './assets/icons/pwa_about.png',
    './css/reset.css',
    './css/win95.css',
    './css/game.css',
    './js/main.js',
    './js/constants.js',
    './js/ui/UIController.js',
    './js/ui/TimerController.js',
    './js/ui/MenuController.js',
    './js/ui/SeedController.js',
    './js/ui/WindowDragger.js',
    './js/ui/ScoreController.js',
    './js/engine/BoardEngine.js',
    './js/engine/SeedRNG.js',
    './js/engine/QuadTree.js',
    './js/engine/CSPSolver.js',
    './js/engine/FloodFill.js',
    './js/renderer/GameRenderer.js',
    './js/renderer/Camera.js',
    './js/renderer/SpriteSheet.js',
    './js/worker/GameWorker.js',
    './js/logic/ScoreManager.js',
    './assets/icons/favicon.ico',
    './assets/icons/minesweeper.ico',
    './assets/icons/about.svg',
    './assets/icons/author.svg',
    './assets/icons/folder.svg',
    './assets/icons/help.svg',
    './assets/icons/howto.svg',
    './assets/icons/plus.svg',
    './assets/icons/run.svg',
    './assets/icons/smiley_normal.svg',
    './assets/icons/smiley_dead.svg',
    './assets/icons/smiley_won.svg',
    './assets/icons/smiley_worried.svg',
    './assets/icons/arrow_side.svg',
    './assets/icons/t0.svg',
    './assets/icons/t1.svg',
    './assets/icons/t2.svg',
    './assets/icons/t3.svg',
    './assets/icons/t4.svg',
    './assets/icons/t5.svg',
    './assets/icons/t6.svg',
    './assets/icons/t7.svg',
    './assets/icons/t8.svg',
    './assets/icons/t9.svg',
    './assets/icons/tm.svg'
];

// Install event initializes the cache layer.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate event flushes stale caches from older builds.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// Fetch event intercepts requests to serve local copies if available.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Update the cache with newly fetched dynamic resources if needed.
                    // This allows the PWA to remain functional for future offline usage.
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });
            });
        }).catch(() => {
            // Optional offline fallback for high-level layouts can be added here.
        })
    );
});
