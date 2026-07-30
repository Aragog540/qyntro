import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useStore } from '../store';

const SAMPLE_PROMPTS = [
  { tag: '[SALES]', label: 'Sales by Region Chart', prompt: 'Filter sales orders with revenue > 200, group by region, and build a bar chart' },
  { tag: '[CLEAN]', label: 'Clean & Profile Employee Data', prompt: 'Drop missing values, remove duplicates, trim strings, and auto-profile all columns' },
  { tag: '[IRIS]', label: 'Iris Species Scatter Plot', prompt: 'Load iris dataset, filter sepal length > 5.0, and render a scatter plot' },
  { tag: '[TITANIC]', label: 'Titanic Passenger Analysis', prompt: 'Load titanic data, drop null fares, group by passenger class, and render pie chart' },
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
      text: 'Describe your data transformation or visualization pipeline in plain text, and Qyntro AI will synthesize the circuit topology on your canvas.',
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
          text: result.explanation || 'Pipeline topology generated successfully.',
          aiResult: result,
          engine: result.engine || 'Qyntro Engine'
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **Synthesis Error**: ${err.message}.`
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
        const runBtn = document.getElementById('run-pipeline-btn');
        if (runBtn) runBtn.click();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[#283242] bg-[#1B2028] p-4 text-[#EDEFF2] shadow-2xl animate-slidein">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#283242] bg-[#14171C] -mx-4 -mt-4 p-4 pb-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#E8823C]">[AI MODE]</span>
            <span className="font-mono text-[10px] text-[#7C8698] border border-[#283242] bg-[#1B2028] px-1.5 py-0.5 rounded">
              LLM SYNTHESIZER
            </span>
          </div>
          <p className="font-mono text-[10px] text-[#7C8698] mt-0.5">Describe pipeline topology to assemble</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            title="Configure Groq API Key"
            className={`btn-hardware font-mono text-[10px] ${
              groqApiKey ? '!border-[#5FC9BA]/50 !text-[#5FC9BA]' : ''
            }`}
          >
            🔑 {groqApiKey ? 'KEY SAVED' : 'ADD KEY'}
          </button>

          <button
            onClick={() => setAIDrawerOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded border border-[#283242] text-[#7C8698] hover:text-[#EDEFF2] hover:bg-[#232B36] transition-colors"
          >
            <Icon icon="ci:close-md" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Groq API Key Input Form */}
      {showKeyInput && (
        <form onSubmit={handleSaveKey} className="my-2 rounded border border-[#283242] bg-[#14171C] p-3 font-mono text-xs">
          <div className="font-semibold text-[#EDEFF2] mb-1">[GROQ API KEY]</div>
          <p className="text-[10px] text-[#7C8698] mb-2">
            Optional: Enter your Groq API Key (`gsk_...`) or use built-in generator.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="gsk_..."
              className="flex-1 rounded border border-[#283242] bg-[#1B2028] px-2 py-1 text-xs text-[#EDEFF2] focus:border-[#E8823C] outline-none"
            />
            <button type="submit" className="btn-copper text-xs py-1 px-3">
              Save
            </button>
          </div>
        </form>
      )}

      {/* Quick Prompts Chips */}
      <div className="my-2 flex flex-wrap gap-1.5">
        {SAMPLE_PROMPTS.map((sp, idx) => (
          <button
            key={idx}
            onClick={() => handleGenerate(sp.prompt)}
            disabled={loading}
            className="btn-hardware font-mono text-[10px] py-1 px-2 text-[#7C8698] hover:text-[#EDEFF2]"
          >
            <span className="text-[#E8823C]">{sp.tag}</span>
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
              className={`max-w-[92%] rounded border px-3 py-2 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#E8823C] text-[#14171C] font-semibold border-[#B86020]'
                  : 'bg-[#14171C] text-[#EDEFF2] border-[#283242]'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-xs">{m.text}</div>

              {/* AI Result Card */}
              {m.aiResult && (
                <div className="mt-2.5 rounded border border-[#283242] bg-[#1B2028] p-2.5">
                  <div className="flex items-center justify-between text-[10px] text-[#7C8698] mb-2 font-mono">
                    <span>⚡ {m.engine || 'Qyntro Engine'}</span>
                    <span>{m.aiResult.nodes?.length || 0} Modules · {m.aiResult.edges?.length || 0} Circuit Wires</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {m.aiResult.nodes?.map((n, i) => (
                      <span key={i} className="rounded bg-[#14171C] px-1.5 py-0.5 font-mono text-[9px] text-[#5FC9BA] border border-[#283242]">
                        {n.type.toUpperCase()}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApplyToCanvas(m.aiResult, false)}
                      className="btn-hardware flex-1 font-mono text-[10px] py-1"
                    >
                      BUILD ON CANVAS
                    </button>
                    <button
                      onClick={() => handleApplyToCanvas(m.aiResult, true)}
                      className="btn-copper flex-1 font-mono text-[10px] py-1"
                    >
                      BUILD & RUN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 font-mono text-xs text-[#E8823C] bg-[#14171C] border border-[#283242] p-2.5 rounded animate-pulse">
            <span className="h-2 w-2 rounded-full bg-[#E8823C]"></span>
            Synthesizing pipeline topology...
          </div>
        )}
      </div>

      {/* Text Area Input */}
      <div className="mt-2 border-t border-[#283242] pt-2.5">
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
            placeholder="Describe pipeline topology (e.g. Filter sales > 500 & create chart)..."
            rows={2}
            className="w-full resize-none rounded border border-[#283242] bg-[#14171C] p-2.5 pr-10 font-sans text-xs text-[#EDEFF2] placeholder-[#7C8698] focus:border-[#E8823C] outline-none"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !inputPrompt.trim()}
            className="absolute right-2 bottom-2.5 btn-copper p-1.5 !rounded"
          >
            <Icon icon="ci:paper-plane" className="h-4 w-4 text-[#14171C]" />
          </button>
        </div>
        <p className="mt-1 font-mono text-[9px] text-[#7C8698] text-center">Press Enter to synthesize pipeline</p>
      </div>

    </div>
  );
};
