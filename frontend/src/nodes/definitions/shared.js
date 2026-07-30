// nodes/definitions/shared.js
import { Position } from 'reactflow';

export const CATEGORIES = [
  { id: 'io',        label: 'Input / Output', tag: '[IN/OUT]',    color: '#E8823C' },
  { id: 'clean',     label: 'Clean',          tag: '[CLEAN]',     color: '#5FC9BA' },
  { id: 'transform', label: 'Transform',      tag: '[TRANSFORM]', color: '#E8823C' },
  { id: 'organize',  label: 'Organize',       tag: '[ORGANIZE]',  color: '#7C8698' },
  { id: 'combine',   label: 'Combine',        tag: '[COMBINE]',   color: '#5FC9BA' },
  { id: 'quality',   label: 'Quality',        tag: '[QUALITY]',   color: '#E8823C' },
  { id: 'visualise', label: 'Visualise',      tag: '[VISUALISE]', color: '#5FC9BA' },
  { id: 'utility',   label: 'Utility',        tag: '[UTILITY]',   color: '#7C8698' },
];


const CAT_COLOR = Object.fromEntries(CATEGORIES.map(c => [c.id, c.color]));

export function defineNode(template) {
  return {
    width: 220,
    accent: CAT_COLOR[template.category] || 'var(--color-accent)',
    ...template,
  };
}

// Standard single-input → single-output handles (map node)
export const mapHandles = (id) => [
  { type: 'target', position: Position.Left,  id: `${id}-input`,  cardinality: 'single' },
  { type: 'source', position: Position.Right, id: `${id}-output`, cardinality: 'multi'  },
];
