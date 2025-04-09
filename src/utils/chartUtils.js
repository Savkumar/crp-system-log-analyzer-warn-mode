// Format timestamp for display
export const formatTimestamp = (timestamp, fullFormat = false) => {
  const date = new Date(timestamp * 1000); // Convert epoch seconds to milliseconds
  
  // For chart x-axis display - compact format
  if (!fullFormat) {
    // Format as HH:MM:SS in UTC including minutes and seconds
    return date.toISOString().substring(11, 19); 
  }
  
  // For detailed display (when explicitly requesting full format)
  return date.toISOString().replace('T', ' ').substr(0, 19); // Format as YYYY-MM-DD HH:MM:SS in UTC
};

// Format timestamp specifically for the OverloadManager charts
export const formatOverloadTimestamp = (timestamp) => {
  if (typeof timestamp === 'string') return timestamp; // Return if already formatted
  
  // Safety check - ensure we have a valid timestamp
  if (!timestamp || isNaN(timestamp) || timestamp === 0) {
    return '00:00:00';
  }
  
  try {
    const date = new Date(timestamp * 1000); // Convert epoch seconds to milliseconds
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '00:00:00';
    }
    // Format as HH:MM:SS in UTC for better readability in OverloadManager charts
    return date.toISOString().substring(11, 19);
  } catch (e) {
    console.error("Error formatting timestamp:", timestamp, e);
    return '00:00:00';
  }
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

// Convert a timestamp string to Unix timestamp (seconds)
export const parseTimestamp = (timeString) => {
  // Expected format: "YYYY-MM-DD HH:MM:SS"
  // Convert to a JavaScript Date object
  const date = new Date(timeString.replace(' ', 'T') + 'Z'); // Append Z to treat as UTC
  return Math.floor(date.getTime() / 1000); // Convert to seconds
};

// Parse a time range string and return start and end timestamps
export const parseTimeRange = (timeRangeString) => {
  // Expected format: "YYYY-MM-DD HH:MM:SS to YYYY-MM-DD HH:MM:SS"
  const parts = timeRangeString.split(' to ');
  if (parts.length !== 2) {
    throw new Error('Invalid time range format. Expected "YYYY-MM-DD HH:MM:SS to YYYY-MM-DD HH:MM:SS"');
  }
  
  return {
    startTime: parseTimestamp(parts[0]),
    endTime: parseTimestamp(parts[1])
  };
};

// Prepare time series data for OverloadManager charts using a fixed time range
export const prepareOverloadTimeSeriesDataWithFixedRange = (data, metrics, timeRangeString) => {
  if (!data || !data.length) return [];
  
  // Parse the time range string to get start and end times
  const { startTime, endTime } = parseTimeRange(timeRangeString);
  
  // First, create a copy of the original data to preserve the actual data points
  const processedData = [...data];
  
  // Create a map of existing entries keyed by timestamp for fast lookup
  const entryMap = new Map(processedData.map(entry => [entry.timestamp, entry]));
  
  // Use a fixed 30-second interval as requested
  const interval = 30; // 30 seconds
  
  // Generate all timestamps at the chosen interval for the entire range
  const allTimestamps = [];
  for (let t = startTime; t <= endTime; t += interval) {
    allTimestamps.push(t);
  }
  
  // Add any timestamps from the original data that aren't already in our list
  // This ensures we include the actual data points
  processedData.forEach(entry => {
    if (!allTimestamps.includes(entry.timestamp)) {
      allTimestamps.push(entry.timestamp);
    }
  });
  
  // Sort the timestamps to ensure they're in chronological order
  allTimestamps.sort((a, b) => a - b);
  
  // Make sure the end timestamp is included
  if (allTimestamps[allTimestamps.length - 1] !== endTime) {
    allTimestamps.push(endTime);
  }
  
  // Create data points for all timestamps
  return allTimestamps.map(timestamp => {
    // Get the exact matching entry if it exists
    const entry = entryMap.get(timestamp);
    
    const result = {
      timestamp,
      formattedTime: formatTimestamp(timestamp)
    };
    
    // Add all requested metrics to the result
    metrics.forEach(metric => {
      if (typeof metric === 'string') {
        result[metric] = entry ? entry[metric] : null;
      } else if (metric.path) {
        let value = null;
        if (entry) {
          value = entry;
          const parts = metric.path.split('.');
          for (const part of parts) {
            value = value && value[part];
          }
        }
        result[metric.name] = value;
      }
    });
    
    return result;
  });
};

// Original function kept for backward compatibility
export const prepareOverloadTimeSeriesData = (data, metrics) => {
  if (!data || !data.length) return [];
  
  // Get all timestamps from data
  const timestamps = data.map(entry => entry.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  
  // Create a map of existing entries keyed by timestamp for fast lookup
  const entryMap = new Map(data.map(entry => [entry.timestamp, entry]));
  
  // Calculate a reasonable interval for x-axis points
  // For typical 30-minute range, aim for about 30-60 data points (one per minute or 30 seconds)
  const timeRangeInSeconds = maxTime - minTime;
  let interval = 60; // Default to 1 minute intervals
  
  // Adjust interval based on time range
  if (timeRangeInSeconds > 3600 * 24) { // More than a day
    interval = 3600; // 1 hour
  } else if (timeRangeInSeconds > 3600 * 6) { // More than 6 hours
    interval = 1800; // 30 minutes
  } else if (timeRangeInSeconds > 3600 * 2) { // More than 2 hours
    interval = 600; // 10 minutes
  } else if (timeRangeInSeconds > 3600) { // More than 1 hour
    interval = 300; // 5 minutes
  } else if (timeRangeInSeconds < 300) { // Less than 5 minutes
    interval = 10; // 10 seconds
  }
  
  // Generate all timestamps at the chosen interval
  const allTimestamps = [];
  for (let t = minTime; t <= maxTime; t += interval) {
    allTimestamps.push(t);
  }
  
  // Make sure the last timestamp is included
  if (allTimestamps[allTimestamps.length - 1] !== maxTime) {
    allTimestamps.push(maxTime);
  }
  
  // Create data points for all timestamps
  return allTimestamps.map(timestamp => {
    // Find the closest actual data entry within a reasonable time window
    const entry = entryMap.get(timestamp) || 
                  data.find(d => Math.abs(d.timestamp - timestamp) < interval / 2);
    
    const result = {
      timestamp,
      formattedTime: formatTimestamp(timestamp)
    };
    
    // Add all requested metrics to the result
    metrics.forEach(metric => {
      if (typeof metric === 'string') {
        result[metric] = entry ? entry[metric] : null;
      } else if (metric.path) {
        let value = null;
        if (entry) {
          value = entry;
          const parts = metric.path.split('.');
          for (const part of parts) {
            value = value && value[part];
          }
        }
        result[metric.name] = value;
      }
    });
    
    return result;
  });
};
