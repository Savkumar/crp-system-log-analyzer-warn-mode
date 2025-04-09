import React, { useState, useEffect } from 'react';
import { parseGhostMonData } from '../utils/ghostMonParser';
import GhostMonStats from './GhostMonStats';
import GhostMonCharts from './GhostMonCharts';
import { formatTimestamp } from '../utils/chartUtils';

const GhostMonAnalyzer = ({ logFileContent, isLoading }) => {
  const [ghostMonData, setGhostMonData] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!logFileContent || isLoading) {
      return;
    }

    try {
      // Check if this is server-processed JSON data
      if (typeof logFileContent === 'string' && logFileContent.startsWith('[{') && logFileContent.endsWith('}]')) {
        try {
          // Try to parse as JSON (pre-processed data from server)
          const parsedData = JSON.parse(logFileContent);
          
          if (Array.isArray(parsedData) && parsedData.length > 0 && 'timestamp' in parsedData[0]) {
            // This is pre-processed data
            setGhostMonData(parsedData);
            
            // Extract time range from the data
            const timestamps = parsedData.map(entry => entry.timestamp);
            setTimeRange({
              start: Math.min(...timestamps),
              end: Math.max(...timestamps)
            });
            
            setError('');
            return;
          }
        } catch (jsonErr) {
          // Not valid JSON, continue with regular parsing
          console.warn('Not valid JSON data, continuing with regular parsing:', jsonErr.message);
        }
      }
      
      // Regular parsing of log file content
      const { data, timeRange, error } = parseGhostMonData(logFileContent);
      
      if (error) {
        setError(error);
        setGhostMonData(null);
      } else {
        setGhostMonData(data);
        setTimeRange(timeRange);
        setError('');
      }
    } catch (err) {
      setError('Error processing GhostMon data: ' + err.message);
      setGhostMonData(null);
    }
  }, [logFileContent, isLoading]);

  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="text-lg">Loading GhostMon data...</div>
        <div className="mt-2 text-gray-500">Please wait</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
        {error}
      </div>
    );
  }

  if (!ghostMonData || ghostMonData.length === 0) {
    return (
      <div className="text-center py-6 bg-yellow-50 rounded-lg">
        <div className="text-lg">No GhostMon data found</div>
        <div className="mt-2 text-gray-600">
          The log file doesn't contain any entries with the pattern "dnsp_key=W" or "dnsp_key=S"
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden element to store the parsed data for the report generator */}
      <div id="ghostmon-analyzer-data" style={{ display: 'none' }}>
        {JSON.stringify(ghostMonData)}
      </div>
      
      <div className="text-xs text-gray-500 flex flex-wrap justify-between items-center">
        <div>
          {formatTimestamp(timeRange.start, true)} to {formatTimestamp(timeRange.end, true)}
        </div>
        <div>
          {ghostMonData.length} GhostMon entries found 
          ({ghostMonData.filter(entry => entry.keyType === 'W').length} W, 
          {ghostMonData.filter(entry => entry.keyType === 'S').length} S)
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-4">GhostMon Statistics</h2>
        <GhostMonStats logData={ghostMonData} />
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-xl font-medium mb-4">GhostMon Charts</h2>
        <GhostMonCharts logData={ghostMonData} />
      </div>

      {/* Export Options */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium mb-2">Raw Data</h3>
        <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-48">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">Timestamp (UTC)</th>
                  <th className="px-2 py-1 text-left">Key</th>
                  <th className="px-2 py-1 text-left">Flyteload</th>
                  <th className="px-2 py-1 text-left">Hits</th>
                  <th className="px-2 py-1 text-left">Suspend Flag</th>
                  <th className="px-2 py-1 text-left">Suspend Level</th>
                </tr>
              </thead>
              <tbody>
                {ghostMonData.slice(0, 20).map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1">{formatTimestamp(entry.timestamp, true)}</td>
                    <td className="px-2 py-1 font-medium" style={{ color: entry.keyType === 'W' ? '#3182ce' : '#38a169' }}>
                      {entry.keyType}
                    </td>
                    <td className="px-2 py-1">{entry.flyteload.toLocaleString()}</td>
                    <td className="px-2 py-1">{entry.hits.toFixed(2)}</td>
                    <td className="px-2 py-1">{entry.suspendflag}</td>
                    <td className="px-2 py-1">{entry.suspendlevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          {ghostMonData.length > 20 && (
            <div className="text-center text-gray-500 mt-2">
              Showing 20 of {ghostMonData.length} entries
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GhostMonAnalyzer;
