# Version 002 - Run + Lift Planner Spec

Overview

Goal: Let users plan realistic sequences of downhill runs and lift rides at Whistler where every step is physically connected (no teleporting).
Scope for POC: Harmony Ridge + adjacent lifts/runs, route planning (start -> end), visual route with flyover and step list.

Core concepts

Nodes: physical points where users can transfer - lift stations, run junctions, top/bottom endpoints.
Edges: traversable actions - lifts (up), runs (down), short walk connectors (flat/transfer).
Graph model: directed graph where lifts are upward edges and runs are downward edges; routes are valid paths following edge directions.

How connectivity should work (intuitively)

Spatial connection: consider two features connected when endpoints are within a small radius (e.g., 20-50 m).
Elevation rule: runs should generally go downhill; require a minimum vertical drop to be considered a valid run edge.
Station derivation: lift stations may be explicit or inferred from lift endpoints; snap nearby run endpoints to the nearest station.
Merge nearby nodes: cluster nodes within a short radius into a single junction to avoid tiny gaps breaking connectivity.

User flows (simple, prioritized)

Quick plan: user clicks start point and destination (map or named run/station) -> system returns best route (fewest lifts / fastest / easiest).
Guided plan: user selects preferences (avoid blacks, minimize lifts, maximize vertical) -> planner returns best match.
Interactive edit: user sees suggested chain, can remove/replace segments or add constraints (e.g., "no hiking").
Preview: visualize entire route on globe and allow a single flyover of the full route or segment-by-segment flyovers.

Planner behavior and user preferences

Preference modes: minimize time, minimize lifts, minimize difficulty, maximize downhill vertical, scenic (long runs).
Cost composition: combine ride time, ski time, wait/transfer overhead, and difficulty penalties into a single cost for routing.
Fallbacks: if direct connections are missing, offer short "walk" connectors with high cost or suggest nearby alternative stations.

Practical heuristics (non-technical summary)

Tolerance thresholds: choose a sensible snap distance (20-50 m) and vertical threshold to avoid false links.
Conservative defaults: require stronger evidence to add a connection (prefer false-negative over false-positive).
User override: always let users accept a manual connection if automatic matching fails.

Data and sources (what matters)

Run geometry: accurate LineString for each run (OSM/piste or resort-provided).
Lift geometry and stations: endpoints and approximate ride time.
Elevation: DEM or Cesium Ion to confirm downhill direction and compute ski time/visual height.
Metadata: run difficulty, open/closed status, names - useful for filtering and UX.

UI design considerations

Clear transfer points: show where the user must disembark or walk (icons + small popup info).
Segment styling: color runs by difficulty; show lifts as dashed lines.
Step list: short, scannable instructions for each step with metrics (time, distance, vertical).
Controls: preferences panel, speed slider for flyover, ability to export KML tour.

Edge cases and policies

Unmapped stations: infer from lift endpoints; present "unverified" connections to user.
Plateaus / short flat runs: allow gentle uphill segments only if user permits or treat as walk connectors.
Licensing and attribution: always surface OSM/resort attribution and cache results to reduce Overpass load.

UX trade-offs

Strict vs permissive matching: stricter matching improves realism but increases "no route found" cases - provide manual override.
Automatic merges: merging nodes reduces clutter but may hide subtle differences (show cluster details on demand).
Real-time data: adding lift closures and queue times improves realism but increases complexity and data needs.

How to present planner results

Primary map: route polyline with segment colors and icons.
Timeline/steps: numbered steps with run/lift name, time, vertical, difficulty.
Metrics summary: total time, total lifts, total vertical, distance.
Export/Share: KML tour, shareable link, GPX.

Success criteria for a good POC

Returned routes always follow a sequence of connected nodes (no gaps).
Users can choose one preference mode and get plausible/usable routes.
Visuals clearly show transfers and per-segment info; flyover plays the combined route smoothly.
Basic edge cases (small gaps, inferred stations) handled with transparent UI messaging.

Next small steps to hand to CODEX

Produce a small sample graph with 6-10 nodes (2 lifts, 3 runs) and a few valid routes to use as examples.
Implement the simple rule: connect endpoints within 30 m and require end-elevation < start-elevation - 5 m.
Add one planner preference (minimize time) and return route + combined GeoJSON for visualization.
