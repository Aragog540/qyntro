// panels/NodeInspector.jsx — Right panel: field editor + data preview
import { useStore } from '../store';
import { templateByType } from '../nodes/nodeTemplates';
import { DataTable } from '../components/DataTable';
import { ChartRenderer } from '../components/ChartRenderer';


function FieldEditor({ nodeId, field, value, onChange, locked, columns = [] }) {
  const inputClass = `w-full rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs text-ink outline-none
    focus:border-accent transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
    ${field.monospace ? 'font-mono' : ''}`;

  if (field.type === 'select') {
    return (
      <select
        value={value ?? field.options?.[0]?.value ?? field.options?.[0]}
        onChange={e => onChange(e.target.value)}
        disabled={locked}
        className={inputClass}
      >
        {field.options?.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val} disabled={opt.disabled}>{lbl}</option>;
        })}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        disabled={locked}
        placeholder={field.placeholder}
        rows={4}
        className={`${inputClass} resize-y leading-relaxed`}
      />
    );
  }

  if (field.type === 'file') {
    return (
      <div className="space-y-1.5">
        <label className={`flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border-hover px-3 py-3
          text-xs text-ink-muted hover:border-accent hover:text-accent transition-all duration-150
          ${locked ? 'pointer-events-none opacity-50' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
            <path d="M12 2v10m0 0 3-3m-3 3-3-3M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          <span>{value?.[0]?.name || `Choose ${field.accept || 'file'}…`}</span>
          <input
            type="file"
            multiple={field.multiple}
            accept={field.accept}
            className="hidden"
            onChange={e => onChange(Array.from(e.target.files))}
            disabled={locked}
          />
        </label>
        {value?.[0] && (
          <p className="px-1 font-mono text-[10px] text-success">✓ {value[0].name}</p>
        )}
      </div>
    );
  }

  // col-select: text input + datalist of available columns
  if (field.type === 'col-select') {
    const listId = `col-list-${nodeId}-${field.id}`;
    return (
      <div className="relative">
        <input
          type="text"
          list={listId}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          disabled={locked}
          placeholder={columns.length ? 'Pick or type a column…' : field.placeholder}
          className={inputClass}
        />
        <datalist id={listId}>
          {columns.map(col => <option key={col} value={col} />)}
        </datalist>
        {columns.length > 0 && (
          <p className="mt-1 font-mono text-[9px] text-ink-faint">
            {columns.length} columns available
          </p>
        )}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={locked}
      placeholder={field.placeholder}
      className={inputClass}
    />
  );
}

const NodeInspectorInner = () => {
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  const updateNodeField = useStore(s => s.updateNodeField);
  const previewData = useStore(s => s.previewData);
  const chartData = useStore(s => s.chartData);
  const selectedPreviewNodeId = useStore(s => s.selectedPreviewNodeId);

  const nodeExecutionState = useStore(s => s.nodeExecutionState);
  const nodeOutputColumns = useStore(s => s.nodeOutputColumns);
  const selectedNode = nodes.find(n => n.selected);

  // Find columns from the node directly upstream of selectedNode
  const upstreamColumns = (() => {
    if (!selectedNode) return [];
    const inEdge = edges.find(e => e.target === selectedNode.id);
    if (!inEdge) return [];
    return nodeOutputColumns[inEdge.source] ?? [];
  })();

  // Show preview panel if a preview node was clicked
  if (selectedPreviewNodeId && previewData[selectedPreviewNodeId]) {
    const df = previewData[selectedPreviewNodeId];
    return (
      <aside className="flex w-[520px] shrink-0 flex-col border-l border-border bg-surface shadow-panel animate-slidein">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Data Preview</h2>
            <p className="font-mono text-[10px] text-ink-muted">{df.rows.length.toLocaleString()} rows × {df.columns.length} cols</p>
          </div>
          <button
            onClick={() => useStore.getState().selectPreviewNode(null)}
            className="rounded-md p-1 text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <DataTable df={df} />
        </div>
      </aside>
    );
  }

  // No node selected
  if (!selectedNode) {
    return (
      <aside className="flex w-72 shrink-0 flex-col items-center justify-center border-l border-border bg-surface shadow-panel text-center px-6">
        <div className="mb-4 text-4xl opacity-30">⚡</div>
        <p className="text-sm font-medium text-ink-muted">Select a node to configure it</p>
        <p className="mt-1 text-[11px] text-ink-faint">Click a Preview node after running to see data</p>
      </aside>
    );
  }

  const template = templateByType[selectedNode.type];
  if (!template) return null;

  const data = selectedNode.data || {};
  const locked = !!data.locked;
  const execState = nodeExecutionState[selectedNode.id];
  const fields = (template.fields || []).filter(f => !f.showIf || f.showIf(data));

  // Chart node — wider panel with chart rendered below fields
  const isChartNode = selectedNode.type === 'chart';
  const chartDF = chartData[selectedNode.id];
  const panelWidth = isChartNode ? 'w-[480px]' : 'w-72';

  return (
    <aside className={`flex ${panelWidth} shrink-0 flex-col border-l border-border bg-surface shadow-panel animate-slidein`}>
      {/* Node header */}
      <div className="shrink-0 border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ background: template.accent }}
          >
            <span className="text-white text-[11px] font-bold">
              {template.label.slice(0, 1)}
            </span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">{data.label || template.label}</h2>
            <p className="font-mono text-[10px] text-ink-muted">{selectedNode.id}</p>
          </div>
          {locked && (
            <span className="ml-auto rounded-full bg-warning/20 px-2 py-0.5 text-[9px] font-medium text-warning">
              Locked
            </span>
          )}
        </div>

        {/* Execution status */}
        {execState && (
          <div className={`mt-2.5 rounded-md px-3 py-2 font-mono text-[10px] ${
            execState.status === 'done'    ? 'bg-success/10 text-success' :
            execState.status === 'error'   ? 'bg-danger/10 text-danger' :
            execState.status === 'running' ? 'bg-accent/10 text-accent' :
            'bg-surface-2 text-ink-muted'
          }`}>
            {execState.status === 'done'    && `✓ ${execState.rowCount?.toLocaleString() ?? 0} rows output`}
            {execState.status === 'error'   && `✗ ${execState.error}`}
            {execState.status === 'running' && '⏳ Running…'}
            {execState.status === 'skipped' && 'Skipped'}
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {fields.length === 0 && (
          <p className="text-xs text-ink-muted text-center py-8">No configurable fields</p>
        )}
        {fields.map(field => (
          <div key={field.id + (field.showIf?.toString() ?? '')} className="space-y-1.5">
            <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-wide">
              {field.label}
            </label>
            <FieldEditor
              nodeId={selectedNode.id}
              field={field}
              value={data[field.id]}
              onChange={val => updateNodeField(selectedNode.id, field.id, val)}
              locked={locked}
              columns={upstreamColumns}
            />
          </div>
        ))}

        {/* Chart panel — shown after pipeline runs */}
        {isChartNode && (
          <div className="chart-inspector-panel">
            <div className="chart-inspector-header">
              <span className="chart-inspector-title">
                {data.title || 'Chart Preview'}
              </span>
              {chartDF && (
                <span className="chart-inspector-meta">
                  {chartDF.rows.length.toLocaleString()} rows
                </span>
              )}
            </div>
            <ChartRenderer df={chartDF} config={data} />
          </div>
        )}
      </div>
    </aside>
  );
};

export const NodeInspector = NodeInspectorInner;

