// nodes/definitions/organize.js — Sort, Slice, Aggregate
import { defineNode, mapHandles } from './shared';
import { sortRows, sliceRows, aggregateDF } from '../../utils/dataOps';

export const organizeNodes = [
  defineNode({
    type: 'sort',
    category: 'organize',
    shape: 'card',
    label: 'Sort',
    lane: 'client',
    defaultData: () => ({ col: '', dir: 'asc' }),
    fields: [
      { id: 'col', label: 'Sort by column', type: 'text', monospace: true, placeholder: 'column name' },
      { id: 'dir', label: 'Direction', type: 'select', options: [{ value: 'asc', label: '↑ Ascending' }, { value: 'desc', label: '↓ Descending' }] },
    ],
    subtitle: (data) => data?.col ? `${data.col} ${data.dir === 'desc' ? '↓' : '↑'}` : 'configure sort',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      if (!data?.col) return df;
      return sortRows(df, [{ col: data.col, dir: data.dir || 'asc' }]);
    },
  }),

  defineNode({
    type: 'slice',
    category: 'organize',
    shape: 'card',
    label: 'Slice',
    lane: 'client',
    defaultData: () => ({ n: '100', mode: 'first' }),
    fields: [
      { id: 'n',    label: 'Number of rows', type: 'text', monospace: true },
      { id: 'mode', label: 'Take', type: 'select', options: [{ value: 'first', label: 'First N rows' }, { value: 'last', label: 'Last N rows' }] },
    ],
    subtitle: (data) => `${data?.mode ?? 'first'} ${data?.n ?? 100} rows`,
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      const n = parseInt(data?.n, 10) || 100;
      return sliceRows(df, n, data?.mode || 'first');
    },
  }),

  defineNode({
    type: 'aggregate',
    category: 'organize',
    shape: 'card',
    label: 'Aggregate',
    lane: 'client',
    width: 240,
    defaultData: () => ({ groupBy: '', aggCol: '', aggFn: 'sum' }),
    fields: [
      { id: 'groupBy', label: 'Group by (comma-separated)', type: 'text', monospace: true, placeholder: 'category, region' },
      { id: 'aggCol',  label: 'Aggregate column',           type: 'text', monospace: true, placeholder: 'sales' },
      {
        id: 'aggFn',
        label: 'Function',
        type: 'select',
        options: [
          { value: 'sum',   label: 'SUM' },
          { value: 'avg',   label: 'AVG (mean)' },
          { value: 'count', label: 'COUNT' },
          { value: 'min',   label: 'MIN' },
          { value: 'max',   label: 'MAX' },
        ],
      },
    ],
    subtitle: (data) => {
      if (!data?.aggCol || !data?.groupBy) return 'configure aggregation';
      return `${data.aggFn}(${data.aggCol}) by ${data.groupBy}`;
    },
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      if (!data?.groupBy) throw new Error('Group-by column required.');
      if (!data?.aggCol) throw new Error('Aggregate column required.');
      const groupByCols = data.groupBy.split(',').map(s => s.trim()).filter(Boolean);
      return aggregateDF(df, groupByCols, [{ col: data.aggCol, fn: data.aggFn || 'sum' }]);
    },
  }),
];
