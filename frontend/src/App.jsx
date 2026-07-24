// App.jsx — Root layout
import { useState, useEffect, useCallback } from 'react';
import { NodePalette } from './panels/NodePalette';
import { NodeInspector } from './panels/NodeInspector';
import { PipelineUI } from './ui';
import { RunButton } from './execution/RunButton';
import { ExecutionToast } from './components/ExecutionToast';
import { Dashboard } from './components/Dashboard';
import { ExportModal } from './components/ExportModal';
import { useStore } from './store';


const THEME_KEY = 'qyntro-theme';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.66 5.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_KEY) !== 'light');
  const [showExportModal, setShowExportModal] = useState(false);

  const savePipeline = useStore(s => s.savePipeline);
  const loadPipelineFromJSON = useStore(s => s.loadPipelineFromJSON);
  const toggleDashboard = useStore(s => s.toggleDashboard);
  const hasChartNodes = useStore(s => s.nodes.some(n => n.type === 'chart'));

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
    <div className="flex h-screen flex-col bg-canvas overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-5 py-3 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg animate-glow rounded-lg p-0.5">⚡</span>
          <div>
            <span className="text-sm font-bold tracking-tight brand-gradient">Qyntro</span>
            <span className="ml-2 font-mono text-[9px] text-ink-muted">v1.0</span>
          </div>
          <div className="ml-4 hidden sm:flex items-center gap-1 rounded-full border border-border px-2.5 py-1" style={{background: 'var(--color-accent-glow2)'}}>
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-[9px] text-ink-muted">client-side</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dashboard drawer toggle */}
          {hasChartNodes && (
            <button
              onClick={toggleDashboard}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink transition-all"
              title="Toggle Dashboard drawer"
            >
              📊 Dashboard
            </button>
          )}

          {/* Save / Load Pipeline */}
          <button
            onClick={savePipeline}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink transition-all"
            title="Save pipeline as JSON"
          >
            💾 Save
          </button>

          <label
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink transition-all cursor-pointer"
            title="Load pipeline from JSON"
          >
            📂 Load
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Export Code */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink transition-all"
            title="Export pipeline to Python/SQL code"
          >
            💻 Code
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(d => !d)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-muted
              hover:bg-surface-2 hover:text-ink transition-all duration-150"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Clear canvas */}
          <ClearCanvasButton />

          {/* Run */}
          <RunButton />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <main className="relative flex-1 overflow-hidden">
          <PipelineUI />
          <ExecutionToast />
          <Dashboard />

          {/* Empty state hint */}
          <EmptyState />
        </main>
        <NodeInspector />
      </div>

      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}
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
      // Auto-disarm after 3 seconds if not confirmed
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
          <span className="clear-canvas-btn-label">Confirm?</span>
        </>
      ) : (
        <TrashIcon />
      )}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function EmptyState() {

  const hasNodes = useStore(s => s.nodes.length > 0);
  if (hasNodes) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl opacity-15">⚡</div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-ink-muted opacity-50">Your canvas awaits</p>
        <p className="text-xs text-ink-faint opacity-50">Drag a <strong>Load</strong> node from the left panel to begin your pipeline</p>
      </div>
      <div className="mt-2 flex gap-2 opacity-35">
        {['Load CSV', '→ Drop Nulls', '→ Filter Rows', '→ Export'].map(s => (
          <span key={s} className="rounded-full border border-border px-3 py-1 font-mono text-[10px] text-ink-muted" style={{background: 'var(--color-accent-glow2)'}}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
