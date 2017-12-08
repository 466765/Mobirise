// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var dataCacheName = 'offthefence1';
var cacheName = 'offthefence1';
var filesToCache = [
  '/Mobirise/assets/bootstrap/css/bootstrap-grid.min.css',
'/Mobirise/assets/bootstrap/css/bootstrap-reboot.min.css',
'/Mobirise/assets/bootstrap/css/bootstrap.min.css',
'/Mobirise/assets/bootstrap/js/bootstrap.min.js',
'/Mobirise/assets/dropdown/css/style.css',
'/Mobirise/assets/dropdown/js/script.min.js',
'/Mobirise/assets/images/hashes.json',
'/Mobirise/assets/images/jumbotron.jpg',
'/Mobirise/assets/images/logo-circle-341x341.png',
'/Mobirise/assets/images/logo-circle-403x403.png',
'/Mobirise/assets/jarallax/jarallax.min.js',
'/Mobirise/assets/mobirise/css/mbr-additional.css',
'/Mobirise/assets/popper/popper.min.js',
'/Mobirise/assets/smooth-scroll/smooth-scroll.js',
'/Mobirise/assets/socicon/css/styles.css',
'/Mobirise/assets/socicon/fonts/socicon.eot',
'/Mobirise/assets/socicon/fonts/socicon.svg',
'/Mobirise/assets/socicon/fonts/socicon.ttf',
'/Mobirise/assets/socicon/fonts/socicon.woff',
'/Mobirise/assets/tether/tether.min.css',
'/Mobirise/assets/tether/tether.min.js',
'/Mobirise/assets/theme/css/style.css',
'/Mobirise/assets/theme/js/script.js',
'/Mobirise/assets/touch-swipe/jquery.touch-swipe.min.js',
'/Mobirise/assets/web/assets/jquery/jquery.min.js',
'/Mobirise/assets/web/assets/mobirise-icons/mobirise-icons.css',
'/Mobirise/assets/web/assets/mobirise-icons/mobirise-icons.eot',
'/Mobirise/assets/web/assets/mobirise-icons/mobirise-icons.svg',
'/Mobirise/assets/web/assets/mobirise-icons/mobirise-icons.ttf',
'/Mobirise/assets/web/assets/mobirise-icons/mobirise-icons.woff',
'/Mobirise/example/favicon.ico',
'/Mobirise/example/icons/icon-128x128.png',
'/Mobirise/example/icons/icon-144x144.png',
'/Mobirise/example/icons/icon-152x152.png',
'/Mobirise/example/icons/icon-192x192.png',
'/Mobirise/example/icons/icon-256x256.png',
'/Mobirise/example/icons/icon-32x32.png',
'/Mobirise/example/index.html',
'/Mobirise/example/manifest.json',
'/Mobirise/example/scripts/app.js',
'/Mobirise/example/service-worker.js',
'/Mobirise/example/styles/inline.css',
'/Mobirise/filename.txt',
'/Mobirise/index.html',
'/Mobirise/logo-circle.jpg',
'/Mobirise/logo-circle.png',
'/Mobirise/manifest.json',
'/Mobirise/project.mobirise',
'/Mobirise/scripts/app.js',
'/Mobirise/service-worker.js'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  /*
   * Fixes a corner case in which the app wasn't returning the latest data.
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps: 1) load app for first time so that the
   * initial New York City data is shown 2) press the refresh button on the
   * app 3) go offline 4) reload the app. You expect to see the newer NYC
   * data, but you actually see the initial data. This happens because the
   * service worker is not yet activated. The code below essentially lets
   * you activate the service worker faster.
   */
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[Service Worker] Fetch', e.request.url);
  var dataUrl = 'https://query.yahooapis.com/v1/public/yql';
  if (e.request.url.indexOf(dataUrl) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});
