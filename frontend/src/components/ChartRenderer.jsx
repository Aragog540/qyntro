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

// ─── Plotly integration for Advanced Charts ─────────────────────────────────
import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

function PlotlyWrapper({ data, layout }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const defaultLayout = {
      margin: { t: 30, r: 20, l: 40, b: 40 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: 'var(--color-ink)', family: 'Outfit, sans-serif', size: 11 },
      showlegend: false,
      ...layout,
    };
    Plotly.newPlot(containerRef.current, data, defaultLayout, { displayModeBar: false, responsive: true });
    return () => { if (containerRef.current) Plotly.purge(containerRef.current); };
  }, [data, layout]);

  return <div ref={containerRef} className="w-full h-[320px]" />;
}

function BoxPlotView({ df, config }) {
  const { yCol, xCol } = config;
  if (!yCol) return <ChartPlaceholder message="Select a numeric Y column for Box Plot" />;
  const plotData = [{
    y: df.rows.map(r => Number(r[yCol])).filter(n => !isNaN(n)),
    x: xCol ? df.rows.map(r => r[xCol]) : undefined,
    type: 'box',
    marker: { color: COLORS[0] },
    boxpoints: 'outliers',
  }];
  return <PlotlyWrapper data={plotData} layout={{ yaxis: { title: yCol } }} />;
}

function ViolinPlotView({ df, config }) {
  const { yCol, xCol } = config;
  if (!yCol) return <ChartPlaceholder message="Select a numeric Y column for Violin Plot" />;
  const plotData = [{
    y: df.rows.map(r => Number(r[yCol])).filter(n => !isNaN(n)),
    x: xCol ? df.rows.map(r => r[xCol]) : undefined,
    type: 'violin',
    marker: { color: COLORS[1] },
    points: 'all',
    jitter: 0.3,
    box: { visible: true },
  }];
  return <PlotlyWrapper data={plotData} layout={{ yaxis: { title: yCol } }} />;
}

function HeatmapView({ df }) {
  const numCols = df.columns.filter(col => {
    const sample = df.rows.slice(0, 20).map(r => r[col]).filter(v => v != null && v !== '');
    return sample.some(v => typeof v === 'number' || !isNaN(Number(v)));
  });
  if (numCols.length < 2) return <ChartPlaceholder message="At least 2 numeric columns required for Heatmap" />;

  const getCol = col => df.rows.map(r => Number(r[col])).filter(n => !isNaN(n));
  const pearson = (xs, ys) => {
    const n = Math.min(xs.length, ys.length);
    if (n < 2) return 0;
    const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) { const ex = xs[i] - mx, ey = ys[i] - my; num += ex * ey; dx += ex * ex; dy += ey * ey; }
    return dx && dy ? +(num / Math.sqrt(dx * dy)).toFixed(2) : 0;
  };
  const colsData = numCols.map(c => ({ col: c, vals: getCol(c) }));
  const z = colsData.map(a => colsData.map(b => pearson(a.vals, b.vals)));

  const plotData = [{
    z, x: numCols, y: numCols, type: 'heatmap', colorscale: 'Viridis', zmin: -1, zmax: 1
  }];
  return <PlotlyWrapper data={plotData} layout={{ margin: { t: 20, r: 20, l: 60, b: 60 } }} />;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function ChartRenderer({ df, config }) {
  if (!df || !df.rows?.length) {
    return <ChartPlaceholder message="Run the pipeline to generate chart data" />;
  }

  const props = { df, config };
  switch (config?.chartType) {
    case 'line':      return <LineChartView {...props} />;
    case 'area':      return <AreaChartView {...props} />;
    case 'scatter':   return <ScatterChartView {...props} />;
    case 'histogram': return <HistogramView {...props} />;
    case 'pie':       return <PieChartView {...props} />;
    case 'box':       return <BoxPlotView {...props} />;
    case 'violin':    return <ViolinPlotView {...props} />;
    case 'heatmap':   return <HeatmapView {...props} />;
    default:          return <BarChartView {...props} />;
  }
}

