
import React, { useCallback } from 'react';
import { formatMemory, formatNumber, prepareTimeSeriesData, getMetricStats } from '../utils/chartUtils';
import MetricChart from './MetricChart';
import StatCard from './StatCard';
import { useAnnotations } from './AnnotationContext';

const Overview = ({ logData }) => {
  // Get annotations from context with optimized methods
  const { 
    getAnnotationsForChart, 
    addAnnotation,
    updateAnnotation,
    deleteAnnotation
  } = useAnnotations();

  // Define optimized handlers for annotation actions
  const handleAnnotationAdd = useCallback((chartId, annotation) => {
    addAnnotation(chartId, annotation);
  }, [addAnnotation]);

  const handleAnnotationUpdate = useCallback((chartId, annotationId, changes) => {
    updateAnnotation(chartId, annotationId, changes);
  }, [updateAnnotation]);

  const handleAnnotationDelete = useCallback((chartId, annotationId) => {
    deleteAnnotation(chartId, annotationId);
  }, [deleteAnnotation]);

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

      <div className="mb-6" style={{textAlign: 'center'}}>
        <StatCard 
          title="CPU Usage"
          value={`${lastStats.cpuAll}%`}
          color="blue"
          details={`Avg: ${cpuStats.avg.toFixed(1)}% | Min: ${cpuStats.min}% | Max: ${cpuStats.max}%`}
        />

        <StatCard
          title="Memory (RSS)"
          value={formatMemory(lastStats.memRSS)}
          color="green"
          details={`Avg: ${formatMemory(memStats.avg)} | Max: ${formatMemory(memStats.max)}`}
        />

        <StatCard
          title="HTTPS Requests"
          value={formatNumber(lastStats.https)}
          color="purple"
          details={`Avg: ${httpStats.avg.toFixed(0)} | Max: ${formatNumber(httpStats.max)}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <MetricChart 
          data={cpuData}
          title="CPU Utilization Over Time"
          metrics={[{name: 'cpuAll', color: '#3182ce'}]}
          yAxisDomain={[0, Math.max(100, cpuStats.max)]}
          tooltipFormatter={(value) => [`${value}%`, 'CPU']}
          annotations={getAnnotationsForChart('cpuChart')}
          onAnnotationAdd={(annotation) => handleAnnotationAdd('cpuChart', annotation)}
          onAnnotationUpdate={(id, changes) => handleAnnotationUpdate('cpuChart', id, changes)}
          onAnnotationDelete={(id) => handleAnnotationDelete('cpuChart', id)}
        />

        <MetricChart 
          data={memData}
          title="Memory Usage Over Time"
          metrics={[{name: 'memRSS', color: '#38a169'}]}
          yAxisFormatter={(value) => `${(value / 1024 / 1024).toFixed(1)} GB`}
          tooltipFormatter={(value) => [formatMemory(value), 'Memory RSS']}
          annotations={getAnnotationsForChart('memoryChart')}
          onAnnotationAdd={(annotation) => handleAnnotationAdd('memoryChart', annotation)}
          onAnnotationUpdate={(id, changes) => handleAnnotationUpdate('memoryChart', id, changes)}
          onAnnotationDelete={(id) => handleAnnotationDelete('memoryChart', id)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricChart 
          data={httpData}
          title="HTTP/HTTPS Requests"
          metrics={[
            {name: 'http', color: '#3182ce'},
            {name: 'https', color: '#805ad5'}
          ]}
          annotations={getAnnotationsForChart('httpChart')}
          onAnnotationAdd={(annotation) => handleAnnotationAdd('httpChart', annotation)}
          onAnnotationUpdate={(id, changes) => handleAnnotationUpdate('httpChart', id, changes)}
          onAnnotationDelete={(id) => handleAnnotationDelete('httpChart', id)}
        />

        <MetricChart 
          data={clientData}
          title="Client Requests"
          metrics={[
            {name: 'clientInProgress', color: '#e53e3e'},
            {name: 'done', color: '#38a169'}
          ]}
          annotations={getAnnotationsForChart('clientRequestsChart')}
          onAnnotationAdd={(annotation) => handleAnnotationAdd('clientRequestsChart', annotation)}
          onAnnotationUpdate={(id, changes) => handleAnnotationUpdate('clientRequestsChart', id, changes)}
          onAnnotationDelete={(id) => handleAnnotationDelete('clientRequestsChart', id)}
        />
      </div>
    </div>
  );
};

export default Overview;
