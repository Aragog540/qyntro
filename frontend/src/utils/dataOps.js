// utils/dataOps.js
// All DataFrame manipulation operations for DataFlow.
// A DataFrame is: { rows: [...], columns: [...], meta: {} }
// All functions are pure — they return a new DataFrame, never mutate in place.

import Papa from 'papaparse';

// ─── Parse ──────────────────────────────────────────────────────────────────

export async function parseFile(file) {
  const name = file.name || 'data';
  const ext = name.split('.').pop().toLowerCase();

  if (ext === 'json') return parseJSON(file, name);
  return parseCSV(file, name);  // csv, tsv, txt
}

async function parseCSV(file, name) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimiter: file.name?.endsWith('.tsv') ? '\t' : '',
      complete: (result) => {
        const columns = result.meta.fields || [];
        const rows = result.data || [];
        resolve(makeDF(rows, columns, { source: name, rowCount: rows.length }));
      },
      error: reject,
    });
  });
}

async function parseJSON(file, name) {
  const text = await file.text();
  let data = JSON.parse(text);
  if (!Array.isArray(data)) data = [data];
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  return makeDF(data, columns, { source: name, rowCount: data.length });
}

function makeDF(rows, columns, meta = {}) {
  return { rows, columns, meta: { rowCount: rows.length, ...meta } };
}

// ─── Export ──────────────────────────────────────────────────────────────────

export function exportCSV(df) {
  const csv = Papa.unparse({ fields: df.columns, data: df.rows.map(r => df.columns.map(c => r[c])) });
  return new Blob([csv], { type: 'text/csv' });
}

export function exportJSON(df) {
  return new Blob([JSON.stringify(df.rows, null, 2)], { type: 'application/json' });
}

export function exportTSV(df) {
  const tsv = Papa.unparse({ fields: df.columns, data: df.rows.map(r => df.columns.map(c => r[c])) }, { delimiter: '\t' });
  return new Blob([tsv], { type: 'text/tab-separated-values' });
}

// ─── Clean ──────────────────────────────────────────────────────────────────

export function dropNulls(df, mode = 'any', targetCols = []) {
  const cols = targetCols.length > 0 ? targetCols : df.columns;
  const rows = df.rows.filter(row => {
    const vals = cols.map(c => row[c]);
    if (mode === 'all') return vals.some(v => !isNullish(v));
    return vals.every(v => !isNullish(v));   // 'any' = drop if any null
  });
  return makeDF(rows, df.columns, df.meta);
}

export function fillNulls(df, colStrategies) {
  // colStrategies: [{ col, strategy: 'mean'|'median'|'mode'|'value', value? }]
  const filled = colStrategies.reduce((acc, { col, strategy, value }) => {
    const colVals = df.rows.map(r => r[col]).filter(v => !isNullish(v));
    let fill;
    if (strategy === 'mean')   fill = mean(colVals);
    else if (strategy === 'median') fill = median(colVals);
    else if (strategy === 'mode')   fill = mode(colVals);
    else fill = value ?? '';
    return acc.map(row => isNullish(row[col]) ? { ...row, [col]: fill } : row);
  }, df.rows);
  return makeDF(filled, df.columns, df.meta);
}

export function dedupe(df, cols = []) {
  const keys = cols.length > 0 ? cols : df.columns;
  const seen = new Set();
  const rows = df.rows.filter(row => {
    const key = JSON.stringify(keys.map(c => row[c]));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return makeDF(rows, df.columns, df.meta);
}

export function typeCast(df, col, targetType) {
  const rows = df.rows.map(row => {
    const v = row[col];
    let cast = v;
    if (targetType === 'number') cast = isNullish(v) ? null : Number(v);
    else if (targetType === 'string') cast = isNullish(v) ? null : String(v);
    else if (targetType === 'boolean') cast = v === 'true' || v === true || v === 1;
    else if (targetType === 'date') cast = isNullish(v) ? null : new Date(v).toISOString();
    return { ...row, [col]: isNaN(cast) ? null : cast };
  });
  return makeDF(rows, df.columns, df.meta);
}

export function trimStrings(df, cols = []) {
  const targets = cols.length > 0 ? cols : df.columns;
  const rows = df.rows.map(row => {
    const patched = {};
    targets.forEach(c => {
      patched[c] = typeof row[c] === 'string' ? row[c].trim() : row[c];
    });
    return { ...row, ...patched };
  });
  return makeDF(rows, df.columns, df.meta);
}

// ─── Transform ──────────────────────────────────────────────────────────────

export function filterRows(df, col, op, value) {
  const rows = df.rows.filter(row => {
    const v = row[col];
    const val = value;
    switch (op) {
      case '=':          return String(v) === String(val);
      case '≠':          return String(v) !== String(val);
      case '>':          return Number(v) > Number(val);
      case '<':          return Number(v) < Number(val);
      case '>=':         return Number(v) >= Number(val);
      case '<=':         return Number(v) <= Number(val);
      case 'contains':   return String(v).toLowerCase().includes(String(val).toLowerCase());
      case 'starts with':return String(v).toLowerCase().startsWith(String(val).toLowerCase());
      case 'ends with':  return String(v).toLowerCase().endsWith(String(val).toLowerCase());
      case 'is null':    return isNullish(v);
      case 'not null':   return !isNullish(v);
      case 'regex':      try { return new RegExp(val).test(String(v)); } catch { return false; }
      default:           return true;
    }
  });
  return makeDF(rows, df.columns, df.meta);
}

export function selectCols(df, cols, mode = 'keep') {
  let columns;
  if (mode === 'keep') {
    columns = df.columns.filter(c => cols.includes(c));
  } else {
    columns = df.columns.filter(c => !cols.includes(c));
  }
  const rows = df.rows.map(row => Object.fromEntries(columns.map(c => [c, row[c]])));
  return makeDF(rows, columns, df.meta);
}

export function renameColumns(df, mapping) {
  // mapping: { oldName: newName }
  const columns = df.columns.map(c => mapping[c] ?? c);
  const rows = df.rows.map(row => {
    const newRow = {};
    df.columns.forEach((c, i) => { newRow[columns[i]] = row[c]; });
    return newRow;
  });
  return makeDF(rows, columns, df.meta);
}

export function addColumn(df, name, expr) {
  // expr is evaluated per-row with all column values in scope
  // e.g. "price * quantity" or "name.toUpperCase()"
  const fn = buildExprFn(df.columns, expr);
  const rows = df.rows.map(row => {
    let val = null;
    try { val = fn(row); } catch {}
    return { ...row, [name]: val };
  });
  const columns = df.columns.includes(name) ? df.columns : [...df.columns, name];
  return makeDF(rows, columns, df.meta);
}

function buildExprFn(cols, expr) {
  // Creates a function that evaluates the expression with row fields in scope.
  // Uses new Function for flexibility; column names become local variables.
  const args = cols.map(sanitizeIdent).join(', ');
  const body = `"use strict"; return (${expr});`;
  // eslint-disable-next-line no-new-func
  const compiled = new Function(...cols.map(sanitizeIdent), body);
  return (row) => compiled(...cols.map(c => row[c]));
}

function sanitizeIdent(name) {
  // Make column names safe as JS identifiers (prefix _ if starts with digit, replace special chars)
  return name.replace(/[^a-zA-Z0-9_$]/g, '_').replace(/^(\d)/, '_$1');
}

// ─── Organize ───────────────────────────────────────────────────────────────

export function sortRows(df, sortKeys) {
  // sortKeys: [{ col, dir: 'asc'|'desc' }]
  const rows = [...df.rows].sort((a, b) => {
    for (const { col, dir } of sortKeys) {
      const av = a[col], bv = b[col];
      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      if (cmp !== 0) return dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
  return makeDF(rows, df.columns, df.meta);
}

export function sliceRows(df, n, mode = 'first') {
  const rows = mode === 'last' ? df.rows.slice(-n) : df.rows.slice(0, n);
  return makeDF(rows, df.columns, df.meta);
}

export function aggregateDF(df, groupByCols, aggDefs) {
  // aggDefs: [{ col, fn: 'sum'|'avg'|'count'|'min'|'max'|'first'|'last' }]
  const groups = new Map();
  df.rows.forEach(row => {
    const key = JSON.stringify(groupByCols.map(c => row[c]));
    if (!groups.has(key)) groups.set(key, { keyRow: row, items: [] });
    groups.get(key).items.push(row);
  });

  const rows = [];
  groups.forEach(({ keyRow, items }) => {
    const base = Object.fromEntries(groupByCols.map(c => [c, keyRow[c]]));
    aggDefs.forEach(({ col, fn }) => {
      const vals = items.map(r => r[col]).filter(v => !isNullish(v));
      base[`${fn}(${col})`] = applyAgg(vals, fn, items);
    });
    rows.push(base);
  });

  const outCols = [
    ...groupByCols,
    ...aggDefs.map(({ col, fn }) => `${fn}(${col})`),
  ];
  return makeDF(rows, outCols, df.meta);
}

function applyAgg(vals, fn, items) {
  const nums = vals.map(Number).filter(n => !isNaN(n));
  switch (fn) {
    case 'sum':   return nums.reduce((a, b) => a + b, 0);
    case 'avg':   return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    case 'count': return items.length;
    case 'min':   return nums.length ? Math.min(...nums) : null;
    case 'max':   return nums.length ? Math.max(...nums) : null;
    case 'first': return items[0] ? Object.values(items[0])[0] : null;
    case 'last':  return items[items.length-1] ? Object.values(items[items.length-1])[0] : null;
    default:      return null;
  }
}

// ─── Combine ────────────────────────────────────────────────────────────────

export function joinDF(left, right, key, mode = 'inner') {
  const rightMap = new Map();
  right.rows.forEach(row => {
    const k = String(row[key]);
    if (!rightMap.has(k)) rightMap.set(k, []);
    rightMap.get(k).push(row);
  });

  // Merge column lists — prefix right cols that clash (except the key)
  const rightCols = right.columns.filter(c => c !== key);
  const rightColNames = rightCols.map(c =>
    left.columns.includes(c) && c !== key ? `right.${c}` : c
  );
  const outCols = [...left.columns, ...rightColNames];

  const rows = [];
  left.rows.forEach(lRow => {
    const matches = rightMap.get(String(lRow[key])) || [];
    if (matches.length > 0) {
      matches.forEach(rRow => {
        const merged = { ...lRow };
        rightCols.forEach((rc, i) => { merged[rightColNames[i]] = rRow[rc]; });
        rows.push(merged);
      });
    } else if (mode === 'left') {
      const merged = { ...lRow };
      rightColNames.forEach(rn => { merged[rn] = null; });
      rows.push(merged);
    }
  });

  // Right join: add unmatched right rows
  if (mode === 'right') {
    const leftKeys = new Set(left.rows.map(r => String(r[key])));
    right.rows.forEach(rRow => {
      if (!leftKeys.has(String(rRow[key]))) {
        const merged = Object.fromEntries(left.columns.map(c => [c, null]));
        merged[key] = rRow[key];
        rightCols.forEach((rc, i) => { merged[rightColNames[i]] = rRow[rc]; });
        rows.push(merged);
      }
    });
  }

  return makeDF(rows, outCols, { source: 'join' });
}

// ─── Column stats ────────────────────────────────────────────────────────────

export function columnStats(df, col) {
  const vals = df.rows.map(r => r[col]);
  const nullCount = vals.filter(isNullish).length;
  const nonNull = vals.filter(v => !isNullish(v));
  const unique = new Set(nonNull.map(String)).size;
  const nums = nonNull.map(Number).filter(n => !isNaN(n));
  return {
    col,
    total: vals.length,
    nullCount,
    unique,
    min: nums.length ? Math.min(...nums) : null,
    max: nums.length ? Math.max(...nums) : null,
    mean: nums.length ? mean(nums) : null,
    type: inferColType(nonNull),
  };
}

export function inferColType(vals) {
  if (vals.length === 0) return 'empty';
  const sample = vals.slice(0, 20);
  const allNum = sample.every(v => typeof v === 'number' || (!isNullish(v) && !isNaN(Number(v))));
  if (allNum) return 'number';
  const allBool = sample.every(v => v === true || v === false || v === 'true' || v === 'false');
  if (allBool) return 'boolean';
  const allDate = sample.every(v => !isNullish(v) && !isNaN(Date.parse(String(v))));
  if (allDate) return 'date';
  return 'string';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isNullish(v) {
  return v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v));
}

function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; }

function median(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
}

function mode(arr) {
  if (!arr.length) return null;
  const freq = {};
  arr.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

// ─── Pivot ────────────────────────────────────────────────────────────────────

export function pivotDF(df, indexCol, columnsCol, valuesCol, aggFn = 'sum') {
  const uniqueCols = [...new Set(df.rows.map(r => String(r[columnsCol])))].sort();
  const groups = new Map();
  df.rows.forEach(row => {
    const key = String(row[indexCol]);
    if (!groups.has(key)) groups.set(key, { [indexCol]: row[indexCol] });
    const g = groups.get(key);
    const colKey = String(row[columnsCol]);
    if (!g[colKey]) g[colKey] = [];
    g[colKey].push(Number(row[valuesCol]));
  });
  const rows = [];
  groups.forEach(g => {
    const row = { [indexCol]: g[indexCol] };
    uniqueCols.forEach(c => {
      const vals = (g[c] || []).filter(n => !isNaN(n));
      row[c] = applyAgg(vals, aggFn, []);
    });
    rows.push(row);
  });
  return makeDF(rows, [indexCol, ...uniqueCols], {});
}

export function meltDF(df, idCols, valueVarName = 'variable', valueName = 'value') {
  const valueCols = df.columns.filter(c => !idCols.includes(c));
  const rows = [];
  df.rows.forEach(row => {
    valueCols.forEach(vc => {
      const newRow = {};
      idCols.forEach(ic => { newRow[ic] = row[ic]; });
      newRow[valueVarName] = vc;
      newRow[valueName] = row[vc];
      rows.push(newRow);
    });
  });
  return makeDF(rows, [...idCols, valueVarName, valueName], {});
}

export function rollingWindow(df, col, windowSize, fn = 'mean', outputCol) {
  const out = outputCol || `${fn}_${windowSize}(${col})`;
  const rows = df.rows.map((row, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const win = df.rows.slice(start, i + 1).map(r => Number(r[col])).filter(n => !isNaN(n));
    let val = null;
    if (fn === 'mean') val = win.length ? win.reduce((a, b) => a + b, 0) / win.length : null;
    if (fn === 'sum')  val = win.reduce((a, b) => a + b, 0);
    if (fn === 'max')  val = win.length ? Math.max(...win) : null;
    if (fn === 'min')  val = win.length ? Math.min(...win) : null;
    return { ...row, [out]: val !== null ? +val.toFixed(4) : null };
  });
  const columns = df.columns.includes(out) ? df.columns : [...df.columns, out];
  return makeDF(rows, columns, df.meta);
}

export function stringOps(df, col, op, param1 = '', param2 = '', outputCol) {
  const out = outputCol || col;
  const rows = df.rows.map(row => {
    const v = String(row[col] ?? '');
    let result = v;
    if (op === 'upper')   result = v.toUpperCase();
    else if (op === 'lower')   result = v.toLowerCase();
    else if (op === 'trim')    result = v.trim();
    else if (op === 'replace') result = v.replaceAll(param1, param2);
    else if (op === 'extract') { try { const m = v.match(new RegExp(param1)); result = m ? (m[param2 ? Number(param2) : 0] ?? null) : null; } catch { result = null; } }
    else if (op === 'split')   result = v.split(param1)[param2 ? Number(param2) : 0] ?? null;
    else if (op === 'length')  result = v.length;
    else if (op === 'prefix')  result = param1 + v;
    else if (op === 'suffix')  result = v + param1;
    return out === col ? { ...row, [col]: result } : { ...row, [out]: result };
  });
  const columns = df.columns.includes(out) ? df.columns : [...df.columns, out];
  return makeDF(rows, columns, df.meta);
}

export function describeDF(df) {
  const numCols = df.columns.filter(col => {
    const sample = df.rows.slice(0, 20).map(r => r[col]).filter(v => v != null && v !== '');
    return sample.some(v => typeof v === 'number' || !isNaN(Number(v)));
  });
  const rows = numCols.map(col => {
    const vals = df.rows.map(r => Number(r[col])).filter(n => !isNaN(n));
    const sorted = [...vals].sort((a, b) => a - b);
    const n = vals.length;
    const q = p => sorted[Math.floor(p * (n - 1))] ?? null;
    const avg = n ? vals.reduce((a, b) => a + b, 0) / n : null;
    const std = n > 1 ? Math.sqrt(vals.map(v => (v - avg) ** 2).reduce((a, b) => a + b, 0) / (n - 1)) : null;
    return { column: col, count: n, mean: avg !== null ? +avg.toFixed(4) : null, std: std !== null ? +std.toFixed(4) : null, min: n ? sorted[0] : null, '25%': n ? q(0.25) : null, '50%': n ? q(0.50) : null, '75%': n ? q(0.75) : null, max: n ? sorted[n - 1] : null, nulls: df.rows.length - n };
  });
  return makeDF(rows, ['column', 'count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max', 'nulls'], {});
}

export function sampleDF(df, n, mode = 'rows', seed = 42) {
  const count = mode === 'percent' ? Math.round(df.rows.length * (n / 100)) : Math.min(n, df.rows.length);
  let s = seed;
  const rand = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const indices = df.rows.map((_, i) => i).sort(() => rand() - 0.5).slice(0, count).sort((a, b) => a - b);
  return makeDF(indices.map(i => df.rows[i]), df.columns, { ...df.meta, rowCount: count });
}

export function concatDF(dfs) {
  const allCols = [...new Set(dfs.flatMap(d => d.columns))];
  const rows = dfs.flatMap(d => d.rows.map(row => Object.fromEntries(allCols.map(c => [c, row[c] ?? null]))));
  return makeDF(rows, allCols, { rowCount: rows.length });
}

export function profileDF(df) {
  return df.columns.map(col => {
    const vals = df.rows.map(r => r[col]);
    const isNullish2 = v => v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v));
    const nonNull = vals.filter(v => !isNullish2(v));
    const nullCount = vals.length - nonNull.length;
    const unique = new Set(nonNull.map(String)).size;
    const nums = nonNull.map(Number).filter(n => !isNaN(n));
    const type = inferColType(nonNull);
    const freq = {};
    nonNull.slice(0, 500).forEach(v => { const k = String(v); freq[k] = (freq[k] || 0) + 1; });
    const topValues = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, c]) => `${v} (${c})`).join(' | ');
    return { col, type, count: nonNull.length, nullPct: vals.length ? +((nullCount / vals.length) * 100).toFixed(1) : 0, unique, min: nums.length ? Math.min(...nums) : null, max: nums.length ? Math.max(...nums) : null, mean: nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(3) : null, topValues };
  });
}

export function correlationMatrix(df) {
  const isNullish2 = v => v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v));
  const numCols = df.columns.filter(col => { const s = df.rows.slice(0, 20).map(r => r[col]).filter(v => !isNullish2(v)); return s.some(v => typeof v === 'number' || !isNaN(Number(v))); });
  const getCol = col => df.rows.map(r => Number(r[col])).filter(n => !isNaN(n));
  const pearson = (xs, ys) => {
    const n = Math.min(xs.length, ys.length);
    if (n < 2) return null;
    const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) { const ex = xs[i] - mx, ey = ys[i] - my; num += ex * ey; dx += ex * ex; dy += ey * ey; }
    return dx && dy ? +(num / Math.sqrt(dx * dy)).toFixed(3) : null;
  };
  const cols = numCols.map(c => ({ col: c, vals: getCol(c) }));
  return { cols: numCols, matrix: cols.map(a => cols.map(b => pearson(a.vals, b.vals))) };
}

export function schemaValidate(df, schemaStr) {
  const schema = schemaStr.split(',').map(s => { const [col, type] = s.trim().split(':').map(x => x.trim()); return { col, type }; }).filter(s => s.col && s.type);
  const isNullish2 = v => v === null || v === undefined || v === '';
  const rows = df.rows.map(row => {
    let valid = true; const errors = [];
    schema.forEach(({ col, type }) => {
      if (!(col in row)) { valid = false; errors.push(`missing:${col}`); return; }
      const v = row[col];
      if (isNullish2(v)) return;
      if (type === 'number' && isNaN(Number(v))) { valid = false; errors.push(`${col}:not_number`); }
      if (type === 'date' && isNaN(Date.parse(String(v)))) { valid = false; errors.push(`${col}:not_date`); }
    });
    return { ...row, _valid: valid, _errors: errors.join('; ') };
  });
  const columns = [...df.columns.filter(c => c !== '_valid' && c !== '_errors'), '_valid', '_errors'];
  return makeDF(rows, columns, df.meta);
}
