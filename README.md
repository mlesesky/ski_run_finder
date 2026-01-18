# Whistler Run Flyover POC

This is a minimal proof-of-concept that loads a `run.geojson` LineString and performs a simple camera flyover using CesiumJS.

How to try it locally

1. Replace `run.geojson` with a GeoJSON LineString for the desired run (export from Overpass Turbo / OSM).
2. Serve the folder with a static server (the browser blocks `fetch` for local files):

```bash
# with Python 3
python -m http.server 8000

# or with Node (install http-server globally or use npx)
npx http-server -p 8080
```

3. Open `http://localhost:8000` and press "Start Flyover".

Notes
- The POC uses Cesium via CDN and does not use Cesium Ion terrain — for a better flyover add terrain (requires an Ion access token) or supply elevation samples.
- To get a GeoJSON for Harmony Ridge from OpenStreetMap, use Overpass Turbo and export GeoJSON (search for features named "Harmony Ridge" under the Whistler Blackcomb area).
