// components/Dashboard.jsx — Bottom drawer showing all chart outputs side-by-side
import { useStore } from '../store';
import { ChartRenderer } from './ChartRenderer';

export function Dashboard() {
  const dashboardOpen = useStore(s => s.dashboardOpen);
  const toggleDashboard = useStore(s => s.toggleDashboard);
  const nodes = useStore(s => s.nodes);
  const chartData = useStore(s => s.chartData);

  // Find all chart nodes that have data
  const chartNodes = nodes.filter(n => n.type === 'chart');
  const populatedCharts = chartNodes.filter(n => chartData[n.id]);

  if (!dashboardOpen) return null;

  return (
    <div className="dashboard-overlay" onClick={e => { if (e.target === e.currentTarget) toggleDashboard(); }}>
      <div className="dashboard-drawer">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-title-group">
            <span className="dashboard-icon">📊</span>
            <h2 className="dashboard-title">Dashboard</h2>
            <span className="dashboard-meta">
              {populatedCharts.length} of {chartNodes.length} chart{chartNodes.length !== 1 ? 's' : ''} populated
            </span>
          </div>
          <button className="dashboard-close" onClick={toggleDashboard} title="Close dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Charts grid */}
        <div className="dashboard-grid">
          {chartNodes.length === 0 && (
            <div className="dashboard-empty">
              <span>📈</span>
              <p>No Chart nodes on canvas</p>
              <p className="dashboard-empty-sub">Add Chart nodes from the Visualise section in the sidebar</p>
            </div>
          )}
          {chartNodes.length > 0 && populatedCharts.length === 0 && (
            <div className="dashboard-empty">
              <span>▶️</span>
              <p>Run the pipeline to populate charts</p>
            </div>
          )}
          {populatedCharts.map(node => (
            <div key={node.id} className="dashboard-chart-card">
              <div className="dashboard-chart-header">
                <span className="dashboard-chart-title">{node.data?.title || node.data?.label || node.id}</span>
                <span className="dashboard-chart-type">{node.data?.chartType || 'bar'}</span>
              </div>
              <ChartRenderer df={chartData[node.id]} config={node.data} compact />
            </div>
          ))}
          {/* Unpopulated charts (dimmed) */}
          {chartNodes.filter(n => !chartData[n.id]).map(node => (
            <div key={node.id} className="dashboard-chart-card dashboard-chart-card--empty">
              <div className="dashboard-chart-header">
                <span className="dashboard-chart-title">{node.data?.title || node.data?.label || node.id}</span>
              </div>
              <div className="dashboard-chart-placeholder">
                <span>📊</span>
                <p>Run pipeline to populate</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
