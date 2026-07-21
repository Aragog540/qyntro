// ui.jsx — React Flow canvas with connection validation
import { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, { Controls, Background, BackgroundVariant, MiniMap } from 'reactflow';
import { useStore } from './store';
import { CanvasNode } from './nodes/CanvasNode';
import { nodeTemplates, templateByType, buildInitialNodeData } from './nodes/nodeTemplates';

const gridSize = 20;
const proOptions = { hideAttribution: true };

const isValidConnection = (connection) => {
  if (connection.source === connection.target) return false;
  const { edges, nodes } = useStore.getState();
  const targetNode = nodes.find(n => n.id === connection.target);
  if (!targetNode) return true;

  const template = templateByType[targetNode.type];
  const handle = template?.handles?.(targetNode.id, targetNode.data)
    ?.find(h => h.type === 'target' && h.id === connection.targetHandle);
  const card = handle?.cardinality || 'single';
  if (card === 'multi') return true;

  const taken = edges.some(e => e.target === connection.target && e.targetHandle === connection.targetHandle);
  return !taken;
};

const nodeTypes = Object.fromEntries(nodeTemplates.map(t => [t.type, CanvasNode]));
const edgeTypes = {};

export const PipelineUI = () => {
  const wrapperRef = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  const cycleEdgeIds = useStore(s => s.cycleEdgeIds);
  const getNodeID = useStore(s => s.getNodeID);
  const addNode = useStore(s => s.addNode);
  const removeNode = useStore(s => s.removeNode);
  const toggleNodeLock = useStore(s => s.toggleNodeLock);
  const onNodesChange = useStore(s => s.onNodesChange);
  const onEdgesChange = useStore(s => s.onEdgesChange);
  const onConnect = useStore(s => s.onConnect);
  const selectPreviewNode = useStore(s => s.selectPreviewNode);

  const styledNodes = useMemo(() =>
    nodes.map(n => ({ ...n, draggable: !n.data?.locked, deletable: !n.data?.locked })),
    [nodes]
  );

  const styledEdges = useMemo(() =>
    edges.map(e => ({
      ...e,
      style: {
        stroke: cycleEdgeIds.includes(e.id) ? 'var(--color-warning)' : 'var(--color-border-hover)',
        strokeWidth: 2,
      },
      animated: false,
    })),
    [edges, cycleEdgeIds]
  );

  const onDrop = useCallback(event => {
    event.preventDefault();
    const bounds = wrapperRef.current.getBoundingClientRect();
    const raw = event.dataTransfer.getData('application/dataflow');
    if (!raw) return;
    const { nodeType } = JSON.parse(raw);
    if (!nodeType) return;
    const pos = rfInstance.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    const nodeID = getNodeID(nodeType);
    addNode({ id: nodeID, type: nodeType, position: pos, data: buildInitialNodeData(nodeID, nodeType) });
  }, [rfInstance, getNodeID, addNode]);

  const onDragOver = useCallback(e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  const onNodeContextMenu = useCallback((e, node) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
  }, []);

  const onNodeClick = useCallback((_, node) => {
    if (node.type === 'preview') selectPreviewNode(node.id);
  }, [selectPreviewNode]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full" style={{ height: '100%' }}>
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setRfInstance}
        onNodeContextMenu={onNodeContextMenu}
        onNodeClick={onNodeClick}
        onPaneClick={() => setContextMenu(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        snapToGrid
        connectionLineStyle={{ stroke: 'var(--color-accent)', strokeWidth: 2 }}
        defaultEdgeOptions={{ style: { stroke: 'var(--color-border-hover)', strokeWidth: 2 } }}
      >
        <Background variant={BackgroundVariant.Dots} color="var(--color-grid-dot)" gap={gridSize} size={1.5} />
        <Controls showInteractive={false} className="!bg-surface !border-border !rounded-xl overflow-hidden" />
        <MiniMap
          nodeColor={() => 'var(--color-accent-dim)'}
          maskColor="rgba(0,0,0,0.4)"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
        />
      </ReactFlow>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 animate-fadein rounded-lg border border-border bg-surface shadow-xl py-1 min-w-[140px]"
          onMouseLeave={() => setContextMenu(null)}
        >
          {[
            { label: '🗑 Delete', action: () => { removeNode(contextMenu.nodeId); setContextMenu(null); } },
            { label: '🔒 Toggle Lock', action: () => { toggleNodeLock(contextMenu.nodeId); setContextMenu(null); } },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full px-3 py-2 text-left text-xs text-ink hover:bg-surface-2 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
