// nodes/definitions/transform2.js — Advanced transform nodes
import { Position } from 'reactflow';
import { defineNode, mapHandles } from './shared';
import { pivotDF, meltDF, rollingWindow, stringOps, describeDF, sampleDF } from '../../utils/dataOps';

export const transform2Nodes = [

  defineNode({
    type: 'pivot',
    category: 'transform',
    shape: 'card',
    label: 'Pivot Table',
    lane: 'client',
    defaultData: () => ({ indexCol: '', columnsCol: '', valuesCol: '', aggFn: 'sum' }),
    fields: [
      { id: 'indexCol',   label: 'Index column (rows)',   type: 'col-select', placeholder: 'e.g. date' },
      { id: 'columnsCol', label: 'Columns column',        type: 'col-select', placeholder: 'e.g. category' },
      { id: 'valuesCol',  label: 'Values column',         type: 'col-select', placeholder: 'e.g. amount' },
      { id: 'aggFn', label: 'Aggregation', type: 'select', options: [
        { value: 'sum',   label: 'Sum' },
        { value: 'avg',   label: 'Mean' },
        { value: 'count', label: 'Count' },
        { value: 'min',   label: 'Min' },
        { value: 'max',   label: 'Max' },
      ]},
    ],
    subtitle: d => d?.indexCol && d?.columnsCol ? `${d.indexCol} × ${d.columnsCol}` : 'configure pivot',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No input data.');
      if (!data?.indexCol) throw new Error('Index column required.');
      if (!data?.columnsCol) throw new Error('Columns column required.');
      if (!data?.valuesCol) throw new Error('Values column required.');
      return pivotDF(df, data.indexCol, data.columnsCol, data.valuesCol, data.aggFn || 'sum');
    },
  }),

  defineNode({
    type: 'melt',
    category: 'transform',
    shape: 'card',
    label: 'Melt (Unpivot)',
    lane: 'client',
    defaultData: () => ({ idCols: '', varName: 'variable', valueName: 'value' }),
    fields: [
      { id: 'idCols',    label: 'ID columns (comma-separated)', type: 'text', monospace: true, placeholder: 'id, date' },
      { id: 'varName',   label: 'Variable column name',         type: 'text', placeholder: 'variable' },
      { id: 'valueName', label: 'Value column name',            type: 'text', placeholder: 'value' },
    ],
    subtitle: d => d?.idCols ? `id: ${d.idCols}` : 'wide → long reshape',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No input data.');
      const idCols = (data?.idCols || '').split(',').map(s => s.trim()).filter(Boolean);
      return meltDF(df, idCols, data?.varName || 'variable', data?.valueName || 'value');
    },
  }),

  defineNode({
    type: 'rolling',
    category: 'transform',
    shape: 'card',
    label: 'Rolling Window',
    lane: 'client',
    defaultData: () => ({ col: '', windowSize: 3, fn: 'mean', outputCol: '' }),
    fields: [
      { id: 'col',        label: 'Input column',  type: 'col-select', placeholder: 'numeric column' },
      { id: 'windowSize', label: 'Window size',   type: 'text', monospace: true, placeholder: '3' },
      { id: 'fn', label: 'Function', type: 'select', options: [
        { value: 'mean', label: 'Rolling Mean (Moving Avg)' },
        { value: 'sum',  label: 'Rolling Sum' },
        { value: 'max',  label: 'Rolling Max' },
        { value: 'min',  label: 'Rolling Min' },
      ]},
      { id: 'outputCol', label: 'Output column name (optional)', type: 'text', monospace: true, placeholder: 'auto-generated' },
    ],
    subtitle: d => d?.col ? `${d.fn || 'mean'}(${d.col}, w=${d.windowSize || 3})` : 'configure window',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No input data.');
      if (!data?.col) throw new Error('Input column required.');
      return rollingWindow(df, data.col, Number(data.windowSize) || 3, data.fn || 'mean', data.outputCol || '');
    },
  }),

  defineNode({
    type: 'stringOps',
    category: 'transform',
    shape: 'card',
    label: 'String Ops',
    lane: 'client',
    defaultData: () => ({ col: '', op: 'upper', param1: '', param2: '', outputCol: '' }),
    fields: [
      { id: 'col', label: 'Column', type: 'col-select', placeholder: 'text column' },
      { id: 'op', label: 'Operation', type: 'select', options: [
        { value: 'upper',   label: 'UPPER CASE' },
        { value: 'lower',   label: 'lower case' },
        { value: 'trim',    label: 'Trim whitespace' },
        { value: 'replace', label: 'Find & Replace' },
        { value: 'extract', label: 'Extract (Regex)' },
        { value: 'split',   label: 'Split by delimiter' },
        { value: 'length',  label: 'String length' },
        { value: 'prefix',  label: 'Add prefix' },
        { value: 'suffix',  label: 'Add suffix' },
      ]},
      { id: 'param1', label: 'Find / Regex / Delimiter / Prefix', type: 'text', monospace: true, placeholder: 'pattern or text', showIf: d => !['upper','lower','trim','length'].includes(d?.op) },
      { id: 'param2', label: 'Replace with / Group index / Part index', type: 'text', monospace: true, placeholder: '', showIf: d => ['replace','extract','split'].includes(d?.op) },
      { id: 'outputCol', label: 'Output column (blank = overwrite)', type: 'text', monospace: true, placeholder: 'new_col' },
    ],
    subtitle: d => d?.col ? `${d.op}(${d.col})` : 'configure string op',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No input data.');
      if (!data?.col) throw new Error('Column required.');
      return stringOps(df, data.col, data.op || 'upper', data.param1 || '', data.param2 || '', data.outputCol || '');
    },
  }),

  defineNode({
    type: 'describe',
    category: 'transform',
    shape: 'card',
    label: 'Describe',
    lane: 'client',
    defaultData: () => ({}),
    fields: [],
    subtitle: () => 'statistical summary',
    handles: mapHandles,
    run: async (df) => {
      if (!df) throw new Error('No input data.');
      return describeDF(df);
    },
  }),

  defineNode({
    type: 'sample',
    category: 'transform',
    shape: 'card',
    label: 'Sample',
    lane: 'client',
    defaultData: () => ({ n: 100, mode: 'rows', seed: 42 }),
    fields: [
      { id: 'mode', label: 'Sample by', type: 'select', options: [
        { value: 'rows',    label: 'Number of rows' },
        { value: 'percent', label: 'Percentage (%)' },
      ]},
      { id: 'n',    label: 'N rows / %', type: 'text', monospace: true, placeholder: '100' },
      { id: 'seed', label: 'Random seed', type: 'text', monospace: true, placeholder: '42' },
    ],
    subtitle: d => d?.mode === 'percent' ? `${d.n || 10}% sample` : `${d.n || 100} rows`,
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No input data.');
      return sampleDF(df, Number(data?.n) || 100, data?.mode || 'rows', Number(data?.seed) || 42);
    },
  }),

];
