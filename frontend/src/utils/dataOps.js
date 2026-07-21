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
