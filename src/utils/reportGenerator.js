// Report generation utilities
import { createBlobURL } from './htmlBundler.js';

/**
 * Generate an interactive HTML report from log data
 * @param {Object} options - Report generation options
 * @param {Object|Array} options.data - Log data for the report
 * @param {Object} options.timeRange - Time range information
 * @param {string} options.dataType - Type of log data ('standard' or 'ghostmon')
 * @param {string} options.filename - Output filename
 * @param {Object} options.options - Additional options
 * @param {string} options.chartStyle - Chart style to use ('modern' or 'classic', defaults to 'classic')
 * @returns {Promise<void>} - Promise that resolves when report is generated
 */
const generateReport = async ({ data, timeRange, dataType, filename, options, chartStyle = 'classic', annotations = {} }) => {
  try {
    // Validate data
    if (!data) {
      throw new Error('No data available for report generation');
    }

    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return 'N/A';
      return new Date(timestamp * 1000).toLocaleString();
    };

    // Create formatted time range for display
    const formattedTimeRange = {
      start: formatTimestamp(timeRange.start),
      end: formatTimestamp(timeRange.end)
    };

    // Get robust stats array (handle different data structures)
    const robustStats = Array.isArray(data) ? data : data.robustStats || [];
    
    // Calculate basic statistics
    const stats = {
      totalEntries: robustStats.length,
      averageCpu: robustStats.length 
        ? (robustStats.reduce((sum, stat) => sum + (stat.cpuAll || 0), 0) / robustStats.length).toFixed(1) 
        : 0,
      averageMemory: robustStats.length 
        ? (robustStats.reduce((sum, stat) => sum + (stat.memRSS || 0), 0) / robustStats.length).toFixed(0) 
        : 0,
      averageConnections: robustStats.length 
        ? (robustStats.reduce((sum, stat) => sum + ((stat.http || 0) + (stat.https || 0)), 0) / robustStats.length).toFixed(0) 
        : 0
    };

    // Extract overload manager data if available
    const overloadData = data.addCandidateTargets || [];
    const processLoopData = data.processMainLoops || [];

    // Prepare data for the report
    const reportData = {
      robustStats: robustStats.map(stat => ({
        ...stat,
        timestampFormatted: formatTimestamp(stat.timestamp)
      })),
      overloadData: {
        addCandidateTargets: overloadData.map(entry => ({
          ...entry,
          timestampFormatted: formatTimestamp(entry.timestamp)
        })),
        processMainLoops: processLoopData.map(entry => ({
          ...entry,
          timestampFormatted: formatTimestamp(entry.timestamp)
        }))
      },
      timeRange: formattedTimeRange,
      stats,
      dataType,
      generatedAt: new Date().toLocaleString(),
      options
    };

    // Generate HTML template
    const template = generateHtmlTemplate(reportData, chartStyle, annotations);

    // Create and download the report
    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

/**
 * Generate HTML template for the report
 * @param {Object} reportData - Processed report data
 * @param {string} chartStyle - Chart style ('modern' or 'classic')
 * @param {Object} annotations - Chart annotations to include in the report
 * @returns {string} - HTML template string
 */
const generateHtmlTemplate = (reportData, chartStyle = 'classic', annotations = {}) => {
  // Serialize the report data for use in the template
  const serializedData = JSON.stringify({
    ...reportData,
    chartStyle,
    annotations
  });
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log Analysis Report</title>
  
  <!-- Import Chart.js from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
  <!-- Import Chart.js Annotation plugin -->
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@2.0.1/dist/chartjs-plugin-annotation.min.js"></script>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 20px;
    }
    .header-title {
      font-size: 24px;
      font-weight: bold;
    }
    .header-meta {
      font-size: 14px;
      color: #6c757d;
    }
    
    /* Chart container styles */
    .chart-container {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 25px;
      height: 300px;
    }
    
    /* Modern chart style overrides */
    .modern-charts .chart-container {
      background-color: #f8fafc;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      padding: 24px;
      height: 350px;
    }
    
    .modern-charts .section-title {
      color: #1e293b;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .tabs {
      display: flex;
      border-bottom: 1px solid #dee2e6;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .tab-button {
      padding: 8px 16px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      margin-right: 10px;
      font-weight: 500;
    }
    .tab-button.active {
      border-bottom-color: #0d6efd;
      color: #0d6efd;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    .section-title {
      font-size: 18px;
      margin-bottom: 15px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th, .data-table td {
      border: 1px solid #dee2e6;
      padding: 8px;
      text-align: left;
    }
    .data-table th {
      background-color: #f8f9fa;
    }
    .data-table tr:nth-child(even) {
      background-color: #f8f9fa;
    }
  </style>
</head>

<body class="${chartStyle === 'modern' ? 'modern-charts' : ''}">
  <div class="container">
    <header class="header">
      <div>
        <h1 class="header-title">Log Analysis Report</h1>
        <div class="header-meta">
          <p>Generated: ${reportData.generatedAt}</p>
          <p>Time Range: ${reportData.timeRange.start} to ${reportData.timeRange.end}</p>
          <p>Total Entries: ${reportData.stats.totalEntries}</p>
        </div>
      </div>
    </header>

    <!-- Tab navigation -->
    <div class="tabs">
      <button class="tab-button active" data-tab="overview">Overview</button>
      <button class="tab-button" data-tab="robust-stats">Robust Stats</button>
      <button class="tab-button" data-tab="client-requests">Client Requests</button>
      <button class="tab-button" data-tab="overload">Overload Manager</button>
      <button class="tab-button" data-tab="data">Data</button>
    </div>
    
    <!-- Overview Tab -->
    <div id="overview" class="tab-content active">
      <h2 class="section-title">Overview</h2>
      <div class="chart-container">
        <canvas id="cpu-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="memory-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="connections-chart"></canvas>
      </div>
    </div>
    
    <!-- Robust Stats Tab -->
    <div id="robust-stats" class="tab-content">
      <h2 class="section-title">Robust Stats Analysis</h2>
      <div class="chart-container">
        <canvas id="system-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="http-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="memory-usage-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="network-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="performance-chart"></canvas>
      </div>
    </div>
    
    <!-- Client Requests Tab -->
    <div id="client-requests" class="tab-content">
      <h2 class="section-title">Client Request States</h2>
      <div class="chart-container">
        <canvas id="client-states-chart"></canvas>
      </div>
    </div>
    
    <!-- Overload Manager Tab -->
    <div id="overload" class="tab-content">
      <h2 class="section-title">Overload Manager Analysis</h2>
      <div class="chart-container">
        <canvas id="trigger-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="deny-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="overload-cpu-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="overload-memory-chart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="requests-chart"></canvas>
      </div>
    </div>
    
    <!-- Data Tab -->
    <div id="data" class="tab-content">
      <h2 class="section-title">Data Sample</h2>
      <div id="data-table"></div>
    </div>
  </div>

  <script>
    // Store report data globally
    window.reportData = ${serializedData};
    
    // Initialize charts
    let charts = {};
    
    // Format timestamp for display
    function formatTimestamp(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString();
    }
    
    // Switch tabs function
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const tabId = button.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
      });
    });
    
    // Create all charts on DOM load
    document.addEventListener('DOMContentLoaded', function() {
      createCharts();
      renderDataTable();
    });
    
    // Function to render annotations on charts
    function renderAnnotations(chart, chartId) {
      if (!window.reportData.annotations || !window.reportData.annotations[chartId]) {
        return;
      }
      
      const chartAnnotations = window.reportData.annotations[chartId];
      if (!chartAnnotations.length) return;
      
      // Register the annotation plugin for this chart if not already registered
      if (!chart.options.plugins.annotation) {
        chart.options.plugins.annotation = {
          annotations: {}
        };
      }
      
      // Add each annotation to the chart
      chartAnnotations.forEach((annotation, index) => {
        // Calculate position based on percentage
        const xPosition = annotation.position.x / 100;
        const yPosition = annotation.position.y / 100;
        
        // Create a unique ID for the annotation
        const annotationId = 'annotation-' + index;
        
        // Add the annotation to the chart
        chart.options.plugins.annotation.annotations[annotationId] = {
          type: 'label',
          xValue: xPosition * chart.data.labels.length,
          yValue: yPosition * (chart.scales.y.max - chart.scales.y.min) + chart.scales.y.min,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderWidth: 1,
          borderRadius: 4,
          borderColor: 'rgba(0,0,0,0.1)',
          content: [annotation.text],
          font: {
            size: 11,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          color: '#333',
          padding: 6,
          // Add a "handle" point at the annotation position
          callout: {
            display: true,
            borderColor: 'rgba(245, 158, 11, 0.9)',
            borderWidth: 2,
            side: 5, // Shorter callout line
            start: 0.5 // Callout starts in the middle
          }
        };
      });
      
      // Update the chart to reflect the annotations
      chart.update();
    }
    
    // Create charts
    function createCharts() {
      const { robustStats, overloadData, annotations } = window.reportData;
      
      // Set up chart colors
      const colors = {
        cpu: '#0d6efd',
        memory: '#6f42c1',
        http: '#20c997',
        https: '#0dcaf0',
        clientInProgress: '#fd7e14',
        done: '#198754',
        fwdInProgress: '#6610f2',
        freeFds: '#6f42c1',
        websocketsInProgress: '#d63384',
        tcpMem: '#dc3545',
        triggerPct: '#fd7e14',
        denyPct: '#dc3545',
        flit: '#fd7e14',
        avgManagerCycle: '#6f42c1'
      };
      
      // Determine if modern styling should be used
      const isModern = window.reportData.chartStyle === 'modern';
      
      // Set up modern colors if using modern style
      if (isModern) {
        // Update colors to match UI
        colors.http = '#3182ce';      // blue
        colors.https = '#805ad5';     // purple
        colors.clientInProgress = '#e53e3e';  // red
        colors.cpu = '#805ad5';       // purple
      }
      
      // Common chart options
      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: isModern,
              boxWidth: isModern ? 6 : 10,
              padding: isModern ? 15 : 10,
              font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: isModern ? 12 : 12
              }
            }
          },
          tooltip: {
            backgroundColor: isModern ? 'rgba(17, 24, 39, 0.8)' : 'rgba(0, 0, 0, 0.7)',
            padding: isModern ? 10 : 8,
            cornerRadius: isModern ? 6 : 4,
            titleFont: {
              size: isModern ? 14 : 12
            },
            bodyFont: {
              size: isModern ? 13 : 12
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: isModern ? 'rgba(226, 232, 240, 0.6)' : 'rgba(0, 0, 0, 0.1)',
              drawBorder: !isModern,
              drawTicks: !isModern
            },
            ticks: {
              autoSkip: true,
              maxRotation: 45,
              color: isModern ? '#64748b' : '#666',
              font: {
                size: isModern ? 11 : 12
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: isModern ? 'rgba(226, 232, 240, 0.6)' : 'rgba(0, 0, 0, 0.1)',
              drawBorder: !isModern
            },
            ticks: {
              color: isModern ? '#64748b' : '#666',
              font: {
                size: isModern ? 11 : 12
              }
            }
          }
        },
        elements: {
          line: {
            tension: isModern ? 0.4 : 0.3,
            borderWidth: isModern ? 2 : 3,
          },
          point: {
            radius: 0, // No points in modern style
            hoverRadius: isModern ? 4 : 3
          }
        }
      };
      
      if (robustStats.length > 0) {
        // CPU Chart
        const cpuCtx = document.getElementById('cpu-chart');
        if (cpuCtx) {
          charts.cpu = new Chart(cpuCtx, {
            type: 'line',
            data: {
              labels: robustStats.map(item => formatTimestamp(item.timestamp)),
              datasets: [{
                label: 'CPU (%)',
                data: robustStats.map(item => item.cpuAll || 0),
                borderColor: colors.cpu,
                backgroundColor: colors.cpu + '33',
                tension: 0.3,
                fill: true
              }]
            },
            options: {
              ...commonOptions,
              // If modern style, customize this specific chart
              elements: {
                ...commonOptions.elements,
                line: {
                  ...commonOptions.elements.line,
                  borderWidth: isModern ? 2.5 : 3,
                  tension: isModern ? 0.4 : 0.3,
                  fill: !isModern
                },
                point: {
                  radius: 0,
                  hoverRadius: isModern ? 4 : 3
                }
              }
            }
          });
          
          // Add annotations if available
          if (annotations && annotations.cpuChart) {
            renderAnnotations(charts.cpu, 'cpuChart');
          }
        }
        
        // Memory Chart
        const memoryCtx = document.getElementById('memory-chart');
        if (memoryCtx) {
          charts.memory = new Chart(memoryCtx, {
            type: 'line',
            data: {
              labels: robustStats.map(item => formatTimestamp(item.timestamp)),
              datasets: [{
                label: 'Memory (KB)',
                data: robustStats.map(item => item.memRSS || 0),
                borderColor: colors.memory,
                backgroundColor: colors.memory + '33',
                tension: 0.3,
                fill: true
              }]
            },
            options: commonOptions
          });
          
          // Add annotations if available
          if (annotations && annotations.memoryChart) {
            renderAnnotations(charts.memory, 'memoryChart');
          }
        }
        
        // Connections Chart
        const connectionsCtx = document.getElementById('connections-chart');
        if (connectionsCtx) {
          charts.connections = new Chart(connectionsCtx, {
            type: 'line',
            data: {
              labels: robustStats.map(item => formatTimestamp(item.timestamp)),
              datasets: [
                {
                  label: 'HTTP',
                  data: robustStats.map(item => item.http || 0),
                  borderColor: colors.http,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'HTTPS',
                  data: robustStats.map(item => item.https || 0),
                  borderColor: colors.https,
                  backgroundColor: 'transparent',
                  tension: 0.3
                }
              ]
            },
            options: commonOptions
          });
          
          // Add annotations if available
          if (annotations && annotations.connectionsChart) {
            renderAnnotations(charts.connections, 'connectionsChart');
          }
        }
        
        // Client States Chart - The key missing chart with clientInProgress, done, fwdInProgress
        const clientStatesCtx = document.getElementById('client-states-chart');
        if (clientStatesCtx) {
          charts.clientStates = new Chart(clientStatesCtx, {
            type: 'line',
            data: {
              labels: robustStats.map(item => formatTimestamp(item.timestamp)),
              datasets: [
                {
                  label: 'Client In Progress',
                  data: robustStats.map(item => item.clientInProgress || 0),
                  borderColor: colors.clientInProgress,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'Done',
                  data: robustStats.map(item => item.done || 0),
                  borderColor: colors.done,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'Fwd In Progress',
                  data: robustStats.map(item => item.fwdInProgress || 0),
                  borderColor: colors.fwdInProgress,
                  backgroundColor: 'transparent',
                  tension: 0.3
                }
              ]
            },
            options: commonOptions
          });
        }
        
        // Robust Stats Charts
        
        // System Chart
        const systemCtx = document.getElementById('system-chart');
        if (systemCtx) {
          charts.system = new Chart(systemCtx, {
            type: 'line',
            data: {
              labels: robustStats.map(item => formatTimestamp(item.timestamp)),
              datasets: [
                {
                  label: 'CPU (%)',
                  data: robustStats.map(item => item.cpuAll || 0),
                  borderColor: colors.cpu,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'Client In Progress',
                  data: robustStats.map(item => item.clientInProgress || 0),
                  borderColor: colors.clientInProgress,
                  backgroundColor: 'transparent',
                  tension: 0.3
                }
              ]
            },
            options: commonOptions
          });
        }
        
        // HTTP Chart
        const httpCtx = document.getElementById('http-chart');
        if (httpCtx) {
          charts.http = new Chart(httpCtx, {
            type: 'line',
            data: {
              labels: robustStats.map(item => formatTimestamp(item.timestamp)),
              datasets: [
                {
                  label: 'HTTP',
                  data: robustStats.map(item => item.http || 0),
                  borderColor: colors.http,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'HTTPS',
                  data: robustStats.map(item => item.https || 0),
                  borderColor: colors.https,
                  backgroundColor: 'transparent',
                  tension: 0.3
                }
              ]
            },
            options: commonOptions
          });
        }
        
        // Memory Usage Chart
        const memUsageCtx = document.getElementById('memory-usage-chart');
        if (memUsageCtx) {
          charts.memUsage = new Chart(memUsageCtx, {
            type: 'line',
            data: {
              labels: robustStats.map(item => formatTimestamp(item.timestamp)),
              datasets: [
                {
                  label: 'Memory RSS (KB)',
                  data: robustStats.map(item => item.memRSS || 0),
                  borderColor: colors.memory,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'App Used (KB)',
                  data: robustStats.map(item => item.appUsed || 0),
                  borderColor: '#9333ea',
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'Total Memory (KB)',
                  data: robustStats.map(item => item.totalMem || 0),
                  borderColor: '#e11d48',
                  backgroundColor: 'transparent',
                  tension: 0.3
                }
              ]
            },
            options: commonOptions
          });
        }
        
        // Network Chart
        const networkCtx = document.getElementById('network-chart');
        if (networkCtx) {
          charts.network = new Chart(networkCtx, {
            type: 'line',
            data: {
              labels: robustStats.map(item => formatTimestamp(item.timestamp)),
              datasets: [
                {
                  label: 'Free FDs',
                  data: robustStats.map(item => item.freeFds || 0),
                  borderColor: colors.freeFds,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'Websockets In Progress',
                  data: robustStats.map(item => item.websocketsInProgress || 0),
                  borderColor: colors.websocketsInProgress,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'TCP Memory',
                  data: robustStats.map(item => item.tcpMem || 0),
                  borderColor: colors.tcpMem,
                  backgroundColor: 'transparent',
                  tension: 0.3
                }
              ]
            },
            options: commonOptions
          });
        }
        
        // Performance Chart
        const performanceCtx = document.getElementById('performance-chart');
        if (performanceCtx) {
          charts.performance = new Chart(performanceCtx, {
            type: 'line',
            data: {
              labels: robustStats.map(item => formatTimestamp(item.timestamp)),
              datasets: [
                {
                  label: 'CPU (%)',
                  data: robustStats.map(item => item.cpuAll || 0),
                  borderColor: colors.cpu,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'FLIT (%)',
                  data: robustStats.map(item => item.flit || 0),
                  borderColor: colors.flit,
                  backgroundColor: 'transparent',
                  tension: 0.3
                },
                {
                  label: 'Avg Manager Cycle',
                  data: robustStats.map(item => item.avgManagerCycle || 0),
                  borderColor: colors.avgManagerCycle,
                  backgroundColor: 'transparent',
                  tension: 0.3
                }
              ]
            },
            options: commonOptions
          });
        }
      }
      
      // Overload Manager Charts
      if (overloadData.addCandidateTargets && overloadData.addCandidateTargets.length > 0) {
        const targets = overloadData.addCandidateTargets;
        
        // Trigger Chart
        const triggerCtx = document.getElementById('trigger-chart');
        if (triggerCtx) {
          charts.trigger = new Chart(triggerCtx, {
            type: 'line',
            data: {
              labels: targets.map(item => formatTimestamp(item.timestamp)),
              datasets: [{
                label: 'Trigger %',
                data: targets.map(item => item.triggerPct || 0),
                borderColor: colors.triggerPct,
                backgroundColor: colors.triggerPct + '33',
                tension: 0.3,
                fill: true
              }]
            },
            options: commonOptions
          });
        }
        
        // Deny Chart
        const denyCtx = document.getElementById('deny-chart');
        if (denyCtx) {
          charts.deny = new Chart(denyCtx, {
            type: 'line',
            data: {
              labels: targets.map(item => formatTimestamp(item.timestamp)),
              datasets: [{
                label: 'Deny %',
                data: targets.map(item => item.denyPct || 0),
                borderColor: colors.denyPct,
                backgroundColor: colors.denyPct + '33',
                tension: 0.3,
                fill: true
              }]
            },
            options: commonOptions
          });
        }
        
        // CPU Chart
        const overloadCpuCtx = document.getElementById('overload-cpu-chart');
        if (overloadCpuCtx) {
          charts.overloadCpu = new Chart(overloadCpuCtx, {
            type: 'line',
            data: {
              labels: targets.map(item => formatTimestamp(item.timestamp)),
              datasets: [{
                label: 'CPU (ms)',
                data: targets.map(item => item.metrics && item.metrics.cpu || 0),
                borderColor: colors.cpu,
                backgroundColor: colors.cpu + '33',
                tension: 0.3,
                fill: true
              }]
            },
            options: commonOptions
          });
        }
        
        // Memory Chart
        const overloadMemoryCtx = document.getElementById('overload-memory-chart');
        if (overloadMemoryCtx) {
          charts.overloadMemory = new Chart(overloadMemoryCtx, {
            type: 'line',
            data: {
              labels: targets.map(item => formatTimestamp(item.timestamp)),
              datasets: [{
                label: 'Memory (KB)',
                data: targets.map(item => item.metrics && item.metrics.mem || 0),
                borderColor: colors.memory,
                backgroundColor: colors.memory + '33',
                tension: 0.3,
                fill: true
              }]
            },
            options: commonOptions
          });
        }
        
        // Requests Chart
        const requestsCtx = document.getElementById('requests-chart');
        if (requestsCtx) {
          charts.requests = new Chart(requestsCtx, {
            type: 'line',
            data: {
              labels: targets.map(item => formatTimestamp(item.timestamp)),
              datasets: [{
                label: 'Requests',
                data: targets.map(item => item.metrics && item.metrics.reqs || 0),
                borderColor: '#8b5cf6',
                backgroundColor: '#8b5cf633',
                tension: 0.3,
                fill: true
              }]
            },
            options: commonOptions
          });
        }
      }
    }
    
    // Render data table
    function renderDataTable() {
      const dataTable = document.getElementById('data-table');
      if (!dataTable) return;
      
      const { robustStats } = window.reportData;
      
      if (!robustStats || !robustStats.length) {
        dataTable.innerHTML = '<p>No data available</p>';
        return;
      }
      
      // Create table
      const table = document.createElement('table');
      table.className = 'data-table';
      
      // Build table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      // Define columns we want to display
      const columns = [
        { key: 'timestampFormatted', label: 'Timestamp' },
        { key: 'cpuAll', label: 'CPU (%)' },
        { key: 'memRSS', label: 'Memory (KB)' },
        { key: 'clientInProgress', label: 'Client In Progress' },
        { key: 'done', label: 'Done' },
        { key: 'fwdInProgress', label: 'Fwd In Progress' },
        { key: 'http', label: 'HTTP' },
        { key: 'https', label: 'HTTPS' }
      ];
      
      // Add header cells
      columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.label;
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Build table body
      const tbody = document.createElement('tbody');
      
      // Get sample of data (up to 20 entries)
      const sampleData = robustStats.slice(0, 20);
      
      // Add data rows
      sampleData.forEach(item => {
        const row = document.createElement('tr');
        
        columns.forEach(column => {
          const td = document.createElement('td');
          td.textContent = item[column.key] !== undefined ? item[column.key] : '0';
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      dataTable.innerHTML = '';
      dataTable.appendChild(table);
      
      dataTable.innerHTML += '<div style="margin-top: 10px; font-size: 14px; color: #6c757d;">' +
        'Showing ' + sampleData.length + ' of ' + robustStats.length + ' entries' +
      '</div>';
    }
  </script>
</body>
</html>`;
};

export { generateReport };
