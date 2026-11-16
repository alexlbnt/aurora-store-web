// Service worker do app instalável do painel (escopo /admin).
//
// O que ele faz:
// - Guarda a página "sem conexão" e a mostra quando uma página do painel não carrega offline.
// - Guarda os arquivos estáticos do Next (/_next/static, com hash no nome) e os ícones,
//   para o app abrir mais rápido em internet fraca.
//
// - Mostra o aviso de pedido novo do site (push) e, ao tocar, abre o pedido no painel.
//
// O que ele NÃO faz, de propósito:
// - Não guarda páginas nem dados do painel (pedidos, clientes): seriam dados desatualizados
//   e ficariam no aparelho. Também não intercepta envios (POST): vendas não ficam na fila offline.

const VERSION = "aurora-admin-v2";
const OFFLINE_URL = "/offline-admin.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Abrir uma página do painel: sempre da rede; sem rede, a página "sem conexão".
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Arquivos estáticos com hash no nome nunca mudam: cache primeiro.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});

// Aviso de pedido novo do site (enviado pelo servidor com web-push).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Aurora", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Pedido novo no site";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || undefined,
      renotify: !!data.tag,
      data: { url: data.url || "/admin/sales" },
    })
  );
});

// Tocar no aviso: foca o painel se já estiver aberto, senão abre o pedido.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/admin/sales", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => w.url.startsWith(self.location.origin + "/admin"));
      if (open) {
        return open.focus().then((w) => (w && "navigate" in w ? w.navigate(target) : undefined));
      }
      return self.clients.openWindow(target);
    })
  );
});
