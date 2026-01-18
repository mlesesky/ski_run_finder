"""
Apply elevation-based Top/Bottom node renames to the planner graph.

Usage:
  python scripts/apply_elevations.py

Requires:
  - planner/data/whistler_blackcomb/graph.json
  - elevations (1).csv (or set ELEVATIONS_CSV env var to the CSV path)

Behavior:
  - Loads elevations CSV (columns: id, name, lat, lon, elev_m).
  - For each run/lift edge, compares endpoint heights.
  - Renames higher endpoint to "<edge name> Top", lower to "<edge name> Bottom"
    if the node name is "junction" or already contains the edge name.
  - Writes a backup: planner/data/whistler_blackcomb/graph.backup.json (if absent).
  - Writes updated graph.json.
"""

import csv
import json
import os
from pathlib import Path
from collections import defaultdict


ROOT = Path(__file__).resolve().parents[1]
GRAPH_PATH = ROOT / "planner" / "data" / "whistler_blackcomb" / "graph.json"
BACKUP_PATH = GRAPH_PATH.with_suffix(".backup.json")
CSV_DEFAULT = ROOT / "elevations (1).csv"


def load_elevations(csv_path: Path) -> dict:
    rows = []
    raw = csv_path.read_text()
    # Handle files that contain literal "\n" sequences instead of real newlines.
    if "\\n" in raw and "\n" not in raw.replace("\\n", ""):
        raw = raw.replace("\\n", "\n")
    lines = raw.splitlines()
    reader = csv.DictReader(lines)
    for r in reader:
        rows.append(r)
    if not rows:
        raise RuntimeError("Elevations CSV is empty.")
    print(f"Loaded {len(rows)} elevation rows from {csv_path}")
    return {str(r["id"]): float(r.get("elev_m", 0) or 0) for r in rows}


def main():
    csv_path = Path(os.environ.get("ELEVATIONS_CSV", CSV_DEFAULT))
    if not csv_path.exists():
        raise FileNotFoundError(f"Elevations CSV not found: {csv_path}")
    if not GRAPH_PATH.exists():
        raise FileNotFoundError(f"Graph not found: {GRAPH_PATH}")

    height_map = load_elevations(csv_path)
    data = json.loads(GRAPH_PATH.read_text())
    nodes = data["nodes"]
    edges = data["edges"]
    node_map = {n["id"]: n for n in nodes}

    rename_count = 0
    for e in edges:
        if e.get("type") not in ("run", "lift"):
            continue
        name = e.get("name") or "Segment"
        a, b = e["from"], e["to"]
        ha = height_map.get(a, 0)
        hb = height_map.get(b, 0)
        if ha == hb:
            continue
        high = a if ha > hb else b
        low = b if ha > hb else a
        for nid, label in ((high, "Top"), (low, "Bottom")):
            n = node_map.get(nid)
            if not n:
                continue
            old = n.get("name", "")
            if old.lower() == "junction" or name.lower() in old.lower():
                new_name = f"{name} {label}"
                if n["name"] != new_name:
                    n["name"] = new_name
                    rename_count += 1

    print(f"Renamed nodes: {rename_count}")
    if not BACKUP_PATH.exists():
        BACKUP_PATH.write_text(GRAPH_PATH.read_text())
        print(f"Backup written: {BACKUP_PATH}")
    GRAPH_PATH.write_text(json.dumps({"nodes": nodes, "edges": edges}, indent=2))

    in_deg = defaultdict(int)
    out_deg = defaultdict(int)
    for e in edges:
        out_deg[e["from"]] += 1
        in_deg[e["to"]] += 1
    sources = [n["id"] for n in nodes if out_deg[n["id"]] == 0]
    sinks = [n["id"] for n in nodes if in_deg[n["id"]] == 0]
    print(f"Graph stats: sources {len(sources)}, sinks {len(sinks)}")


if __name__ == "__main__":
    main()
