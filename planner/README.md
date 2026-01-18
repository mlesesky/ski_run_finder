# Planner POC

This folder contains a small, standalone routing prototype that does not change the main Cesium app.

What is included

- `sample_graph.json`: Small directed graph with nodes and edges (2 lifts, 3 runs, 1 walk).
- `resorts.json`: Planner resorts list with graph paths.
- `data/<resort_id>/graph.json`: Per-resort graph files.
- `planner.js`: Graph builder + Dijkstra routing with preference modes.
- `index.html`: Minimal UI to select start/end and view the route steps.

How to run

1. Start a static server from the repo root:

```bash
python -m http.server 8000
```

2. Open:

`http://localhost:8000/planner/index.html`

Data format

- `nodes`: `{ id, name, type, lat, lon, elev_m }`
- `edges`: `{ id, name, type, from, to, difficulty?, time_min?, geometry }`
- `geometry`: array of `[lon, lat, elev_m]` points.

Notes

- Preference modes are heuristic and use time as the base cost.
- This is the "002" scaffold intended to evolve into the full run+lift planner.
- `planner/index.html` validates graph structure and reports the first validation error in the summary panel.
