// panels/NodePalette.jsx — Left sidebar with draggable nodes grouped by schematic category
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { nodeTemplates, CATEGORIES } from '../nodes/nodeTemplates';
import { TemplateGallery } from './TemplateGallery';
import { useStore } from '../store';

function DraggableNode({ type, label, categoryTag }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData('application/dataflow', JSON.stringify({ nodeType: type }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group relative flex cursor-grab items-center justify-between border-l-2 border-transparent px-3 py-1.5 text-xs text-[#EDEFF2] transition-all duration-150 hover:border-[#E8823C] hover:bg-[#232B36] active:border-[#E8823C] active:cursor-grabbing select-none rounded-r"
    >
      <span className="font-sans font-medium text-[#EDEFF2] group-hover:text-[#EDEFF2]">{label}</span>
      <span className="font-mono text-[9px] text-[#7C8698] group-hover:text-[#E8823C] transition-colors">
        {type.toUpperCase()}
      </span>
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
        className={`flex shrink-0 flex-col border-r border-[#283242] bg-[#1B2028] shadow-panel transition-all duration-300 ease-in-out overflow-hidden z-20 ${
          sidebarOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#283242] bg-[#14171C] px-3.5 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#E8823C]" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#EDEFF2]">
              NODE PALETTE
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            title="Close sidebar drawer"
            className="flex h-6 w-6 items-center justify-center rounded border border-[#283242] bg-[#1B2028] text-[#7C8698] hover:border-[#39475E] hover:text-[#EDEFF2] transition-all"
          >
            <Icon icon="ci:hamburger" className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Templates button */}
        <div className="px-2 pt-2.5 pb-1">
          <button
            id="open-templates-btn"
            onClick={() => setShowGallery(true)}
            className="btn-hardware w-full justify-between font-mono text-[11px]"
            title="Browse pre-built pipeline templates"
          >
            <div className="flex items-center gap-1.5">
              <Icon icon="ci:layers" className="h-3.5 w-3.5 text-[#E8823C]" />
              <span>[TEMPLATES]</span>
            </div>
            <Icon icon="ci:chevron-right" className="h-3.5 w-3.5 text-[#7C8698]" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-[#283242] my-1.5" />

        {/* Node list */}
        <div className="flex flex-1 flex-col overflow-y-auto p-1.5 gap-1">
          {CATEGORIES.map(cat => {
            const templates = nodeTemplates.filter(t => t.category === cat.id);
            if (!templates.length) return null;
            return (
              <div key={cat.id} className="py-1">
                <div className="flex items-center justify-between px-2 pb-1 pt-1 border-b border-[#283242]/40 mb-1">
                  <span className="font-mono text-[10px] font-semibold text-[#7C8698]">
                    {cat.tag || `[${cat.label.toUpperCase()}]`}
                  </span>
                  <span className="font-mono text-[9px] text-[#454F60]">
                    {templates.length}
                  </span>
                </div>
                {templates.map(t => (
                  <DraggableNode
                    key={t.type}
                    type={t.type}
                    label={t.label}
                    categoryTag={cat.tag}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-[#283242] bg-[#14171C] px-3 py-2 text-center">
          <span className="font-mono text-[9px] text-[#7C8698]">
            Qyntro Engine v1.4 • Schematic Builder
          </span>
        </div>
      </aside>

      {/* Template Gallery Modal */}
      {showGallery && <TemplateGallery onClose={() => setShowGallery(false)} />}
    </>
  );
};
