const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const pako = require('pako');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'uploads', 'temp'),
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit
}));


// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'public')));

// Upload endpoint
app.post('/api/upload-log', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }

    const logFile = req.files.logFile;
    const jobId = Date.now().toString();
    const filePath = path.join(uploadsDir, `${jobId}_${logFile.name}`);

    // Move file to uploads directory
    await logFile.mv(filePath);

    // Create job entry
    jobs.set(jobId, {
      id: jobId,
      status: 'processing',
      progress: 0,
      filePath,
      resultPath: null,
      error: null,
      startTime: Date.now(),
      fileName: logFile.name,
      processingStage: 'Preparing file for processing'
    });

    // Process file in background
    processLogFile(jobId, filePath, logFile.name);

    // Return job ID to client
    return res.json({ 
      jobId, 
      status: 'processing', 
      message: 'File upload successful. Processing started.' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'File upload failed: ' + error.message });
  }
});

// Job status endpoint
app.get('/api/job-status/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  return res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    processingStage: job.processingStage,
    error: job.error,
    resultUrl: job.resultPath ? `/api/results/${jobId}` : null
  });
});

// Get results endpoint
app.get('/api/results/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'completed' || !job.resultPath) {
    return res.status(400).json({ error: 'Results not available yet' });
  }

  try {
    const resultData = fs.readFileSync(job.resultPath, 'utf8');
    return res.json(JSON.parse(resultData));
  } catch (error) {
    console.error('Error reading results:', error);
    return res.status(500).json({ error: 'Error retrieving results: ' + error.message });
  }
});

// Format timestamp (similar to chartUtils but standalone for server-side use)
function formatTimestamp(timestamp, includeTime = false) {
  const date = new Date(timestamp * 1000);
  const pad = (num) => String(num).padStart(2, '0');

  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  if (includeTime) {
    return `${month}/${day} ${hours}:${minutes}:${seconds}`;
  }
  return `${month}/${day}`;
}

// Process log file
async function processLogFile(jobId, filePath, fileName) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    // Read file in chunks for large files
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    const isGzipped = fileName.toLowerCase().endsWith('.gz');

    // Update status
    updateJobProgress(jobId, 5, 'Reading file metadata');

    // For larger files, we'll process in chunks
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    let fileContent = '';
    let processedChunks = 0;

    updateJobProgress(jobId, 10, 'Starting file read operation');

    // Process the file based on its type
    if (isGzipped) {
      // For gzipped files
      updateJobProgress(jobId, 15, 'Reading compressed file');
      const compressed = fs.readFileSync(filePath);

      try {
        updateJobProgress(jobId, 30, 'Decompressing file');
        const decompressed = pako.inflate(compressed);
        fileContent = new TextDecoder('utf-8').decode(decompressed);
        processedChunks = totalChunks; // Mark as fully processed
        updateJobProgress(jobId, 50, 'File decompression complete'); 
      } catch (err) {
        throw new Error('Failed to decompress gzipped file: ' + err.message);
      }
    } else {
      // For plain text files, read in chunks
      updateJobProgress(jobId, 15, 'Reading file in chunks');
      const readStream = fs.createReadStream(filePath, { 
        encoding: 'utf8',
        highWaterMark: CHUNK_SIZE
      });

      for await (const chunk of readStream) {
        fileContent += chunk;
        processedChunks++;
        updateJobProgress(
          jobId, 
          Math.floor(15 + (processedChunks / totalChunks) * 35), 
          `Reading file chunk ${processedChunks}/${totalChunks}`
        );
      }
    }

    updateJobProgress(jobId, 50, 'File reading complete');

    // Parse the log content
    let parsedData;
    let parseError = null;

    try {
      // First try standard log parsing
      updateJobProgress(jobId, 60, 'Parsing log data - Robust stats and OverloadManager');

      // Check for GhostMon logs
      const hasGhostMonEntries = fileContent.includes('dnsp_key=W') || fileContent.includes('dnsp_key=S');

      if (hasGhostMonEntries) {
        updateJobProgress(jobId, 70, 'GhostMon data detected, parsing GhostMon entries');

        // Parse GhostMon data
        const ghostMonData = parseGhostMonData(fileContent);

        if (!ghostMonData.error) {
          parsedData = {
            type: 'ghostmon',
            data: ghostMonData.data,
            timeRange: ghostMonData.timeRange
          };
        } else {
          parseError = 'Unable to parse GhostMon data: ' + ghostMonData.error;
        }
      } else {
        updateJobProgress(jobId, 70, 'Parsing system log data');

        // Parse standard log data
        const standardData = parseLogData(fileContent);

        if (!standardData.error) {
          parsedData = {
            type: 'standard',
            data: standardData.data,
            timeRange: standardData.timeRange
          };
        } else {
          parseError = 'Unable to parse standard log data: ' + standardData.error;
        }
      }
    } catch (err) {
      parseError = 'Error during log parsing: ' + err.message;
    }

    updateJobProgress(jobId, 90, 'Parsing complete');

    // Handling the result
    if (parseError) {
      throw new Error(parseError);
    }

    // Save results to file
    updateJobProgress(jobId, 95, 'Saving results');
    const resultPath = path.join(resultsDir, `${jobId}_result.json`);
    fs.writeFileSync(resultPath, JSON.stringify(parsedData));

    // Update job status
    jobs.set(jobId, {
      ...job,
      status: 'completed',
      progress: 100,
      processingStage: 'Processing complete',
      resultPath,
      endTime: Date.now()
    });

    console.log(`Job ${jobId} completed successfully`);

    // Clean up uploaded file after processing (optional)
    setTimeout(() => {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up uploaded file for job ${jobId}`);
      } catch (err) {
        console.error(`Error cleaning up file for job ${jobId}:`, err);
      }
    }, 3600000); // Clean up after 1 hour

  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);

    // Update job with error
    jobs.set(jobId, {
      ...job,
      status: 'failed',
      error: error.message,
      processingStage: 'Failed: ' + error.message,
      endTime: Date.now()
    });
  }
}

// Update job progress
function updateJobProgress(jobId, progress, processingStage) {
  const job = jobs.get(jobId);
  if (job) {
    jobs.set(jobId, {
      ...job,
      progress: Math.min(Math.max(0, progress), 100),
      processingStage
    });
    console.log(`Job ${jobId}: ${progress}% - ${processingStage}`);
  }
}

// Simple implementation of log parsing functions for server-side use
function parseGhostMonData(fileContent) {
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
}

function parseLogData(fileContent) {
  try {
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    // Parse Robust stats logs
    const robustStats = [];
    // Parse OverloadManager entries
    const overloadManager = [];

    lines.forEach(line => {
      if (line.includes("Robust - stats")) {
        const parts = line.split('|');
        const timestamp = parseFloat(parts[0]);

        const data = {
          timestamp,
          timestampFormatted: formatTimestamp(timestamp),
          http: 0,
          https: 0,
          clientInProgress: 0,
          done: 0,
          fwdInProgress: 0,
          flit: 0,
          freeFds: 0,
          websocketsInProgress: 0,
          memRSS: 0,
          appUsed: 0,
          totalMem: 0,
          tcpMem: 0,
          inPressure: "N",
          cpuAll: 0,
          avgManagerCycle: 0
        };

        // Extract HTTP/HTTPS
        const httpMatch = line.match(/Accepts: http\/https (\d+)\/(\d+)/);
        if (httpMatch) {
          data.http = parseInt(httpMatch[1]);
          data.https = parseInt(httpMatch[2]);
        }

        // Extract client in-progress
        const clientMatch = line.match(/client: in-progress (\d+)/);
        if (clientMatch) {
          data.clientInProgress = parseInt(clientMatch[1]);
        }

        // Extract done
        const doneMatch = line.match(/done (\d+),/);
        if (doneMatch) {
          data.done = parseInt(doneMatch[1]);
        }

        // Extract fwd in-progress
        const fwdMatch = line.match(/fwd: in progress (\d+)/);
        if (fwdMatch) {
          data.fwdInProgress = parseInt(fwdMatch[1]);
        }

        // Extract flit
        const flitMatch = line.match(/flit (\d+)%/);
        if (flitMatch) {
          data.flit = parseInt(flitMatch[1]);
        }

        // Extract FreeFds
        const freeFdsMatch = line.match(/FreeFds: (\d+)/);
        if (freeFdsMatch) {
          data.freeFds = parseInt(freeFdsMatch[1]);
        }

        // Extract websockets in-progress
        const websocketsMatch = line.match(/websockets: in-progress (\d+)/);
        if (websocketsMatch) {
          data.websocketsInProgress = parseInt(websocketsMatch[1]);
        }

        // Extract memory values
        const memRSSMatch = line.match(/Mem RSS (\d+) KB/);
        if (memRSSMatch) {
          data.memRSS = parseInt(memRSSMatch[1]);
        }

        const appUsedMatch = line.match(/app used (\d+) KB/);
        if (appUsedMatch) {
          data.appUsed = parseInt(appUsedMatch[1]);
        }

        const totalMemMatch = line.match(/totalMem (\d+) KB/);
        if (totalMemMatch) {
          data.totalMem = parseInt(totalMemMatch[1]);
        }

        // Extract TCP Mem
        const tcpMemMatch = line.match(/TCP Mem (\d+) KB/);
        if (tcpMemMatch) {
          data.tcpMem = parseInt(tcpMemMatch[1]);
        }

        // Extract pressure
        const pressureMatch = line.match(/in pressure: ([YN])/);
        if (pressureMatch) {
          data.inPressure = pressureMatch[1];
        }

        // Extract CPU all
        const cpuAllMatch = line.match(/CPU: all (\d+)%/);
        if (cpuAllMatch) {
          data.cpuAll = parseInt(cpuAllMatch[1]);
        }

        // Extract AVG manager cycle
        const avgManagerMatch = line.match(/AVG manager cycle (\d+)us/);
        if (avgManagerMatch) {
          data.avgManagerCycle = parseInt(avgManagerMatch[1]);
        }

        robustStats.push(data);
      } else if (line.includes("crp::OverloadManager")) {
        const parts = line.split('|');
        const timestamp = parseFloat(parts[0]);

        const data = {
          timestamp,
          timestampFormatted: formatTimestamp(timestamp),
          type: "",
          triggerPct: 0,
          denyPct: 0,
          metrics: {
            cpu: 0,
            mem: 0,
            reqs: 0
          },
          runQ: 0
        };

        // Determine the type of OverloadManager entry
        if (line.includes("addCandidateTarget")) {
          data.type = "addCandidateTarget";

          // Extract trigger and deny percentages
          const pctMatch = line.match(/trigger_pct:(\d+\.\d+)% deny_pct:(\d+\.\d+)%/);
          if (pctMatch) {
            data.triggerPct = parseFloat(pctMatch[1]);
            data.denyPct = parseFloat(pctMatch[2]);
          }

          // Extract metrics
          const metricsMatch = line.match(/metrics \(cpu:(\d+)ms mem:(\d+)KB reqs:(\d+)\)/);
          if (metricsMatch) {
            data.metrics.cpu = parseInt(metricsMatch[1]);
            data.metrics.mem = parseInt(metricsMatch[2]);
            data.metrics.reqs = parseInt(metricsMatch[3]);
          }
        } else if (line.includes("processMainLoop")) {
          data.type = "processMainLoop";

          // Extract runQ
          const runQMatch = line.match(/runQ:(\d+\.\d+)/);
          if (runQMatch) {
            data.runQ = parseFloat(runQMatch[1]);
          }
        }

        overloadManager.push(data);
      }
    });

    // Set the data
    if (robustStats.length > 0 && overloadManager.length > 0) {
      const data = {
        robustStats,
        overloadManager,
        addCandidateTargets: overloadManager.filter(entry => entry.type === "addCandidateTarget"),
        processMainLoops: overloadManager.filter(entry => entry.type === "processMainLoop")
      };

      const startTime = Math.min(
        robustStats[0].timestamp,
        overloadManager[0].timestamp
      );

      const endTime = Math.max(
        robustStats[robustStats.length - 1].timestamp,
        overloadManager[overloadManager.length - 1].timestamp
      );

      return {
        data,
        timeRange: { start: startTime, end: endTime },
        error: null
      };
    } else {
      return {
        data: null,
        timeRange: null,
        error: 'Failed to parse any log data'
      };
    }
  } catch (err) {
    return {
      data: null,
      timeRange: null,
      error: 'Error parsing log file: ' + err.message
    };
  }
}

// Clean up old jobs periodically
setInterval(() => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const [jobId, job] of jobs.entries()) {
    // Remove completed or failed jobs older than 1 day
    if (job.endTime && (now - job.endTime > ONE_DAY_MS)) {
      // Clean up result file if it exists
      if (job.resultPath && fs.existsSync(job.resultPath)) {
        try {
          fs.unlinkSync(job.resultPath);
        } catch (err) {
          console.error(`Error deleting result file for job ${jobId}:`, err);
        }
      }

      // Remove from jobs map
      jobs.delete(jobId);
      console.log(`Cleaned up old job ${jobId}`);
    }
  }
}, 3600000); // Run every hour

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});