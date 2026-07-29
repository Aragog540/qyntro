// components/ExecutionToast.jsx — Bottom-of-canvas status toast
import { useStore } from '../store';

export const ExecutionToast = () => {
  const executionStatus = useStore(s => s.executionStatus);
  const executionError = useStore(s => s.executionError);
  const nodeExecutionState = useStore(s => s.nodeExecutionState);
  const clearExecution = useStore(s => s.clearExecution);
  if (executionStatus === 'idle') return null;

  const doneNodes  = Object.values(nodeExecutionState).filter(s => s.status === 'done').length;
  const errorNodes = Object.values(nodeExecutionState).filter(s => s.status === 'error').length;
  const totalRows  = Object.values(nodeExecutionState)
    .filter(s => s.status === 'done' && s.rowCount != null)
    .reduce((sum, s) => Math.max(sum, s.rowCount), 0);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 animate-fadein">
      <div className={`flex items-center gap-3 rounded-xl border px-5 py-3 shadow-2xl backdrop-blur-sm
        ${executionStatus === 'error'   ? 'border-danger/40 bg-danger/10 text-danger' :
          executionStatus === 'done'    ? 'border-success/40 bg-success/10 text-success' :
                                          'border-accent/40 bg-accent/10 text-accent'}`}
      >
        {executionStatus === 'running' && (
          <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        {executionStatus === 'done' && <span>✓</span>}
        {executionStatus === 'error' && <span>✗</span>}

        <div className="font-mono text-xs">
          {executionStatus === 'running' && 'Running pipeline…'}
          {executionStatus === 'done' && (
            <>Pipeline complete · {doneNodes} nodes · {totalRows.toLocaleString()} rows processed</>
          )}
          {executionStatus === 'error' && `Error: ${executionError}`}
        </div>

        {(executionStatus === 'done' || executionStatus === 'error') && (
          <button
            onClick={clearExecution}
            className="ml-2 rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
