// nodes/icons.jsx — Coolicons (by Kryston Schwarze) via @iconify/react
import React from 'react';
import { Icon } from '@iconify/react';

const CIcon = ({ icon, className = "h-4 w-4", ...rest }) => (
  <Icon icon={`ci:${icon}`} className={className} {...rest} />
);

export const IconLoad        = (p) => <CIcon icon="cloud-download" {...p} />;
export const IconDatabase    = (p) => <CIcon icon="data" {...p} />;
export const IconAPI         = (p) => <CIcon icon="terminal" {...p} />;
export const IconPreview     = (p) => <CIcon icon="show" {...p} />;
export const IconExport      = (p) => <CIcon icon="file-download" {...p} />;
export const IconDropNulls   = (p) => <CIcon icon="off-close" {...p} />;
export const IconFillNulls   = (p) => <CIcon icon="plus-circle" {...p} />;
export const IconDedupe      = (p) => <CIcon icon="layers" {...p} />;
export const IconTypeCast    = (p) => <CIcon icon="settings" {...p} />;
export const IconTrimStrings = (p) => <CIcon icon="edit-pencil-line-01" {...p} />;
export const IconNormalize   = (p) => <CIcon icon="slider-01" {...p} />;
export const IconFilter      = (p) => <CIcon icon="filter" {...p} />;
export const IconSelectCols  = (p) => <CIcon icon="columns" {...p} />;
export const IconRename      = (p) => <CIcon icon="edit-pencil-01" {...p} />;
export const IconAddColumn   = (p) => <CIcon icon="add-column" {...p} />;
export const IconSort        = (p) => <CIcon icon="sort-ascending" {...p} />;
export const IconSlice       = (p) => <CIcon icon="crop" {...p} />;
export const IconAggregate   = (p) => <CIcon icon="bar-chart" {...p} />;
export const IconJoin        = (p) => <CIcon icon="combine-cells" {...p} />;
export const IconChart       = (p) => <CIcon icon="chart-line" {...p} />;
export const IconPivot       = (p) => <CIcon icon="grid" {...p} />;
export const IconMelt        = (p) => <CIcon icon="unfold-more" {...p} />;
export const IconRolling     = (p) => <CIcon icon="redo" {...p} />;
export const IconStringOps   = (p) => <CIcon icon="text" {...p} />;
export const IconDescribe    = (p) => <CIcon icon="info-circle" {...p} />;
export const IconSample      = (p) => <CIcon icon="shuffle" {...p} />;
export const IconConcat      = (p) => <CIcon icon="link" {...p} />;
export const IconProfiler    = (p) => <CIcon icon="chart-pie" {...p} />;
export const IconSchemaVal   = (p) => <CIcon icon="shield-check" {...p} />;
export const IconComment     = (p) => <CIcon icon="note" {...p} />;

export const NODE_ICONS = {
  load:            IconLoad,
  dbQuery:         IconDatabase,
  apiFetch:        IconAPI,
  preview:         IconPreview,
  export:          IconExport,
  dropNulls:       IconDropNulls,
  fillNulls:       IconFillNulls,
  dedupe:          IconDedupe,
  typeCast:        IconTypeCast,
  trimStrings:     IconTrimStrings,
  normalize:       IconNormalize,
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
