// store.js — Zustand state for DataFlow
import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { findCycleEdgeIds } from './utils/dag';

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  cycleEdgeIds: [],
  nodeIDs: {},

  // Execution state
  executionStatus: 'idle', // 'idle' | 'running' | 'done' | 'error'
  executionError: '',
  nodeExecutionState: {},  // nodeId -> { status, rowCount?, error? }
  nodeOutputColumns: {},   // nodeId -> string[] (column names from last run)
  previewData: {},          // nodeId -> DataFrame (for Preview nodes)
  selectedPreviewNodeId: null,

  setExecutionRunning: () => set({ executionStatus: 'running', executionError: '', nodeExecutionState: {}, previewData: {} }),
  setNodeExecutionState: (nodeId, patch) =>
    set(s => ({ nodeExecutionState: { ...s.nodeExecutionState, [nodeId]: { ...s.nodeExecutionState[nodeId], ...patch } } })),
  setNodeOutputColumns: (nodeId, columns) =>
    set(s => ({ nodeOutputColumns: { ...s.nodeOutputColumns, [nodeId]: columns } })),
  setExecutionDone: () => set({ executionStatus: 'done' }),
  setExecutionError: (msg) => set({ executionStatus: 'error', executionError: msg }),
  clearExecution: () => set({ executionStatus: 'idle', executionError: '', nodeExecutionState: {} }),
  setPreviewData: (nodeId, df) =>
    set(s => ({ previewData: { ...s.previewData, [nodeId]: df }, selectedPreviewNodeId: nodeId })),
  selectPreviewNode: (nodeId) => set({ selectedPreviewNodeId: nodeId }),

  getNodeID: (type) => {
    const ids = { ...get().nodeIDs };
    ids[type] = (ids[type] ?? 0) + 1;
    set({ nodeIDs: ids });
    return `${type}-${ids[type]}`;
  },

  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge({ ...connection, type: 'flow' }, get().edges) }),

  markCycleEdges: (nodes, edges) => set({ cycleEdgeIds: Array.from(findCycleEdgeIds(nodes, edges)) }),
  clearCycleEdges: () => set({ cycleEdgeIds: [] }),

  removeNode: (nodeId) =>
    set({
      nodes: get().nodes.filter(n => n.id !== nodeId),
      edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      cycleEdgeIds: [],
    }),

  toggleNodeLock: (nodeId) =>
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, locked: !n.data?.locked } } : n
      ),
    }),

  updateNodeField: (nodeId, field, value) =>
    set({
      nodes: get().nodes.map(n => {
        if (n.id === nodeId && !n.data?.locked) {
          return { ...n, data: { ...n.data, [field]: value } };
        }
        return n;
      }),
    }),

  loadTemplate: (template) => {
    // Build a type→counter map so IDs stay sequential
    const typeCounts = {};
    const nodeIdMap = {}; // templateIndex -> generated nodeId

    const nodes = template.nodes.map((nodeDef, i) => {
      typeCounts[nodeDef.type] = (typeCounts[nodeDef.type] ?? 0) + 1;
      const id = `${nodeDef.type}-${typeCounts[nodeDef.type]}`;
      nodeIdMap[i] = id;
      return {
        id,
        type: nodeDef.type,
        position: nodeDef.position,
        data: {
          id,
          nodeType: nodeDef.type,
          label: nodeDef.type,   // CanvasNode will resolve real label from template
          ...nodeDef.data,
        },
      };
    });

    const edges = template.edges.map((edgeDef, i) => {
      const sourceId = nodeIdMap[edgeDef.sourceIndex];
      const targetId = nodeIdMap[edgeDef.targetIndex];
      return {
        id: `e-template-${i}`,
        source: sourceId,
        target: targetId,
        sourceHandle: `${sourceId}-output`,
        targetHandle: `${targetId}-input`,
        type: 'flow',
        style: { stroke: 'var(--color-border-hover)', strokeWidth: 2 },
      };
    });

    set({
      nodes,
      edges,
      nodeIDs: typeCounts,
      cycleEdgeIds: [],
      executionStatus: 'idle',
      executionError: '',
      nodeExecutionState: {},
      previewData: {},
      selectedPreviewNodeId: null,
      nodeOutputColumns: {},
    });
  },
}));

