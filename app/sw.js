// Service Worker for GitHub Pages to proxy Seklima HTML to same-origin. [web:81]
// Exact Seklima URL for last hour: direction, wind, and 10‑minute max gust for SN36330. [web:2]
const SEKLIMA_URL = "https://seklima.met.no/minutes/wind_from_direction,wind_speed,max(wind_speed_of_gust%20PT10M)/last_hour/SN36330/nb/"; // [web:2]

// Compute the path for the local proxy relative to the SW scope (e.g., https://user.github.io/app/). [web:102]
const SCOPE = self.registration.scope; // full URL to scope root (ends with "/") [web:102]
const LOCAL_PROXY_PATH = new URL("./seklima/last-hour", SCOPE).pathname; // e.g., /app/seklima/last-hour [web:102]

self.addEventListener("install", (event) => {
  self.skipWaiting(); // activate immediately on first load [web:110]
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim()); // control open clients [web:110]
});

// Robust proxy with retries and explicit Accept header to avoid flaky upstream fetches. [web:81][web:21]
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === LOCAL_PROXY_PATH) {
    event.respondWith((async () => {
      const tryOnce = async (mode) => {
        return await fetch(SEKLIMA_URL, {
          method: "GET",
          credentials: "omit",
          cache: mode === "reload" ? "reload" : "no-store",
          redirect: "follow",
          headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          }
        });
      };
      try {
        let r = await tryOnce("no-store");
        if (!r.ok) {
          await new Promise(res => setTimeout(res, 400));
          r = await tryOnce("reload");
        }
        if (!r.ok) {
          return new Response("Upstream error " + r.status + " " + r.statusText, { status: 502, headers: { "Content-Type": "text/plain" } });
        }
        const body = await r.text();
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (e) {
        // One extra retry on network error
        try {
          await new Promise(res => setTimeout(res, 400));
          const r2 = await tryOnce("reload");
          if (!r2.ok) {
            return new Response("Upstream error " + r2.status + " " + r2.statusText, { status: 502, headers: { "Content-Type": "text/plain" } });
          }
          const body2 = await r2.text();
          return new Response(body2, {
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
    })());
  }
});
