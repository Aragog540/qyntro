// nodes/CanvasNode.jsx
// Schematic node module renderer with monospace schema labels & copper/teal execution states
import { useEffect, useRef, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { useStore } from '../store';
import { templateByType, CATEGORIES } from './nodeTemplates';
import { NODE_ICONS } from './icons';

const HEADER_HEIGHT = 52;
const HANDLE_SPACING = 28;

/** Status ring classes corresponding to node execution status state */
const STATUS_RING = {
  running: 'ring-1 ring-[#E8823C] animate-pulse',
  done:    'ring-1 ring-[#5FC9BA]',
  error:   'ring-1 ring-[#E55353]',
  skipped: '',
};

function HandleLabel({ h }) {
  if (!h.label) return null;
  const isLeft = h.position === Position.Left;
  return (
    <span
      style={{
        top: `${h.offsetPercent ?? 50}%`,
        ...(isLeft ? { right: 'calc(100% + 6px)' } : { left: 'calc(100% + 6px)' }),
      }}
      className="pointer-events-none absolute -translate-y-1/2 rounded border border-[#283242] bg-[#14171C] px-1 py-0.2 font-mono text-[9px] font-semibold text-[#7C8698] uppercase tracking-wider"
    >
      {h.label}
    </span>
  );
}

export const CanvasNode = ({ id, data, type, selected }) => {
  const template = templateByType[type];
  const updateNodeField = useStore(s => s.updateNodeField);
  const nodeExecState = useStore(s => s.nodeExecutionState?.[id]);
  const rootRef = useRef(null);
  const updateNodeInternals = useUpdateNodeInternals();

  const locked = !!data?.locked;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const label = data?.label ?? template?.label ?? type;
  const Icon = NODE_ICONS[type] || (() => null);
  const handles = template?.handles ? template.handles(id, data) : [];
  const subtitle = template?.subtitle ? template.subtitle(data) : null;

  const handleSig = handles.map(h => `${h.id}:${h.offsetPercent ?? 50}`).join('|');
  useEffect(() => { updateNodeInternals(id); }, [id, handleSig, updateNodeInternals]);

  // Mount animation
  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.style.opacity = '0';
    rootRef.current.style.transform = 'scale(0.95)';
    requestAnimationFrame(() => {
      if (!rootRef.current) return;
      rootRef.current.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      rootRef.current.style.opacity = '1';
      rootRef.current.style.transform = 'scale(1)';
    });
  }, []);

  if (!template) return null;

  const statusRing = STATUS_RING[nodeExecState?.status] || '';
  const catObj = CATEGORIES.find(c => c.id === template.category);
  const catTag = catObj?.tag || `[${template.category?.toUpperCase() || 'NODE'}]`;
  const accentColor = template.accent || '#E8823C';

  const leftHandles  = handles.filter(h => h.position === Position.Left);
  const rightHandles = handles.filter(h => h.position === Position.Right);
  const maxH = Math.max(leftHandles.length, rightHandles.length, 1);
  const cardH = HEADER_HEIGHT + (maxH - 1) * HANDLE_SPACING;

  const labelEl = isEditing ? (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => {
        setIsEditing(false);
        const t = draft.trim();
        updateNodeField(id, 'label', t || template.label);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') { setIsEditing(false); updateNodeField(id, 'label', draft.trim() || template.label); }
        if (e.key === 'Escape') setIsEditing(false);
      }}
      onClick={e => e.stopPropagation()}
      className="nodrag w-full rounded border border-[#E8823C] bg-[#14171C] px-1 py-0.5 font-mono text-xs font-medium text-[#EDEFF2] outline-none"
    />
  ) : (
    <span
      onDoubleClick={locked ? undefined : () => { setDraft(label); setIsEditing(true); }}
      title={locked ? 'Locked' : 'Double-click to rename'}
      className="block truncate font-sans text-xs font-semibold leading-tight text-[#EDEFF2]"
    >
      {label}
    </span>
  );

  return (
    <div
      ref={rootRef}
      style={{
        width: template.width ?? 220,
        height: cardH,
        borderColor: selected ? '#E8823C' : '#283242',
      }}
      className={`relative flex flex-col rounded border bg-[#1B2028] shadow-node transition-all duration-150 hover:border-[#39475E] ${statusRing} ${selected ? 'shadow-node-selected' : ''}`}
    >
      {/* Top accent wire rail */}
      <div className="h-1 w-full rounded-t" style={{ backgroundColor: accentColor }} />

      {handles.map(h => (
        <Handle
          key={h.id}
          type={h.type}
          position={h.position}
          id={h.id}
          style={{ top: `${h.offsetPercent ?? 50}%` }}
          title={h.label || ''}
        />
      ))}
      {handles.map(h => <HandleLabel key={`lbl-${h.id}`} h={h} />)}

      {/* Main Schematic Body */}
      <div className="flex flex-1 items-center gap-2 px-2.5 py-2 overflow-hidden">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-mono text-[9px] font-semibold text-[#7C8698] tracking-wider">
              {catTag}
            </span>
            {locked && <span className="font-mono text-[9px] text-[#7C8698]">🔒</span>}
          </div>
          
          {labelEl}

          {subtitle && (
            <span className="block truncate font-mono text-[9px] text-[#7C8698] mt-0.5">
              {subtitle}
            </span>
          )}
        </div>

        {/* Execution Status Badge */}
        {nodeExecState?.status === 'running' && (
          <span className="ml-auto shrink-0 font-mono text-[9px] font-bold text-[#E8823C] animate-pulse">
            [RUN]
          </span>
        )}
        {nodeExecState?.status === 'done' && nodeExecState.rowCount !== undefined && (
          <span className="ml-auto shrink-0 font-mono text-[9px] font-semibold text-[#5FC9BA] bg-[#5FC9BA]/10 px-1 py-0.5 rounded border border-[#5FC9BA]/30">
            {nodeExecState.rowCount.toLocaleString()}r
          </span>
        )}
        {nodeExecState?.status === 'error' && (
          <span className="ml-auto shrink-0 font-mono text-[9px] font-semibold text-[#E55353] bg-[#E55353]/10 px-1 py-0.5 rounded border border-[#E55353]/30" title={nodeExecState.error}>
            ERR
          </span>
        )}
      </div>
    </div>
  );
};
