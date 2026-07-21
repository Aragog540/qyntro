// App.jsx — Root layout
import { useState, useEffect } from 'react';
import { NodePalette } from './panels/NodePalette';
import { NodeInspector } from './panels/NodeInspector';
import { PipelineUI } from './ui';
import { RunButton } from './execution/RunButton';
import { ExecutionToast } from './components/ExecutionToast';
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

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

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

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(d => !d)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-muted
              hover:bg-surface-2 hover:text-ink transition-all duration-150"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

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

          {/* Empty state hint */}
          <EmptyState />
        </main>
        <NodeInspector />
      </div>
    </div>
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
