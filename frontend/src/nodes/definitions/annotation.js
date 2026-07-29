// nodes/definitions/annotation.js — Comment/sticky-note node (no execution)
import { defineNode } from './shared';

export const annotationNodes = [

  defineNode({
    type: 'comment',
    category: 'utility',
    shape: 'card',
    label: 'Comment',
    lane: 'client',
    defaultData: () => ({ text: 'Add a note here…' }),
    fields: [
      { id: 'text', label: 'Note', type: 'textarea', placeholder: 'Describe what this pipeline does…' },
    ],
    subtitle: d => d?.text ? d.text.slice(0, 40) + (d.text.length > 40 ? '…' : '') : 'sticky note',
    handles: () => [], // no handles — not part of pipeline
    // No run() — executor will skip this node gracefully
  }),

];
