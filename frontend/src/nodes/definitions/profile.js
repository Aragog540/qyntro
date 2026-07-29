// nodes/definitions/profile.js — Data Profiler + Schema Validator nodes
import { defineNode, mapHandles } from './shared';
import { profileDF, schemaValidate } from '../../utils/dataOps';

export const profileNodes = [

  defineNode({
    type: 'profiler',
    category: 'quality',
    shape: 'card',
    label: 'Data Profiler',
    lane: 'client',
    defaultData: () => ({}),
    fields: [],
    subtitle: () => 'auto-profile all columns',
    handles: mapHandles,
    run: async (df) => {
      if (!df) throw new Error('No input data.');
      // Pass input through; profiler data stored separately
      return df;
    },
  }),

  defineNode({
    type: 'schemaValidator',
    category: 'quality',
    shape: 'card',
    label: 'Schema Validator',
    lane: 'client',
    defaultData: () => ({ schema: '' }),
    fields: [
      {
        id: 'schema',
        label: 'Schema (col:type, ...)',
        type: 'textarea',
        placeholder: 'order_id:number, product:string, date:date',
      },
    ],
    subtitle: d => d?.schema ? `${d.schema.split(',').length} rules` : 'define schema',
    handles: mapHandles,
    run: async (df, data) => {
      if (!df) throw new Error('No input data.');
      if (!data?.schema?.trim()) throw new Error('Schema definition required.');
      return schemaValidate(df, data.schema);
    },
  }),

];
