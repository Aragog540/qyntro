// components/ExecutionToast.jsx — Bottom-of-canvas status toast
import { Icon } from '@iconify/react';
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
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 animate-fadein">
      <div className={`flex items-center gap-3 rounded border px-4 py-2.5 shadow-2xl font-mono text-xs
        ${executionStatus === 'error'   ? 'border-[#E55353] bg-[#14171C] text-[#E55353]' :
          executionStatus === 'done'    ? 'border-[#5FC9BA] bg-[#14171C] text-[#5FC9BA]' :
                                          'border-[#E8823C] bg-[#14171C] text-[#E8823C]'}`}
      >
        {executionStatus === 'running' && (
          <span className="h-3 w-3 rounded-full border-2 border-[#E8823C] border-t-transparent animate-spin" />
        )}
        {executionStatus === 'done' && <Icon icon="ci:check" className="h-4 w-4 text-[#5FC9BA]" />}
        {executionStatus === 'error' && <Icon icon="ci:close-big" className="h-4 w-4 text-[#E55353]" />}

        <div>
          {executionStatus === 'running' && '[RUNNING CURRENT TOPOLOGY...]'}
          {executionStatus === 'done' && (
            <>[PIPELINE COMPLETE] • {doneNodes} MODULES • {totalRows.toLocaleString()} ROWS PROCESSED</>
          )}
          {executionStatus === 'error' && `[CIRCUIT ERROR] ${executionError}`}
        </div>

        {(executionStatus === 'done' || executionStatus === 'error') && (
          <button
            onClick={clearExecution}
            className="ml-2 rounded p-1 opacity-60 hover:opacity-100 hover:bg-[#232B36] transition-all"
          >
            <Icon icon="ci:close-md" className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
