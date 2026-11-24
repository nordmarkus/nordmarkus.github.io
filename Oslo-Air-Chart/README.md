# Oslo Air Chart

This is a personal, offline-capable moving-map web app built from `M517-AIR_Sheet04-Oslo_2611.tif`.

## Put it on your iPad mini

1. Publish this entire folder to a free HTTPS static host (GitHub Pages is a simple option).
2. Open the resulting address in **Safari on the iPad**, while online.
3. Wait for the chart to appear once; this also saves it for offline use.
4. Safari: **Share → Add to Home Screen → Add**.
5. Open the new icon, press **Locate**, and allow Location and Motion & Orientation access.

The red aircraft symbol follows the iPad’s GPS location and points only by its GPS-derived track while moving. The compact panel shows GPS track, speed in knots, altitude in feet, and GPS accuracy. A red breadcrumb marks the recent track; **Clear trail** resets it. Pinch to zoom and drag to pan; tap Locate to re-centre.

## Notes

- This first version is deliberately minimal: one chart, no flight planning, no terrain/airspace alerting, no recording, and no aviation-navigation approval.
- Test the location alignment on the ground before relying on it in flight. Carry an approved primary navigation source and current official charts.
- The included `assets/oslo-chart.jpg` is a display copy made from the source GeoTIFF. The original georeference was retained in the app logic (ETRS89 / LCC Europe, EPSG:3034).
