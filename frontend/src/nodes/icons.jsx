// nodes/icons.jsx — SVG icons for each node type
import React from 'react';

const I = ({ d, ...rest }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

export const IconLoad        = (p) => <I {...p} d="M12 2v10m0 0 3-3m-3 3-3-3M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />;
export const IconPreview     = (p) => <I {...p} d={['M3 6h18', 'M3 12h18', 'M3 18h18']} />;
export const IconExport      = (p) => <I {...p} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />;
export const IconDropNulls   = (p) => <I {...p} d={['M18 6 6 18', 'M6 6l12 12']} />;
export const IconFillNulls   = (p) => <I {...p} d="M12 5v14m-7-7h14" />;
export const IconDedupe      = (p) => <I {...p} d={['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01']} />;
export const IconTypeCast    = (p) => <I {...p} d="M4 7h3m0 0a3 3 0 0 1 6 0m-6 0v10m6-10h3m-3 0v10m-6 0h3m0 0a3 3 0 0 0 6 0m-6 0h-3m9 0h3" />;
export const IconTrimStrings = (p) => <I {...p} d={['M6 3v18', 'M18 3v18', 'M3 6l3-3', 'M3 18l3 3', 'M21 6l-3-3', 'M21 18l-3 3']} />;
export const IconFilter      = (p) => <I {...p} d="M3 6h18M7 12h10M10 18h4" />;
export const IconSelectCols  = (p) => <I {...p} d={['M9 3H5a2 2 0 0 0-2 2v4', 'M9 3v18', 'M9 21H5a2 2 0 0 1-2-2v-4', 'M15 3h4a2 2 0 0 1 2 2v4', 'M15 3v18', 'M15 21h4a2 2 0 0 0 2-2v-4']} />;
export const IconRename      = (p) => <I {...p} d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />;
export const IconAddColumn   = (p) => <I {...p} d={['M11 12H3', 'M16 6l6 6-6 6', 'M21 12H13']} />;
export const IconSort        = (p) => <I {...p} d={['M3 6h18', 'M7 12h10', 'M10 18h4']} />;
export const IconSlice       = (p) => <I {...p} d={['M8 6h13', 'M8 18h13', 'M3 6l4 6-4 6']} />;
export const IconAggregate   = (p) => <I {...p} d={['M18 20V10', 'M12 20V4', 'M6 20v-6']} />;
export const IconJoin          = (p) => <I {...p} d={['M4 12h16', 'M4 7l5 5-5 5', 'M20 7l-5 5 5 5']} />;
export const IconChart         = (p) => <I {...p} d={['M18 20V10', 'M12 20V4', 'M6 20v-6', 'M2 20h20']} />;
export const IconPivot         = (p) => <I {...p} d={['M3 3h18v18H3z', 'M3 9h18', 'M9 3v18']} />;
export const IconMelt          = (p) => <I {...p} d={['M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3', 'M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3', 'M12 8v8', 'M8 12h8']} />;
export const IconRolling       = (p) => <I {...p} d={['M2 12c0-5.5 4.5-10 10-10s10 4.5 10 10', 'M2 12h4', 'M18 12h4', 'M7 7l3 5h4l3-5']} />;
export const IconStringOps     = (p) => <I {...p} d={['M4 7V4h16v3', 'M9 20h6', 'M12 4v16']} />;
export const IconDescribe      = (p) => <I {...p} d={['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11']} />;
export const IconSample        = (p) => <I {...p} d={['M12 2l9 4.9V17L12 22 3 17V6.9L12 2z', 'M12 22V12', 'M3 7l9 5 9-5']} />;
export const IconConcat        = (p) => <I {...p} d={['M17 11H7', 'M17 7H7', 'M7 15h.01', 'M12 15h.01', 'M17 15h.01', 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z']} />;
export const IconProfiler      = (p) => <I {...p} d={['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z']} />;
export const IconSchemaVal     = (p) => <I {...p} d={['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11']} />;
export const IconComment       = (p) => <I {...p} d={['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z']} />;


export const NODE_ICONS = {
  load:            IconLoad,
  preview:         IconPreview,
  export:          IconExport,
  dropNulls:       IconDropNulls,
  fillNulls:       IconFillNulls,
  dedupe:          IconDedupe,
  typeCast:        IconTypeCast,
  trimStrings:     IconTrimStrings,
  filterRows:      IconFilter,
  selectCols:      IconSelectCols,
  rename:          IconRename,
  addColumn:       IconAddColumn,
  sort:            IconSort,
  slice:           IconSlice,
  aggregate:       IconAggregate,
  join:            IconJoin,
  chart:           IconChart,
  pivot:           IconPivot,
  melt:            IconMelt,
  rolling:         IconRolling,
  stringOps:       IconStringOps,
  describe:        IconDescribe,
  sample:          IconSample,
  concat:          IconConcat,
  profiler:        IconProfiler,
  schemaValidator: IconSchemaVal,
  comment:         IconComment,
};
