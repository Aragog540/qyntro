// panels/NodePalette.jsx — Left sidebar with draggable nodes grouped by category
import { useState } from 'react';
import { nodeTemplates, CATEGORIES } from '../nodes/nodeTemplates';
import { NODE_ICONS } from '../nodes/icons';
import { TemplateGallery } from './TemplateGallery';

function DraggableNode({ type, label, accent }) {
  const Icon = NODE_ICONS[type] || (() => null);

  const onDragStart = (e) => {
    e.dataTransfer.setData('application/dataflow', JSON.stringify({ nodeType: type }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group flex cursor-grab items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-150
        hover:bg-surface-2 active:cursor-grabbing active:scale-95 select-none"
    >
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-110"
        style={{ background: accent }}
      >
        <Icon className="h-3 w-3 text-white" />
      </div>
      <span className="text-xs font-medium text-ink group-hover:text-accent transition-colors">{label}</span>
    </div>
  );
}

export const NodePalette = () => {
  const [showGallery, setShowGallery] = useState(false);

  return (
    <>
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface shadow-panel">
        {/* Header */}
        <div className="border-b border-border px-4 py-3.5" style={{background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%)'}}>
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <span className="text-sm font-bold brand-gradient">Qyntro</span>
          </div>
          <p className="mt-0.5 text-[10px] text-ink-muted font-mono">Drag nodes to canvas</p>
        </div>

        {/* Templates button */}
        <div className="px-2 pt-2 pb-1">
          <button
            id="open-templates-btn"
            onClick={() => setShowGallery(true)}
            className="templates-palette-btn"
            title="Browse pre-built pipeline templates"
          >
            <span className="templates-palette-btn-icon">📋</span>
            <span>Templates</span>
            <span className="templates-palette-btn-badge">{/* arrow */}→</span>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-border my-1" />

        {/* Node list */}
        <div className="flex flex-1 flex-col overflow-y-auto p-2 gap-1">
          {CATEGORIES.map(cat => {
            const templates = nodeTemplates.filter(t => t.category === cat.id);
            if (!templates.length) return null;
            return (
              <div key={cat.id} className="py-1">
                <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />
                  <span className="font-mono text-[9px] font-medium uppercase tracking-widest text-ink-muted">
                    {cat.label}
                  </span>
                </div>
                {templates.map(t => (
                  <DraggableNode key={t.type} type={t.type} label={t.label} accent={t.accent} />
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-3 py-3 text-center">
          <span className="text-[10px] text-ink-muted">
            27 nodes · client-side processing
          </span>
        </div>

      </aside>

      {/* Template Gallery Modal */}
      {showGallery && <TemplateGallery onClose={() => setShowGallery(false)} />}
    </>
  );
};

