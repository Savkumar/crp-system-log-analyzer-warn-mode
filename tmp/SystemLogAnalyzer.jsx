import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

const SystemLogAnalyzer = () => {
  const [loading, setLoading] = useState(true);
  const [logData, setLogData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeMetric, setActiveMetric] = useState('system');
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState({ start: null, end: null });

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000); // Convert epoch seconds to milliseconds
    return date.toISOString().replace('T', ' ').substr(0, 19); // Format as YYYY-MM-DD HH:MM:SS in UTC
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // Parse Robust stats logs
        const robustStats = [];
        // Parse OverloadManager entries
        const overloadManager = [];

        // Your existing parsing logic here - copy it from the useEffect
        lines.forEach(line => {
          if (line.includes("Robust - stats")) {
            const parts = line.split('|');
            const timestamp = parseFloat(parts[0]);

            const data = {
              timestamp,
              timestampFormatted: formatTimestamp(timestamp),
              http: 0,
              https: 0,
              clientInProgress: 0,
              done: 0,
              fwdInProgress: 0,
              flit: 0,
              freeFds: 0,
              websocketsInProgress: 0,
              memRSS: 0,
              appUsed: 0,
              totalMem: 0,
              tcpMem: 0,
              inPressure: "N",
              cpuAll: 0,
              avgManagerCycle: 0
            };

            // Extract HTTP/HTTPS
            const httpMatch = line.match(/Accepts: http\/https (\d+)\/(\d+)/);
            if (httpMatch) {
              data.http = parseInt(httpMatch[1]);
              data.https = parseInt(httpMatch[2]);
            }

            // Extract client in-progress
            const clientMatch = line.match(/client: in-progress (\d+)/);
            if (clientMatch) {
              data.clientInProgress = parseInt(clientMatch[1]);
            }

            // Extract done
            const doneMatch = line.match(/done (\d+),/);
            if (doneMatch) {
              data.done = parseInt(doneMatch[1]);
            }

            // Extract fwd in-progress
            const fwdMatch = line.match(/fwd: in progress (\d+)/);
            if (fwdMatch) {
              data.fwdInProgress = parseInt(fwdMatch[1]);
            }

            // Extract flit
            const flitMatch = line.match(/flit (\d+)%/);
            if (flitMatch) {
              data.flit = parseInt(flitMatch[1]);
            }

            // Extract FreeFds
            const freeFdsMatch = line.match(/FreeFds: (\d+)/);
            if (freeFdsMatch) {
              data.freeFds = parseInt(freeFdsMatch[1]);
            }

            // Extract websockets in-progress
            const websocketsMatch = line.match(/websockets: in-progress (\d+)/);
            if (websocketsMatch) {
              data.websocketsInProgress = parseInt(websocketsMatch[1]);
            }

            // Extract memory values
            const memRSSMatch = line.match(/Mem RSS (\d+) KB/);
            if (memRSSMatch) {
              data.memRSS = parseInt(memRSSMatch[1]);
            }

            const appUsedMatch = line.match(/app used (\d+) KB/);
            if (appUsedMatch) {
              data.appUsed = parseInt(appUsedMatch[1]);
            }

            const totalMemMatch = line.match(/totalMem (\d+) KB/);
            if (totalMemMatch) {
              data.totalMem = parseInt(totalMemMatch[1]);
            }

            // Extract TCP Mem
            const tcpMemMatch = line.match(/TCP Mem (\d+) KB/);
            if (tcpMemMatch) {
              data.tcpMem = parseInt(tcpMemMatch[1]);
            }

            // Extract pressure
            const pressureMatch = line.match(/in pressure: ([YN])/);
            if (pressureMatch) {
              data.inPressure = pressureMatch[1];
            }

            // Extract CPU all
            const cpuAllMatch = line.match(/CPU: all (\d+)%/);
            if (cpuAllMatch) {
              data.cpuAll = parseInt(cpuAllMatch[1]);
            }

            // Extract AVG manager cycle
            const avgManagerMatch = line.match(/AVG manager cycle (\d+)us/);
            if (avgManagerMatch) {
              data.avgManagerCycle = parseInt(avgManagerMatch[1]);
            }

            robustStats.push(data);
          } else if (line.includes("crp::OverloadManager")) {
            const parts = line.split('|');
            const timestamp = parseFloat(parts[0]);

            const data = {
              timestamp,
              timestampFormatted: formatTimestamp(timestamp),
              type: "",
              triggerPct: 0,
              denyPct: 0,
              metrics: {
                cpu: 0,
                mem: 0,
                reqs: 0
              },
              runQ: 0
            };

            // Determine the type of OverloadManager entry
            if (line.includes("addCandidateTarget")) {
              data.type = "addCandidateTarget";

              // Extract trigger and deny percentages
              const pctMatch = line.match(/trigger_pct:(\d+\.\d+)% deny_pct:(\d+\.\d+)%/);
              if (pctMatch) {
                data.triggerPct = parseFloat(pctMatch[1]);
                data.denyPct = parseFloat(pctMatch[2]);
              }

              // Extract metrics
              const metricsMatch = line.match(/metrics \(cpu:(\d+)ms mem:(\d+)KB reqs:(\d+)\)/);
              if (metricsMatch) {
                data.metrics.cpu = parseInt(metricsMatch[1]);
                data.metrics.mem = parseInt(metricsMatch[2]);
                data.metrics.reqs = parseInt(metricsMatch[3]);
              }
            } else if (line.includes("processMainLoop")) {
              data.type = "processMainLoop";

              // Extract trigger reason and runQ
              const triggerMatch = line.match(/triggered by ([^:]+):(\d+\.\d+)/);
              if (triggerMatch) {
                data.triggerReason = triggerMatch[1];
                data.runQ = parseFloat(triggerMatch[2]);
              }
            }

            overloadManager.push(data);
          }
        });

        // Set the data
        if (robustStats.length > 0 && overloadManager.length > 0) {
          const data = {
            robustStats,
            overloadManager,
            addCandidateTargets: overloadManager.filter(entry => entry.type === "addCandidateTarget"),
            processMainLoops: overloadManager.filter(entry => entry.type === "processMainLoop")
          };

          const startTime = Math.min(
            robustStats[0].timestamp,
            overloadManager[0].timestamp
          );

          const endTime = Math.max(
            robustStats[robustStats.length - 1].timestamp,
            overloadManager[overloadManager.length - 1].timestamp
          );

          setTimeRange({ start: startTime, end: endTime });
          setLogData(data);
        } else {
          setError('Failed to parse any log data');
        }
      } catch (err) {
        setError('Error analyzing log file: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  // Format numbers for display
  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
  };

  // Format memory values
  const formatMemory = (kb) => {
    if (!kb) return '0 KB';
    if (kb < 1024) return `${kb.toLocaleString()} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(2)} MB`;
    return `${(kb / 1024 / 1024).toFixed(2)} GB`;
  };

  // Convert time series data for charts
  const prepareTimeSeriesData = (data, metrics) => {
    if (!data) return [];

    return data.map(entry => {
      const result = { 
        timestamp: entry.timestamp,
        formattedTime: formatTimestamp(entry.timestamp)
      };

      metrics.forEach(metric => {
        if (typeof metric === 'string') {
          result[metric] = entry[metric];
        } else if (metric.path) {
          // Handle nested paths like metrics.cpu
          let value = entry;
          const parts = metric.path.split('.');
          for (const part of parts) {
            value = value[part];
          }
          result[metric.name] = value;
        }
      });

      return result;
    });
  };

  // Get statistics for a particular metric
  const getMetricStats = (data, metricPath) => {
    if (!data || !data.length) return { min: 0, max: 0, avg: 0, median: 0 };

    // Extract values
    const values = data.map(entry => {
      if (typeof metricPath === 'string') {
        return entry[metricPath] || 0;
      } else if (metricPath.path) {
        let value = entry;
        const parts = metricPath.path.split('.');
        for (const part of parts) {
          value = value && value[part];
        }
        return value || 0;
      }
      return 0;
    });

    // Calculate statistics
    values.sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const median = values.length % 2 === 0
      ? (values[values.length / 2] + values[(values.length / 2) - 1]) / 2
      : values[Math.floor(values.length / 2)];

    return { min, max, avg, median };
  };

  // Render system overview dashboard
  const renderSystemOverview = () => {
    if (!logData || !logData.robustStats.length) return <div>No data available</div>;

    const lastStats = logData.robustStats[logData.robustStats.length - 1];
    const cpuStats = getMetricStats(logData.robustStats, 'cpuAll');
    const memStats = getMetricStats(logData.robustStats, 'memRSS');
    const httpStats = getMetricStats(logData.robustStats, 'https');

    // Prepare time series data for CPU, Memory, and HTTP requests
    const cpuData = prepareTimeSeriesData(logData.robustStats, ['cpuAll']);
    const memData = prepareTimeSeriesData(logData.robustStats, ['memRSS']);
    const httpData = prepareTimeSeriesData(logData.robustStats, ['http', 'https']);
    const clientData = prepareTimeSeriesData(logData.robustStats, ['clientInProgress', 'done']);

    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>

        {/* Horizontal grid for system metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">CPU Usage</h3>
            <div className="text-3xl font-bold text-blue-600">{lastStats.cpuAll}%</div>
            <div className="text-sm text-gray-500">
              Avg: {cpuStats.avg.toFixed(1)}% | Min: {cpuStats.min}% | Max: {cpuStats.max}%
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Memory (RSS)</h3>
            <div className="text-3xl font-bold text-green-600">{formatMemory(lastStats.memRSS)}</div>
            <div className="text-sm text-gray-500">
              Avg: {formatMemory(memStats.avg)} | Max: {formatMemory(memStats.max)}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">HTTPS Requests</h3>
            <div className="text-3xl font-bold text-purple-600">{formatNumber(lastStats.https)}</div>
            <div className="text-sm text-gray-500">
              Avg: {httpStats.avg.toFixed(0)} | Max: {formatNumber(httpStats.max)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">CPU Utilization Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cpuData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedTime" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} dy={20}/>
                <YAxis domain={[0, Math.max(100, cpuStats.max)]} />
                <Tooltip formatter={(value) => [`${value}%`, 'CPU']} labelFormatter={(time) => `Time: ${time}`} />
                <Line type="monotone" dataKey="cpuAll" stroke="#3182ce" name="CPU %" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">Memory Usage Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={memData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedTime" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} dy={20}/>
                <YAxis domain={['dataMin', 'dataMax']} tickFormatter={(value) => `${(value / 1024 / 1024).toFixed(1)} GB`} />
                <Tooltip formatter={(value) => [formatMemory(value), 'Memory RSS']} labelFormatter={(time) => `Time: ${time}`} />
                <Line type="monotone" dataKey="memRSS" stroke="#38a169" name="Memory RSS" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">HTTP/HTTPS Requests</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={httpData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedTime" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} dy={20}/>
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="http" stroke="#3182ce" name="HTTP" dot={false} />
                <Line type="monotone" dataKey="https" stroke="#805ad5" name="HTTPS" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">Client Requests</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={clientData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedTime" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} dy={20}/>
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clientInProgress" stroke="#e53e3e" name="In Progress" dot={false} />
                <Line type="monotone" dataKey="done" stroke="#38a169" name="Done" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Render Robust Stats details
  const renderRobustStats = () => {
    if (!logData || !logData.robustStats.length) return <div>No data available</div>;

    // Determine which metrics to show based on the active metric selection
    let metrics = [];
    let chartTitle = "";

    switch (activeMetric) {
      case 'http':
        metrics = ['http', 'https'];
        chartTitle = "HTTP/HTTPS Requests";
        break;
      case 'client':
        metrics = ['clientInProgress', 'done', 'fwdInProgress'];
        chartTitle = "Client Requests";
        break;
      case 'memory':
        metrics = ['memRSS', 'appUsed', 'totalMem'];
        chartTitle = "Memory Usage (KB)";
        break;
      case 'network':
        metrics = ['freeFds', 'websocketsInProgress', 'tcpMem'];
        chartTitle = "Network Resources";
        break;
      case 'performance':
        metrics = ['cpuAll', 'flit', 'avgManagerCycle'];
        chartTitle = "Performance Metrics";
        break;
      default:
        metrics = ['cpuAll', 'clientInProgress'];
        chartTitle = "System Load";
    }

    const chartData = prepareTimeSeriesData(logData.robustStats, metrics);

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Robust Stats Analysis</h2>

          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded text-sm ${activeMetric === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveMetric('system')}
            >
              System
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm ${activeMetric === 'http' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveMetric('http')}
            >
              HTTP
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm ${activeMetric === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveMetric('client')}
            >
              Client
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm ${activeMetric === 'memory' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveMetric('memory')}
            >
              Memory
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm ${activeMetric === 'network' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveMetric('network')}
            >
              Network
            </button>
            <button 
              className={`px-3 py-1 rounded text-sm ${activeMetric === 'performance' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveMetric('performance')}
            >
              Performance
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium mb-3">{chartTitle}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedTime" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} dy={20}/>
              <YAxis />
              <Tooltip />
              <Legend />
              {metrics.map((metric, index) => (
                <Line 
                  key={metric}
                  type="monotone" 
                  dataKey={metric} 
                  stroke={index === 0 ? "#3182ce" : index === 1 ? "#805ad5" : "#e53e3e"} 
                  dot={false} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Raw Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HTTP</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HTTPS</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client In Progress</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Done</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fwd In Progress</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU All</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mem RSS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logData.robustStats.slice(0, 10).map((entry, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.timestampFormatted}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.http}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.https}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.clientInProgress}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.done}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.fwdInProgress}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.cpuAll}%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{formatMemory(entry.memRSS)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Showing 10 of {logData.robustStats.length} entries
          </div>
        </div>
      </div>
    );
  };

  // Render OverloadManager analysis
  const renderOverloadManager = () => {
    if (!logData || !logData.addCandidateTargets.length) return <div>No data available</div>;

    const targetData = prepareTimeSeriesData(logData.addCandidateTargets, ['triggerPct', 'denyPct']);
    const metricsData = prepareTimeSeriesData(
      logData.addCandidateTargets, 
      [
        { name: 'cpuMs', path: 'metrics.cpu' },
        { name: 'memKB', path: 'metrics.mem' },
        { name: 'reqs', path: 'metrics.reqs' }
      ]
    );
    const runQData = prepareTimeSeriesData(logData.processMainLoops, ['runQ']);

    // Calculate statistics
    const triggerStats = getMetricStats(logData.addCandidateTargets, 'triggerPct');
    const denyStats = getMetricStats(logData.addCandidateTargets, 'denyPct');
    const cpuStats = getMetricStats(logData.addCandidateTargets, { path: 'metrics.cpu' });
    const memStats = getMetricStats(logData.addCandidateTargets, { path: 'metrics.mem' });
    const reqsStats = getMetricStats(logData.addCandidateTargets, { path: 'metrics.reqs' });
    const runQStats = getMetricStats(logData.processMainLoops, 'runQ');

    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">OverloadManager Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Trigger Percentage</h3>
            <div className="text-3xl font-bold text-orange-600">{logData.addCandidateTargets[logData.addCandidateTargets.length - 1].triggerPct.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">
              Avg: {triggerStats.avg.toFixed(1)}% | Max: {triggerStats.max.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Deny Percentage</h3>
            <div className="text-3xl font-bold text-red-600">{logData.addCandidateTargets[logData.addCandidateTargets.length - 1].denyPct.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">
              Avg: {denyStats.avg.toFixed(1)}% | Max: {denyStats.max.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Run Queue</h3>
            <div className="text-3xl font-bold text-blue-600">{logData.processMainLoops[logData.processMainLoops.length - 1].runQ.toFixed(3)}</div>
            <div className="text-sm text-gray-500">
              Avg: {runQStats.avg.toFixed(3)} | Max: {runQStats.max.toFixed(3)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">Trigger & Deny Percentages</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={targetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedTime" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} dy={20}/>
                <YAxis domain={[0, Math.max(100, denyStats.max * 1.1)]} />
                <Tooltip formatter={(value) => [`${value.toFixed(1)}%`]} />
                <Legend />
                <Line type="monotone" dataKey="triggerPct" stroke="#ed8936" name="Trigger %" dot={false} />
                <Line type="monotone" dataKey="denyPct" stroke="#e53e3e" name="Deny %" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">Run Queue Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart

                data={runQData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedTime" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} dy={20}/>
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toFixed(3)}`]} />
                <Line type="monotone" dataKey="runQ" stroke="#3182ce" name="RunQ" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderSystemOverview();
      case 'robustStats':
        return renderRobustStats();
      case 'overloadManager':
        return renderOverloadManager();
      default:
        return <div>No data available</div>;
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Log Analyzer</h1>
        <input type="file" onChange={handleFileUpload} className="border border-gray-300 px-3 py-2 rounded" />
        {loading && <div className="text-gray-500">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
      </div>
      <div className="flex mb-4">
        <button 
          className={`px-4 py-2 rounded text-lg ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`px-4 py-2 rounded text-lg ${activeTab === 'robustStats' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('robustStats')}
        >
          Robust Stats
        </button>
        <button 
          className={`px-4 py-2 rounded text-lg ${activeTab === 'overloadManager' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('overloadManager')}
        >
          Overload Manager
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default SystemLogAnalyzer;