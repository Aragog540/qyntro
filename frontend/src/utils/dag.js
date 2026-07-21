// utils/dag.js — cycle detection for edge highlighting
export function findCycleEdgeIds(nodes, edges) {
  const nodeIds = new Set(nodes.map(n => n.id));
  const adj = new Map(nodes.map(n => [n.id, []]));
  edges.forEach(e => {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
      adj.get(e.source).push({ target: e.target, edgeId: e.id });
    }
  });

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map(nodes.map(n => [n.id, WHITE]));
  const cycleEdges = new Set();

  function visit(u) {
    color.set(u, GRAY);
    for (const { target: v, edgeId } of adj.get(u)) {
      if (color.get(v) === GRAY) { cycleEdges.add(edgeId); return; }
      if (color.get(v) === WHITE) visit(v);
    }
    color.set(u, BLACK);
  }

  nodes.forEach(n => { if (color.get(n.id) === WHITE) visit(n.id); });
  return cycleEdges;
}
