# Ski Run Flyover POC

This is a proof-of-concept that loads ski run GeoJSON data and performs a camera flyover using CesiumJS.

How to try it locally

1. Serve the folder with a static server (the browser blocks `fetch` for local files):

```bash
# with Python 3
python -m http.server 8000

# or with Node (install http-server globally or use npx)
npx http-server -p 8080
```

2. Open `http://localhost:8000` and press "Start Flyover".

Data layout

- `resorts.json` lists resorts and points to their data files.
- Each resort has:
  - `data/<resort_id>/runs.geojson` (LineString features for runs)
  - `data/<resort_id>/lifts.geojson` (optional LineString features for lifts)

Adding a resort

1. Create a new folder under `data/<resort_id>`.
2. Add `runs.geojson` and (optionally) `lifts.geojson`.
3. Add an entry to `resorts.json` with `id`, `name`, and paths to the files.

Notes
- The POC uses Cesium via CDN. Terrain and 3D buildings require a Cesium Ion access token.
- Run difficulty colors are based on the `difficulty` or `piste:difficulty` property in the runs GeoJSON.
