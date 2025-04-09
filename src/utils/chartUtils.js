// Format timestamp for display
export const formatTimestamp = (timestamp, fullFormat = false) => {
  const date = new Date(timestamp * 1000); // Convert epoch seconds to milliseconds
  
  // For chart x-axis display - compact format
  if (!fullFormat) {
    // Format as HH:MM:SS in UTC
    return date.toISOString().substring(11, 19); 
  }
  
  // For detailed display (when explicitly requesting full format)
  return date.toISOString().replace('T', ' ').substr(0, 19); // Format as YYYY-MM-DD HH:MM:SS in UTC
};

// Format numbers for display
export const formatNumber = (num) => {
  return num ? num.toLocaleString() : '0';
};

// Format memory values
export const formatMemory = (kb) => {
  if (!kb) return '0 KB';
  if (kb < 1024) return `${kb.toLocaleString()} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${(kb / 1024 / 1024).toFixed(2)} GB`;
};

// Get statistics for a particular metric
export const getMetricStats = (data, metricPath) => {
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

// Convert time series data for charts
export const prepareTimeSeriesData = (data, metrics) => {
  if (!data || !data.length) return [];
  
  return data.map(entry => {
    const result = {
      timestamp: entry.timestamp,
      formattedTime: formatTimestamp(entry.timestamp)
    };
    
    metrics.forEach(metric => {
      if (typeof metric === 'string') {
        result[metric] = entry[metric];
      } else if (metric.path) {
        let value = entry;
        const parts = metric.path.split('.');
        for (const part of parts) {
          value = value && value[part];
        }
        result[metric.name] = value;
      }
    });
    
    return result;
  });
};
export const prepareOverloadTimeSeriesData = (data, metrics) => {
  if (!data || !data.length) return [];
  
  const timestamps = data.map(entry => entry.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  
  const entryMap = new Map(data.map(entry => [entry.timestamp, entry]));
  
  const allTimestamps = [];
  for (let t = minTime; t <= maxTime; t++) {
    allTimestamps.push(t);
  }
  
  return allTimestamps.map(timestamp => {
    const entry = entryMap.get(timestamp) || data.find(d => Math.abs(d.timestamp - timestamp) < 1);
    const result = {
      timestamp,
      formattedTime: formatTimestamp(timestamp)
    };
    
    metrics.forEach(metric => {
      if (typeof metric === 'string') {
        result[metric] = entry ? entry[metric] : null;
      } else if (metric.path) {
        let value = entry;
        const parts = metric.path.split('.');
        for (const part of parts) {
          value = value && value[part];
        }
        result[metric.name] = value;
      }
    });
    
    return result;
  });
};
