// utils/aiFallback.js — Client-side smart rule-engine fallback for DataFlow AI pipeline generation
export function generateAIPipelineFallback(prompt) {
  const promptLower = prompt.toLowerCase();
  const nodes = [];
  const edges = [];

  // 1. Determine dataset
  let sampleName = 'sales';
  if (promptLower.includes('iris')) {
    sampleName = 'iris';
  } else if (promptLower.includes('titanic')) {
    sampleName = 'titanic';
  }

  nodes.push({
    id: 'node-1',
    type: 'load',
    data: { sourceType: 'sample', sampleName },
    position: { x: 100, y: 200 }
  });

  let currIdx = 2;
  let prevId = 'node-1';

  // 2. Cleaning
  if (promptLower.includes('null') || promptLower.includes('missing') || promptLower.includes('clean') || promptLower.includes('drop')) {
    const nid = `node-${currIdx}`;
    nodes.push({
      id: nid,
      type: 'dropNulls',
      data: { mode: 'any', cols: '' },
      position: { x: 100 + (currIdx - 1) * 260, y: 200 }
    });
    edges.push({ id: `e-${prevId}-${nid}`, source: prevId, target: nid });
    prevId = nid;
    currIdx += 1;
  }

  if (promptLower.includes('dedupe') || promptLower.includes('duplicate')) {
    const nid = `node-${currIdx}`;
    nodes.push({
      id: nid,
      type: 'dedupe',
      data: { cols: '' },
      position: { x: 100 + (currIdx - 1) * 260, y: 200 }
    });
    edges.push({ id: `e-${prevId}-${nid}`, source: prevId, target: nid });
    prevId = nid;
    currIdx += 1;
  }

  // 3. Filtering
  if (promptLower.includes('filter') || promptLower.includes('where') || promptLower.includes('greater') || promptLower.includes('revenue') || promptLower.includes('salary') || promptLower.includes('fare')) {
    const col = sampleName === 'sales' ? 'revenue' : (sampleName === 'titanic' ? 'fare' : 'sepal_length');
    const op = '>';
    const val = sampleName === 'sales' ? '200' : '5.0';
    
    const nid = `node-${currIdx}`;
    nodes.push({
      id: nid,
      type: 'filterRows',
      data: { col, op, value: val, mode: 'keep' },
      position: { x: 100 + (currIdx - 1) * 260, y: 200 }
    });
    edges.push({ id: `e-${prevId}-${nid}`, source: prevId, target: nid });
    prevId = nid;
    currIdx += 1;
  }

  // 4. Aggregation / Group by
  if (promptLower.includes('group') || promptLower.includes('aggregate') || promptLower.includes('sum') || promptLower.includes('avg')) {
    const groupCol = sampleName === 'sales' ? 'region' : (sampleName === 'titanic' ? 'pclass' : 'species');
    const aggCol = sampleName === 'sales' ? 'revenue' : (sampleName === 'titanic' ? 'fare' : 'petal_length');
    
    const nid = `node-${currIdx}`;
    nodes.push({
      id: nid,
      type: 'aggregate',
      data: { groupBy: groupCol, aggCol, aggFn: 'sum' },
      position: { x: 100 + (currIdx - 1) * 260, y: 200 }
    });
    edges.push({ id: `e-${prevId}-${nid}`, source: prevId, target: nid });
    prevId = nid;
    currIdx += 1;
  }

  // 5. Sorting
  if (promptLower.includes('sort') || promptLower.includes('order') || promptLower.includes('top')) {
    const sortCol = sampleName === 'sales' ? 'revenue' : 'sepal_length';
    const nid = `node-${currIdx}`;
    nodes.push({
      id: nid,
      type: 'sort',
      data: { col: sortCol, dir: 'desc' },
      position: { x: 100 + (currIdx - 1) * 260, y: 200 }
    });
    edges.push({ id: `e-${prevId}-${nid}`, source: prevId, target: nid });
    prevId = nid;
    currIdx += 1;
  }

  // 6. Output (Chart, Profiler, Preview)
  if (promptLower.includes('chart') || promptLower.includes('bar') || promptLower.includes('plot') || promptLower.includes('pie')) {
    const chartType = promptLower.includes('pie') ? 'pie' : (promptLower.includes('scatter') ? 'scatter' : 'bar');
    const xCol = sampleName === 'sales' ? 'region' : (sampleName === 'iris' ? 'species' : 'sex');
    const yCol = sampleName === 'sales' ? 'revenue' : (sampleName === 'iris' ? 'petal_length' : 'fare');
    
    const nid = `node-${currIdx}`;
    nodes.push({
      id: nid,
      type: 'chart',
      data: { chartType, xCol, yCol, title: `AI Generated ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart` },
      position: { x: 100 + (currIdx - 1) * 260, y: 200 }
    });
    edges.push({ id: `e-${prevId}-${nid}`, source: prevId, target: nid });
    prevId = nid;
    currIdx += 1;
  } else if (promptLower.includes('profile') || promptLower.includes('stats')) {
    const nid = `node-${currIdx}`;
    nodes.push({
      id: nid,
      type: 'profiler',
      data: {},
      position: { x: 100 + (currIdx - 1) * 260, y: 200 }
    });
    edges.push({ id: `e-${prevId}-${nid}`, source: prevId, target: nid });
    prevId = nid;
    currIdx += 1;
  }

  // Always ensure preview node at the end if not chart/profile
  const lastType = nodes[nodes.length - 1]?.type;
  if (!['preview', 'chart', 'profiler', 'export'].includes(lastType)) {
    const nid = `node-${currIdx}`;
    nodes.push({
      id: nid,
      type: 'preview',
      data: {},
      position: { x: 100 + (currIdx - 1) * 260, y: 200 }
    });
    edges.push({ id: `e-${prevId}-${nid}`, source: prevId, target: nid });
  }

  return {
    explanation: `Generated custom DataFlow pipeline for: "${prompt}". Attached dataset "${sampleName}", transformation steps, and output node.`,
    nodes,
    edges,
    engine: 'DataFlow Smart Rule Engine'
  };
}
