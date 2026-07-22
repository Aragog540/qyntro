// components/ChartRenderer.jsx — Recharts-based chart renderer
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

// ─── Design palette ─────────────────────────────────────────────────────────
const COLORS = [
  '#a855f7', '#6366f1', '#06b6d4', '#f59e0b',
  '#ec4899', '#34d399', '#f87171', '#818cf8',
];

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--color-ink)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

const axisStyle = { fontSize: 10, fill: 'var(--color-ink-muted)', fontFamily: 'JetBrains Mono, monospace' };

// ─── Histogram helper ────────────────────────────────────────────────────────
function buildHistogram(rows, col, bins = 20) {
  const vals = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
  if (!vals.length) return [];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const width = (max - min) / bins || 1;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + i * width).toFixed(1)}–${(min + (i + 1) * width).toFixed(1)}`,
    count: 0,
  }));
  vals.forEach(v => {
    const i = Math.min(Math.floor((v - min) / width), bins - 1);
    buckets[i].count++;
  });
  return buckets;
}

// ─── Grouping helper for multi-series ────────────────────────────────────────
function groupData(rows, xCol, yCol, colorCol) {
  if (!colorCol) {
    return {
      data: rows.map(r => ({ x: r[xCol], y: Number(r[yCol]) })),
      series: [{ key: yCol, color: COLORS[0] }],
    };
  }
  const groups = [...new Set(rows.map(r => r[colorCol]))];
  // Pivot: for each unique x value, add a key per group
  const byX = {};
  rows.forEach(r => {
    const xv = r[xCol];
    if (!byX[xv]) byX[xv] = { x: xv };
    byX[xv][r[colorCol]] = Number(r[yCol]);
  });
  return {
    data: Object.values(byX),
    series: groups.map((g, i) => ({ key: String(g), color: COLORS[i % COLORS.length] })),
  };
}

// ─── Empty / Error states ────────────────────────────────────────────────────
function ChartPlaceholder({ message }) {
  return (
    <div className="chart-placeholder">
      <span className="chart-placeholder-icon">📊</span>
      <p>{message}</p>
    </div>
  );
}

// ─── Individual chart renderers ──────────────────────────────────────────────
function BarChartView({ df, config }) {
  const { xCol, yCol, colorCol } = config;
  if (!xCol || !yCol) return <ChartPlaceholder message="Set X and Y columns to render" />;
  const { data, series } = groupData(df.rows, xCol, yCol, colorCol);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="x" tick={axisStyle} angle={-35} textAnchor="end" interval="preserveStartEnd" />
        <YAxis tick={axisStyle} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
        {series.map(s => (
          <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={48} />
        ))}
        {series.length === 1 && (
          <Bar dataKey="y" name={yCol} fill={COLORS[0]} radius={[3, 3, 0, 0]} maxBarSize={48} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartView({ df, config }) {
  const { xCol, yCol, colorCol } = config;
  if (!xCol || !yCol) return <ChartPlaceholder message="Set X and Y columns to render" />;
  const { data, series } = groupData(df.rows, xCol, yCol, colorCol);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="x" tick={axisStyle} angle={-35} textAnchor="end" interval="preserveStartEnd" />
        <YAxis tick={axisStyle} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
        {series.map(s => (
          <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} dot={false} strokeWidth={2} />
        ))}
        {series.length === 1 && (
          <Line type="monotone" dataKey="y" name={yCol} stroke={COLORS[0]} dot={false} strokeWidth={2} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

function AreaChartView({ df, config }) {
  const { xCol, yCol } = config;
  if (!xCol || !yCol) return <ChartPlaceholder message="Set X and Y columns to render" />;
  const data = df.rows.map(r => ({ x: r[xCol], y: Number(r[yCol]) }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="x" tick={axisStyle} angle={-35} textAnchor="end" interval="preserveStartEnd" />
        <YAxis tick={axisStyle} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="y" name={yCol} stroke={COLORS[0]} fill="url(#areaGrad)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ScatterChartView({ df, config }) {
  const { xCol, yCol } = config;
  if (!xCol || !yCol) return <ChartPlaceholder message="Set X and Y columns to render" />;
  const data = df.rows.map(r => ({ x: Number(r[xCol]), y: Number(r[yCol]) })).filter(r => !isNaN(r.x) && !isNaN(r.y));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="x" name={xCol} tick={axisStyle} type="number" domain={['auto', 'auto']} />
        <YAxis dataKey="y" name={yCol} tick={axisStyle} />
        <ZAxis range={[30, 30]} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} fill={COLORS[0]} fillOpacity={0.75} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function HistogramView({ df, config }) {
  const { xCol } = config;
  if (!xCol) return <ChartPlaceholder message="Set the value column to render" />;
  const data = buildHistogram(df.rows, xCol);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="range" tick={axisStyle} angle={-45} textAnchor="end" interval={1} />
        <YAxis tick={axisStyle} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill={COLORS[2]} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieChartView({ df, config }) {
  const { xCol, yCol } = config;
  if (!xCol || !yCol) return <ChartPlaceholder message="Set Label (X) and Value (Y) columns to render" />;
  const data = df.rows.map(r => ({ name: String(r[xCol]), value: Number(r[yCol]) })).filter(r => !isNaN(r.value));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={50} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function ChartRenderer({ df, config }) {
  if (!df || !df.rows?.length) {
    return <ChartPlaceholder message="Run the pipeline to generate chart data" />;
  }

  const props = { df, config };
  switch (config.chartType) {
    case 'line':      return <LineChartView {...props} />;
    case 'area':      return <AreaChartView {...props} />;
    case 'scatter':   return <ScatterChartView {...props} />;
    case 'histogram': return <HistogramView {...props} />;
    case 'pie':       return <PieChartView {...props} />;
    default:          return <BarChartView {...props} />;
  }
}
