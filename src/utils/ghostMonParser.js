import { formatTimestamp } from './chartUtils';

/**
 * Parse ghostmon log data to extract metrics from lines containing "dnsp_key=W"
 * 
 * @param {string} fileContent - Raw log file content
 * @returns {Object} - Parsed data, time range, and any errors
 */
export const parseGhostMonData = (fileContent) => {
  try {
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    // Filter for lines containing "dnsp_key=W" or "dnsp_key=S" with the expected format
    const filteredLines = lines.filter(line => 
      (line.includes("dnsp_key=W") || line.includes("dnsp_key=S")) && 
      (line.includes("flyteload=") || line.includes("flyteload\t"))
    );
    
    if (filteredLines.length === 0) {
      return {
        data: null,
        timeRange: null,
        error: 'No ghostmon log entries found with dnsp_key=W'
      };
    }
    
    // Parse the filtered lines
    const ghostMonEntries = [];
    
    filteredLines.forEach(line => {
      // Example log line:
      // [03-26 17:16:17.710 I write_dnsp.cpp:2453 read_shm[W] dnsp_key=W flyteload=31639344 hits=4248.001265 suspendflag=0 suspendlevel=0
      
      // Extract timestamp
      const timestampMatch = line.match(/\[(\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})/);
      if (!timestampMatch) return; // Skip if timestamp not found
      
      // Convert MM-DD HH:MM:SS.mmm to timestamp
      // Assuming current year for the timestamp
      const currentYear = new Date().getFullYear();
      const timestampStr = `${currentYear}-${timestampMatch[1].replace(' ', 'T')}`;
      const timestamp = new Date(timestampStr).getTime() / 1000; // Convert to epoch seconds
      
      // Extract other metrics - handle both tab-separated and space-separated formats
      let flyteload = 0, hits = 0, suspendflag = 0, suspendlevel = 0;
      
      // Format 1: Tab-separated values (from real logs)
      if (line.includes('dnsp_key=W\t')) {
        // Extract the tab-separated part after "dnsp_key=W"
        const tabPart = line.split('dnsp_key=W')[1].trim();
        const parts = tabPart.split('\t');
        if (parts.length >= 4) {
          const flyteloadPart = parts.find(p => p.startsWith('flyteload='));
          const hitsPart = parts.find(p => p.startsWith('hits='));
          const suspendFlagPart = parts.find(p => p.startsWith('suspendflag='));
          const suspendLevelPart = parts.find(p => p.startsWith('suspendlevel='));
          
          if (flyteloadPart) flyteload = parseInt(flyteloadPart.split('=')[1]);
          if (hitsPart) hits = parseFloat(hitsPart.split('=')[1]);
          if (suspendFlagPart) suspendflag = parseInt(suspendFlagPart.split('=')[1]);
          if (suspendLevelPart) suspendlevel = parseInt(suspendLevelPart.split('=')[1]);
        }
      } 
      // Format 2: Space-separated values 
      else {
        const flyteloadMatch = line.match(/flyteload=(\d+)/);
        const hitsMatch = line.match(/hits=(\d+\.\d+)/);
        const suspendFlagMatch = line.match(/suspendflag=(\d+)/);
        const suspendLevelMatch = line.match(/suspendlevel=(\d+)/);
        
        if (flyteloadMatch) flyteload = parseInt(flyteloadMatch[1]);
        if (hitsMatch) hits = parseFloat(hitsMatch[1]);
        if (suspendFlagMatch) suspendflag = parseInt(suspendFlagMatch[1]);
        if (suspendLevelMatch) suspendlevel = parseInt(suspendLevelMatch[1]);
      }
      
      // Determine the key type (W or S)
      const keyType = line.includes("dnsp_key=W") ? "W" : "S";
      
      const data = {
        timestamp,
        timestampFormatted: formatTimestamp(timestamp),
        keyType,
        flyteload,
        hits,
        suspendflag,
        suspendlevel
      };
      
      ghostMonEntries.push(data);
    });
    
    // Sort by timestamp to ensure chronological order
    ghostMonEntries.sort((a, b) => a.timestamp - b.timestamp);
    
    if (ghostMonEntries.length > 0) {
      const startTime = ghostMonEntries[0].timestamp;
      const endTime = ghostMonEntries[ghostMonEntries.length - 1].timestamp;
      
      return {
        data: ghostMonEntries,
        timeRange: { start: startTime, end: endTime },
        error: null
      };
    } else {
      return {
        data: null,
        timeRange: null,
        error: 'Failed to parse any ghostmon log data'
      };
    }
  } catch (err) {
    return {
      data: null,
      timeRange: null,
      error: 'Error parsing ghostmon log file: ' + err.message
    };
  }
};
