# Interactive Report Generation Feature

This feature enables users to generate self-contained interactive HTML reports from log analysis data, designed specifically for easy embedding in Confluence pages.

## Overview

The interactive report generation feature adds the ability to export complete, standalone HTML reports that contain:

- All analyzed log data
- Interactive charts with tooltips and hover effects
- Cross-browser compatible visualizations
- No external dependencies (all libraries bundled)

## Files and Components

The feature is implemented through the following files:

### Frontend Components
- `src/components/ReportGenerator.jsx` - UI component for report generation options
- `src/templates/report-template.html` - HTML template for the generated report
- `src/templates/report-styles.css` - CSS styles for the report

### Utility Files
- `src/utils/reportGenerator.js` - Core report generation logic
- `src/utils/htmlBundler.js` - Utilities for bundling HTML, CSS, and JS

### Public Assets
- `public/report-template.html` - Accessible template for the report generator
- `public/report-styles.css` - Accessible styles for the report generator

### Documentation
- `src/assets/confluence-instructions.md` - Guide for embedding reports in Confluence

## Implementation Details

The report generation feature works as follows:

1. When a user clicks "Generate HTML Report", the `ReportGenerator` component initiates the process
2. The report generator fetches the HTML template and CSS from the public folder
3. It bundles the log data, Recharts/React libraries, and rendering code into a self-contained HTML file
4. The resulting HTML file is downloaded to the user's computer
5. This file can then be uploaded to Confluence and embedded using the HTML macro

## Technical Notes

- All charts maintain interactivity within the iframe context of Confluence
- The generated HTML is completely self-contained with no external dependencies
- The report is responsive and works across different screen sizes
- All JavaScript executes within the confined environment of the HTML file

## Usage

This feature is designed to be non-intrusive and integrated into the existing application flow:

1. Load and analyze log data as normal
2. Once data is displayed, the "Generate HTML Report" option appears
3. Configure report options if desired
4. Click "Generate" to create and download the interactive HTML report
5. Follow the instructions in `confluence-instructions.md` to embed in Confluence

## Development Notes

To extend or modify this feature:

1. The `report-template.html` and `report-styles.css` files define the report structure
2. Chart rendering logic is generated in `reportGenerator.js`
3. To add new chart types or visualizations, extend the rendering code generation
4. For custom styling, modify the CSS in `report-styles.css`
