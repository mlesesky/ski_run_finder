/* global window */
(function () {
  'use strict';

  const SPEEDS_MPS = {
    run: 12.0,
    lift: 5.0,
    walk: 1.2
  };

  function toRad(value) {
    return value * Math.PI / 180;
  }

  function haversineMeters(a, b) {
    const r = 6371000;
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * r * Math.asin(Math.sqrt(h));
  }

  function lineDistanceMeters(coords) {
    if (!coords || coords.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      total += haversineMeters(coords[i - 1], coords[i]);
    }
    return total;
  }

  function difficultyPenalty(difficulty) {
    const key = String(difficulty || '').toLowerCase();
    if (key === 'green') return 0;
    if (key === 'blue') return 3;
    if (key === 'black') return 6;
    if (key === 'double_black') return 9;
    return 2;
  }

  function computeEdgeMetrics(edge, nodes) {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    const coords = edge.geometry && edge.geometry.length ? edge.geometry : [
      [from.lon, from.lat, from.elev_m],
      [to.lon, to.lat, to.elev_m]
    ];
    const distance = edge.distance_m || lineDistanceMeters(coords);
    const verticalDrop = Math.max(0, (from.elev_m || 0) - (to.elev_m || 0));
    const verticalGain = Math.max(0, (to.elev_m || 0) - (from.elev_m || 0));
    const speed = SPEEDS_MPS[edge.type] || 5.0;
    const timeMin = edge.time_min || (distance / speed / 60);
    return Object.assign({}, edge, {
      geometry: coords,
      distance_m: distance,
      vertical_drop_m: verticalDrop,
      vertical_gain_m: verticalGain,
      time_min: timeMin
    });
  }

  function computeStats(edges) {
    let maxRunDrop = 1;
    let maxRunDistance = 1;
    for (const edge of edges) {
      if (edge.type !== 'run') continue;
      if (edge.vertical_drop_m > maxRunDrop) maxRunDrop = edge.vertical_drop_m;
      if (edge.distance_m > maxRunDistance) maxRunDistance = edge.distance_m;
    }
    return { maxRunDrop, maxRunDistance };
  }

  function edgeCost(edge, preference, stats) {
    const time = edge.time_min || 0;
    if (preference === 'minimize_lifts') {
      return time + (edge.type === 'lift' ? 20 : 0);
    }
    if (preference === 'minimize_difficulty') {
      return time + difficultyPenalty(edge.difficulty) * 5;
    }
    if (preference === 'maximize_vertical') {
      const maxDrop = stats.maxRunDrop || 1;
      const penalty = edge.type === 'run' ? (maxDrop - edge.vertical_drop_m) * 0.02 : 0;
      return time + penalty;
    }
    if (preference === 'scenic') {
      const maxDist = stats.maxRunDistance || 1;
      const penalty = edge.type === 'run' ? (maxDist - edge.distance_m) * 0.001 : 0;
      return time + penalty;
    }
    return time;
  }

  function buildGraph(data) {
    const nodes = new Map();
    for (const node of data.nodes || []) {
      nodes.set(node.id, node);
    }
    const edges = (data.edges || []).map(edge => computeEdgeMetrics(edge, nodes));
    const adjacency = new Map();
    for (const edge of edges) {
      if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
      adjacency.get(edge.from).push(edge);
    }
    return { nodes, edges, adjacency, stats: computeStats(edges) };
  }

  function findRoute(graph, startId, endId, preference) {
    const dist = new Map();
    const prevEdge = new Map();
    const visited = new Set();
    const nodes = Array.from(graph.nodes.keys());

    for (const id of nodes) dist.set(id, Infinity);
    dist.set(startId, 0);

    while (visited.size < nodes.length) {
      let current = null;
      let currentDist = Infinity;
      for (const id of nodes) {
        if (visited.has(id)) continue;
        const d = dist.get(id);
        if (d < currentDist) {
          current = id;
          currentDist = d;
        }
      }
      if (current === null) break;
      if (current === endId) break;
      visited.add(current);
      const edges = graph.adjacency.get(current) || [];
      for (const edge of edges) {
        const cost = edgeCost(edge, preference, graph.stats);
        const alt = dist.get(current) + cost;
        if (alt < dist.get(edge.to)) {
          dist.set(edge.to, alt);
          prevEdge.set(edge.to, edge);
        }
      }
    }

    if (!prevEdge.has(endId)) return null;

    const routeEdges = [];
    let cursor = endId;
    while (cursor !== startId) {
      const edge = prevEdge.get(cursor);
      if (!edge) break;
      routeEdges.unshift(edge);
      cursor = edge.from;
    }
    return routeEdges;
  }

  function summarizeRoute(routeEdges) {
    let totalTimeMin = 0;
    let totalDistance = 0;
    let totalDrop = 0;
    let liftCount = 0;
    for (const edge of routeEdges) {
      totalTimeMin += edge.time_min || 0;
      totalDistance += edge.distance_m || 0;
      if (edge.type === 'run') totalDrop += edge.vertical_drop_m || 0;
      if (edge.type === 'lift') liftCount += 1;
    }
    return {
      total_time_min: totalTimeMin,
      total_distance_m: totalDistance,
      total_vertical_drop_m: totalDrop,
      lifts: liftCount
    };
  }

  function routeToGeoJSON(routeEdges) {
    const features = routeEdges.map(edge => {
      const coords = edge.geometry.map(c => [c[0], c[1]]);
      return {
        type: 'Feature',
        properties: {
          name: edge.name,
          type: edge.type,
          difficulty: edge.difficulty || '',
          time_min: Number(edge.time_min.toFixed(2)),
          distance_m: Math.round(edge.distance_m),
          vertical_drop_m: Math.round(edge.vertical_drop_m)
        },
        geometry: {
          type: 'LineString',
          coordinates: coords
        }
      };
    });
    return { type: 'FeatureCollection', features };
  }

  function formatStep(edge) {
    const distance = Math.round(edge.distance_m);
    const time = edge.time_min.toFixed(1);
    const drop = Math.round(edge.vertical_drop_m);
    const diff = edge.difficulty ? ` (${edge.difficulty})` : '';
    return `${edge.type.toUpperCase()}: ${edge.name}${diff} - ${distance} m, ${drop} m drop, ${time} min`;
  }

  window.Planner = {
    buildGraph,
    findRoute,
    summarizeRoute,
    routeToGeoJSON,
    formatStep
  };
})();
