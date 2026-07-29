// execution/RunButton.jsx — Run the pipeline
import { Icon } from '@iconify/react';
import { useStore } from '../store';
import { runPipeline } from '../utils/executor';

export const RunButton = () => {
  const nodes = useStore(s => s.nodes);
  const edges = useStore(s => s.edges);
  const executionStatus = useStore(s => s.executionStatus);

  const isRunning = executionStatus === 'running';

  const handleRun = async () => {
    if (isRunning) return;
    const {
      clearCycleEdges, setExecutionRunning, setNodeExecutionState,
      setExecutionDone, setExecutionError, setPreviewData, markCycleEdges,
      setNodeOutputColumns, setChartData, setProfileData, updateNodeField,
      nodes: currentNodes, edges: currentEdges,
    } = useStore.getState();

    clearCycleEdges();
    setExecutionRunning();

    try {
      const outputMap = await runPipeline(currentNodes, currentEdges, {
        onNodeUpdate: (nodeId, patch) => setNodeExecutionState(nodeId, patch),
        onPreviewReady: (nodeId, df) => {
          setPreviewData(nodeId, df);
          updateNodeField(nodeId, '_previewRows', df.rows.length);
        },
        onChartReady: (nodeId, df) => setChartData(nodeId, df),
        onProfileReady: (nodeId, profile) => setProfileData(nodeId, profile),
      });
      // Store column names from every node's output for inspector dropdowns
      outputMap.forEach((df, nodeId) => {
        if (df?.columns) setNodeOutputColumns(nodeId, df.columns);
      });

      // Automatically trigger ZIP / artifact export bundle for all Export nodes attached
      const exportNodes = currentNodes.filter(n => n.type === 'export');
      for (const expNode of exportNodes) {
        const incomingEdge = currentEdges.find(e => e.target === expNode.id);
        const sourceDF = incomingEdge ? outputMap.get(incomingEdge.source) : null;
        if (sourceDF && sourceDF.rows?.length) {
          const { exportPipelineArtifacts } = await import('../utils/exportBundler');
          await exportPipelineArtifacts(sourceDF, expNode.data || {}, useStore.getState());
        }
      }

      setExecutionDone();
    } catch (err) {
      markCycleEdges(currentNodes, currentEdges);
      setExecutionError(err.message || String(err));
    }
  };

  return (
    <div className="flex items-center gap-2">

      <button
        onClick={handleRun}
        disabled={isRunning || nodes.length === 0}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-150
          ${isRunning
            ? 'bg-surface-2 text-ink-muted border border-border cursor-not-allowed'
            : 'bg-accent text-canvas hover:opacity-90 active:scale-95 shadow-md'
          }
          disabled:opacity-50`}
      >
        {isRunning ? (
          <>
            <span className="h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            Running…
          </>
        ) : (
          <>
            <Icon icon="ci:play" className="h-3.5 w-3.5" />
            Run Pipeline
          </>
        )}
      </button>
    </div>
  );
};
