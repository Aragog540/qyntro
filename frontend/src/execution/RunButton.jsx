// execution/RunButton.jsx — Run the pipeline
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
      setNodeOutputColumns, setChartData, updateNodeField,
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
      });
      // Store column names from every node's output for inspector dropdowns
      outputMap.forEach((df, nodeId) => {
        if (df?.columns) setNodeOutputColumns(nodeId, df.columns);
      });
      setExecutionDone();
    } catch (err) {
      markCycleEdges(currentNodes, currentEdges);
      setExecutionError(err.message || String(err));
    }
  };


  return (
    <button
      onClick={handleRun}
      disabled={isRunning || nodes.length === 0}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-150
        ${isRunning
          ? 'bg-accent/20 text-accent cursor-not-allowed'
          : 'bg-accent text-white hover:bg-accent-dim active:scale-95 shadow-lg'
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
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
          Run Pipeline
        </>
      )}
    </button>
  );
};
