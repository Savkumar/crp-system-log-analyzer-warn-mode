// Utility functions for exporting data and charts

/**
 * Convert chart to image and trigger download
 * @param {string} svgElementId - The ID of the SVG element to export
 * @param {string} fileName - The file name for the exported image
 * @param {string} format - Export format: 'png', 'jpg', or 'svg'
 */
export const exportChartAsImage = (svgElementId, fileName, format = 'png') => {
  const svgElement = document.getElementById(svgElementId);
  if (!svgElement) {
    console.error('SVG element not found:', svgElementId);
    return;
  }

  // For SVG export
  if (format === 'svg') {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(svgBlob);
    
    downloadBlob(url, `${fileName}.svg`);
    return;
  }

  // For PNG/JPG export, we need to convert SVG to canvas
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Create an image from SVG
  const img = new Image();
  const svgBlob = new Blob([svgData], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(svgBlob);
  
  img.onload = () => {
    // Set canvas dimensions to match SVG
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw white background (optional)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image
    ctx.drawImage(img, 0, 0);
    
    // Convert to desired format
    const imageType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const imageUrl = canvas.toDataURL(imageType);
    
    // Trigger download
    downloadBlob(imageUrl, `${fileName}.${format}`);
    
    // Clean up
    URL.revokeObjectURL(url);
  };
  
  img.src = url;
};

/**
 * Export data as CSV or JSON file
 * @param {Array} data - The data to export
 * @param {string} fileName - The file name without extension
 * @param {string} format - Export format: 'csv' or 'json'
 */
export const exportData = (data, fileName, format = 'csv') => {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }

  let blob;
  let fileExtension;

  if (format === 'json') {
    // Export as JSON
    const jsonStr = JSON.stringify(data, null, 2);
    blob = new Blob([jsonStr], {type: 'application/json'});
    fileExtension = 'json';
  } else {
    // Export as CSV
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      csv += headers.map(header => {
        let value = row[header];
        
        // Handle special cases: null, undefined, objects
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        // Escape values with commas or quotes
        value = String(value);
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        
        return value;
      }).join(',') + '\n';
    });
    
    blob = new Blob([csv], {type: 'text/csv'});
    fileExtension = 'csv';
  }
  
  const url = URL.createObjectURL(blob);
  downloadBlob(url, `${fileName}.${fileExtension}`);
};

/**
 * Helper function to download a blob as a file
 * @param {string} url - The URL of the blob to download
 * @param {string} filename - The filename for the download
 */
const downloadBlob = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};
