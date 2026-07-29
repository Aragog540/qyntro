// components/DataTable.jsx — Scrollable data grid with column stats
import { useMemo, useState } from 'react';
import { columnStats } from '../utils/dataOps';

const TYPE_BADGE = {
  number:  { label: '#',   bg: 'bg-blue-500/20 text-blue-400' },
  string:  { label: 'Aa',  bg: 'bg-violet-500/20 text-violet-400' },
  boolean: { label: '✓',   bg: 'bg-green-500/20 text-green-400' },
  date:    { label: '📅',  bg: 'bg-orange-500/20 text-orange-400' },
  empty:   { label: '∅',   bg: 'bg-gray-500/20 text-gray-400' },
};

const MAX_DISPLAY_ROWS = 500;

function ColHeader({ col, stats }) {
  const [showStats, setShowStats] = useState(false);
  const badge = TYPE_BADGE[stats?.type] || TYPE_BADGE.string;

  return (
    <th
      className="relative cursor-pointer select-none"
      onMouseEnter={() => setShowStats(true)}
      onMouseLeave={() => setShowStats(false)}
    >
      <div className="flex items-center gap-1.5">
        <span className={`rounded px-1 py-0.5 text-[8px] font-bold font-mono ${badge.bg}`}>
          {badge.label}
        </span>
        <span className="truncate max-w-[120px]">{col}</span>
      </div>

      {/* Stats tooltip */}
      {showStats && stats && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-border bg-surface-2 p-2.5 shadow-xl animate-fadein">
          <p className="font-mono text-[10px] font-semibold text-ink mb-1.5">{col}</p>
          <div className="space-y-0.5 font-mono text-[9px] text-ink-muted">
            <div className="flex justify-between"><span>Type</span><span className="text-ink">{stats.type}</span></div>
            <div className="flex justify-between"><span>Total</span><span className="text-ink">{stats.total.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Nulls</span><span className={stats.nullCount > 0 ? 'text-warning' : 'text-success'}>{stats.nullCount}</span></div>
            <div className="flex justify-between"><span>Unique</span><span className="text-ink">{stats.unique.toLocaleString()}</span></div>
            {stats.min !== null && <div className="flex justify-between"><span>Min</span><span className="text-ink">{typeof stats.min === 'number' ? stats.min.toFixed(2) : stats.min}</span></div>}
            {stats.max !== null && <div className="flex justify-between"><span>Max</span><span className="text-ink">{typeof stats.max === 'number' ? stats.max.toFixed(2) : stats.max}</span></div>}
            {stats.mean !== null && <div className="flex justify-between"><span>Mean</span><span className="text-ink">{stats.mean?.toFixed(2)}</span></div>}
          </div>
        </div>
      )}
    </th>
  );
}

export const DataTable = ({ df }) => {
  const stats = useMemo(() =>
    df ? Object.fromEntries(df.columns.map(c => [c, columnStats(df, c)])) : {},
    [df]
  );

  if (!df || !df.rows?.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        No data — run the pipeline to see results
      </div>
    );
  }

  const displayRows = df.rows.slice(0, MAX_DISPLAY_ROWS);
  const truncated = df.rows.length > MAX_DISPLAY_ROWS;

  return (
    <div className="flex h-full flex-col">
      {/* Stats bar */}
      <div className="flex shrink-0 items-center gap-4 border-b border-border px-4 py-2">
        <span className="font-mono text-[11px] text-ink-muted">
          <span className="text-ink font-semibold">{df.rows.length.toLocaleString()}</span> rows
        </span>
        <span className="font-mono text-[11px] text-ink-muted">
          <span className="text-ink font-semibold">{df.columns.length}</span> columns
        </span>
        {df.meta?.source && (
          <span className="font-mono text-[11px] text-ink-faint">from: {df.meta.source}</span>
        )}
        {truncated && (
          <span className="ml-auto font-mono text-[10px] text-warning">
            Showing first {MAX_DISPLAY_ROWS.toLocaleString()} rows
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="df-table">
          <thead>
            <tr>
              <th className="w-10 text-center text-ink-faint">#</th>
              {df.columns.map(col => (
                <ColHeader key={col} col={col} stats={stats[col]} />
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i}>
                <td className="text-center text-ink-faint text-[9px]">{i + 1}</td>
                {df.columns.map(col => {
                  const val = row[col];
                  const isNull = val === null || val === undefined || val === '';
                  return (
                    <td key={col} title={isNull ? 'null' : String(val)}>
                      {isNull
                        ? <span className="df-null">null</span>
                        : String(val)
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
