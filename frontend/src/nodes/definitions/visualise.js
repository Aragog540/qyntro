// nodes/definitions/visualise.js — Chart node
import { defineNode, mapHandles } from './shared';

export const visualiseNodes = [
  defineNode({
    type: 'chart',
    category: 'visualise',
    shape: 'card',
    label: 'Chart',
    lane: 'client',
    defaultData: () => ({
      chartType: 'bar',
      xCol: '',
      yCol: '',
      colorCol: '',
      title: '',
    }),
    fields: [
      {
        id: 'chartType',
        label: 'Chart Type',
        type: 'select',
        options: [
          { value: 'bar',       label: '📊 Bar Chart' },
          { value: 'line',      label: '📈 Line Chart' },
          { value: 'area',      label: '🌊 Area Chart' },
          { value: 'scatter',   label: '✦ Scatter Plot' },
          { value: 'histogram', label: '📉 Histogram' },
          { value: 'pie',       label: '🥧 Pie Chart' },
        ],
      },
      {
        id: 'xCol',
        label: 'X Axis / Category',
        type: 'col-select',
        monospace: true,
        placeholder: 'select column',
        showIf: (d) => d?.chartType !== 'histogram',
      },
      {
        id: 'xCol',
        label: 'Column (values)',
        type: 'col-select',
        monospace: true,
        placeholder: 'select numeric column',
        showIf: (d) => d?.chartType === 'histogram',
      },
      {
        id: 'yCol',
        label: 'Y Axis / Value',
        type: 'col-select',
        monospace: true,
        placeholder: 'select numeric column',
        showIf: (d) => !['pie', 'histogram'].includes(d?.chartType),
      },
      {
        id: 'colorCol',
        label: 'Group / Color By (optional)',
        type: 'col-select',
        monospace: true,
        placeholder: 'optional grouping column',
        showIf: (d) => ['bar', 'line', 'scatter'].includes(d?.chartType),
      },
      {
        id: 'title',
        label: 'Chart Title (optional)',
        type: 'text',
        placeholder: 'My Chart',
      },
    ],
    subtitle: (data) => {
      const types = { bar: 'Bar', line: 'Line', area: 'Area', scatter: 'Scatter', histogram: 'Histogram', pie: 'Pie' };
      const t = types[data?.chartType] || 'Chart';
      if (data?.xCol && data?.yCol) return `${t} · ${data.xCol} vs ${data.yCol}`;
      if (data?.xCol) return `${t} · ${data.xCol}`;
      return `${t} · configure columns`;
    },
    handles: mapHandles,
    run: async (df) => {
      if (!df) throw new Error('No data connected.');
      return df; // pass-through; chart renders from chartData in inspector
    },
  }),
];
