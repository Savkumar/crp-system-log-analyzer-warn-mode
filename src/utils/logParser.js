import { formatTimestamp } from './chartUtils';

export const parseLogData = (fileContent) => {
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
          runQ: 0,
          arlid: null,
          ehnid: null
        };
        
        // Determine the type of OverloadManager entry
        if (line.includes("addCandidateTarget")) {
          data.type = "addCandidateTarget";
          
          // Extract rule name
          const ruleMatch = line.match(/rule:'([^']+)'/);
          if (ruleMatch) {
            data.rule = ruleMatch[1];
          }
          
          // Extract trigger and deny percentages
          const pctMatch = line.match(/trigger_pct:(\d+\.\d+)% deny_pct:(\d+\.\d+)%/);
          if (pctMatch) {
            data.triggerPct = parseFloat(pctMatch[1]);
            data.denyPct = parseFloat(pctMatch[2]);
          }
          
          // Extract arlid and ehnid
          const targetMatch = line.match(/target \(arlid:(\d+) ehnid:(\d+)\)/);
          if (targetMatch) {
            data.arlid = parseInt(targetMatch[1]);
            data.ehnid = parseInt(targetMatch[2]);
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
          
          // Extract trigger reason and value
          const triggerMatch = line.match(/triggered by ([^:]+):(\d+\.\d+)/);
          if (triggerMatch) {
            data.triggerReason = triggerMatch[1]; // e.g., "cpu", "runQ"
            data.triggerValue = parseFloat(triggerMatch[2]);
          }
          
          // Extract active arlids count
          const activeArlidMatch = line.match(/(\d+) arlid\(s\) active/);
          if (activeArlidMatch) {
            data.activeArlidCount = parseInt(activeArlidMatch[1]);
          }
        }
        
        overloadManager.push(data);
      }
    });
    
    // Set the data
    if (robustStats.length > 0 || overloadManager.length > 0) {
      const data = {
        robustStats,
        overloadManager,
        addCandidateTargets: overloadManager.filter(entry => entry.type === "addCandidateTarget"),
        processMainLoops: overloadManager.filter(entry => entry.type === "processMainLoop")
      };
      
      const startTime = Math.min(
        robustStats.length > 0 ? robustStats[0].timestamp : Infinity,
        overloadManager.length > 0 ? overloadManager[0].timestamp : Infinity
      );
      
      const endTime = Math.max(
        robustStats.length > 0 ? robustStats[robustStats.length - 1].timestamp : 0,
        overloadManager.length > 0 ? overloadManager[overloadManager.length - 1].timestamp : 0
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
};
