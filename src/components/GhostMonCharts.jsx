import React from 'react';
import MetricChart from './MetricChart';
import { prepareTimeSeriesData, formatNumber } from '../utils/chartUtils';

const GhostMonCharts = ({ logData }) => {
  if (!logData || !Array.isArray(logData) || logData.length === 0) {
    return <div>No GhostMon data available for charts</div>;
  }

  // Split data by key type
  const typeWData = logData.filter(entry => entry.keyType === 'W');
  const typeSData = logData.filter(entry => entry.keyType === 'S');
  
  // Determine if we have data for each key type
  const hasWData = typeWData.length > 0;
  const hasSData = typeSData.length > 0;

  // Custom formatter for tooltips
  const formatTooltip = (value, name) => {
    if (name === 'flyteload') return [formatNumber(value), 'Flyteload'];
    if (name === 'hits') return [value.toFixed(2), 'Hits'];
    if (name === 'suspendflag') return [value, 'Suspend Flag'];
    if (name === 'suspendlevel') return [value, 'Suspend Level'];
    return [value, name];
  };
  

  // Helper function to create chart sections for a specific data set
  const createChartSection = (data, keyType) => {
    const flyteloadChartData = prepareTimeSeriesData(data, ['flyteload']);
    const hitsChartData = prepareTimeSeriesData(data, ['hits']);
    const combinedChartData = prepareTimeSeriesData(data, ['flyteload', 'hits']);
    const typeSuffix = keyType ? ` (${keyType})` : '';
    
    return (
      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Flyteload chart */}
        <MetricChart
          data={flyteloadChartData}
          title={`Flyteload Over Time${typeSuffix}`}
          metrics={[{ name: 'flyteload', color: keyType === 'W' ? '#3182ce' : '#38a169' }]}
          tooltipFormatter={formatTooltip}
          height={350}
          yAxisFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
        />
        
        {/* Hits chart */}
        <MetricChart
          data={hitsChartData}
          title={`Hits Over Time${typeSuffix}`}
          metrics={[{ name: 'hits', color: keyType === 'W' ? '#805ad5' : '#d53f8c' }]}
          tooltipFormatter={formatTooltip}
          height={350}
          yAxisFormatter={(value) => value.toFixed(2)}
        />
        
        {/* Combined chart for correlation */}
        <MetricChart
          data={combinedChartData}
          title={`Flyteload vs Hits${typeSuffix}`}
          metrics={[
            { name: 'flyteload', color: keyType === 'W' ? '#3182ce' : '#38a169' },
            { name: 'hits', color: keyType === 'W' ? '#805ad5' : '#d53f8c' }
          ]}
          tooltipFormatter={formatTooltip}
          height={350}
          useMultipleYAxis={true}
        />
        
        {/* Suspend flags chart (if any non-zero values) */}
        {data.some(entry => entry.suspendflag > 0 || entry.suspendlevel > 0) && (
          <MetricChart
            data={prepareTimeSeriesData(data, ['suspendflag', 'suspendlevel'])}
            title={`Suspend Flags and Levels${typeSuffix}`}
            metrics={[
              { name: 'suspendflag', color: '#e53e3e' },
              { name: 'suspendlevel', color: '#ed8936' }
            ]}
            tooltipFormatter={formatTooltip}
            height={350}
          />
        )}
      </div>
    );
  };

  return (
    <div className="mb-6">
      {/* Render charts for each key type if data is available */}
      {hasWData && (
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4">Key Type: W ({typeWData.length} entries)</h3>
          {createChartSection(typeWData, 'W')}
        </div>
      )}
      
      {hasSData && (
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4">Key Type: S ({typeSData.length} entries)</h3>
          {createChartSection(typeSData, 'S')}
        </div>
      )}
      
      {/* Combined charts if both types are present */}
      {hasWData && hasSData && (
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4">Combined ({logData.length} entries)</h3>
          {createChartSection(logData)}
        </div>
      )}
    </div>
  );
};

export default GhostMonCharts;
