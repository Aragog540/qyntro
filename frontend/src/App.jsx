// App.jsx — Root layout
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
  return <Icon icon="ci:sun" className="h-4 w-4" />;
}

function MoonIcon() {
  return <Icon icon="ci:moon" className="h-4 w-4" />;
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
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-2 text-ink-muted hover:bg-border hover:text-ink transition-all shadow-sm"
            title={sidebarOpen ? 'Collapse sidebar drawer' : 'Expand sidebar drawer'}
          >
            <Icon icon="ci:hamburger" className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Icon icon="ci:coolicons" className="text-xl text-accent" />
            <div>
              <span className="text-sm font-bold tracking-tight brand-gradient">Qyntro</span>
              <span className="ml-2 font-mono text-[9px] text-ink-muted">{APP_VERSION}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Mode Assistant toggle */}
          <button
            onClick={toggleAIDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-xs font-semibold text-ink hover:bg-border transition-all shadow-sm"
            title="Open AI Mode Pipeline Generator (Groq Llama 3)"
          >
            <Icon icon="ci:chat-conversation" className="h-3.5 w-3.5 text-purple-400" />
            <span>AI Mode</span>
          </button>

          {/* Dashboard drawer toggle */}
          {hasChartNodes && (
            <button
              onClick={toggleDashboard}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink transition-all"
              title="Toggle Dashboard drawer"
            >
              <Icon icon="ci:dashboard" className="h-3.5 w-3.5 text-blue-400" />
              <span>Dashboard</span>
            </button>
          )}

          {/* Docs Tab */}
          <button
            onClick={() => setShowDocsModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink transition-all bg-accent/5 hover:border-accent/30"
            title="View Documentation & Node Reference Guide"
          >
            <Icon icon="ci:file-document" className="h-3.5 w-3.5" />
            <span>Docs</span>
          </button>

          {/* Save / Load Pipeline */}
          <button
            onClick={savePipeline}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink transition-all"
            title="Save pipeline as JSON"
          >
            <Icon icon="ci:save" className="h-3.5 w-3.5" />
            <span>Save</span>
          </button>

          <label
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink transition-all cursor-pointer"
            title="Load pipeline from JSON"
          >
            <Icon icon="ci:folder-open" className="h-3.5 w-3.5" />
            <span>Load</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Export Code */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-ink-muted hover:bg-surface-2 hover:text-ink transition-all"
            title="Export pipeline to Python/SQL code"
          >
            <Icon icon="ci:code" className="h-3.5 w-3.5" />
            <span>Code</span>
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
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded-xl border border-border bg-surface/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-ink shadow-lg hover:bg-surface-2 transition-all animate-fadein"
              title="Open side panel drawer"
            >
              <Icon icon="ci:hamburger" className="h-4 w-4 text-accent" />
              <span>Nodes Palette</span>
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
          <span className="clear-canvas-btn-label">Confirm?</span>
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
  if (hasNodes) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
      <div className="max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md shadow-2xl pointer-events-auto">
        <div className="flex justify-center mb-2">
          <Icon icon="ci:coolicons" className="text-4xl text-accent" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">Canvas is empty</h3>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Drag nodes from the left palette, load a template, or generate a pipeline instantly using natural language!
        </p>
        <button
          onClick={toggleAIDrawer}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:opacity-90 transition-all"
        >
          <Icon icon="ci:chat-conversation" className="h-4 w-4" />
          <span>Generate Pipeline with AI Mode</span>
        </button>
      </div>
    </div>
  );
}

function TrashIcon() {
  return <Icon icon="ci:trash-empty" className="h-3.5 w-3.5" />;
}
