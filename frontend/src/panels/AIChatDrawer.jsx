import { useState } from 'react';
import { useStore } from '../store';

const SAMPLE_PROMPTS = [
  { icon: '📊', label: 'Sales by Region Bar Chart', prompt: 'Filter sales orders with revenue > 200, group by region, and build a bar chart' },
  { icon: '🧹', label: 'Clean & Profile Employee Data', prompt: 'Drop missing values, remove duplicates, trim strings, and auto-profile all columns' },
  { icon: '🌸', label: 'Iris Species Scatter Plot', prompt: 'Load iris dataset, filter sepal length > 5.0, and render a scatter plot' },
  { icon: '🚢', label: 'Titanic Passenger Analysis', prompt: 'Load titanic data, drop null fares, group by passenger class, and render pie chart' },
];

export const AIChatDrawer = () => {
  const aiDrawerOpen = useStore(s => s.aiDrawerOpen);
  const setAIDrawerOpen = useStore(s => s.setAIDrawerOpen);
  const groqApiKey = useStore(s => s.groqApiKey);
  const setGroqApiKey = useStore(s => s.setGroqApiKey);
  const loadAIPipeline = useStore(s => s.loadAIPipeline);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState(groqApiKey);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am **DataFlow AI**. Describe your data transformation or visualization pipeline in plain text, and I will instantly build the connected node DAG on your canvas.',
    }
  ]);

  if (!aiDrawerOpen) return null;

  const handleSaveKey = (e) => {
    e.preventDefault();
    setGroqApiKey(tempKey.trim());
    setShowKeyInput(false);
  };

  const handleGenerate = async (promptToUse) => {
    const prompt = (promptToUse || inputPrompt).trim();
    if (!prompt || loading) return;

    setInputPrompt('');
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setLoading(true);

    try {
      let result = null;
      const baseUrl = import.meta.env.VITE_API_URL !== undefined
        ? import.meta.env.VITE_API_URL
        : (import.meta.env.DEV ? 'http://localhost:8000' : '');

      try {
        const response = await fetch(`${baseUrl}/ai/generate-pipeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, apiKey: groqApiKey || undefined })
        });
        if (response.ok) {
          result = await response.json();
        }
      } catch (fetchErr) {
        console.warn('Backend AI service unreachable, using smart client fallback:', fetchErr.message);
      }

      if (!result) {
        const { generateAIPipelineFallback } = await import('../utils/aiFallback');
        result = generateAIPipelineFallback(prompt);
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: result.explanation || 'Pipeline generated successfully.',
          aiResult: result,
          engine: result.engine || 'DataFlow AI'
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **Error generating pipeline**: ${err.message}.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToCanvas = (aiResult, autoRun = false) => {
    loadAIPipeline(aiResult);
    if (autoRun) {
      setTimeout(() => {
        const runBtn = document.querySelector('button:has(svg)');
        if (runBtn) runBtn.click();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface/95 p-4 text-ink shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 border border-border text-ink font-bold shadow-md">
            ✨
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              DataFlow AI Mode
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted border border-border">
                Groq Llama 3
              </span>
            </h2>
            <p className="text-[11px] text-ink-muted">Natural Language Pipeline Designer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            title="Configure Groq API Key"
            className={`rounded-md p-1.5 text-xs transition-colors ${
              groqApiKey ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-surface-2 text-ink-muted hover:text-ink border border-border'
            }`}
          >
            🔑 {groqApiKey ? 'Key Saved' : 'Add Key'}
          </button>

          <button
            onClick={() => setAIDrawerOpen(false)}
            className="rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Groq API Key Input Form */}
      {showKeyInput && (
        <form onSubmit={handleSaveKey} className="my-3 rounded-lg border border-border bg-surface-2 p-3 text-xs">
          <div className="font-semibold text-ink mb-1">Groq API Key (Optional)</div>
          <p className="text-[11px] text-ink-muted mb-2">
            Enter your free Groq API Key (`gsk_...`) for custom AI generation. Leave blank to use built-in smart generator.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="gsk_..."
              className="flex-1 rounded border border-border bg-canvas px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="submit"
              className="rounded bg-accent px-3 py-1 font-semibold text-canvas hover:opacity-90"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Quick Prompts Chips */}
      <div className="my-3 flex flex-wrap gap-1.5">
        {SAMPLE_PROMPTS.map((sp, idx) => (
          <button
            key={idx}
            onClick={() => handleGenerate(sp.prompt)}
            disabled={loading}
            className="flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-ink-muted transition hover:border-border-hover hover:text-ink"
          >
            <span>{sp.icon}</span>
            <span>{sp.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-accent text-canvas font-medium rounded-br-none'
                  : 'bg-surface-2 text-ink border border-border rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* AI Result Card */}
              {m.aiResult && (
                <div className="mt-3 rounded-lg border border-border bg-canvas p-2.5">
                  <div className="flex items-center justify-between text-[10px] text-ink-muted mb-2 font-mono">
                    <span>⚡ {m.engine || 'DataFlow AI'}</span>
                    <span>{m.aiResult.nodes?.length || 0} Nodes · {m.aiResult.edges?.length || 0} Edges</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {m.aiResult.nodes?.map((n, i) => (
                      <span key={i} className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-ink border border-border">
                        {n.type}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApplyToCanvas(m.aiResult, false)}
                      className="flex-1 rounded bg-surface-2 border border-border py-1 text-center font-semibold text-ink hover:bg-border shadow-md text-xs"
                    >
                      ✨ Build on Canvas
                    </button>
                    <button
                      onClick={() => handleApplyToCanvas(m.aiResult, true)}
                      className="flex-1 rounded bg-accent py-1 text-center font-semibold text-canvas hover:opacity-90 shadow-md text-xs flex items-center justify-center gap-1"
                    >
                      ▶️ Build & Run
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-ink-muted bg-surface-2 border border-border p-3 rounded-xl animate-pulse">
            <span className="h-2 w-2 rounded-full bg-ink animate-ping"></span>
            Designing pipeline architecture via Groq LLM...
          </div>
        )}
      </div>

      {/* Text Area Input */}
      <div className="mt-3 border-t border-border pt-3">
        <div className="relative flex items-center">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Describe your pipeline (e.g. Filter sales > 500 & create bar chart)..."
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-canvas p-2.5 pr-10 text-xs text-ink placeholder-ink-muted focus:border-border-hover focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !inputPrompt.trim()}
            className="absolute right-2 bottom-2.5 rounded-lg bg-accent p-1.5 text-canvas shadow-md hover:opacity-90 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-[10px] text-ink-muted text-center">Press Enter to generate pipeline</p>
      </div>

    </div>
  );
};
