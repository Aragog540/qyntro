// App.jsx — Qyntro Visual Data Pipeline Studio Layout
import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { NodePalette } from './panels/NodePalette';
import { NodeInspector } from './panels/NodeInspector';
import { AIChatDrawer } from './panels/AIChatDrawer';
import { PipelineUI } from './ui';
import { RunButton } from './execution/RunButton';
import { ExecutionToast } from './components/ExecutionToast';
import { Dashboard } from './components/Dashboard';
import { ExportModal } from './components/ExportModal';
import { DocsModal } from './components/DocsModal';
import { useStore } from './store';
import { APP_VERSION } from './version';

const THEME_KEY = 'qyntro-theme';

function SunIcon() {
  return <Icon icon="ci:sun" className="h-3.5 w-3.5" />;
}

function MoonIcon() {
  return <Icon icon="ci:moon" className="h-3.5 w-3.5" />;
}

function QyntroLogo({ isRunning }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg className="h-6 w-8 shrink-0 overflow-visible" viewBox="0 0 60 30" fill="none">
        {/* Static track */}
        <path
          d="M 15 15 C 15 6, 25 6, 30 15 C 35 24, 45 24, 45 15 C 45 6, 35 6, 30 15 C 25 24, 15 24, 15 15 Z"
          stroke="#283242"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Active copper current track */}
        <path
          d="M 15 15 C 15 6, 25 6, 30 15 C 35 24, 45 24, 45 15 C 45 6, 35 6, 30 15 C 25 24, 15 24, 15 15 Z"
          stroke="#E8823C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={isRunning ? "8 6" : "none"}
          className={isRunning ? "animate-[flowCurrent_0.8s_linear_infinite]" : ""}
        />
        {/* Terminals */}
        <circle cx="15" cy="15" r="2.5" fill="#5FC9BA" />
        <circle cx="45" cy="15" r="2.5" fill="#E8823C" />
      </svg>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-lg font-bold tracking-tight text-[#EDEFF2]">Qyntro</span>
        <span className="font-mono text-[10px] font-semibold text-[#7C8698]">[{APP_VERSION}]</span>
      </div>
    </div>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_KEY) !== 'light');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  const savePipeline = useStore(s => s.savePipeline);
  const loadPipelineFromJSON = useStore(s => s.loadPipelineFromJSON);
  const toggleDashboard = useStore(s => s.toggleDashboard);
  const toggleAIDrawer = useStore(s => s.toggleAIDrawer);
  const sidebarOpen = useStore(s => s.sidebarOpen);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const hasChartNodes = useStore(s => s.nodes.some(n => n.type === 'chart'));
  const executionStatus = useStore(s => s.executionStatus);

  const isRunning = executionStatus === 'running';

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Auto-restore from localStorage on initial load
  useEffect(() => {
    const saved = localStorage.getItem('qyntro-pipeline');
    if (saved) loadPipelineFromJSON(saved);
  }, [loadPipelineFromJSON]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) loadPipelineFromJSON(evt.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen flex-col bg-[#14171C] text-[#EDEFF2] overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[#283242] bg-[#1B2028] px-4 py-2.5 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#283242] bg-[#14171C] text-[#7C8698] hover:border-[#39475E] hover:text-[#EDEFF2] transition-all"
            title={sidebarOpen ? 'Collapse node palette' : 'Expand node palette'}
          >
            <Icon icon="ci:hamburger" className="h-4 w-4" />
          </button>
          
          <QyntroLogo isRunning={isRunning} />
        </div>

        <div className="flex items-center gap-2">
          {/* AI Mode Assistant toggle */}
          <button
            onClick={toggleAIDrawer}
            className="btn-hardware font-mono text-[11px]"
            title="Open AI Mode Pipeline Synthesizer"
          >
            <Icon icon="ci:chat-conversation" className="h-3.5 w-3.5 text-[#5FC9BA]" />
            <span>[AI MODE]</span>
          </button>

          {/* Dashboard drawer toggle */}
          {hasChartNodes && (
            <button
              onClick={toggleDashboard}
              className="btn-hardware font-mono text-[11px]"
              title="Toggle Dashboard drawer"
            >
              <Icon icon="ci:dashboard" className="h-3.5 w-3.5 text-[#5FC9BA]" />
              <span>[DASHBOARD]</span>
            </button>
          )}

          {/* Docs Tab */}
          <button
            onClick={() => setShowDocsModal(true)}
            className="btn-hardware text-xs"
            title="View Documentation & Node Reference Guide"
          >
            <Icon icon="ci:file-document" className="h-3.5 w-3.5 text-[#7C8698]" />
            <span>Docs</span>
          </button>

          {/* Save / Load Pipeline */}
          <button
            onClick={savePipeline}
            className="btn-hardware text-xs"
            title="Save pipeline topology JSON"
          >
            <Icon icon="ci:save" className="h-3.5 w-3.5 text-[#7C8698]" />
            <span>Save</span>
          </button>

          <label
            className="btn-hardware text-xs cursor-pointer"
            title="Load pipeline topology JSON"
          >
            <Icon icon="ci:folder-open" className="h-3.5 w-3.5 text-[#7C8698]" />
            <span>Load</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Export Code */}
          <button
            onClick={() => setShowExportModal(true)}
            className="btn-hardware text-xs"
            title="Export pipeline to Python/SQL script"
          >
            <Icon icon="ci:code" className="h-3.5 w-3.5 text-[#7C8698]" />
            <span>Export Code</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(d => !d)}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#283242] bg-[#14171C] text-[#7C8698] hover:border-[#39475E] hover:text-[#EDEFF2] transition-all"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Clear canvas */}
          <ClearCanvasButton />

          {/* Run Pipeline */}
          <RunButton />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <main className="relative flex-1 overflow-hidden">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 left-4 z-30 flex items-center gap-2 btn-hardware font-mono text-xs shadow-md animate-fadein"
              title="Open Node Palette"
            >
              <Icon icon="ci:hamburger" className="h-3.5 w-3.5 text-[#E8823C]" />
              <span>[NODES]</span>
            </button>
          )}
          <PipelineUI />
          <ExecutionToast />
          <Dashboard />
          <AIChatDrawer />

          {/* Empty state hint */}
          <EmptyState />
        </main>
        <NodeInspector />
      </div>

      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
      {showDocsModal && <DocsModal onClose={() => setShowDocsModal(false)} />}
    </div>
  );
}

function ClearCanvasButton() {
  const hasNodes = useStore(s => s.nodes.length > 0);
  const clearCanvas = useStore(s => s.clearCanvas);
  const [armed, setArmed] = useState(false);

  const handleClick = useCallback(() => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
    } else {
      clearCanvas();
      setArmed(false);
    }
  }, [armed, clearCanvas]);

  if (!hasNodes) return null;

  return (
    <button
      id="clear-canvas-btn"
      onClick={handleClick}
      title={armed ? 'Click again to confirm clear' : 'Clear canvas'}
      className={`clear-canvas-btn${armed ? ' clear-canvas-btn--armed' : ''}`}
    >
      {armed ? (
        <>
          <TrashIcon />
          <span className="clear-canvas-btn-label font-mono">Confirm?</span>
        </>
      ) : (
        <TrashIcon />
      )}
    </button>
  );
}

function EmptyState() {
  const hasNodes = useStore(s => s.nodes.length > 0);
  const toggleAIDrawer = useStore(s => s.toggleAIDrawer);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const sidebarOpen = useStore(s => s.sidebarOpen);

  if (hasNodes) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 select-none z-10">
      {/* Ghost schematic outline directly on the blueprint canvas */}
      <div className="relative flex flex-col items-center max-w-lg text-center pointer-events-auto">
        <svg className="w-96 h-28 mb-4 overflow-visible opacity-40" viewBox="0 0 384 112" fill="none">
          {/* Node 1 schematic ghost */}
          <rect x="2" y="16" width="110" height="64" rx="4" stroke="#7C8698" strokeWidth="1.5" strokeDasharray="3 3" fill="#1B2028" fillOpacity="0.5" />
          <text x="12" y="38" fill="#7C8698" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">[IN/OUT]</text>
          <text x="12" y="58" fill="#EDEFF2" fontSize="11" fontFamily="Public Sans" fontWeight="600">LOAD_CSV</text>
          <circle cx="112" cy="48" r="3" fill="#E8823C" />
          
          {/* Unwired dashed wire path */}
          <path d="M 112 48 C 170 48, 214 48, 272 48" stroke="#E8823C" strokeWidth="2" strokeDasharray="5 4" className="animate-[flowCurrent_1.5s_linear_infinite]" />
          
          {/* Node 2 schematic ghost */}
          <rect x="272" y="16" width="110" height="64" rx="4" stroke="#7C8698" strokeWidth="1.5" strokeDasharray="3 3" fill="#1B2028" fillOpacity="0.5" />
          <text x="282" y="38" fill="#7C8698" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">[TRANSFORM]</text>
          <text x="282" y="58" fill="#EDEFF2" fontSize="11" fontFamily="Public Sans" fontWeight="600">FILTER</text>
          <circle cx="272" cy="48" r="3" fill="#5FC9BA" />
        </svg>

        {/* Minimal unboxed copy sitting directly on grid */}
        <p className="font-sans text-sm font-semibold text-[#EDEFF2] mb-1">
          Canvas is empty. Drag a node in, or describe the pipeline you want built.
        </p>
        <p className="font-mono text-xs text-[#7C8698] mb-5 max-w-md">
          Ready for circuit assembly. Drag modules from palette or use natural language.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleAIDrawer}
            className="btn-copper"
          >
            <Icon icon="ci:chat-conversation" className="h-4 w-4 text-[#14171C]" />
            <span>Generate with AI Mode</span>
          </button>

          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="btn-hardware"
            >
              <Icon icon="ci:hamburger" className="h-4 w-4 text-[#7C8698]" />
              <span>Open Palette</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return <Icon icon="ci:trash-empty" className="h-3.5 w-3.5" />;
}
