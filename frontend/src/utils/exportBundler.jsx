// utils/exportBundler.js — Programmatic ZIP Export Bundler
// Automatically converts data to CSV/JSON/TSV and all pipeline charts to PNG images, packaging into a ZIP bundle
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { exportCSV, exportJSON, exportTSV } from './dataOps';
import { ChartRenderer } from '../components/ChartRenderer';

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Programmatically renders a chart node offscreen and captures it as a high-resolution PNG Blob.
 */
async function captureChartNodeToPNG(chartNode, chartDF) {
  if (!chartDF || !chartDF.rows?.length) return null;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.height = '500px';
  container.style.background = '#171717';
  container.style.padding = '24px';
  container.style.boxSizing = 'border-box';
  container.style.borderRadius = '12px';
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(
    <div style={{ width: '100%', height: '100%', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
        {chartNode.data?.title || chartNode.data?.label || 'Chart Output'}
      </div>
      <div style={{ width: '100%', height: '420px' }}>
        <ChartRenderer df={chartDF} config={chartNode.data} />
      </div>
    </div>
  );

  // Wait for React & chart library (Recharts/Plotly) to render completely
  await new Promise((resolve) => setTimeout(resolve, 600));

  let pngBlob = null;
  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#171717',
      scale: 2,
      logging: false,
      useCORS: true,
    });
    pngBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  } catch (err) {
    console.warn('Failed to capture offscreen chart PNG:', err);
  } finally {
    root.unmount();
    container.remove();
  }

  return pngBlob;
}

/**
 * Main Export Bundler:
 * Converts data + pipeline charts to PNG/CSV and downloads ZIP package
 */
export async function exportPipelineArtifacts(df, options = {}, storeState = {}) {
  const format = options.format || 'csv';
  const baseName = (options.filename || 'export').replace(/\.[^/.]+$/, '');
  const zipName = `${baseName}_bundle.zip`;

  // 1. Generate primary data file blob
  let dataBlob;
  let dataExt = 'csv';
  if (format === 'json') {
    dataBlob = exportJSON(df);
    dataExt = 'json';
  } else if (format === 'tsv') {
    dataBlob = exportTSV(df);
    dataExt = 'tsv';
  } else {
    dataBlob = exportCSV(df);
    dataExt = 'csv';
  }

  const dataFileName = `${baseName}_data.${dataExt}`;

  // 2. Find all chart nodes and capture their PNG images
  const chartFiles = [];
  const nodes = storeState.nodes || [];
  const chartDataMap = storeState.chartData || {};

  const chartNodes = nodes.filter(n => n.type === 'chart');

  let chartIndex = 1;
  for (const chartNode of chartNodes) {
    const chartDF = chartDataMap[chartNode.id] || df;
    const pngBlob = await captureChartNodeToPNG(chartNode, chartDF);
    if (pngBlob) {
      const cleanTitle = (chartNode.data?.title || `chart_${chartIndex}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      chartFiles.push({
        name: `${cleanTitle || `chart_${chartIndex}`}.png`,
        blob: pngBlob
      });
      chartIndex++;
    }
  }

  // 3. Fallback: Check if there are visible chart DOM elements on page
  if (chartFiles.length === 0) {
    const chartElements = document.querySelectorAll('.recharts-responsive-container, .plotly');
    for (let i = 0; i < chartElements.length; i++) {
      const el = chartElements[i];
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        try {
          const canvas = await html2canvas(el, { backgroundColor: '#171717', scale: 2, logging: false });
          const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
          if (blob) {
            chartFiles.push({ name: `chart_${i + 1}.png`, blob });
          }
        } catch (e) {
          console.warn('Failed capturing DOM chart:', e);
        }
      }
    }
  }

  // 4. Bundle into ZIP or single file download
  const zipAlways = options.zipAlways || options.bundleZip === 'always';
  const shouldZip = zipAlways || chartFiles.length > 0;

  if (shouldZip) {
    const zip = new JSZip();

    // Add main data file to ZIP
    zip.file(dataFileName, dataBlob);

    // Add PNG chart images under charts/ directory
    if (chartFiles.length > 0) {
      const chartsFolder = zip.folder('charts');
      chartFiles.forEach((file) => {
        chartsFolder.file(file.name, file.blob);
      });
    }

    // Generate ZIP file and trigger browser download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, zipName);
    return { zipped: true, zipName, count: chartFiles.length + 1 };
  } else {
    // Download single data file directly
    triggerDownload(dataBlob, `${baseName}.${dataExt}`);
    return { zipped: false, name: `${baseName}.${dataExt}`, count: 1 };
  }
}
