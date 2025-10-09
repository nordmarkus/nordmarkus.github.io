// Service Worker for GitHub Pages to proxy Seklima HTML to same-origin.
// Controls pages under the same directory by default. [scope docs] [web:102][web:81]
const SEKLIMA_URL = "https://seklima.met.no/minutes/wind_from_direction,wind_speed,max(wind_speed_of_gust%20PT10M)/last_hour/SN36330/nb/"; // [web:2]

// Derive base path from the SW location so it works under repo subpaths.
const BASE = self.registration.scope; // e.g., https://user.github.io/repo/
const LOCAL_PROXY = new URL("./seklima/last-hour", BASE).pathname; // path only

self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === LOCAL_PROXY) {
    event.respondWith((async () => {
      try {
        const r = await fetch(SEKLIMA_URL, { method:"GET", credentials:"omit", cache:"no-cache", redirect:"follow" });
        const body = await r.text();
        return new Response(body, {
          status: r.status,
          statusText: r.statusText,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (e) {
        return new Response("Proxy error: " + String(e), { status: 502, headers: { "Content-Type": "text/plain" } });
      }
    })());
  }
});
