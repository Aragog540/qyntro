// utils/executor.js
// Topological sort + pipeline runner — same pattern as Flux.
// DataFrames flow between nodes instead of file blobs.

import { templateByType } from '../nodes/nodeTemplates';

export function topoSort(nodes, edges) {
  const inDegree = new Map(nodes.map(n => [n.id, 0]));
  const adjacency = new Map(nodes.map(n => [n.id, []]));
  for (const e of edges) {
    if (adjacency.has(e.source) && inDegree.has(e.target)) {
      adjacency.get(e.source).push(e);
      inDegree.set(e.target, inDegree.get(e.target) + 1);
    }
  }
  const queue = nodes.filter(n => inDegree.get(n.id) === 0).map(n => n.id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const e of adjacency.get(id)) {
      inDegree.set(e.target, inDegree.get(e.target) - 1);
      if (inDegree.get(e.target) === 0) queue.push(e.target);
    }
  }
  if (order.length !== nodes.length) {
    throw new Error('Pipeline has a cycle — fix the amber edges before running.');
  }
  return order;
}

export async function runPipeline(nodes, edges, { onNodeUpdate, onPreviewReady, onChartReady, onProfileReady } = {}) {

  const order = topoSort(nodes, edges);
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  // outputByNodeId stores the DataFrame output of each node
  const outputByNodeId = new Map();

  for (const nodeId of order) {
    const node = nodeById.get(nodeId);
    const template = templateByType[node.type];
    if (!template) continue;

    // Gather input DataFrames from all incoming edges
    // For Join nodes: collect by targetHandle name (left/right)
    const incomingEdges = edges.filter(e => e.target === nodeId);

    let inputDF;
    if (template.multiInput) {
      // Join node: pass { left: df, right: df }
      const byHandle = {};
      incomingEdges.forEach(e => {
        const df = outputByNodeId.get(e.source);
        if (df) byHandle[e.targetHandle || 'left'] = df;
      });
      inputDF = byHandle;
    } else {
      // Regular node: concatenate all incoming rows (usually just 1 edge)
      const dfs = incomingEdges.map(e => outputByNodeId.get(e.source)).filter(Boolean);
      if (dfs.length === 0) {
        inputDF = null;
      } else if (dfs.length === 1) {
        inputDF = dfs[0];
      } else {
        // Merge multiple DataFrames row-wise (for Output / Preview with multi-input)
        const allCols = [...new Set(dfs.flatMap(d => d.columns))];
        const allRows = dfs.flatMap(d => d.rows);
        inputDF = { rows: allRows, columns: allCols, meta: { rowCount: allRows.length } };
      }
    }

    if (!template.run) {
      outputByNodeId.set(nodeId, inputDF);
      onNodeUpdate?.(nodeId, { status: 'skipped' });
      continue;
    }

    onNodeUpdate?.(nodeId, { status: 'running' });
    try {
      const result = await template.run(inputDF, node.data);
      outputByNodeId.set(nodeId, result);

      // Preview node callback — lets the store store the preview DataFrame
      if (template.type === 'preview' && result) {
        onPreviewReady?.(nodeId, result);
      }

      // Chart node callback
      if (template.type === 'chart' && result) {
        onChartReady?.(nodeId, result);
      }

      // Profiler node callback -- profile the input df
      if (template.type === 'profiler' && inputDF) {
        const { profileDF } = await import('../utils/dataOps.js');
        onProfileReady?.(nodeId, profileDF(inputDF));
      }

      const rowCount = result?.rows?.length ?? 0;
      onNodeUpdate?.(nodeId, { status: 'done', rowCount });
    } catch (err) {
      onNodeUpdate?.(nodeId, { status: 'error', error: err.message || String(err) });
      throw err;
    }
  }

  return outputByNodeId;
}

