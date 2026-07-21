// nodes/definitions/io.js — Load, Preview, Export
import { Position } from 'reactflow';
import { defineNode } from './shared';
import { parseFile, exportCSV, exportJSON, exportTSV } from '../../utils/dataOps';

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export const ioNodes = [
  defineNode({
    type: 'load',
    category: 'io',
    shape: 'trigger',
    label: 'Load',
    lane: 'client',
    defaultData: () => ({ fileList: [], sourceType: 'file' }),
    fields: [
      {
        id: 'sourceType',
        label: 'Source',
        type: 'select',
        options: [
          { value: 'file', label: 'Upload File' },
          { value: 'url', label: 'URL (CSV/JSON)' },
        ],
      },
      {
        id: 'fileList',
        label: 'File (CSV / TSV / JSON)',
        type: 'file',
        multiple: false,
        accept: '.csv,.tsv,.json,.txt',
        showIf: (d) => (d?.sourceType ?? 'file') === 'file',
      },
      {
        id: 'url',
        label: 'URL',
        type: 'text',
        monospace: true,
        placeholder: 'https://example.com/data.csv',
        showIf: (d) => d?.sourceType === 'url',
      },
    ],
    subtitle: (data) => {
      const f = data?.fileList?.[0];
      if (f) return f.name || 'file loaded';
      if (data?.url) return data.url.split('/').pop();
      return 'no file';
    },
    handles: (id) => [
      { type: 'source', position: Position.Right, id: `${id}-output`, cardinality: 'multi' },
    ],
    run: async (_input, data) => {
      const src = data?.sourceType ?? 'file';
      if (src === 'url') {
        if (!data?.url) throw new Error('No URL provided.');
        const resp = await fetch(data.url);
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        const blob = await resp.blob();
        const file = new File([blob], data.url.split('/').pop() || 'data.csv');
        return parseFile(file);
      }
      const file = data?.fileList?.[0];
      if (!file) throw new Error('No file selected.');
      return parseFile(file);
    },
  }),

  defineNode({
    type: 'preview',
    category: 'io',
    shape: 'card',
    label: 'Preview',
    lane: 'client',
    defaultData: () => ({ _previewRows: null }),
    fields: [],
    subtitle: (data) => {
      const rows = data?._previewRows;
      if (!rows) return 'run pipeline to preview';
      return `${rows} rows`;
    },
    handles: (id) => [
      { type: 'target', position: Position.Left,  id: `${id}-input`,  cardinality: 'multi' },
      { type: 'source', position: Position.Right, id: `${id}-output`, cardinality: 'multi' },
    ],
    run: async (df) => {
      // Pass-through; the executor stores the df for the panel to read
      return df;
    },
  }),

  defineNode({
    type: 'export',
    category: 'io',
    shape: 'round',
    label: 'Export',
    lane: 'client',
    defaultData: () => ({ format: 'csv', filename: 'output' }),
    fields: [
      {
        id: 'format',
        label: 'Format',
        type: 'select',
        options: [
          { value: 'csv',  label: 'CSV' },
          { value: 'json', label: 'JSON' },
          { value: 'tsv',  label: 'TSV' },
        ],
      },
      { id: 'filename', label: 'Filename (no ext)', type: 'text', monospace: true },
    ],
    subtitle: (data) => `.${data?.format ?? 'csv'} — ${data?.filename || 'output'}`,
    handles: (id) => [
      { type: 'target', position: Position.Left, id: `${id}-input`, cardinality: 'multi' },
    ],
    run: async (df, data) => {
      if (!df || !df.rows?.length) throw new Error('No data to export.');
      const fmt = data?.format ?? 'csv';
      const name = (data?.filename || 'output') + '.' + fmt;
      let blob;
      if (fmt === 'json') blob = exportJSON(df);
      else if (fmt === 'tsv') blob = exportTSV(df);
      else blob = exportCSV(df);
      triggerDownload(blob, name);
      return df;
    },
  }),
];
