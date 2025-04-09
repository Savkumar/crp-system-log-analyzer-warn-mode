import React from 'react';
import StatCard from './StatCard';
import { getMetricStats, formatNumber } from '../utils/chartUtils';

const GhostMonStats = ({ logData }) => {
  if (!logData || !Array.isArray(logData) || logData.length === 0) {
    return <div>No GhostMon data available</div>;
  }

  // Split data by key type
  const typeWData = logData.filter(entry => entry.keyType === 'W');
  const typeSData = logData.filter(entry => entry.keyType === 'S');
  
  // Determine if we have data for each key type
  const hasWData = typeWData.length > 0;
  const hasSData = typeSData.length > 0;
  
  return (
    <div>
      {hasWData && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Key Type: W ({typeWData.length} entries)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Flyteload"
              min={formatNumber(getMetricStats(typeWData, 'flyteload').min)}
              max={formatNumber(getMetricStats(typeWData, 'flyteload').max)}
              avg={formatNumber(Math.round(getMetricStats(typeWData, 'flyteload').avg))}
              median={formatNumber(Math.round(getMetricStats(typeWData, 'flyteload').median))}
            />
            
            <StatCard 
              title="Hits"
              min={getMetricStats(typeWData, 'hits').min.toFixed(2)}
              max={getMetricStats(typeWData, 'hits').max.toFixed(2)}
              avg={getMetricStats(typeWData, 'hits').avg.toFixed(2)}
              median={getMetricStats(typeWData, 'hits').median.toFixed(2)}
            />
            
            <StatCard 
              title="Suspend Flag"
              value={typeWData.some(entry => entry.suspendflag > 0) ? 'Active' : 'Inactive'}
              className={typeWData.some(entry => entry.suspendflag > 0) ? 'text-red-600' : 'text-green-600'}
            />
            
            <StatCard 
              title="Suspend Level"
              value={Math.max(...typeWData.map(entry => entry.suspendlevel))}
              className={Math.max(...typeWData.map(entry => entry.suspendlevel)) > 0 ? 'text-yellow-600' : 'text-green-600'}
            />
          </div>
        </div>
      )}
      
      {hasSData && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Key Type: S ({typeSData.length} entries)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Flyteload"
              min={formatNumber(getMetricStats(typeSData, 'flyteload').min)}
              max={formatNumber(getMetricStats(typeSData, 'flyteload').max)}
              avg={formatNumber(Math.round(getMetricStats(typeSData, 'flyteload').avg))}
              median={formatNumber(Math.round(getMetricStats(typeSData, 'flyteload').median))}
            />
            
            <StatCard 
              title="Hits"
              min={getMetricStats(typeSData, 'hits').min.toFixed(2)}
              max={getMetricStats(typeSData, 'hits').max.toFixed(2)}
              avg={getMetricStats(typeSData, 'hits').avg.toFixed(2)}
              median={getMetricStats(typeSData, 'hits').median.toFixed(2)}
            />
            
            <StatCard 
              title="Suspend Flag"
              value={typeSData.some(entry => entry.suspendflag > 0) ? 'Active' : 'Inactive'}
              className={typeSData.some(entry => entry.suspendflag > 0) ? 'text-red-600' : 'text-green-600'}
            />
            
            <StatCard 
              title="Suspend Level"
              value={Math.max(...typeSData.map(entry => entry.suspendlevel))}
              className={Math.max(...typeSData.map(entry => entry.suspendlevel)) > 0 ? 'text-yellow-600' : 'text-green-600'}
            />
          </div>
        </div>
      )}

      {/* Combined stats if both types are present */}
      {hasWData && hasSData && (
        <div className="mb-3">
          <h3 className="text-lg font-medium mb-3">Combined ({logData.length} entries)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Flyteload"
              min={formatNumber(getMetricStats(logData, 'flyteload').min)}
              max={formatNumber(getMetricStats(logData, 'flyteload').max)}
              avg={formatNumber(Math.round(getMetricStats(logData, 'flyteload').avg))}
              median={formatNumber(Math.round(getMetricStats(logData, 'flyteload').median))}
            />
            
            <StatCard 
              title="Hits"
              min={getMetricStats(logData, 'hits').min.toFixed(2)}
              max={getMetricStats(logData, 'hits').max.toFixed(2)}
              avg={getMetricStats(logData, 'hits').avg.toFixed(2)}
              median={getMetricStats(logData, 'hits').median.toFixed(2)}
            />
            
            <StatCard 
              title="Suspend Flag"
              value={logData.some(entry => entry.suspendflag > 0) ? 'Active' : 'Inactive'}
              className={logData.some(entry => entry.suspendflag > 0) ? 'text-red-600' : 'text-green-600'}
            />
            
            <StatCard 
              title="Suspend Level"
              value={Math.max(...logData.map(entry => entry.suspendlevel))}
              className={Math.max(...logData.map(entry => entry.suspendlevel)) > 0 ? 'text-yellow-600' : 'text-green-600'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GhostMonStats;
