import json
with open("planner/data/whistler_blackcomb/graph.json") as f:
    data = json.load(f)
errors = []
node_ids = set()
if not isinstance(data, dict):
    errors.append("Graph not object")
if not isinstance(data.get("nodes"), list) or not data["nodes"]:
    errors.append("nodes missing")
if not isinstance(data.get("edges"), list) or not data["edges"]:
    errors.append("edges missing")
for n in data.get("nodes", []):
    if not isinstance(n, dict):
        errors.append("node not dict")
        continue
    if not n.get("id"):
        errors.append("node missing id")
    if not n.get("name"):
        errors.append(f"node {n.get('id','')} missing name")
    if not isinstance(n.get("lat"), (int, float)) or not isinstance(n.get("lon"), (int, float)):
        errors.append(f"node {n.get('id','')} missing lat/lon")
    if not isinstance(n.get("elev_m"), (int, float)):
        errors.append(f"node {n.get('id','')} missing elev_m")
    node_ids.add(n.get("id"))
for e in data.get("edges", []):
    if not isinstance(e, dict):
        errors.append("edge not dict")
        continue
    if not e.get("id"):
        errors.append("edge missing id")
    if not e.get("name"):
        errors.append(f"edge {e.get('id','')} missing name")
    if not e.get("type"):
        errors.append(f"edge {e.get('id','')} missing type")
    if not e.get("from") or e['from'] not in node_ids:
        errors.append(f"edge {e.get('id','')} invalid from")
    if not e.get("to") or e['to'] not in node_ids:
        errors.append(f"edge {e.get('id','')} invalid to")
    geom = e.get("geometry")
    if not isinstance(geom, list) or len(geom) < 2:
        errors.append(f"edge {e.get('id','')} geometry short")
    else:
        for c in geom:
            if not isinstance(c, list) or len(c) < 2:
                errors.append(f"edge {e.get('id','')} bad coord")
                break
print("error count", len(errors))
print(errors[:5])
