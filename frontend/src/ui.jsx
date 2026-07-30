// ui.jsx — React Flow canvas with blueprint schematic styling & circuit edge flow
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
  const executionStatus = useStore(s => s.executionStatus);
  const getNodeID = useStore(s => s.getNodeID);
  const addNode = useStore(s => s.addNode);
  const removeNode = useStore(s => s.removeNode);
  const toggleNodeLock = useStore(s => s.toggleNodeLock);
  const onNodesChange = useStore(s => s.onNodesChange);
  const onEdgesChange = useStore(s => s.onEdgesChange);
  const onConnect = useStore(s => s.onConnect);
  const selectPreviewNode = useStore(s => s.selectPreviewNode);

  const isRunning = executionStatus === 'running';

  const styledNodes = useMemo(() =>
    nodes.map(n => ({ ...n, draggable: !n.data?.locked, deletable: !n.data?.locked })),
    [nodes]
  );

  const styledEdges = useMemo(() =>
    edges.map(e => {
      const isCycle = cycleEdgeIds.includes(e.id);
      return {
        ...e,
        className: isRunning ? 'running' : isCycle ? 'cycle' : '',
        style: {
          stroke: isCycle ? '#E55353' : isRunning ? '#E8823C' : '#283242',
          strokeWidth: 2,
        },
        animated: isRunning,
      };
    }),
    [edges, cycleEdgeIds, isRunning]
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
    <div ref={wrapperRef} className="relative h-full w-full bg-[#14171C]">
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
        connectionLineStyle={{ stroke: '#E8823C', strokeWidth: 2, strokeDasharray: '4 4' }}
        defaultEdgeOptions={{ style: { stroke: '#283242', strokeWidth: 2 } }}
      >
        <Background variant={BackgroundVariant.Lines} color="#223047" gap={gridSize} lineWidth={1} />
        <Controls showInteractive={false} className="!bg-[#1B2028] !border-[#283242] !rounded overflow-hidden" />
        <MiniMap
          nodeColor={() => '#E8823C'}
          maskColor="rgba(20,23,28,0.8)"
          style={{ background: '#1B2028', border: '1px solid #283242', borderRadius: 4 }}
        />
      </ReactFlow>

      {/* Context menu */}
      {contextMenu && (
        <div
          role="menu"
          aria-label="Node Actions Menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 animate-fadein rounded border border-[#283242] bg-[#1B2028] shadow-xl py-1 min-w-[150px]"
          onMouseLeave={() => setContextMenu(null)}
        >
          {[
            { label: '🗑 Delete Module', action: () => { removeNode(contextMenu.nodeId); setContextMenu(null); } },
            { label: '🔒 Toggle Lock State', action: () => { toggleNodeLock(contextMenu.nodeId); setContextMenu(null); } },
          ].map(item => (
            <button
              key={item.label}
              role="menuitem"
              onClick={item.action}
              className="w-full px-3 py-1.5 text-left font-mono text-xs text-[#EDEFF2] hover:bg-[#232B36] hover:text-[#E8823C] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
