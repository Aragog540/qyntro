// components/ProfilerPanel.jsx — Data profiler results panel
import { useStore } from '../store';

const TYPE_COLORS = {
  number:  { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
  string:  { bg: 'rgba(168,85,247,0.15)', text: '#c084fc' },
  boolean: { bg: 'rgba(6,182,212,0.15)',  text: '#22d3ee' },
  date:    { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  empty:   { bg: 'rgba(100,116,139,0.15)',text: '#94a3b8' },
};

function NullBar({ pct }) {
  return (
    <div className="profiler-null-bar-track">
      <div className="profiler-null-bar-fill" style={{ width: `${pct}%` }} />
      <span className="profiler-null-pct">{pct}%</span>
    </div>
  );
}

export function ProfilerPanel({ profile }) {
  if (!profile || !profile.length) {
    return (
      <div className="profiler-empty">
        <span>📊</span>
        <p>Run the pipeline to profile this dataset</p>
      </div>
    );
  }

  return (
    <div className="profiler-table-wrap">
      <table className="profiler-table">
        <thead>
          <tr>
            <th>Column</th>
            <th>Type</th>
            <th>Count</th>
            <th>Nulls</th>
            <th>Unique</th>
            <th>Min</th>
            <th>Mean</th>
            <th>Max</th>
            <th>Top Values</th>
          </tr>
        </thead>
        <tbody>
          {profile.map(row => {
            const tc = TYPE_COLORS[row.type] || TYPE_COLORS.empty;
            return (
              <tr key={row.col}>
                <td className="profiler-col-name">{row.col}</td>
                <td>
                  <span className="profiler-type-badge" style={{ background: tc.bg, color: tc.text }}>
                    {row.type}
                  </span>
                </td>
                <td className="profiler-num">{row.count.toLocaleString()}</td>
                <td><NullBar pct={row.nullPct} /></td>
                <td className="profiler-num">{row.unique.toLocaleString()}</td>
                <td className="profiler-num">{row.min ?? '—'}</td>
                <td className="profiler-num">{row.mean ?? '—'}</td>
                <td className="profiler-num">{row.max ?? '—'}</td>
                <td className="profiler-top-vals" title={row.topValues}>{row.topValues || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
