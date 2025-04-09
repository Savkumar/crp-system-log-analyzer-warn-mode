import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartAnnotation from './ChartAnnotation';

// Custom X-axis tick component for rotated labels
// Custom X-axis tick to match styling across all charts
const CustomXAxisTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="end"
        fill="#666"
        fontSize={12}
        transform="rotate(-45)"
      >
        {payload.value}
      </text>
    </g>
  );
};

const MetricChart = ({
  data,
  title,
  height = 250,
  metrics = [],
  yAxisFormatter = null,
  tooltipFormatter = null,
  yAxisDomain = ['dataMin', 'dataMax'],
  useMultipleYAxis = false,
  annotations = [],
  onAnnotationsChange,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete
}) => {
  // Default color scheme
  const colors = ["#3182ce", "#805ad5", "#e53e3e", "#38a169", "#ed8936", "#667eea"];

  // Annotation state
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const containerRef = useRef(null);

  // Annotation handlers - support both legacy and new API
  const handleAnnotationAdd = (annotation) => {
    console.log('MetricChart: Attempting to add annotation:', annotation);
    console.log('MetricChart: Current annotation mode:', isAnnotationMode);
    
    if (onAnnotationAdd) {
      console.log('MetricChart: Using granular API');
      onAnnotationAdd(annotation);
    } else if (onAnnotationsChange) {
      console.log('MetricChart: Using legacy API');
      const updatedAnnotations = [...annotations, annotation];
      onAnnotationsChange(updatedAnnotations);
    } else {
      console.warn('MetricChart: No annotation handlers available');
    }
  };

  const handleAnnotationUpdate = (id, changes) => {
    if (onAnnotationUpdate) {
      // Use new granular API
      onAnnotationUpdate(id, changes);
    } else if (onAnnotationsChange) {
      // Use legacy API
      const updatedAnnotations = annotations.map(annotation => 
        annotation.id === id ? { ...annotation, ...changes } : annotation
      );
      onAnnotationsChange(updatedAnnotations);
    }
  };

  const handleAnnotationDelete = (id) => {
    if (onAnnotationDelete) {
      // Use new granular API
      onAnnotationDelete(id);
    } else if (onAnnotationsChange) {
      // Use legacy API
      const updatedAnnotations = annotations.filter(annotation => annotation.id !== id);
      onAnnotationsChange(updatedAnnotations);
    }
  };

  // Toggle annotation mode
  const toggleAnnotationMode = () => {
    setIsAnnotationMode(!isAnnotationMode);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow" ref={containerRef}>
      <div className="flex justify-between items-center mb-3">
        {title && <h3 className="text-lg font-medium">{title}</h3>}
        {annotations && annotations.length > 0 && (
          <div className="text-xs text-gray-500">
            {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div style={{ position: 'relative' }}>

        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ bottom: 40, left: 45, right: 25 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="formattedTime"
              height={80}
              tickMargin={25}
              tick={<CustomXAxisTick />}
              angle={-45}
              textAnchor="end"
              dy={20}
              interval="preserveStartEnd" // Only show start, end and some ticks in between
            />

          {!useMultipleYAxis ? (
            <YAxis 
              domain={yAxisDomain} 
              tickFormatter={
                metrics.length > 0 && metrics[0].name === 'flyteload'
                ? (value) => value >= 1000000 
                  ? `${(value/1000000).toFixed(1)}M` 
                  : value >= 1000 
                  ? `${(value/1000).toFixed(0)}k` 
                  : value
                : yAxisFormatter
              } 
            />
          ) : (
            <>
              <YAxis 
                yAxisId="left" 
                tickFormatter={metrics[0].name === 'flyteload' 
                  ? (value) => value >= 1000000 
                    ? `${(value/1000000).toFixed(1)}M` 
                    : value >= 1000 
                    ? `${(value/1000).toFixed(0)}k` 
                    : value
                  : yAxisFormatter
                } 
              />
              <YAxis yAxisId="right" orientation="right" tickFormatter={metrics[1].name === 'hits' ? (value) => value.toFixed(2) : yAxisFormatter} />
            </>
          )}

          <Tooltip formatter={tooltipFormatter} />
          <Legend />

          {metrics.map((metric, index) => {
            const name = typeof metric === 'string' ? metric : metric.name;
            const dataKey = typeof metric === 'string' ? metric : metric.name;
            const color = metric.color || colors[index % colors.length];
            const yAxisId = useMultipleYAxis ? 
              (index < metrics.length / 2 ? "left" : "right") : 
              undefined;

            return (
              <Line 
                key={name}
                type="monotone" 
                dataKey={dataKey} 
                name={name}
                stroke={color}
                dot={false}
                yAxisId={yAxisId}
              />
            );
          })}
        </LineChart>
          </ResponsiveContainer>

          {/* Annotation layer - always interactive */}
          <div className="annotation-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}>
            <ChartAnnotation
              annotations={annotations}
              onAnnotationAdd={handleAnnotationAdd}
              onAnnotationUpdate={handleAnnotationUpdate}
              onAnnotationDelete={handleAnnotationDelete}
              isAnnotationMode={isAnnotationMode}
              containerRef={containerRef}
            />
          </div>
        </div>
    </div>
  );
};

export default MetricChart;