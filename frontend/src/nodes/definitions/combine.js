// nodes/definitions/combine.js — Join
import { Position } from 'reactflow';
import { defineNode } from './shared';
import { joinDF } from '../../utils/dataOps';

export const combineNodes = [
  defineNode({
    type: 'join',
    category: 'combine',
    shape: 'card',
    label: 'Join',
    lane: 'client',
    multiInput: true,   // signals executor to collect by handle name
    defaultData: () => ({ key: '', mode: 'inner' }),
    fields: [
      { id: 'key',  label: 'Join key column', type: 'text', monospace: true, placeholder: 'id' },
      {
        id: 'mode',
        label: 'Join type',
        type: 'select',
        options: [
          { value: 'inner', label: 'Inner — keep matching rows' },
          { value: 'left',  label: 'Left — keep all left rows' },
          { value: 'right', label: 'Right — keep all right rows' },
        ],
      },
    ],
    subtitle: (data) => data?.key ? `${data.mode} join on ${data.key}` : 'configure join',
    handles: (id) => [
      { type: 'target', position: Position.Left,  id: `${id}-left`,   cardinality: 'single', label: 'left',  offsetPercent: 33 },
      { type: 'target', position: Position.Left,  id: `${id}-right`,  cardinality: 'single', label: 'right', offsetPercent: 67 },
      { type: 'source', position: Position.Right, id: `${id}-output`, cardinality: 'multi' },
    ],
    run: async (inputByHandle, data) => {
      const left  = inputByHandle?.left  || inputByHandle?.[`left`];
      const right = inputByHandle?.right || inputByHandle?.[`right`];
      if (!left)  throw new Error('Left input not connected.');
      if (!right) throw new Error('Right input not connected.');
      if (!data?.key) throw new Error('Join key required.');
      return joinDF(left, right, data.key, data.mode || 'inner');
    },
  }),
];
