// components/DocsModal.jsx — Interactive User Guide & Node Reference documentation
import { useState, useMemo } from 'react';

const NODE_DOCS = [
  // Input / Output
  {
    type: 'load',
    label: 'Load Data',
    category: 'io',
    categoryName: 'Input / Output',
    badgeColor: 'var(--color-io)',
    icon: '📥',
    summary: 'Import data from uploaded files (CSV, TSV, JSON), external URLs, pasted text, or sample datasets.',
    inputs: 'None (Trigger source node)',
    outputs: 'DataFrame (Single or Multi-target)',
    fields: [
      { name: 'Source Type', desc: 'Choose between Upload File, URL, Paste CSV, or Sample Dataset.' },
      { name: 'File Upload', desc: 'Select a local file (.csv, .tsv, .json, .txt).' },
      { name: 'URL', desc: 'Direct URL path to remote CSV/JSON dataset.' },
      { name: 'Paste CSV', desc: 'Raw CSV content typed or pasted into a text box.' },
      { name: 'Sample Dataset', desc: 'Pre-loaded datasets: Iris (flower metrics), Titanic (passengers), Sales (demo orders).' },
    ],
    example: 'Select "Sample Dataset" → "Sales Orders" to quickly test a pipeline without uploading files.',
  },
  {
    type: 'preview',
    label: 'Preview Data',
    category: 'io',
    categoryName: 'Input / Output',
    badgeColor: 'var(--color-io)',
    icon: '👁️',
    summary: 'Display interactive tabular preview of DataFrame rows, column types, and total row count in the Inspector.',
    inputs: '1 DataFrame (multi-handle allowed)',
    outputs: 'DataFrame (Pass-through for downstream nodes)',
    fields: [],
    example: 'Connect after any transform or cleaning node to inspect the step-by-step intermediate output.',
  },
  {
    type: 'export',
    label: 'Export Data',
    category: 'io',
    categoryName: 'Input / Output',
    badgeColor: 'var(--color-io)',
    icon: '💾',
    summary: 'Trigger automatic browser download of the processed dataset in CSV, TSV, or JSON format when pipeline runs.',
    inputs: '1 DataFrame',
    outputs: 'None (Terminal sink node)',
    fields: [
      { name: 'Format', desc: 'Output file format: CSV, JSON, or TSV.' },
      { name: 'Filename', desc: 'Base filename for download (without extension).' },
    ],
    example: 'Set Format to CSV and Filename to "clean_report" to export results upon clicking ▶ Run.',
  },

  // Clean
  {
    type: 'dropNulls',
    label: 'Drop Nulls',
    category: 'clean',
    categoryName: 'Clean',
    badgeColor: 'var(--color-clean)',
    icon: '🧹',
    summary: 'Remove rows containing null, undefined, NaN, or empty values across specified or all columns.',
    inputs: '1 DataFrame',
    outputs: '1 Cleaned DataFrame',
    fields: [
      { name: 'Drop Mode', desc: '"Any" = drop row if any column is null. "All" = drop row only if all columns are null.' },
      { name: 'Columns', desc: 'Comma-separated list of target columns. Leave blank to check all columns.' },
    ],
    example: 'Set Columns to "price, quantity" to filter out incomplete transactions.',
  },
  {
    type: 'fillNulls',
    label: 'Fill Nulls',
    category: 'clean',
    categoryName: 'Clean',
    badgeColor: 'var(--color-clean)',
    icon: '🩺',
    summary: 'Impute missing values using numerical statistics (Mean, Median), mode (most frequent), or custom default values.',
    inputs: '1 DataFrame',
    outputs: '1 Imputed DataFrame',
    fields: [
      { name: 'Column', desc: 'Target column name to fill missing values for.' },
      { name: 'Fill Strategy', desc: 'Mean, Median, Mode (most frequent), or Custom Value.' },
      { name: 'Custom Value', desc: 'Value to substitute when "Custom value" strategy is selected.' },
    ],
    example: 'Fill missing values in "age" column using "Mean (numeric)".',
  },
  {
    type: 'dedupe',
    label: 'Deduplicate',
    category: 'clean',
    categoryName: 'Clean',
    badgeColor: 'var(--color-clean)',
    icon: '👯',
    summary: 'Remove exact duplicate rows from the dataset based on selected key columns or all columns combined.',
    inputs: '1 DataFrame',
    outputs: '1 Deduplicated DataFrame',
    fields: [
      { name: 'Key Columns', desc: 'Comma-separated column names to evaluate uniqueness. Leave blank to check all fields.' },
    ],
    example: 'Set Key Columns to "order_id" to ensure each order appears only once.',
  },
  {
    type: 'typeCast',
    label: 'Type Cast',
    category: 'clean',
    categoryName: 'Clean',
    badgeColor: 'var(--color-clean)',
    icon: '🔀',
    summary: 'Convert column values to a specific target data type (Number, String, Boolean, or ISO Date).',
    inputs: '1 DataFrame',
    outputs: '1 Converted DataFrame',
    fields: [
      { name: 'Column', desc: 'Target column name to cast.' },
      { name: 'Cast To', desc: 'Number, String, Boolean, or Date (ISO string).' },
    ],
    example: 'Cast string column "revenue" to "Number" to enable mathematical aggregations.',
  },
  {
    type: 'trimStrings',
    label: 'Trim Strings',
    category: 'clean',
    categoryName: 'Clean',
    badgeColor: 'var(--color-clean)',
    icon: '✂️',
    summary: 'Strip leading and trailing whitespace characters from string column values.',
    inputs: '1 DataFrame',
    outputs: '1 Trimmed DataFrame',
    fields: [
      { name: 'Columns', desc: 'Comma-separated text column names. Leave blank to trim all string columns.' },
    ],
    example: 'Trim whitespace from user-entered text fields like "email" or "category".',
  },

  // Transform
  {
    type: 'filterRows',
    label: 'Filter Rows',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '🔍',
    summary: 'Filter dataset rows matching logical condition rules (=, ≠, >, <, ≥, ≤, contains, starts with, ends with, null, regex).',
    inputs: '1 DataFrame',
    outputs: '1 Filtered DataFrame',
    fields: [
      { name: 'Action', desc: '"Keep matching" to retain rows, or "Drop matching" to exclude them.' },
      { name: 'Column', desc: 'Target column name (select from dropdown or type).' },
      { name: 'Operator', desc: '=, ≠, >, <, >=, <=, contains, starts with, ends with, is null, not null, matches regex.' },
      { name: 'Value', desc: 'Comparison criteria value or regular expression pattern.' },
    ],
    example: 'Keep matching rows where "revenue" > "200".',
  },
  {
    type: 'selectCols',
    label: 'Select Columns',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '📌',
    summary: 'Include or drop specific columns to keep your dataset focused and efficient.',
    inputs: '1 DataFrame',
    outputs: '1 Column-filtered DataFrame',
    fields: [
      { name: 'Action', desc: '"Keep selected" or "Drop selected".' },
      { name: 'Columns', desc: 'Comma-separated list of column names.' },
    ],
    example: 'Keep selected columns: "order_id, date, revenue".',
  },
  {
    type: 'rename',
    label: 'Rename Columns',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '🏷️',
    summary: 'Batch rename columns using simple mapping rules (one per line: `old_name → new_name`).',
    inputs: '1 DataFrame',
    outputs: '1 Renamed DataFrame',
    fields: [
      { name: 'Rename Map', desc: 'One rule per line, e.g. `unit_price → Price ($)` or `qty -> Quantity`.' },
    ],
    example: 'Map `cust_id → Customer ID` and `total -> Total Revenue`.',
  },
  {
    type: 'addColumn',
    label: 'Add Column',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '➕',
    summary: 'Create a calculated column using JavaScript expressions with row fields in scope.',
    inputs: '1 DataFrame',
    outputs: '1 Augmented DataFrame',
    fields: [
      { name: 'New Column Name', desc: 'Name of the calculated column to add.' },
      { name: 'Expression', desc: 'JS expression (e.g. `unit_price * quantity` or `age > 18 ? "Adult" : "Minor"`).' },
    ],
    example: 'Add column `revenue` with expression `quantity * unit_price`.',
  },
  {
    type: 'pivot',
    label: 'Pivot Table',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '📐',
    summary: 'Reshape long data into a wide pivot table, grouping by index and spreading values across column headers.',
    inputs: '1 DataFrame',
    outputs: '1 Pivoted DataFrame',
    fields: [
      { name: 'Index Column', desc: 'Row identifier column (e.g. date or region).' },
      { name: 'Columns Column', desc: 'Column whose unique values become new column headers (e.g. category).' },
      { name: 'Values Column', desc: 'Numeric column to aggregate (e.g. revenue).' },
      { name: 'Aggregation', desc: 'Sum, Mean (avg), Count, Min, or Max.' },
    ],
    example: 'Pivot Index "region" × Columns "category" with Values "revenue" aggregated by Sum.',
  },
  {
    type: 'melt',
    label: 'Melt (Unpivot)',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '🥞',
    summary: 'Unpivot wide data into a long format, converting column headers into variable and value rows.',
    inputs: '1 DataFrame',
    outputs: '1 Melted DataFrame',
    fields: [
      { name: 'ID Columns', desc: 'Columns to keep as fixed row identifiers.' },
      { name: 'Variable Column Name', desc: 'New column name for former header titles (default: "variable").' },
      { name: 'Value Column Name', desc: 'New column name for data values (default: "value").' },
    ],
    example: 'Unpivot monthly columns into long rows with ID column "product".',
  },
  {
    type: 'rolling',
    label: 'Rolling Window',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '🌊',
    summary: 'Compute rolling (moving) window calculations like moving averages or cumulative sums over N rows.',
    inputs: '1 DataFrame',
    outputs: '1 Windowed DataFrame',
    fields: [
      { name: 'Input Column', desc: 'Numeric column to compute window operation on.' },
      { name: 'Window Size', desc: 'Number of consecutive rows in window (e.g. 3, 7, 30).' },
      { name: 'Function', desc: 'Rolling Mean (Moving Avg), Rolling Sum, Rolling Max, Rolling Min.' },
      { name: 'Output Column', desc: 'Name of generated column (blank = auto-generated).' },
    ],
    example: 'Calculate 7-day moving average on column "revenue".',
  },
  {
    type: 'stringOps',
    label: 'String Ops',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '🔤',
    summary: 'Apply text manipulation operations: UPPER CASE, lower case, replace, regex extract, split, prefix, suffix.',
    inputs: '1 DataFrame',
    outputs: '1 Modified DataFrame',
    fields: [
      { name: 'Column', desc: 'Input string column.' },
      { name: 'Operation', desc: 'UPPER, lower, trim, replace, extract (regex), split, length, prefix, suffix.' },
      { name: 'Param 1 & 2', desc: 'Pattern/delimiter/prefix and replacement/group index.' },
      { name: 'Output Column', desc: 'Target column name (blank = overwrite input column).' },
    ],
    example: 'Convert "product" column to UPPER CASE.',
  },
  {
    type: 'describe',
    label: 'Describe',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '📊',
    summary: 'Generate summary statistical metrics (count, mean, std, min, 25%, 50%, 75%, max) for all numeric columns.',
    inputs: '1 DataFrame',
    outputs: '1 Summary Statistics DataFrame',
    fields: [],
    example: 'Connect to inspect central tendency and variance of numerical features.',
  },
  {
    type: 'sample',
    label: 'Sample',
    category: 'transform',
    categoryName: 'Transform',
    badgeColor: 'var(--color-transform)',
    icon: '🎲',
    summary: 'Extract a random sample subset of rows by absolute row count or percentage with reproducible random seed.',
    inputs: '1 DataFrame',
    outputs: '1 Sampled DataFrame',
    fields: [
      { name: 'Sample By', desc: 'Number of rows or Percentage (%).' },
      { name: 'N rows / %', desc: 'Quantity or percentage to sample (e.g. 100 or 10).' },
      { name: 'Random Seed', desc: 'Integer seed for reproducible sampling (default: 42).' },
    ],
    example: 'Sample 10% of a large dataset to speed up pipeline development and testing.',
  },

  // Organize
  {
    type: 'sort',
    label: 'Sort',
    category: 'organize',
    categoryName: 'Organize',
    badgeColor: 'var(--color-organize)',
    icon: '🔀',
    summary: 'Sort DataFrame rows by a specific column in Ascending (↑) or Descending (↓) order.',
    inputs: '1 DataFrame',
    outputs: '1 Sorted DataFrame',
    fields: [
      { name: 'Sort By Column', desc: 'Target column name to sort.' },
      { name: 'Direction', desc: 'Ascending (A-Z, 0-9) or Descending (Z-A, 9-0).' },
    ],
    example: 'Sort by "revenue" Descending (↓) to find top performing transactions.',
  },
  {
    type: 'slice',
    label: 'Slice',
    category: 'organize',
    categoryName: 'Organize',
    badgeColor: 'var(--color-organize)',
    icon: '🍰',
    summary: 'Take the First N or Last N rows from the dataset.',
    inputs: '1 DataFrame',
    outputs: '1 Sliced DataFrame',
    fields: [
      { name: 'Number of Rows', desc: 'Integer count of rows to keep (e.g. 10, 50, 100).' },
      { name: 'Take', desc: 'First N rows or Last N rows.' },
    ],
    example: 'Slice "First 10 rows" after sorting to display top 10 leaderboard.',
  },
  {
    type: 'aggregate',
    label: 'Aggregate',
    category: 'organize',
    categoryName: 'Organize',
    badgeColor: 'var(--color-organize)',
    icon: '🧮',
    summary: 'Group data by categorical columns and compute aggregate functions (SUM, AVG, COUNT, MIN, MAX).',
    inputs: '1 DataFrame',
    outputs: '1 Aggregated DataFrame',
    fields: [
      { name: 'Group By', desc: 'Comma-separated categorical columns (e.g. "category, region").' },
      { name: 'Aggregate Column', desc: 'Numeric column to aggregate (e.g. "revenue").' },
      { name: 'Function', desc: 'SUM, AVG (mean), COUNT, MIN, MAX.' },
    ],
    example: 'Group by "region" and compute SUM of "revenue". Output column name becomes `sum(revenue)`.',
  },

  // Combine
  {
    type: 'join',
    label: 'Join',
    category: 'combine',
    categoryName: 'Combine',
    badgeColor: 'var(--color-combine)',
    icon: '🔗',
    summary: 'Combine two DataFrames side-by-side using a shared join key column (Inner, Left, or Right join).',
    inputs: '2 DataFrames (Left target handle & Right target handle)',
    outputs: '1 Merged DataFrame',
    fields: [
      { name: 'Join Key Column', desc: 'Common key field in both datasets (e.g. "id" or "order_id").' },
      { name: 'Join Type', desc: 'Inner (matching only), Left (all left rows), Right (all right rows).' },
    ],
    example: 'Join Sales Data (Left) with Customer Info (Right) on join key "customer_id".',
  },
  {
    type: 'concat',
    label: 'Concat',
    category: 'combine',
    categoryName: 'Combine',
    badgeColor: 'var(--color-combine)',
    icon: '📚',
    summary: 'Stack multiple DataFrames vertically row-wise (concatenating multiple input streams).',
    inputs: '2 or 3 DataFrames (Handles df1, df2, df3)',
    outputs: '1 Combined DataFrame',
    fields: [],
    example: 'Connect Q1 sales (df1) and Q2 sales (df2) to combine into a full half-year dataset.',
  },

  // Quality
  {
    type: 'profiler',
    label: 'Data Profiler',
    category: 'quality',
    categoryName: 'Quality',
    badgeColor: 'var(--color-quality)',
    icon: '🔬',
    summary: 'Automatically compute data quality metrics, null ratios, distinct counts, min/max, and type health for all columns.',
    inputs: '1 DataFrame',
    outputs: '1 DataFrame (Pass-through for pipeline)',
    fields: [],
    example: 'Attach to any stream and open Node Inspector → Profiler tab to view complete dataset health.',
  },
  {
    type: 'schemaValidator',
    label: 'Schema Validator',
    category: 'quality',
    categoryName: 'Quality',
    badgeColor: 'var(--color-quality)',
    icon: '🛡️',
    summary: 'Enforce structural schema constraints and validate column existence and expected data types.',
    inputs: '1 DataFrame',
    outputs: '1 DataFrame (Throws error if validation fails)',
    fields: [
      { name: 'Schema Definition', desc: 'Rules format: `col_name:type, ...` (e.g. `order_id:number, date:date, status:string`).' },
    ],
    example: 'Validate that incoming raw CSV contains required fields `user_id:number, signup_date:date`.',
  },

  // Visualise
  {
    type: 'chart',
    label: 'Chart',
    category: 'visualise',
    categoryName: 'Visualise',
    badgeColor: 'var(--color-visualise)',
    icon: '📊',
    summary: 'Generate interactive data visualisations with 9 chart types. Automatically populates the floating Dashboard Drawer.',
    inputs: '1 DataFrame',
    outputs: '1 DataFrame (Pass-through)',
    fields: [
      { name: 'Chart Type', desc: 'Bar, Line, Area, Scatter, Histogram, Pie, Box Plot, Violin Plot, Heatmap.' },
      { name: 'X Axis / Category', desc: 'Column for X axis categories or dates.' },
      { name: 'Y Axis / Value', desc: 'Numeric column for Y values.' },
      { name: 'Group / Color By', desc: 'Optional breakdown column for grouped bar/line/scatter series.' },
      { name: 'Title', desc: 'Custom title displayed on chart card and Dashboard drawer.' },
    ],
    example: 'Create a Bar chart with X="category", Y="sum(revenue)" to visualize sales breakdown.',
  },

  // Utility
  {
    type: 'comment',
    label: 'Comment (Note)',
    category: 'utility',
    categoryName: 'Utility',
    badgeColor: 'var(--color-utility)',
    icon: '📝',
    summary: 'Sticky note text annotation for documenting pipeline logic on the canvas. Does not execute or affect data.',
    inputs: 'None (Standalone visual element)',
    outputs: 'None',
    fields: [
      { name: 'Note Text', desc: 'Markdown or plain text documentation note.' },
    ],
    example: 'Add notes above complex joins or filters explaining business rules for teammates.',
  },
];

export function DocsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'nodes' | 'features' | 'tips'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeNode, setActiveNode] = useState(NODE_DOCS[0]);

  // Filtered nodes for Node Reference tab
  const filteredNodes = useMemo(() => {
    return NODE_DOCS.filter(n => {
      const matchesCat = selectedCategory === 'all' || n.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        n.label.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.categoryName.toLowerCase().includes(q) ||
        n.fields.some(f => f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q))
      );
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="modal-backdrop z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="modal-content flex flex-col w-full max-w-5xl h-[85vh] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4 bg-surface-2/50">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent text-xl border border-accent/30 shadow-inner">
              📖
            </span>
            <div>
              <h2 className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
                Qyntro Documentation & Reference Guide
              </h2>
              <p className="text-xs text-ink-muted">Master visual data pipelines, nodes, shortcuts, and features</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-muted hover:bg-surface-2 hover:text-ink transition-all text-lg font-bold"
              title="Close documentation (Esc)"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Top Navigation Tabs & Search */}
        <div className="flex flex-wrap shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-2.5 gap-3">
          <div className="flex items-center gap-1">
            {[
              { id: 'overview', label: '🚀 Getting Started' },
              { id: 'nodes',    label: `🧩 Node Library (${NODE_DOCS.length})` },
              { id: 'features', label: '⚡ Application Features' },
              { id: 'tips',     label: '💡 Tips & FAQ' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'nodes') setActiveTab('nodes');
              }}
              placeholder="Search nodes, features, fields..."
              className="w-full rounded-lg border border-border bg-canvas pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-canvas/40">
          {activeTab === 'overview' && <OverviewTab onNavigateNodes={() => setActiveTab('nodes')} />}
          {activeTab === 'nodes' && (
            <NodesTab
              filteredNodes={filteredNodes}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              activeNode={activeNode}
              setActiveNode={setActiveNode}
              searchQuery={searchQuery}
            />
          )}
          {activeTab === 'features' && <FeaturesTab />}
          {activeTab === 'tips' && <TipsTab />}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-6 py-3 text-xs text-ink-muted">
          <span>Qyntro Visual Data Flow Engine • Client-side In-memory Processing</span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px]">Shortcuts: Drag node, Click handle to wire</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-surface-2 border border-border text-ink hover:border-border-hover font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TAB 1: OVERVIEW / GETTING STARTED
   ───────────────────────────────────────────────────────────────────────────── */
function OverviewTab({ onNavigateNodes }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-surface to-accent/5 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="text-4xl">⚡</span>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-ink tracking-tight">Welcome to Qyntro Visual Data Flow</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Qyntro is an interactive visual ETL & data analysis workspace. Construct powerful data processing pipelines
              by dragging node building blocks onto a visual canvas, connecting output handles to input handles, and executing in real-time right inside your browser.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={onNavigateNodes}
                className="px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:opacity-90 transition-all shadow-md shadow-accent/20"
              >
                Browse All 27 Nodes →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step Quickstart */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Quickstart Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Add Input Data',
              icon: '📥',
              desc: 'Drag a Load node from the left palette. Upload a CSV/JSON file, paste data, or pick a sample dataset (Iris, Titanic, Sales).',
            },
            {
              step: '02',
              title: 'Build Workflow',
              icon: '🧩',
              desc: 'Drag nodes for Cleaning, Filtering, Transforming, Aggregating, or Joining. Click and drag handle handles to connect nodes.',
            },
            {
              step: '03',
              title: 'Run Pipeline',
              icon: '▶️',
              desc: 'Click the ▶ Run button in the header. Qyntro executes your Directed Acyclic Graph (DAG) topographically in milliseconds.',
            },
            {
              step: '04',
              title: 'Inspect & Export',
              icon: '📊',
              desc: 'Click any node to inspect output tables and charts in the right panel. Export processed data to CSV/JSON or export executable Python/SQL code.',
            },
          ].map(s => (
            <div key={s.step} className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between hover:border-accent/40 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl">{s.icon}</span>
                  <span className="font-mono text-[10px] font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                    STEP {s.step}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-ink">{s.title}</h5>
                <p className="text-[11px] text-ink-muted leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application UI Layout Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Application Layout</h4>
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <span>👈 Left Sidebar</span>
                <span className="text-[10px] text-accent font-mono">Node Palette</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Search and filter node blocks by category. Drag onto canvas or select pre-built recipes from the <strong>Templates Gallery</strong>.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <span>🎨 Center Workspace</span>
                <span className="text-[10px] text-accent font-mono">ReactFlow Canvas</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Interactive node graph workspace. Drag nodes, draw edge connections between handles, pan canvas, zoom, and clear canvas.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                <span>👉 Right Sidebar</span>
                <span className="text-[10px] text-accent font-mono">Node Inspector</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Configure node parameters, column dropdown pickers, view paginated output data tables, column data profilers, and charts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Cheat Sheet */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Keyboard & Canvas Shortcuts</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'Drag Node', label: 'Add to Canvas' },
            { key: 'Click Node', label: 'Select & Inspect' },
            { key: 'Backspace / Del', label: 'Delete Selected Node/Edge' },
            { key: 'Scroll Wheel', label: 'Zoom In / Out' },
            { key: 'Drag Canvas', label: 'Pan Canvas' },
            { key: 'Double Click Edge', label: 'Remove Connection' },
            { key: 'Click Handle', label: 'Draw Wire Handle' },
            { key: 'Shift + Drag', label: 'Box Multi-Select' },
          ].map(sc => (
            <div key={sc.key} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
              <span className="text-[11px] text-ink-muted">{sc.label}</span>
              <kbd className="font-mono text-[10px] font-semibold text-ink bg-surface-2 border border-border px-1.5 py-0.5 rounded shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TAB 2: COMPREHENSIVE NODE LIBRARY (27 NODES)
   ───────────────────────────────────────────────────────────────────────────── */
function NodesTab({ filteredNodes, selectedCategory, setSelectedCategory, activeNode, setActiveNode, searchQuery }) {
  const categories = [
    { id: 'all',       label: `All Nodes (${NODE_DOCS.length})`, color: 'var(--color-ink)' },
    { id: 'io',        label: 'Input / Output', color: 'var(--color-io)' },
    { id: 'clean',     label: 'Clean',          color: 'var(--color-clean)' },
    { id: 'transform', label: 'Transform',      color: 'var(--color-transform)' },
    { id: 'organize',  label: 'Organize',       color: 'var(--color-organize)' },
    { id: 'combine',   label: 'Combine',        color: 'var(--color-combine)' },
    { id: 'quality',   label: 'Quality',        color: 'var(--color-quality)' },
    { id: 'visualise', label: 'Visualise',      color: 'var(--color-visualise)' },
    { id: 'utility',   label: 'Utility',        color: 'var(--color-utility)' },
  ];

  const current = activeNode || filteredNodes[0] || NODE_DOCS[0];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* Left List of Nodes */}
      <div className="w-full md:w-80 shrink-0 flex flex-col space-y-3">
        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-border bg-surface">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                selectedCategory === c.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Node Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-1">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-8 text-ink-muted text-xs">
              No nodes match search query &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredNodes.map(n => {
              const isSelected = current?.type === n.type;
              return (
                <div
                  key={n.type}
                  onClick={() => setActiveNode(n)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-md shadow-accent/10'
                      : 'border-border bg-surface hover:border-border-hover hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{n.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-ink truncate">{n.label}</span>
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-surface-2 text-ink-muted border border-border">
                          {n.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-muted truncate">{n.summary}</p>
                    </div>
                  </div>
                  <span
                    className="h-2 w-2 rounded-full shrink-0 ml-2"
                    style={{ backgroundColor: n.badgeColor }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detailed Inspector Panel for Selected Node */}
      <div className="flex-1 rounded-2xl border border-border bg-surface p-6 overflow-y-auto space-y-5 shadow-sm">
        {current ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-2xl border border-border shadow-inner">
                  {current.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-ink">{current.label}</h3>
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white shadow-sm"
                      style={{ backgroundColor: current.badgeColor }}
                    >
                      {current.categoryName}
                    </span>
                    <span className="font-mono text-xs text-ink-muted">type: &quot;{current.type}&quot;</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{current.summary}</p>
                </div>
              </div>
            </div>

            {/* Inputs & Outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-canvas p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-ink-muted tracking-wider flex items-center gap-1">
                  📥 Input Handles
                </span>
                <p className="text-xs font-mono text-ink">{current.inputs}</p>
              </div>
              <div className="rounded-xl border border-border bg-canvas p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-ink-muted tracking-wider flex items-center gap-1">
                  📤 Output Handles
                </span>
                <p className="text-xs font-mono text-ink">{current.outputs}</p>
              </div>
            </div>

            {/* Configurable Fields */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Configurable Options & Parameters ({current.fields.length})
              </h4>
              {current.fields.length === 0 ? (
                <p className="text-xs text-ink-muted italic bg-canvas p-3 rounded-xl border border-border">
                  No configuration required. Connect data handles and click ▶ Run.
                </p>
              ) : (
                <div className="rounded-xl border border-border bg-canvas divide-y divide-border overflow-hidden">
                  {current.fields.map(f => (
                    <div key={f.name} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-semibold text-ink font-mono">{f.name}</span>
                      <span className="text-ink-muted sm:text-right">{f.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Practical Example */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-1">
              <h5 className="text-xs font-bold text-accent flex items-center gap-1.5">
                <span>💡 Example Usage Scenario</span>
              </h5>
              <p className="text-xs text-ink-muted leading-relaxed">{current.example}</p>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-ink-muted text-xs">Select a node from the list to view docs</div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TAB 3: APPLICATION FEATURES
   ───────────────────────────────────────────────────────────────────────────── */
function FeaturesTab() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Feature 1: Execution Engine */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-2 hover:border-accent/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h4 className="text-sm font-bold text-ink">In-Memory Async DAG Execution</h4>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Qyntro analyzes your connected canvas graph using topological sorting (`topoSort`) to resolve execution dependencies.
            Data processing runs asynchronously in your browser memory without sending private data to external servers.
          </p>
        </div>

        {/* Feature 2: Code Generator */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-2 hover:border-accent/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💻</span>
            <h4 className="text-sm font-bold text-ink">Python (pandas) & SQL Code Generator</h4>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Click the <strong>💻 Code</strong> button in the header toolbar to instantly generate production-ready executable
            Python pandas code or SQL queries matching your exact visual pipeline topology.
          </p>
        </div>

        {/* Feature 3: Data Profiler */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-2 hover:border-accent/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            <h4 className="text-sm font-bold text-ink">Automated Data Profiler</h4>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Attach a <strong>Data Profiler</strong> node to automatically analyze missing value ratios, distinct value counts, data types, min/max bounds, and distribution stats for every column in your dataset.
          </p>
        </div>

        {/* Feature 4: Dashboard Drawer */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-2 hover:border-accent/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h4 className="text-sm font-bold text-ink">Floating Dashboard Drawer</h4>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            When your pipeline includes <strong>Chart</strong> nodes, click the <strong>📊 Dashboard</strong> button in the top navigation header to open an aggregated dashboard drawer displaying all rendered charts in one responsive grid.
          </p>
        </div>

        {/* Feature 5: Pipeline Templates */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-2 hover:border-accent/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📑</span>
            <h4 className="text-sm font-bold text-ink">Template Gallery Recipes</h4>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Explore 9 pre-built pipeline templates in the Left Sidebar (Quick Preview, Clean & Export, Sales Analysis, Aggregations, Charting, and Data Profiling) to jumpstart your analysis.
          </p>
        </div>

        {/* Feature 6: State Persistence */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-2 hover:border-accent/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💾</span>
            <h4 className="text-sm font-bold text-ink">Pipeline Save / Load & Auto-Save</h4>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            Qyntro automatically auto-saves your canvas workflow to browser LocalStorage. Use the <strong>💾 Save</strong> and <strong>📂 Load</strong> buttons to export or import pipeline `.json` project files anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TAB 4: TIPS & FAQ
   ───────────────────────────────────────────────────────────────────────────── */
function TipsTab() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {[
        {
          q: 'Why does a node show an error when I click Run?',
          a: 'Make sure previous nodes are connected to an active Load node and executed. For nodes like Filter Rows or Fill Nulls, ensure you select valid column names from the Node Inspector configuration fields.',
        },
        {
          q: 'How do Join and Concat handle multiple input connections?',
          a: 'Join nodes have dedicated "left" and "right" target handles on their left edge. Concat nodes have handles labeled "df1", "df2", and "df3" to combine up to 3 streams simultaneously.',
        },
        {
          q: 'How does Auto Column Resolution work?',
          a: 'When you select a node on the canvas, Qyntro detects the schema of upstream connected nodes and populates column picker dropdowns in the inspector automatically.',
        },
        {
          q: 'Is my dataset uploaded to any cloud server?',
          a: 'No! All data parsing (via PapaParse) and matrix transformations take place 100% locally inside your browser runtime memory. Your data never leaves your device.',
        },
        {
          q: 'How do I clear or reset the canvas safely?',
          a: 'Click the Trash icon button in the header toolbar. It features an armed confirmation state—click once to arm, then click a second time within 3 seconds to clear all nodes.',
        },
      ].map((faq, idx) => (
        <div key={idx} className="rounded-xl border border-border bg-surface p-4 space-y-1 hover:border-accent/30 transition-all">
          <h4 className="text-xs font-bold text-ink flex items-center gap-2">
            <span className="text-accent font-mono">Q:</span> {faq.q}
          </h4>
          <p className="text-xs text-ink-muted leading-relaxed pl-5">{faq.a}</p>
        </div>
      ))}
    </div>
  );
}
