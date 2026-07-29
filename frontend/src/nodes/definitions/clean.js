// nodes/definitions/clean.js — DropNulls, FillNulls, Dedupe, TypeCast, TrimStrings
import { defineNode, mapHandles } from './shared';
import { dropNulls, fillNulls, dedupe, typeCast, trimStrings } from '../../utils/dataOps';

export const cleanNodes = [
  defineNode({
    type: 'dropNulls',
    category: 'clean',
    shape: 'card',
    label: 'Drop Nulls',
    lane: 'client',
    defaultData: () => ({ mode: 'any', cols: '' }),
    fields: [
      {
        id: 'mode',
        label: 'Drop row if',
        type: 'select',
        options: [
          { value: 'any', label: 'Any selected column is null' },
          { value: 'all', label: 'All selected columns are null' },
        ],
      },
      { id: 'cols', label: 'Columns (comma-separated, blank = all)', type: 'text', monospace: true },
    ],
    subtitle: (data) => `drop if ${data?.mode ?? 'any'} null`,
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      const cols = (data?.cols || '').split(',').map(s => s.trim()).filter(Boolean);
      return dropNulls(df, data?.mode ?? 'any', cols);
    },
  }),

  defineNode({
    type: 'fillNulls',
    category: 'clean',
    shape: 'card',
    label: 'Fill Nulls',
    lane: 'client',
    defaultData: () => ({ col: '', strategy: 'mean', value: '' }),
    fields: [
      { id: 'col', label: 'Column', type: 'text', monospace: true, placeholder: 'column name' },
      {
        id: 'strategy',
        label: 'Fill with',
        type: 'select',
        options: [
          { value: 'mean',   label: 'Mean (numeric)' },
          { value: 'median', label: 'Median (numeric)' },
          { value: 'mode',   label: 'Mode (most frequent)' },
          { value: 'value',  label: 'Custom value' },
        ],
      },
      { id: 'value', label: 'Custom value', type: 'text', monospace: true, showIf: (d) => d?.strategy === 'value' },
    ],
    subtitle: (data) => data?.col ? `${data.col} → ${data.strategy}` : 'choose column',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      if (!data?.col) throw new Error('Column name required.');
      return fillNulls(df, [{ col: data.col, strategy: data.strategy || 'mean', value: data.value }]);
    },
  }),

  defineNode({
    type: 'dedupe',
    category: 'clean',
    shape: 'card',
    label: 'Deduplicate',
    lane: 'client',
    defaultData: () => ({ cols: '' }),
    fields: [
      { id: 'cols', label: 'Key columns (blank = all)', type: 'text', monospace: true, placeholder: 'col1, col2' },
    ],
    subtitle: () => 'remove duplicates',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      const cols = (data?.cols || '').split(',').map(s => s.trim()).filter(Boolean);
      return dedupe(df, cols);
    },
  }),

  defineNode({
    type: 'typeCast',
    category: 'clean',
    shape: 'card',
    label: 'Type Cast',
    lane: 'client',
    defaultData: () => ({ col: '', targetType: 'number' }),
    fields: [
      { id: 'col', label: 'Column', type: 'text', monospace: true, placeholder: 'column name' },
      {
        id: 'targetType',
        label: 'Cast to',
        type: 'select',
        options: [
          { value: 'number',  label: 'Number' },
          { value: 'string',  label: 'String' },
          { value: 'boolean', label: 'Boolean' },
          { value: 'date',    label: 'Date (ISO)' },
        ],
      },
    ],
    subtitle: (data) => data?.col ? `${data.col} → ${data.targetType}` : 'choose column',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      if (!data?.col) throw new Error('Column name required.');
      return typeCast(df, data.col, data.targetType || 'number');
    },
  }),

  defineNode({
    type: 'trimStrings',
    category: 'clean',
    shape: 'card',
    label: 'Trim Strings',
    lane: 'client',
    defaultData: () => ({ cols: '' }),
    fields: [
      { id: 'cols', label: 'Columns (blank = all string cols)', type: 'text', monospace: true },
    ],
    subtitle: () => 'trim whitespace',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No data connected.');
      const cols = (data?.cols || '').split(',').map(s => s.trim()).filter(Boolean);
      return trimStrings(df, cols);
    },
  }),
];
