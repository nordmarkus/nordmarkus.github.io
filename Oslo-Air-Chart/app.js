/* Oslo chart: EPSG:3034 (ETRS89 / LCC Europe), source 11654 x 15904 pixels. */
const image = new Image();
image.src = 'assets/oslo-chart.jpg';
const chart = document.querySelector('#chart');
const context = chart.getContext('2d');
const status = document.querySelector('#status');
const button = document.querySelector('#locate');
const notice = document.querySelector('#notice');
const original = { width: 11654, height: 15904, west: 3964647.341, north: 3789360.849, xMetres: 15.8743778960014, yMetres: 15.876509054326 };
let view = { scale: 1, x: 0, y: 0 }, fix = null, heading = null, following = false, pointers = new Map(), gesture = null;

function resize() { const dpr = devicePixelRatio || 1; chart.width = innerWidth * dpr; chart.height = innerHeight * dpr; context.setTransform(dpr, 0, 0, dpr, 0, 0); if (!view.ready) fitChart(); draw(); }
function fitChart() { view.scale = Math.min(innerWidth / image.width, innerHeight / image.height); view.x = (innerWidth - image.width * view.scale) / 2; view.y = (innerHeight - image.height * view.scale) / 2; view.ready = true; }
function lonLatToProjected(lat, lon) {
  const rad = Math.PI / 180, a = 6378137, e = Math.sqrt(0.00669438002290), p1 = 35 * rad, p2 = 65 * rad, p0 = 52 * rad, l0 = 10 * rad;
  const m = p => Math.cos(p) / Math.sqrt(1 - e * e * Math.sin(p) ** 2);
  const t = p => Math.tan(Math.PI / 4 - p / 2) / Math.pow((1 - e * Math.sin(p)) / (1 + e * Math.sin(p)), e / 2);
  const n = Math.log(m(p1) / m(p2)) / Math.log(t(p1) / t(p2)), F = m(p1) / (n * t(p1) ** n);
  const rho = a * F * t(lat * rad) ** n, rho0 = a * F * t(p0) ** n;
  return { x: rho * Math.sin(n * (lon * rad - l0)) + 4000000, y: rho0 - rho * Math.cos(n * (lon * rad - l0)) + 2800000 };
}
function chartPoint(lat, lon) { const p = lonLatToProjected(lat, lon); return { x: (p.x - original.west) / original.xMetres * .5, y: (original.north - p.y) / original.yMetres * .5 }; }
function screenPoint(p) { return { x: view.x + p.x * view.scale, y: view.y + p.y * view.scale }; }
function drawPlane(x, y, angle) { context.save(); context.translate(x, y); context.rotate((angle || 0) * Math.PI / 180); context.beginPath(); context.moveTo(0, -20); context.lineTo(10, 15); context.lineTo(0, 10); context.lineTo(-10, 15); context.closePath(); context.fillStyle = '#e53935'; context.strokeStyle = '#fff'; context.lineWidth = 3; context.fill(); context.stroke(); context.restore(); }
function draw() { context.clearRect(0, 0, innerWidth, innerHeight); if (!image.complete) return; context.drawImage(image, view.x, view.y, image.width * view.scale, image.height * view.scale); if (fix) { const p = chartPoint(fix.coords.latitude, fix.coords.longitude), s = screenPoint(p); drawPlane(s.x, s.y, Number.isFinite(fix.coords.heading) && fix.coords.heading >= 0 ? fix.coords.heading : heading); } }
function follow() { if (!fix) return; const p = screenPoint(chartPoint(fix.coords.latitude, fix.coords.longitude)); view.x += innerWidth / 2 - p.x; view.y += innerHeight / 2 - p.y; draw(); }
function show(message) { notice.textContent = message; notice.hidden = false; setTimeout(() => notice.hidden = true, 5500); }
function positionOK(p) { fix = p; const course = p.coords.heading; status.textContent = `GPS ±${Math.round(p.coords.accuracy)} m${course >= 0 ? ` · ${Math.round(course)}°` : ''}`; if (following) follow(); else draw(); }
function positionFail(e) { status.textContent = 'Location unavailable'; show(e.message || 'Allow location access, then try again.'); }
function start() { following = true; button.textContent = 'Following'; status.textContent = 'Finding GPS…'; navigator.geolocation.watchPosition(positionOK, positionFail, { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }); if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then(r => { if (r !== 'granted') show('Compass access was not granted; GPS track will still point the aircraft while moving.'); }).catch(() => {}); }
button.addEventListener('click', start);
addEventListener('deviceorientation', e => { if (Number.isFinite(e.webkitCompassHeading)) { heading = e.webkitCompassHeading; draw(); } });
chart.addEventListener('pointerdown', e => { chart.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); following = false; button.textContent = 'Locate'; });
chart.addEventListener('pointermove', e => { if (!pointers.has(e.pointerId)) return; const before = pointers.get(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); const pts = [...pointers.values()]; if (pts.length === 1) { view.x += e.clientX - before.x; view.y += e.clientY - before.y; } else { const dx = pts[1].x - pts[0].x, dy = pts[1].y - pts[0].y, distance = Math.hypot(dx, dy), centre = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }; if (gesture) { const factor = distance / gesture.distance; view.x = centre.x - (gesture.centre.x - gesture.x) * factor; view.y = centre.y - (gesture.centre.y - gesture.y) * factor; view.scale = Math.max(.03, Math.min(8, gesture.scale * factor)); } else gesture = { distance, centre, x: view.x, y: view.y, scale: view.scale }; } draw(); });
function endPointer(e) { pointers.delete(e.pointerId); gesture = null; } chart.addEventListener('pointerup', endPointer); chart.addEventListener('pointercancel', endPointer);
image.onload = () => { fitChart(); draw(); }; addEventListener('resize', resize); resize(); if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
