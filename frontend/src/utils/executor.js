// utils/executor.js
// Pipeline execution driver supporting Python FastAPI Backend (Pandas/Polars)
// with seamless in-browser JavaScript fallback.

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
  // Attempt Python FastAPI Backend execution for low-latency vectorized processing
  try {
    const payloadNodes = nodes.map(n => ({
      id: n.id,
      type: n.type,
      data: n.data || {}
    }));

    const payloadEdges = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null
    }));

    const baseUrl = import.meta.env.VITE_API_URL !== undefined
      ? import.meta.env.VITE_API_URL
      : (import.meta.env.DEV ? 'http://localhost:8000' : '');
    const response = await fetch(`${baseUrl}/pipelines/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: payloadNodes, edges: payloadEdges })
    });

    if (response.ok) {
      const res = await response.json();
      const outputByNodeId = new Map();

      for (const [nodeId, r] of Object.entries(res.nodeResults || {})) {
        if (r.status === 'error') {
          onNodeUpdate?.(nodeId, { status: 'error', error: r.error });
          throw new Error(`Node ${nodeId} error: ${r.error}`);
        }

        onNodeUpdate?.(nodeId, { status: r.status, rowCount: r.rowCount, executionTimeMs: r.executionTimeMs });

        if (r.preview) {
          onPreviewReady?.(nodeId, r.preview);
        }

        if (r.chart) {
          onChartReady?.(nodeId, r.chart);
        }

        if (r.profile) {
          onProfileReady?.(nodeId, r.profile);
        }

        if (r.data) {
          outputByNodeId.set(nodeId, r.data);
        }
      }

      return outputByNodeId;
    }
  } catch (err) {
    // If backend is un-reachable or errors, fallback to client JS runner
    console.warn('Python backend unavailable or failed, falling back to JS execution engine:', err.message);
  }

  // JS Engine Fallback
  return runPipelineJS(nodes, edges, { onNodeUpdate, onPreviewReady, onChartReady, onProfileReady });
}

async function runPipelineJS(nodes, edges, { onNodeUpdate, onPreviewReady, onChartReady, onProfileReady } = {}) {
  const order = topoSort(nodes, edges);
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const outputByNodeId = new Map();

  for (const nodeId of order) {
    const node = nodeById.get(nodeId);
    const template = templateByType[node.type];
    if (!template) continue;

    const incomingEdges = edges.filter(e => e.target === nodeId);

    let inputDF;
    if (template.multiInput) {
      const byHandle = {};
      incomingEdges.forEach(e => {
        const df = outputByNodeId.get(e.source);
        if (df) byHandle[e.targetHandle || 'left'] = df;
      });
      inputDF = byHandle;
    } else {
      const dfs = incomingEdges.map(e => outputByNodeId.get(e.source)).filter(Boolean);
      if (dfs.length === 0) {
        inputDF = null;
      } else if (dfs.length === 1) {
        inputDF = dfs[0];
      } else {
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

      if (template.type === 'preview' && result) {
        onPreviewReady?.(nodeId, result);
      }

      if (template.type === 'chart' && result) {
        onChartReady?.(nodeId, result);
      }

      if (template.type === 'profiler' && inputDF) {
        const { profileDF } = await import('./dataOps.js');
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
