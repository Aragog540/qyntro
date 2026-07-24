// nodes/definitions/index.js
import { ioNodes }        from './io';
import { cleanNodes }     from './clean';
import { transformNodes } from './transform';
import { transform2Nodes }from './transform2';
import { organizeNodes }  from './organize';
import { combineNodes }   from './combine';
import { combine2Nodes }  from './combine2';
import { profileNodes }   from './profile';
import { visualiseNodes } from './visualise';
import { annotationNodes }from './annotation';
export { CATEGORIES }     from './shared';

export const nodeTemplates = [
  ...ioNodes,
  ...cleanNodes,
  ...transformNodes,
  ...transform2Nodes,
  ...organizeNodes,
  ...combineNodes,
  ...combine2Nodes,
  ...profileNodes,
  ...visualiseNodes,
  ...annotationNodes,
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
