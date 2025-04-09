import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { prepareOverloadTimeSeriesDataWithFixedRange, getMetricStats } from '../utils/chartUtils';
// Removed unused imports

const OverloadManager = ({ logData }) => {
  if (!logData || !logData.addCandidateTargets.length) return <div>No data available</div>;
  
  // Define NA value without quotes
  const NA = "N/A";

  // Define fixed time range for OverloadManager analysis
  const fixedTimeRange = "2025-04-09 17:24:11 to 2025-04-09 18:05:50";
  
  // Prepare data for charts with the fixed time range
  const targetData = prepareOverloadTimeSeriesDataWithFixedRange(
    logData.addCandidateTargets, 
    ['triggerPct', 'denyPct', 'rule'],
    fixedTimeRange
  );
  
  const metricsData = prepareOverloadTimeSeriesDataWithFixedRange(
    logData.addCandidateTargets, 
    [
      { name: 'cpuMs', path: 'metrics.cpu' },
      { name: 'memKB', path: 'metrics.mem' },
      { name: 'reqs', path: 'metrics.reqs' }
    ],
    fixedTimeRange
  );
  // Calculate statistics
  const triggerStats = getMetricStats(logData.addCandidateTargets, 'triggerPct');
  const denyStats = getMetricStats(logData.addCandidateTargets, 'denyPct');
  const cpuStats = getMetricStats(logData.addCandidateTargets, { path: 'metrics.cpu' });
  const memStats = getMetricStats(logData.addCandidateTargets, { path: 'metrics.mem' });
  const reqsStats = getMetricStats(logData.addCandidateTargets, { path: 'metrics.reqs' });
  // Removed unused runQStats

  // Get unique rules for rule distribution analysis
  const rules = {};
  const triggerReasons = {};
  const arlidEntries = {};
  const ehnidEntries = {};
  
  logData.addCandidateTargets.forEach(entry => {
    if (entry.rule) {
      rules[entry.rule] = (rules[entry.rule] || 0) + 1;
    }
    // Track arlid and ehnid entries if they exist
    if (entry.arlid) {
      arlidEntries[entry.arlid] = (arlidEntries[entry.arlid] || 0) + 1;
    }
    if (entry.ehnid !== null && entry.ehnid !== undefined) {
      ehnidEntries[entry.ehnid] = (ehnidEntries[entry.ehnid] || 0) + 1;
    }
  });
  
  logData.processMainLoops.forEach(entry => {
    if (entry.triggerReason) {
      triggerReasons[entry.triggerReason] = (triggerReasons[entry.triggerReason] || 0) + 1;
    }
  });
  
  // Convert to arrays for easier rendering
  const ruleDistribution = Object.entries(rules)
    .map(([rule, count]) => ({ 
      rule, 
      count, 
      percentage: ((count / logData.addCandidateTargets.length) * 100).toFixed(1) 
    }))
    .sort((a, b) => b.count - a.count);
    
  const triggerDistribution = Object.entries(triggerReasons)
    .map(([reason, count]) => ({ 
      reason, 
      count, 
      percentage: ((count / logData.processMainLoops.length) * 100).toFixed(1) 
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">OverloadManager Analysis</h2>
      <div className="text-sm text-gray-500 mb-4">
        Time Range: {fixedTimeRange} (UTC)
      </div>

      {/* All sections in a horizontal row */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-300 mb-6">
        <h3 className="text-xl font-semibold mb-3 text-center">Summary Statistics, Rule Distribution & Trigger Reason Distribution</h3>
        
        {/* Centered tables container */}
        <div className="flex flex-col items-center">
          {/* Summary Statistics Table */}
          <div className="w-full max-w-md mb-6">
            <h4 className="text-lg font-medium mb-2 text-center">Summary Statistics</h4>
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 border-b">Metric</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-b border-l">Current</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-b border-l">Avg</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-b border-l">Max</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">Trigger %</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-orange-600 font-bold border-l">
                    {logData.addCandidateTargets[logData.addCandidateTargets.length - 1].triggerPct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{triggerStats.avg.toFixed(1)}%</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{triggerStats.max.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">Deny %</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-red-600 font-bold border-l">
                    {logData.addCandidateTargets[logData.addCandidateTargets.length - 1].denyPct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{denyStats.avg.toFixed(1)}%</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{denyStats.max.toFixed(1)}%</td>
                </tr>
                {/* Run Queue metric removed as requested */}
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">CPU (ms)</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-green-600 font-bold border-l">
                    {logData.addCandidateTargets[logData.addCandidateTargets.length - 1].metrics.cpu}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{cpuStats.avg.toFixed(1)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{cpuStats.max}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">Memory (KB)</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-purple-600 font-bold border-l">
                    {logData.addCandidateTargets[logData.addCandidateTargets.length - 1].metrics.mem}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{memStats.avg.toFixed(1)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{memStats.max}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">Requests</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-blue-600 font-bold border-l">
                    {logData.addCandidateTargets[logData.addCandidateTargets.length - 1].metrics.reqs}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{reqsStats.avg.toFixed(1)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{reqsStats.max}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Rule Distribution Table */}
          <div className="w-full max-w-md mb-6">
            <h4 className="text-lg font-medium mb-2 text-center">Rule Distribution</h4>
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 border-b">Rule</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-b border-l">Count</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-b border-l">Percentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ruleDistribution.map((rule, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{rule.rule}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{rule.count}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{rule.percentage}%</td>
                  </tr>
                ))}
                {ruleDistribution.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-2 text-center text-sm text-gray-500">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Trigger Reason Distribution Table */}
          <div className="w-full max-w-md mb-6">
            <h4 className="text-lg font-medium mb-2 text-center">Trigger Reason Distribution</h4>
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-900 border-b">Trigger Reason</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-b border-l">Count</th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-b border-l">Percentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {triggerDistribution.map((trigger, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">{trigger.reason}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{trigger.count}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center border-l">{trigger.percentage}%</td>
                  </tr>
                ))}
                {triggerDistribution.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-2 text-center text-sm text-gray-500">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts section */}
      {/* Trigger Percentage Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Trigger Percentage</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={targetData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }} 
              angle={-45} 
              textAnchor="end" 
              height={80} 
              dy={20}
              interval="preserveStartEnd"
              minTickGap={10}
            />
            <YAxis domain={[0, Math.max(100, triggerStats.max * 1.1)]} />
            <Tooltip 
              formatter={(value) => value !== null ? [`${value.toFixed(1)}%`] : ["No data"]}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="triggerPct" 
              stroke="#ed8936" 
              name="Trigger %" 
              dot={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Deny Percentage Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Deny Percentage</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={targetData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }} 
              angle={-45} 
              textAnchor="end" 
              height={80} 
              dy={20}
              interval="preserveStartEnd"
              minTickGap={10}
            />
            <YAxis domain={[0, Math.max(100, denyStats.max * 1.1)]} />
            <Tooltip 
              formatter={(value) => value !== null ? [`${value.toFixed(1)}%`] : ["No data"]}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="denyPct" 
              stroke="#e53e3e" 
              name="Deny %" 
              dot={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CPU Metrics Chart */}
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h3 className="text-lg font-medium mb-3">CPU Usage (ms)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={metricsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }} 
              angle={-45} 
              textAnchor="end" 
              height={80} 
              dy={20}
              interval="preserveStartEnd"
              minTickGap={10}
            />
            <YAxis domain={[0, cpuStats.max * 1.1]} />
            <Tooltip 
              formatter={(value) => value !== null ? [`${value} ms`] : ["No data"]}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="cpuMs" 
              stroke="#3182ce" 
              name="CPU (ms)" 
              dot={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Memory Metrics Chart */}
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h3 className="text-lg font-medium mb-3">Memory Usage (KB)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={metricsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }} 
              angle={-45} 
              textAnchor="end" 
              height={80} 
              dy={20}
              interval="preserveStartEnd"
              minTickGap={10}
            />
            <YAxis domain={[0, memStats.max * 1.1]} />
            <Tooltip 
              formatter={(value) => value !== null ? [`${value} KB`] : ["No data"]}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="memKB" 
              stroke="#38a169" 
              name="Memory (KB)" 
              dot={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Requests Metrics Chart */}
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h3 className="text-lg font-medium mb-3">Request Count</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={metricsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }} 
              angle={-45} 
              textAnchor="end" 
              height={80} 
              dy={20}
              interval="preserveStartEnd"
              minTickGap={10}
            />
            <YAxis domain={[0, reqsStats.max * 1.1]} />
            <Tooltip 
              formatter={(value) => value !== null ? [`${value}`] : ["No data"]}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="reqs" 
              stroke="#805ad5" 
              name="Requests" 
              dot={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Raw data table */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium mb-3">OverloadManager Raw Data</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger %</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deny %</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU (ms)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory (KB)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triggered By</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">arlid</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ehnid</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logData.addCandidateTargets.slice(0, 5).map((entry, index) => {
                const mainLoop = logData.processMainLoops.find(m => Math.abs(m.timestamp - entry.timestamp) < 0.01);
                return (
                  <tr key={index}>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.timestampFormatted}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.triggerPct.toFixed(1)}%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.denyPct.toFixed(1)}%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.metrics.cpu}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.metrics.mem}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.metrics.reqs}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{mainLoop ? mainLoop.triggerReason || NA : NA}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.rule || NA}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.arlid !== null && entry.arlid !== undefined ? entry.arlid : NA}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{entry.ehnid !== null && entry.ehnid !== undefined ? entry.ehnid : NA}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Showing 5 of {logData.addCandidateTargets.length} entries
        </div>
      </div>
    </div>
  );
};

export default OverloadManager;
