const CACHE_STATIC = "catraca-static-v6";
const SHELL_ASSETS = [
  "/manifest.webmanifest",
  "/icon-192x192.jpeg",
  "/icon-512x512-.jpeg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_STATIC)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Nunca fazer cache de dados operacionais, rotas de API ou chamadas Supabase.
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.in")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache apenas de ícones e manifesto (nunca chunks JS/CSS do _next/static em dev).
  if (
    url.pathname === "/icon-192x192.jpeg" ||
    url.pathname === "/icon-512x512-.jpeg" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navegações e demais requisições seguem sempre pela rede para preservar sessão e dados reais.
  event.respondWith(fetch(request));
});
