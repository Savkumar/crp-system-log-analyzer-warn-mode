import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatMemory, prepareTimeSeriesData } from '../utils/chartUtils';

const RobustStats = ({ logData }) => {
  const [activeMetric, setActiveMetric] = useState('system');

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
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }} 
              angle={-45} 
              textAnchor="end" 
              height={80} 
              dy={20}
            />
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU All</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flit</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Manager Cycle</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client In Progress</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Done</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fwd In Progress</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mem RSS</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HTTP</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HTTPS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logData.robustStats.slice(0, 10).map((entry, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{entry.timestampFormatted}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.cpuAll}%</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.flit}%</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.avgManagerCycle}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.clientInProgress}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.done}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.fwdInProgress}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatMemory(entry.memRSS)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.http}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.https}</td>
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

export default RobustStats;