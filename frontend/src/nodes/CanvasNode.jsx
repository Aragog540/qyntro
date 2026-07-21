// nodes/CanvasNode.jsx
// Generic node renderer — handles all 4 shapes: trigger, round, card, capsule.
import { useEffect, useRef, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { useStore } from '../store';
import { templateByType } from './nodeTemplates';
import { NODE_ICONS } from './icons';

const HEADER_HEIGHT = 48;
const HANDLE_SPACING = 26;
const ROUND_D = 60;
const TRIGGER_D = 64;
const COMPACT_W = 110;

// Status ring colors for execution state
const STATUS_RING = {
  running: 'ring-2 ring-accent animate-pulse',
  done:    'ring-2 ring-success',
  error:   'ring-2 ring-danger',
  skipped: '',
};

function HandleLabel({ h }) {
  if (!h.label) return null;
  const isLeft = h.position === Position.Left;
  return (
    <span
      style={{
        top: `${h.offsetPercent ?? 50}%`,
        ...(isLeft ? { right: 'calc(100% + 8px)' } : { left: 'calc(100% + 8px)' }),
      }}
      className="pointer-events-none absolute -translate-y-1/2 rounded px-1 py-0.5 text-[9px] font-mono text-ink-muted bg-surface border border-border"
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
    rootRef.current.style.transform = 'scale(0.9)';
    requestAnimationFrame(() => {
      if (!rootRef.current) return;
      rootRef.current.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      rootRef.current.style.opacity = '1';
      rootRef.current.style.transform = 'scale(1)';
    });
  }, []);

  if (!template) return null;

  const statusRing = STATUS_RING[nodeExecState?.status] || '';
  const accentColor = template.accent || 'var(--color-accent)';

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
      className="nodrag w-full rounded border border-accent bg-canvas px-1 text-xs font-medium text-ink outline-none"
    />
  ) : (
    <span
      onDoubleClick={locked ? undefined : () => { setDraft(label); setIsEditing(true); }}
      title={locked ? 'Locked' : 'Double-click to rename'}
      className="block truncate text-xs font-semibold leading-tight text-ink"
    >{label}</span>
  );

  // ── Trigger / Round shapes ───────────────────────────────────────────────
  if (template.shape === 'round' || template.shape === 'trigger') {
    const d = template.shape === 'trigger' ? TRIGGER_D : ROUND_D;
    return (
      <div ref={rootRef} style={{ width: COMPACT_W }} className="flex flex-col items-center gap-1.5">
        <div
          style={{ width: d, height: d, borderColor: selected ? accentColor : undefined }}
          className={`relative flex shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface shadow-node transition-all duration-150 hover:border-border-hover ${statusRing} ${selected ? 'shadow-node-selected' : ''}`}
        >
          {handles.map(h => (
            <Handle key={h.id} type={h.type} position={h.position} id={h.id} title={h.label || ''} />
          ))}
          {handles.map(h => <HandleLabel key={`lbl-${h.id}`} h={h} />)}
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: d - 20, height: d - 20, background: accentColor }}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="w-full text-center">
          {labelEl}
          {subtitle && <span className="block truncate font-mono text-[9px] text-ink-muted mt-0.5">{subtitle}</span>}
        </div>
        {nodeExecState?.status === 'running' && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent animate-spin" />
        )}
        {nodeExecState?.rowCount !== undefined && nodeExecState.status === 'done' && (
          <span className="mt-0.5 rounded-full bg-success/20 px-2 py-0.5 font-mono text-[9px] text-success">
            {nodeExecState.rowCount.toLocaleString()} rows
          </span>
        )}
      </div>
    );
  }

  // ── Card shape ───────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      style={{ width: template.width ?? 220, height: cardH, borderColor: selected ? accentColor : undefined }}
      className={`relative flex flex-col rounded-xl border border-border bg-surface shadow-node transition-all duration-150 hover:border-border-hover ${statusRing} ${selected ? 'shadow-node-selected' : ''}`}
    >
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

      {/* Header */}
      <div className="flex flex-1 items-center gap-2.5 px-3 py-2.5 overflow-hidden">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: accentColor }}
        >
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          {labelEl}
          {subtitle && (
            <span className="block truncate font-mono text-[10px] leading-tight text-ink-muted mt-0.5">
              {subtitle}
            </span>
          )}
        </div>

        {/* Execution badge */}
        {nodeExecState?.status === 'running' && (
          <div className="ml-auto h-2 w-2 rounded-full bg-accent animate-pulse shrink-0" />
        )}
        {nodeExecState?.status === 'done' && nodeExecState.rowCount !== undefined && (
          <span className="ml-auto shrink-0 rounded-full bg-success/20 px-1.5 py-0.5 font-mono text-[9px] text-success">
            {nodeExecState.rowCount.toLocaleString()}
          </span>
        )}
        {nodeExecState?.status === 'error' && (
          <span className="ml-auto shrink-0 rounded-full bg-danger/20 px-1.5 py-0.5 font-mono text-[9px] text-danger" title={nodeExecState.error}>
            err
          </span>
        )}
      </div>
    </div>
  );
};
