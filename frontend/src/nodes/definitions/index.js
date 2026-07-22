// nodes/definitions/index.js
import { ioNodes }        from './io';
import { cleanNodes }     from './clean';
import { transformNodes } from './transform';
import { organizeNodes }  from './organize';
import { combineNodes }   from './combine';
import { visualiseNodes } from './visualise';
export { CATEGORIES }     from './shared';

export const nodeTemplates = [
  ...ioNodes,
  ...cleanNodes,
  ...transformNodes,
  ...organizeNodes,
  ...combineNodes,
  ...visualiseNodes,
];


export const templateByType = Object.fromEntries(nodeTemplates.map(t => [t.type, t]));

export function buildInitialNodeData(nodeId, type) {
  const template = templateByType[type];
  return {
    id: nodeId,
    nodeType: type,
    label: template?.label ?? type,
    ...(template?.defaultData ? template.defaultData(nodeId) : {}),
  };
}
