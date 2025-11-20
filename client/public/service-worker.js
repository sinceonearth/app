const CACHE_VERSION = 'v4';
const STATIC_CACHE = `sinceonearth-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `sinceonearth-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `sinceonearth-images-${CACHE_VERSION}`;
const API_CACHE = `sinceonearth-api-${CACHE_VERSION}`;
const ASSETS_CACHE = `sinceonearth-assets-${CACHE_VERSION}`;

const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/face-alien-192x192.png',
  '/icons/face-alien-512x512.png'
];

// Cache images separately with different strategy
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.ico'];
const FONT_EXTENSIONS = ['.woff', '.woff2', '.ttf', '.otf'];
const ASSET_EXTENSIONS = ['.js', '.css', '.json'];

// API endpoints to cache for offline access
const CACHEABLE_API_PATTERNS = [
  '/api/flights',
  '/api/stayins',
  '/api/auth/user',
  '/api/radr/groups'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_FILES).catch((err) => {
          console.warn('[SW] Failed to cache some static files:', err);
          // Don't fail installation if some files can't be cached
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
      })
      .catch((err) => {
        console.error('[SW] Error during installation:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker and cleaning old caches...');
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE, ASSETS_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      )
    )
  );
  self.clients.claim();
});

// Helper function to check if URL matches cacheable patterns
function isCacheableAPI(url) {
  return CACHEABLE_API_PATTERNS.some(pattern => url.pathname.includes(pattern));
}

// Helper function to check file extension
function hasExtension(url, extensions) {
  return extensions.some(ext => url.pathname.toLowerCase().endsWith(ext));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Allow caching for Google Fonts and other CDN resources
  const isCDNFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  
  // Skip cross-origin requests (except fonts/images from CDNs)
  if (url.origin !== location.origin && !isCDNFont && !hasExtension(url, [...IMAGE_EXTENSIONS, ...FONT_EXTENSIONS])) {
    return;
  }

  // STRATEGY 1: API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful GET responses for specific endpoints
          if (response.status === 200 && isCacheableAPI(url)) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: return cached API response
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[SW] Serving cached API:', url.pathname);
              return cached;
            }
            // Return offline indicator for non-cached API calls
            return new Response(
              JSON.stringify({ offline: true, error: 'No internet connection' }),
              { 
                status: 503, 
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // STRATEGY 2: Images - Cache first, then network
  if (hasExtension(url, IMAGE_EXTENSIONS)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Return placeholder for failed image loads
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // STRATEGY 3: Fonts - Cache first (fonts don't change)
  if (hasExtension(url, FONT_EXTENSIONS) || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        }).catch(() => {
          // If font fails to load offline, just continue without it
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }
  
  // STRATEGY 3.5: Google Fonts CSS - Cache for offline
  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        }).catch(() => {
          // Fallback: return cached or empty CSS
          return caches.match(request).then(c => c || new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } }));
        });
      })
    );
    return;
  }

  // STRATEGY 4: Vite assets (/assets/*.js, /assets/*.css) - Cache first with long-term storage
  if (url.pathname.startsWith('/assets/') && hasExtension(url, ASSET_EXTENSIONS)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          console.log('[SW] Serving cached asset:', url.pathname);
          return cached;
        }

        return fetch(request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(ASSETS_CACHE).then((cache) => {
              console.log('[SW] Caching Vite asset:', url.pathname);
              cache.put(request, clone);
            });
          }
          return response;
        }).catch((error) => {
          console.error('[SW] Failed to fetch asset:', url.pathname, error);
          // Return cached version or fail
          return caches.match(request);
        });
      })
    );
    return;
  }

  // STRATEGY 5: Static assets (HTML, other files) - Cache first, update in background
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch((error) => {
          console.warn('[SW] Fetch failed for:', url.pathname, error);
          // If it's a page navigation and we're offline, serve index.html
          if (request.destination === 'document') {
            return caches.match('/index.html').then((indexPage) => {
              if (indexPage) return indexPage;
              // Absolute fallback: return basic offline page
              return new Response('<html><body><h1>Offline</h1><p>Please connect to the internet.</p></body></html>', {
                headers: { 'Content-Type': 'text/html' }
              });
            });
          }
          // Return undefined to let browser handle
          return undefined;
        });

      // Return cached version immediately, update in background
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting...');
    self.skipWaiting();
  }
});
