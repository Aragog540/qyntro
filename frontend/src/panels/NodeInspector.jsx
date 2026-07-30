// panels/NodeInspector.jsx — Right panel: field editor + data preview
import { Icon } from '@iconify/react';
import { useStore } from '../store';
import { templateByType, CATEGORIES } from '../nodes/nodeTemplates';
import { DataTable } from '../components/DataTable';
import { ChartRenderer } from '../components/ChartRenderer';
import { ProfilerPanel } from '../components/ProfilerPanel';

function FieldEditor({ nodeId, field, value, onChange, locked, columns = [] }) {
  const inputClass = `w-full rounded border border-[#283242] bg-[#14171C] px-2.5 py-1.5 font-mono text-xs text-[#EDEFF2] outline-none
    focus:border-[#E8823C] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
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
        <label className={`flex cursor-pointer items-center gap-2 rounded border border-dashed border-[#283242] px-3 py-3
          text-xs text-[#7C8698] hover:border-[#E8823C] hover:text-[#EDEFF2] transition-all duration-150 bg-[#14171C]
          ${locked ? 'pointer-events-none opacity-50' : ''}`}
        >
          <Icon icon="ci:cloud-upload" className="h-4 w-4 shrink-0 text-[#E8823C]" />
          <span className="font-mono">{value?.[0]?.name || `Choose ${field.accept || 'file'}…`}</span>
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
          <p className="px-1 font-mono text-[10px] text-[#5FC9BA]">✓ {value[0].name}</p>
        )}
      </div>
    );
  }

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
          <p className="mt-1 font-mono text-[9px] text-[#7C8698]">
            {columns.length} schema columns detected
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
  const profileData = useStore(s => s.profileData);
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
      <aside className="flex w-[540px] shrink-0 flex-col border-l border-[#283242] bg-[#1B2028] shadow-panel animate-slidein">
        <div className="flex shrink-0 items-center justify-between border-b border-[#283242] bg-[#14171C] px-4 py-3">
          <div>
            <h2 className="font-mono text-xs font-semibold text-[#EDEFF2] uppercase tracking-wider">[DATA PREVIEW]</h2>
            <p className="font-mono text-[10px] text-[#7C8698]">{df.rows.length.toLocaleString()} rows × {df.columns.length} columns</p>
          </div>
          <button
            onClick={() => useStore.getState().selectPreviewNode(null)}
            className="flex h-6 w-6 items-center justify-center rounded border border-[#283242] text-[#7C8698] hover:text-[#EDEFF2] hover:bg-[#232B36] transition-colors"
          >
            <Icon icon="ci:close-md" className="h-4 w-4" />
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
      <aside className="flex w-72 shrink-0 flex-col items-center justify-center border-l border-[#283242] bg-[#1B2028] text-center px-6">
        <div className="mb-3 font-mono text-xl text-[#7C8698] opacity-40">[SCHEMATIC]</div>
        <p className="font-sans text-xs font-semibold text-[#EDEFF2]">No module selected</p>
        <p className="mt-1 font-mono text-[10px] text-[#7C8698]">Select a node on canvas to configure parameters</p>
      </aside>
    );
  }

  const template = templateByType[selectedNode.type];
  if (!template) return null;

  const data = selectedNode.data || {};
  const locked = !!data.locked;
  const execState = nodeExecutionState[selectedNode.id];
  const fields = (template.fields || []).filter(f => !f.showIf || f.showIf(data));
  const catObj = CATEGORIES.find(c => c.id === template.category);

  // Chart & Profiler nodes — wider panel width
  const isChartNode = selectedNode.type === 'chart';
  const isProfilerNode = selectedNode.type === 'profiler';
  const chartDF = chartData[selectedNode.id];
  const profile = profileData[selectedNode.id];
  const panelWidth = isProfilerNode ? 'w-[640px]' : isChartNode ? 'w-[480px]' : 'w-72';

  return (
    <aside aria-label="Node Inspector Panel" className={`flex ${panelWidth} shrink-0 flex-col border-l border-[#283242] bg-[#1B2028] shadow-panel animate-slidein`}>
      {/* Node header */}
      <div className="shrink-0 border-b border-[#283242] bg-[#14171C] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold text-[#7C8698]">
            {catObj?.tag || `[${template.category?.toUpperCase()}]`}
          </span>
          {locked && (
            <span className="font-mono text-[9px] text-[#E8823C] bg-[#E8823C]/10 px-1.5 py-0.5 rounded border border-[#E8823C]/30">
              LOCKED
            </span>
          )}
        </div>
        <h2 className="font-sans text-sm font-bold text-[#EDEFF2] mt-0.5">{data.label || template.label}</h2>
        <p className="font-mono text-[10px] text-[#7C8698]">ID: {selectedNode.id}</p>

        {/* Execution status */}
        {execState && (
          <div className={`mt-2 rounded border px-2.5 py-1.5 font-mono text-[10px] ${
            execState.status === 'done'    ? 'bg-[#5FC9BA]/10 text-[#5FC9BA] border-[#5FC9BA]/30' :
            execState.status === 'error'   ? 'bg-[#E55353]/10 text-[#E55353] border-[#E55353]/30' :
            execState.status === 'running' ? 'bg-[#E8823C]/10 text-[#E8823C] border-[#E8823C]/30 animate-pulse' :
            'bg-[#232B36] text-[#7C8698] border-[#283242]'
          }`}>
            {execState.status === 'done'    && `✓ ${execState.rowCount?.toLocaleString() ?? 0} rows processed`}
            {execState.status === 'error'   && `✗ ${execState.error}`}
            {execState.status === 'running' && '⏳ Executing pipeline...'}
            {execState.status === 'skipped' && 'Skipped'}
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {fields.length === 0 && (
          <p className="font-mono text-xs text-[#7C8698] text-center py-8">No configurable parameters</p>
        )}
        {fields.map(field => (
          <div key={field.id + (field.showIf?.toString() ?? '')} className="space-y-1">
            <label className="block font-mono text-[10px] font-semibold text-[#7C8698] uppercase tracking-wider">
              [{field.label}]
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

        {selectedNode.type === 'export' && (
          <button
            onClick={async () => {
              const df = previewData[selectedNode.id] || Object.values(previewData)[0];
              if (df) {
                const { exportPipelineArtifacts } = await import('../utils/exportBundler');
                await exportPipelineArtifacts(df, data, useStore.getState());
              }
            }}
            className="btn-copper w-full mt-3 font-mono text-xs"
          >
            📥 DOWNLOAD ARTIFACT BUNDLE
          </button>
        )}

        {/* Chart panel */}
        {isChartNode && (
          <div className="mt-4 border border-[#283242] bg-[#14171C] rounded p-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#283242] mb-3">
              <span className="font-mono text-xs font-semibold text-[#EDEFF2]">
                {data.title || 'Chart Preview'}
              </span>
              {chartDF && (
                <span className="font-mono text-[10px] text-[#5FC9BA]">
                  {chartDF.rows.length.toLocaleString()} rows
                </span>
              )}
            </div>
            <ChartRenderer df={chartDF} config={data} />
          </div>
        )}

        {/* Profiler panel */}
        {isProfilerNode && (
          <div className="mt-4 border border-[#283242] bg-[#14171C] rounded p-3">
            <ProfilerPanel profile={profile} />
          </div>
        )}
      </div>
    </aside>
  );
};

export const NodeInspector = NodeInspectorInner;
