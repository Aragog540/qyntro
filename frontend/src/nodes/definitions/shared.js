// nodes/definitions/shared.js
import { Position } from 'reactflow';

export const CATEGORIES = [
  { id: 'io',        label: 'Input / Output', color: 'var(--color-io)' },
  { id: 'clean',     label: 'Clean',          color: 'var(--color-clean)' },
  { id: 'transform', label: 'Transform',      color: 'var(--color-transform)' },
  { id: 'organize',  label: 'Organize',       color: 'var(--color-organize)' },
  { id: 'combine',   label: 'Combine',        color: 'var(--color-combine)' },
  { id: 'visualise', label: 'Visualise',      color: 'var(--color-visualise)' },
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
