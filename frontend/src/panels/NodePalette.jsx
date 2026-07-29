// panels/NodePalette.jsx — Left sidebar with draggable nodes grouped by category
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { nodeTemplates, CATEGORIES } from '../nodes/nodeTemplates';
import { NODE_ICONS } from '../nodes/icons';
import { TemplateGallery } from './TemplateGallery';
import { useStore } from '../store';

function DraggableNode({ type, label, accent }) {
  const IconComponent = NODE_ICONS[type] || (() => null);

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
        <IconComponent className="h-3 w-3 text-canvas" />
      </div>
      <span className="text-xs font-medium text-ink group-hover:text-accent transition-colors">{label}</span>
    </div>
  );
}

export const NodePalette = () => {
  const [showGallery, setShowGallery] = useState(false);
  const sidebarOpen = useStore(s => s.sidebarOpen);
  const toggleSidebar = useStore(s => s.toggleSidebar);

  return (
    <>
      <aside
        className={`flex shrink-0 flex-col border-r border-border bg-surface shadow-panel transition-all duration-300 ease-in-out overflow-hidden z-20 ${
          sidebarOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5" style={{background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%)'}}>
          <div>
            <div className="flex items-center gap-2">
              <Icon icon="ci:coolicons" className="text-base text-accent" />
              <span className="text-sm font-bold brand-gradient">Qyntro</span>
            </div>
            <p className="mt-0.5 text-[10px] text-ink-muted font-mono">Drag nodes to canvas</p>
          </div>
          <button
            onClick={toggleSidebar}
            title="Close sidebar drawer"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-2 text-ink-muted hover:text-ink transition-all shadow-sm"
          >
            <Icon icon="ci:hamburger" className="h-4 w-4" />
          </button>
        </div>

        {/* Templates button */}
        <div className="px-2 pt-2 pb-1">
          <button
            id="open-templates-btn"
            onClick={() => setShowGallery(true)}
            className="templates-palette-btn flex items-center justify-between"
            title="Browse pre-built pipeline templates"
          >
            <div className="flex items-center gap-1.5">
              <Icon icon="ci:layers" className="h-3.5 w-3.5 text-accent" />
              <span>Templates</span>
            </div>
            <Icon icon="ci:chevron-right" className="h-3.5 w-3.5" />
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
            Made with ❤️ by{' '}
            <a
              href="https://swaroopwebport.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-ink-muted hover:text-ink transition-colors"
            >
              Swaroop Bhowmik
            </a>
          </span>
        </div>

      </aside>

      {/* Template Gallery Modal */}
      {showGallery && <TemplateGallery onClose={() => setShowGallery(false)} />}
    </>
  );
};

