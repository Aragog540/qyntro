// utils/exportBundler.js — Smart ZIP Export Bundler
// Bundles CSV/JSON data and PNG chart images into a single clean ZIP archive
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { exportCSV, exportJSON, exportTSV } from './dataOps';

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
 * Capture a rendered DOM element (e.g. chart) as a PNG Blob
 */
async function captureElementToPNG(element) {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#171717',
      scale: 2, // High resolution PNG
      logging: false,
      useCORS: true,
    });
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  } catch (err) {
    console.warn('Failed to capture chart PNG:', err);
    return null;
  }
}

/**
 * Main export bundler:
 * Converts data + charts to PNG/CSV and bundles into ZIP if multiple files exist
 */
export async function exportPipelineArtifacts(df, options = {}, storeState = {}) {
  const format = options.format || 'csv';
  const baseName = (options.filename || 'export').replace(/\.[^/.]+$/, '');
  const zipName = `${baseName}_bundle.zip`;

  // 1. Generate data file blob
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

  // 2. Find and capture chart images
  const chartFiles = [];
  const chartElements = document.querySelectorAll('.recharts-responsive-container, .plotly, [data-chart-container]');
  
  let chartIndex = 1;
  for (const el of chartElements) {
    // Check if element is visible
    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
      const pngBlob = await captureElementToPNG(el);
      if (pngBlob) {
        chartFiles.push({
          name: `chart_${chartIndex}_png.png`,
          blob: pngBlob
        });
        chartIndex++;
      }
    }
  }

  // 3. Determine if ZIP bundling is needed
  const shouldZip = options.zipAlways || chartFiles.length > 0 || options.format === 'zip';

  if (shouldZip && (chartFiles.length > 0 || options.zipAlways)) {
    const zip = new JSZip();

    // Add main data file
    zip.file(dataFileName, dataBlob);

    // Add chart PNG images inside a charts/ folder
    const chartsFolder = zip.folder('charts');
    chartFiles.forEach((file) => {
      chartsFolder.file(file.name, file.blob);
    });

    // Generate ZIP archive
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, zipName);
    return { zipped: true, zipName, count: chartFiles.length + 1 };
  } else {
    // Download single data file directly if no charts
    triggerDownload(dataBlob, `${baseName}.${dataExt}`);
    return { zipped: false, name: `${baseName}.${dataExt}`, count: 1 };
  }
}
