// nodes/definitions/io.js -- Load, Preview, Export
import { Position } from 'reactflow';
import { defineNode } from './shared';
import { parseFile, exportCSV, exportJSON, exportTSV } from '../../utils/dataOps';
import Papa from 'papaparse';

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const SAMPLE_DATASETS = {
  iris: `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
4.6,3.1,1.5,0.2,setosa
5.0,3.6,1.4,0.2,setosa
5.4,3.9,1.7,0.4,setosa
5.7,4.4,1.5,0.4,setosa
5.1,3.5,1.4,0.3,setosa
5.7,3.8,1.7,0.3,setosa
5.1,3.8,1.5,0.3,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.5,2.8,4.6,1.5,versicolor
5.7,2.8,4.5,1.3,versicolor
6.3,3.3,4.7,1.6,versicolor
4.9,2.4,3.3,1.0,versicolor
6.6,2.9,4.6,1.3,versicolor
5.2,2.7,3.9,1.4,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
6.5,3.0,5.8,2.2,virginica
7.6,3.0,6.6,2.1,virginica
4.9,2.5,4.5,1.7,virginica
7.3,2.9,6.3,1.8,virginica
6.7,2.5,5.8,1.8,virginica
7.2,3.6,6.1,2.5,virginica`,
  titanic: `survived,pclass,sex,age,fare,embarked
1,1,female,29,211.34,S
0,1,male,30,151.55,S
0,1,female,2,151.55,S
0,1,male,30,151.55,S
1,1,female,53,51.48,S
0,1,male,39,0,S
1,1,female,36,13,S
0,1,male,34,13,S
1,2,female,36,13,S
0,2,male,18,11.5,Q
0,2,male,40,13,S
1,2,female,36,13,C
0,2,male,28,10.5,S
0,3,male,42,7.55,S
1,3,female,16,20.25,S
0,3,male,13,20.25,S
0,3,female,16,7.65,S
1,3,male,25,7.65,S
0,3,male,20,7.925,S
1,3,female,18,7.225,C
0,3,male,30,7.25,Q
1,3,female,26,7.65,S
0,3,male,17,8.66,S
0,3,male,32,7.925,S
1,3,female,45,8.05,S
0,1,male,71,49.5,C
0,2,male,30,24,C
1,2,female,28,24,C
0,2,male,27,13,S
0,2,male,34,13,S`,
  sales: `order_id,date,product,category,region,quantity,unit_price,revenue
1001,2024-01-05,Widget A,Electronics,North,10,29.99,299.90
1002,2024-01-08,Gadget B,Electronics,South,5,49.99,249.95
1003,2024-01-12,Widget A,Electronics,East,8,29.99,239.92
1004,2024-01-15,Gizmo C,Accessories,North,20,9.99,199.80
1005,2024-01-20,Gadget B,Electronics,West,3,49.99,149.97
1006,2024-02-02,Widget A,Electronics,South,12,29.99,359.88
1007,2024-02-10,Gizmo C,Accessories,East,15,9.99,149.85
1008,2024-02-14,Thingamajig D,Accessories,North,7,19.99,139.93
1009,2024-02-18,Gadget B,Electronics,South,6,49.99,299.94
1010,2024-02-25,Widget A,Electronics,West,9,29.99,269.91
1011,2024-03-01,Thingamajig D,Accessories,East,11,19.99,219.89
1012,2024-03-07,Gizmo C,Accessories,West,25,9.99,249.75
1013,2024-03-14,Widget A,Electronics,North,14,29.99,419.86
1014,2024-03-20,Gadget B,Electronics,East,4,49.99,199.96
1015,2024-03-28,Thingamajig D,Accessories,South,9,19.99,179.91
1016,2024-04-04,Widget A,Electronics,West,11,29.99,329.89
1017,2024-04-11,Gizmo C,Accessories,North,30,9.99,299.70
1018,2024-04-18,Gadget B,Electronics,South,7,49.99,349.93
1019,2024-04-25,Thingamajig D,Accessories,East,13,19.99,259.87
1020,2024-05-02,Widget A,Electronics,North,16,29.99,479.84`,
};

function parseSample(name) {
  const csv = SAMPLE_DATASETS[name];
  if (!csv) throw new Error('Unknown sample dataset: ' + name);
  const result = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
  return { rows: result.data, columns: result.meta.fields || [], meta: { source: name, rowCount: result.data.length } };
}

function parsePastedCSV(text) {
  const result = Papa.parse(text.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true });
  return { rows: result.data, columns: result.meta.fields || [], meta: { source: 'paste', rowCount: result.data.length } };
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
      { id: 'sourceType', label: 'Source', type: 'select', options: [
        { value: 'file',   label: 'Upload File' },
        { value: 'url',    label: 'URL (CSV/JSON)' },
        { value: 'paste',  label: 'Paste CSV' },
        { value: 'sample', label: 'Sample Dataset' },
      ]},
      { id: 'fileList', label: 'File (CSV / TSV / JSON)', type: 'file', multiple: false, accept: '.csv,.tsv,.json,.txt', showIf: (d) => (d?.sourceType ?? 'file') === 'file' },
      { id: 'url', label: 'URL', type: 'text', monospace: true, placeholder: 'https://example.com/data.csv', showIf: (d) => d?.sourceType === 'url' },
      { id: 'pasteText', label: 'Paste CSV data here', type: 'textarea', placeholder: 'col1,col2\nval1,val2', showIf: (d) => d?.sourceType === 'paste' },
      { id: 'sampleName', label: 'Dataset', type: 'select', options: [
        { value: 'iris',    label: 'Iris (classification)' },
        { value: 'titanic', label: 'Titanic (survival)' },
        { value: 'sales',   label: 'Sales Orders (demo)' },
      ], showIf: (d) => d?.sourceType === 'sample' },
    ],
    subtitle: (data) => {
      if (data?.sourceType === 'sample') return data?.sampleName || 'pick a dataset';
      if (data?.sourceType === 'paste') return data?.pasteText ? 'CSV pasted' : 'paste CSV';
      const f = data?.fileList?.[0];
      if (f) return f.name || 'file loaded';
      if (data?.url) return data.url.split('/').pop();
      return 'no file';
    },
    handles: (id) => [{ type: 'source', position: Position.Right, id: `${id}-output`, cardinality: 'multi' }],
    run: async (_input, data) => {
      const src = data?.sourceType ?? 'file';
      if (src === 'url') {
        if (!data?.url) throw new Error('No URL provided.');
        const resp = await fetch(data.url);
        if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);
        const blob = await resp.blob();
        return parseFile(new File([blob], data.url.split('/').pop() || 'data.csv'));
      }
      if (src === 'paste') {
        if (!data?.pasteText?.trim()) throw new Error('No CSV text pasted.');
        return parsePastedCSV(data.pasteText);
      }
      if (src === 'sample') return parseSample(data?.sampleName || 'iris');
      const file = data?.fileList?.[0];
      if (!file) return parseSample(data?.sampleName || 'sales');
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
    subtitle: (data) => { const rows = data?._previewRows; if (!rows) return 'run pipeline to preview'; return rows + ' rows'; },
    handles: (id) => [
      { type: 'target', position: Position.Left,  id: `${id}-input`,  cardinality: 'multi' },
      { type: 'source', position: Position.Right, id: `${id}-output`, cardinality: 'multi' },
    ],
    run: async (df) => df,
  }),

  defineNode({
    type: 'export',
    category: 'io',
    shape: 'round',
    label: 'Export',
    lane: 'client',
    defaultData: () => ({ format: 'csv', filename: 'output' }),
    fields: [
      { id: 'format', label: 'Format', type: 'select', options: [
        { value: 'csv',  label: 'CSV' },
        { value: 'json', label: 'JSON' },
        { value: 'tsv',  label: 'TSV' },
      ]},
      { id: 'filename', label: 'Filename (no ext)', type: 'text', monospace: true },
    ],
    subtitle: (data) => '.' + (data?.format ?? 'csv') + ' -- ' + (data?.filename || 'output'),
    handles: (id) => [{ type: 'target', position: Position.Left, id: `${id}-input`, cardinality: 'multi' }],
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
