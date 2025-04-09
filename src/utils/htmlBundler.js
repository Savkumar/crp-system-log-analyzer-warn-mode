/**
 * Utilities for bundling HTML reports with inlined dependencies
 */

/**
 * Inline external CSS into the HTML template
 * @param {string} htmlTemplate - The HTML template
 * @param {string} cssContent - The CSS content to inline
 * @param {string} placeholder - The placeholder to replace in the template
 * @returns {string} The HTML with inlined CSS
 */
export const inlineCSS = (htmlTemplate, cssContent, placeholder = '/* PLACEHOLDER_FOR_STYLES */') => {
  return htmlTemplate.replace(placeholder, cssContent);
};

/**
 * Inline external JavaScript libraries into the HTML template
 * @param {string} htmlTemplate - The HTML template
 * @param {Array<{name: string, content: string}>} libraries - Array of library objects with name and content
 * @param {string} placeholder - The placeholder to replace in the template
 * @returns {string} The HTML with inlined libraries
 */
export const inlineLibraries = (htmlTemplate, libraries, placeholder = '<!-- PLACEHOLDER_FOR_LIBRARIES -->') => {
  const librariesHtml = libraries.map(lib => 
    `<!-- ${lib.name} -->\n<script>${lib.content}</script>`
  ).join('\n\n');
  
  return htmlTemplate.replace(placeholder, librariesHtml);
};

/**
 * Inline data as JavaScript variables into the HTML template
 * @param {string} htmlTemplate - The HTML template
 * @param {Object} data - The data to inline
 * @param {string} placeholder - The placeholder to replace in the template
 * @returns {string} The HTML with inlined data
 */
export const inlineData = (htmlTemplate, data, placeholder = '// PLACEHOLDER_FOR_DATA') => {
  const serializedData = JSON.stringify(data, null, 2);
  const dataScript = `const reportData = ${serializedData};`;
  
  return htmlTemplate.replace(placeholder, dataScript);
};

/**
 * Inline chart rendering code into the HTML template
 * @param {string} htmlTemplate - The HTML template
 * @param {string} renderingCode - The chart rendering code
 * @param {string} placeholder - The placeholder to replace in the template
 * @returns {string} The HTML with inlined rendering code
 */
export const inlineRenderingCode = (htmlTemplate, renderingCode, placeholder = '// PLACEHOLDER_FOR_CHART_RENDERING') => {
  return htmlTemplate.replace(placeholder, renderingCode);
};

/**
 * Replace metadata in the HTML template
 * @param {string} htmlTemplate - The HTML template
 * @param {Object} metadata - The metadata object
 * @returns {string} The HTML with replaced metadata
 */
export const replaceMetadata = (htmlTemplate, metadata) => {
  let result = htmlTemplate;
  
  // Process each metadata field
  if (metadata.title) {
    result = result.replace(/<title>.*?<\/title>/, `<title>${metadata.title}</title>`);
  }
  
  if (metadata.generationDate) {
    result = result.replace(
      /<span id="generation-date"><\/span>/,
      `<span id="generation-date">${metadata.generationDate}</span>`
    );
  }
  
  if (metadata.timeRange) {
    result = result.replace(
      /<span id="time-range"><\/span>/,
      `<span id="time-range">${metadata.timeRange}</span>`
    );
  }
  
  if (metadata.entriesCount) {
    result = result.replace(
      /<span id="entries-count"><\/span>/,
      `<span id="entries-count">${metadata.entriesCount}</span>`
    );
  }
  
  return result;
};

/**
 * Generate the final bundled HTML with all dependencies inlined
 * @param {Object} options - Configuration options
 * @param {string} options.template - The HTML template
 * @param {string} options.css - The CSS content
 * @param {Array} options.libraries - Array of library objects with name and content
 * @param {Object} options.data - The data to inline
 * @param {string} options.renderingCode - The chart rendering code
 * @param {Object} options.metadata - The metadata object
 * @returns {string} The final bundled HTML
 */
export const generateBundledHTML = (options) => {
  const {
    template,
    css,
    libraries,
    data,
    renderingCode,
    metadata
  } = options;
  
  let html = template;
  
  // Inline all dependencies
  html = inlineCSS(html, css);
  html = inlineLibraries(html, libraries);
  html = inlineData(html, data);
  html = inlineRenderingCode(html, renderingCode);
  html = replaceMetadata(html, metadata);
  
  return html;
};

/**
 * Create blob URL for the HTML content
 * @param {string} html - The HTML content
 * @returns {string} The blob URL
 */
export const createBlobURL = (html) => {
  const blob = new Blob([html], { type: 'text/html' });
  return URL.createObjectURL(blob);
};

/**
 * Trigger download of the HTML report
 * @param {string} html - The HTML content
 * @param {string} filename - The filename for the download
 */
export const downloadHTML = (html, filename) => {
  const url = createBlobURL(html);
  
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
