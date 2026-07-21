// nodes/definitions/transform.js — FilterRows, SelectColumns, Rename, AddColumn
import { defineNode, mapHandles } from './shared';
import { filterRows, selectCols, renameColumns, addColumn } from '../../utils/dataOps';

export const transformNodes = [
  defineNode({
    type: 'filterRows',
    category: 'transform',
    shape: 'card',
    label: 'Filter Rows',
    lane: 'client',
    defaultData: () => ({ col: '', op: '=', value: '', mode: 'keep' }),
    fields: [
      { id: 'mode', label: 'Action', type: 'select', options: [{ value: 'keep', label: 'Keep matching' }, { value: 'drop', label: 'Drop matching' }] },
      { id: 'col',  label: 'Column', type: 'col-select', monospace: true, placeholder: 'select a column' },
      {
        id: 'op',
        label: 'Operator',
        type: 'select',
        options: [
          { value: '=',          label: '= equals' },
          { value: '≠',          label: '≠ not equals' },
          { value: '>',          label: '> greater than' },
          { value: '<',          label: '< less than' },
          { value: '>=',         label: '>= ≥' },
          { value: '<=',         label: '<= ≤' },
          { value: 'contains',   label: 'contains' },
          { value: 'starts with',label: 'starts with' },
          { value: 'ends with',  label: 'ends with' },
          { value: 'is null',    label: 'is null' },
          { value: 'not null',   label: 'is not null' },
          { value: 'regex',      label: 'matches regex' },
        ],
      },
      {
        id: 'value',
        label: 'Value',
        type: 'text',
        monospace: true,
        showIf: (d) => !['is null', 'not null'].includes(d?.op),
      },
    ],
    subtitle: (data) => data?.col ? `${data.mode} where ${data.col} ${data.op} ${data.value}` : 'configure filter',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      if (!data?.col?.trim()) throw new Error('Column name required. Select a node, pick a column from the inspector, then re-run.');
      let result = filterRows(df, data.col, data.op || '=', data.value ?? '');
      if (data?.mode === 'drop') {
        // Invert: keep rows that did NOT match
        const keepIds = new Set(result.rows.map((_, i) => i));
        // Rebuild: keep rows from original that aren't in result
        const filtered = df.rows.filter(row => !result.rows.includes(row));
        result = { ...df, rows: filtered, meta: { ...df.meta, rowCount: filtered.length } };
      }
      return result;
    },
  }),

  defineNode({
    type: 'selectCols',
    category: 'transform',
    shape: 'card',
    label: 'Select Columns',
    lane: 'client',
    defaultData: () => ({ cols: '', mode: 'keep' }),
    fields: [
      { id: 'mode', label: 'Action', type: 'select', options: [{ value: 'keep', label: 'Keep selected' }, { value: 'drop', label: 'Drop selected' }] },
      { id: 'cols', label: 'Columns (comma-separated)', type: 'text', monospace: true, placeholder: 'col1, col2' },
    ],
    subtitle: (data) => data?.cols ? `${data.mode}: ${data.cols}` : 'choose columns',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      const cols = (data?.cols || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!cols.length) return df;
      return selectCols(df, cols, data?.mode || 'keep');
    },
  }),

  defineNode({
    type: 'rename',
    category: 'transform',
    shape: 'card',
    label: 'Rename Columns',
    lane: 'client',
    defaultData: () => ({ mappingStr: '' }),
    fields: [
      {
        id: 'mappingStr',
        label: 'Rename map (old→new, one per line)',
        type: 'textarea',
        monospace: true,
        placeholder: 'old_name → new_name\ncol2 → Better Name',
      },
    ],
    subtitle: (data) => {
      const lines = (data?.mappingStr || '').split('\n').filter(Boolean);
      return lines.length ? `${lines.length} rename${lines.length > 1 ? 's' : ''}` : 'configure renames';
    },
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      const mapping = {};
      (data?.mappingStr || '').split('\n').forEach(line => {
        const [from, to] = line.split(/→|->/).map(s => s.trim());
        if (from && to) mapping[from] = to;
      });
      return renameColumns(df, mapping);
    },
  }),

  defineNode({
    type: 'addColumn',
    category: 'transform',
    shape: 'card',
    label: 'Add Column',
    lane: 'client',
    defaultData: () => ({ name: 'new_col', expr: '' }),
    fields: [
      { id: 'name', label: 'New column name', type: 'text', monospace: true },
      {
        id: 'expr',
        label: 'Expression (JS, row fields in scope)',
        type: 'textarea',
        monospace: true,
        placeholder: 'price * quantity\nname.toUpperCase()\nage > 18 ? "adult" : "minor"',
      },
    ],
    subtitle: (data) => data?.name ? `${data.name} = ${data.expr?.slice(0, 20) ?? ''}…` : 'add computed col',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      if (!data?.name) throw new Error('Column name required.');
      if (!data?.expr) throw new Error('Expression required.');
      return addColumn(df, data.name, data.expr);
    },
  }),
];
