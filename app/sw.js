// Service Worker for GitHub Pages to proxy Seklima HTML to same-origin. [docs]
const SEKLIMA_URL = "https://seklima.met.no/minutes/wind_from_direction,wind_speed,max(wind_speed_of_gust%20PT10M)/last_hour/SN36330/nb/";

const SCOPE = self.registration.scope; // e.g., https://nordmarkus.github.io/app/
const LOCAL_PROXY_PATH = new URL("./seklima/last-hour", SCOPE).pathname; // e.g., /app/seklima/last-hour

self.addEventListener("install", (event) => { self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });

async function fetchHtmlWithFallback(url) {
  // First try normal CORS fetch with Accept header
  const tryOnce = (cacheMode) => fetch(url, {
    method: "GET",
    credentials: "omit",
    cache: cacheMode,
    redirect: "follow",
    headers: { "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }
  });

  try {
    let r = await tryOnce("no-store");
    if (!r.ok) {
      await new Promise(res => setTimeout(res, 400));
      r = await tryOnce("reload");
    }
    if (r.ok) {
      return new Response(await r.text(), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  } catch (e) {
    // continue to no-cors fallback
  }

  // Fallback: no-cors to obtain an opaque response; pass it through to the client.
  try {
    const r2 = await fetch(url, { method: "GET", mode: "no-cors", credentials: "omit", cache: "reload", redirect: "follow" });
    // Opaque response cannot be inspected; return as-is with 200 and generic HTML type
    return new Response(r2.body, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e2) {
    return new Response("Proxy error: " + String(e2), { status: 502, headers: { "Content-Type": "text/plain" } });
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === LOCAL_PROXY_PATH) {
    event.respondWith(fetchHtmlWithFallback(SEKLIMA_URL));
  }
});
