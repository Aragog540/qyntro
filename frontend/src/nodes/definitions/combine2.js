// nodes/definitions/combine2.js — Concat (multi-input) node
import { Position } from 'reactflow';
import { defineNode } from './shared';
import { concatDF } from '../../utils/dataOps';

export const combine2Nodes = [

  defineNode({
    type: 'concat',
    category: 'combine',
    shape: 'card',
    label: 'Concat',
    lane: 'client',
    multiInput: true,
    defaultData: () => ({ axis: 'rows' }),
    fields: [],
    subtitle: () => 'stack DataFrames row-wise',
    handles: (id) => [
      { type: 'target', position: Position.Left, id: `${id}-a`, label: 'df1', offsetPercent: 25 },
      { type: 'target', position: Position.Left, id: `${id}-b`, label: 'df2', offsetPercent: 50 },
      { type: 'target', position: Position.Left, id: `${id}-c`, label: 'df3', offsetPercent: 75 },
      { type: 'source', position: Position.Right, id: `${id}-output` },
    ],
    run: async (inputByHandle) => {
      const dfs = Object.values(inputByHandle || {}).filter(Boolean);
      if (dfs.length < 2) throw new Error('Connect at least 2 DataFrames.');
      return concatDF(dfs);
    },
  }),

];
