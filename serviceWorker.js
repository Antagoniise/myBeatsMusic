const siteCache = 'myCACHE';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  // Add other URLs to cache here
];

// Install service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(siteCache)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate service worker and remove old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [siteCache];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch resources from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname === '/share') {
    event.respondWith(handleShareTarget(event.request));
  } else if (url.pathname === '/open-file') {
    event.respondWith(handleFileOpen(event.request));
  } else if (url.pathname === '/open-protocol') {
    event.respondWith(handleProtocol(url.searchParams.get('url')));
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(
            response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(siteCache)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            }
          );
        })
    );
  }
});

async function handleShareTarget(request) {
  const formData = await request.formData();
  const title = formData.get('name');
  const text = formData.get('description');
  const url = formData.get('link');
  const files = formData.getAll('file');

  // Process the shared content here (e.g., save to IndexedDB, display in the app, etc.)

  return Response.redirect('/', 303);
}

async function handleFileOpen(request) {
  const formData = await request.formData();
  const files = formData.getAll('file');

  // Send the file to the main application through a message
  if (files.length > 0) {
    const file = files[0];
    const clientList = await clients.matchAll();
    for (const client of clientList) {
      client.postMessage({
        type: 'OPEN_FILE',
        file: await file.arrayBuffer(),
        fileName: file.name
      });
    }
  }

  return Response.redirect('/', 303);
}

async function handleProtocol(url) {
  // Process the protocol URL here (e.g., navigate to the URL, display content, etc.)

  return Response.redirect('/', 303);
}
