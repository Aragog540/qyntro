// pipelineTemplates.js — Pre-built pipeline recipes for the Template Gallery

export const PIPELINE_TEMPLATES = [
  {
    id: 'quick-preview',
    title: 'Quick Preview',
    description: 'Load any CSV/JSON file and instantly preview its contents. The fastest way to explore a new dataset.',
    icon: '👁️',
    tags: ['beginner', 'io'],
    pipeline: ['Load', 'Preview'],
    nodes: [
      {
        type: 'load',
        position: { x: 80, y: 160 },
        data: { sourceType: 'file', fileList: [] },
      },
      {
        type: 'preview',
        position: { x: 360, y: 160 },
        data: { _previewRows: null },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
    ],
  },

  {
    id: 'clean-export',
    title: 'Clean & Export',
    description: 'Remove missing values and duplicates from your data, then export a clean version ready for analysis.',
    icon: '🧹',
    tags: ['cleaning', 'io'],
    pipeline: ['Load', 'Drop Nulls', 'Deduplicate', 'Export'],
    nodes: [
      {
        type: 'load',
        position: { x: 60, y: 160 },
        data: { sourceType: 'file', fileList: [] },
      },
      {
        type: 'dropNulls',
        position: { x: 340, y: 160 },
        data: { mode: 'any', cols: '' },
      },
      {
        type: 'dedupe',
        position: { x: 620, y: 160 },
        data: { cols: '' },
      },
      {
        type: 'export',
        position: { x: 900, y: 160 },
        data: { format: 'csv', filename: 'cleaned_output' },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
    ],
  },

  {
    id: 'sales-analysis',
    title: 'Sales Analysis',
    description: 'Clean string whitespace, filter to relevant records, sort by a key column, then export for reporting.',
    icon: '📊',
    tags: ['analysis', 'transform'],
    pipeline: ['Load', 'Trim Strings', 'Filter Rows', 'Sort', 'Export'],
    nodes: [
      {
        type: 'load',
        position: { x: 60, y: 160 },
        data: { sourceType: 'file', fileList: [] },
      },
      {
        type: 'trimStrings',
        position: { x: 340, y: 160 },
        data: { cols: '' },
      },
      {
        type: 'filterRows',
        position: { x: 620, y: 160 },
        data: { col: '', op: 'not null', value: '', mode: 'keep' },
      },
      {
        type: 'sort',
        position: { x: 900, y: 160 },
        data: { col: '', dir: 'desc' },
      },
      {
        type: 'export',
        position: { x: 1180, y: 160 },
        data: { format: 'csv', filename: 'sales_report' },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
      { sourceIndex: 3, targetIndex: 4 },
    ],
  },

  {
    id: 'type-fixer',
    title: 'Data Type Fixer',
    description: 'Cast a column to the right type and fill any remaining missing values before previewing the result.',
    icon: '🔧',
    tags: ['cleaning', 'types'],
    pipeline: ['Load', 'Type Cast', 'Fill Nulls', 'Preview'],
    nodes: [
      {
        type: 'load',
        position: { x: 60, y: 160 },
        data: { sourceType: 'file', fileList: [] },
      },
      {
        type: 'typeCast',
        position: { x: 340, y: 160 },
        data: { col: '', targetType: 'number' },
      },
      {
        type: 'fillNulls',
        position: { x: 620, y: 160 },
        data: { col: '', strategy: 'mean', value: '' },
      },
      {
        type: 'preview',
        position: { x: 900, y: 160 },
        data: { _previewRows: null },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
    ],
  },

  {
    id: 'aggregate-report',
    title: 'Aggregate & Report',
    description: 'Group your data by a category column, compute a summary metric (sum/avg/count), then export the report.',
    icon: '📈',
    tags: ['analysis', 'organize'],
    pipeline: ['Load', 'Drop Nulls', 'Aggregate', 'Sort', 'Export'],
    nodes: [
      {
        type: 'load',
        position: { x: 60, y: 160 },
        data: { sourceType: 'file', fileList: [] },
      },
      {
        type: 'dropNulls',
        position: { x: 340, y: 160 },
        data: { mode: 'any', cols: '' },
      },
      {
        type: 'aggregate',
        position: { x: 620, y: 160 },
        data: { groupBy: '', aggCol: '', aggFn: 'sum' },
      },
      {
        type: 'sort',
        position: { x: 900, y: 160 },
        data: { col: '', dir: 'desc' },
      },
      {
        type: 'export',
        position: { x: 1180, y: 160 },
        data: { format: 'csv', filename: 'aggregated_report' },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
      { sourceIndex: 3, targetIndex: 4 },
    ],
  },

  {
    id: 'full-clean',
    title: 'Full Clean Pipeline',
    description: 'The complete cleaning workflow: drop nulls, fill remaining gaps, deduplicate, trim whitespace, then export pristine data.',
    icon: '✨',
    tags: ['cleaning', 'advanced'],
    pipeline: ['Load', 'Drop Nulls', 'Fill Nulls', 'Deduplicate', 'Trim Strings', 'Export'],
    nodes: [
      {
        type: 'load',
        position: { x: 60, y: 200 },
        data: { sourceType: 'file', fileList: [] },
      },
      {
        type: 'dropNulls',
        position: { x: 340, y: 200 },
        data: { mode: 'all', cols: '' },
      },
      {
        type: 'fillNulls',
        position: { x: 620, y: 200 },
        data: { col: '', strategy: 'mean', value: '' },
      },
      {
        type: 'dedupe',
        position: { x: 900, y: 200 },
        data: { cols: '' },
      },
      {
        type: 'trimStrings',
        position: { x: 1180, y: 200 },
        data: { cols: '' },
      },
      {
        type: 'export',
        position: { x: 1460, y: 200 },
        data: { format: 'csv', filename: 'fully_cleaned' },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
      { sourceIndex: 3, targetIndex: 4 },
      { sourceIndex: 4, targetIndex: 5 },
    ],
  },
  {
    id: 'bar-chart',
    title: 'Bar Chart',
    description: 'Load data, aggregate by a category column, then visualise the totals as a bar chart.',
    icon: '📊',
    tags: ['visualise', 'analysis'],
    pipeline: ['Load', 'Drop Nulls', 'Aggregate', 'Chart'],
    nodes: [
      {
        type: 'load',
        position: { x: 60, y: 160 },
        data: { sourceType: 'file', fileList: [] },
      },
      {
        type: 'dropNulls',
        position: { x: 340, y: 160 },
        data: { mode: 'any', cols: '' },
      },
      {
        type: 'aggregate',
        position: { x: 620, y: 160 },
        data: { groupBy: '', aggCol: '', aggFn: 'sum' },
      },
      {
        type: 'chart',
        position: { x: 900, y: 160 },
        data: { chartType: 'bar', xCol: '', yCol: '', colorCol: '', title: 'Bar Chart' },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
    ],
  },

  {
    id: 'line-chart',
    title: 'Line Chart',
    description: 'Sort your data by a time or sequence column and visualise trends with a smooth line chart.',
    icon: '📈',
    tags: ['visualise', 'analysis'],
    pipeline: ['Load', 'Drop Nulls', 'Sort', 'Chart'],
    nodes: [
      {
        type: 'load',
        position: { x: 60, y: 160 },
        data: { sourceType: 'file', fileList: [] },
      },
      {
        type: 'dropNulls',
        position: { x: 340, y: 160 },
        data: { mode: 'any', cols: '' },
      },
      {
        type: 'sort',
        position: { x: 620, y: 160 },
        data: { col: '', dir: 'asc' },
      },
      {
        type: 'chart',
        position: { x: 900, y: 160 },
        data: { chartType: 'line', xCol: '', yCol: '', colorCol: '', title: 'Line Chart' },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
    ],
  },
  {
    id: 'data-profiler',

    title: 'Data Profiling & Quality',
    description: 'Load sample data, automatically profile every column, and validate schema integrity.',
    icon: '🔬',
    tags: ['quality', 'analysis'],
    pipeline: ['Load', 'Data Profiler', 'Schema Validator'],
    nodes: [
      {
        type: 'load',
        position: { x: 60, y: 160 },
        data: { sourceType: 'sample', sampleName: 'sales' },
      },
      {
        type: 'profiler',
        position: { x: 340, y: 160 },
        data: {},
      },
      {
        type: 'schemaValidator',
        position: { x: 620, y: 160 },
        data: { schema: 'order_id:number, product:string, date:date' },
      },
    ],
    edges: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
    ],
  },
];


// Tag color mapping
export const TAG_COLORS = {


  beginner:  { bg: 'rgba(52,211,153,0.15)',  text: '#34d399' },
  io:        { bg: 'rgba(99,102,241,0.15)',   text: '#818cf8' },
  cleaning:  { bg: 'rgba(168,85,247,0.15)',   text: '#c084fc' },
  analysis:  { bg: 'rgba(251,191,36,0.15)',   text: '#fbbf24' },
  transform: { bg: 'rgba(245,158,11,0.15)',   text: '#f59e0b' },
  types:     { bg: 'rgba(6,182,212,0.15)',    text: '#22d3ee' },
  organize:  { bg: 'rgba(236,72,153,0.15)',   text: '#f472b6' },
  advanced:  { bg: 'rgba(248,113,113,0.15)',  text: '#f87171' },
  visualise: { bg: 'rgba(16,185,129,0.15)',   text: '#34d399' },
  quality:   { bg: 'rgba(249,115,22,0.15)',   text: '#fb923c' },
};

