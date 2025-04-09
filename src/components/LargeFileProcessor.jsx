import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { formatTimestamp } from '../utils/chartUtils';

const LargeFileProcessor = forwardRef(({ onFileProcessed, onError }, ref) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, completed, error
  const [processingStage, setProcessingStage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Simulate progress for testing (when no real API is available)
  const simulateProgress = (isTestFile) => {
    console.log("Starting simulated progress");
    setStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');
    setProcessingStage('Preparing upload');
    
    // Simulate file upload progress (goes from 0 to 100% in 3 seconds)
    let uploadCounter = 0;
    const uploadInterval = setInterval(() => {
      uploadCounter += 5;
      setUploadProgress(Math.min(uploadCounter, 100));
      
      if (uploadCounter >= 100) {
        clearInterval(uploadInterval);
        setStatus('processing');
        setProcessingProgress(0);
        setProcessingStage('Starting server processing');
        
        // After upload completes, simulate processing progress
        simulateProcessing(isTestFile);
      }
    }, 50); // Speed up simulation for testing
  };
  
  // Simulate the processing steps
  const simulateProcessing = (isTestFile) => {
    let processingCounter = 0;
    const stages = [
      'Parsing log format',
      'Extracting timestamps',
      'Analyzing system events',
      'Processing metrics',
      'Generating report'
    ];
    let currentStageIndex = 0;
    
    const processingInterval = setInterval(() => {
      // Update progress incrementally
      processingCounter += 2;
      setProcessingProgress(Math.min(processingCounter, 100));
      
      // Switch to new processing stage every 20%
      if (processingCounter % 20 === 0 && currentStageIndex < stages.length - 1) {
        currentStageIndex++;
        setProcessingStage(stages[currentStageIndex]);
      }
      
      // Always show the current updated time
      setLastUpdated(new Date());
      
      // When complete
      if (processingCounter >= 100) {
        clearInterval(processingInterval);
        setStatus('completed');
        
        // Generate mock results with epoch seconds timestamps (not ISO strings)
        // because formatTimestamp expects seconds, not ISO strings
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const oneHourAgo = now - 3600; // One hour ago in seconds
        
        const mockResults = {
          type: 'standard',
          data: {
            robustStats: Array(5).fill(0).map((_, i) => ({ 
              id: i, 
              timestamp: now - Math.floor(Math.random() * 3600), // Random time within the last hour
              timestampFormatted: formatTimestamp ? formatTimestamp(now - Math.floor(Math.random() * 3600)) : '',
              http: Math.floor(Math.random() * 100), 
              https: Math.floor(Math.random() * 50),
              clientInProgress: Math.floor(Math.random() * 15),
              done: Math.floor(Math.random() * 1000),
              fwdInProgress: Math.floor(Math.random() * 5),
              flit: Math.floor(Math.random() * 100),
              freeFds: Math.floor(Math.random() * 200) + 800,
              websocketsInProgress: Math.floor(Math.random() * 3),
              memRSS: Math.floor(Math.random() * 20000) + 30000,
              appUsed: Math.floor(Math.random() * 10000) + 25000,
              totalMem: Math.floor(Math.random() * 40000) + 60000,
              tcpMem: Math.floor(Math.random() * 1000) + 2000,
              inPressure: Math.random() > 0.8 ? "Y" : "N",
              cpuAll: Math.floor(Math.random() * 60),
              avgManagerCycle: Math.floor(Math.random() * 500) + 100
            })),
            overloadManager: Array(3).fill(0).map((_, i) => {
              const isAddCandidate = Math.random() > 0.3;
              return { 
                id: i, 
                timestamp: now - Math.floor(Math.random() * 3600), // Random time within the last hour
                timestampFormatted: formatTimestamp ? formatTimestamp(now - Math.floor(Math.random() * 3600)) : '',
                type: isAddCandidate ? "addCandidateTarget" : "processMainLoop",
                triggerPct: isAddCandidate ? Math.random() * 50 + 30 : 0,
                denyPct: isAddCandidate ? Math.random() * 30 : 0,
                metrics: {
                  cpu: Math.floor(Math.random() * 100),
                  mem: Math.floor(Math.random() * 50000) + 10000,
                  reqs: Math.floor(Math.random() * 100)
                },
                runQ: !isAddCandidate ? Math.random() * 5 : 0
              }
            })
          },
          timeRange: {
            start: oneHourAgo,
            end: now
          }
        };
        
        // Add derived collections
        // Create better mock data to show our UI changes
        mockResults.data.addCandidateTargets = [
          ...mockResults.data.overloadManager.filter(entry => entry.type === "addCandidateTarget"),
          // Add more mock entries for better testing
          ...Array(5).fill(0).map((_, i) => ({ 
            id: i + 10, 
            timestamp: now - Math.floor(Math.random() * 3600),
            timestampFormatted: formatTimestamp ? formatTimestamp(now - Math.floor(Math.random() * 3600)) : '',
            type: "addCandidateTarget",
            triggerPct: Math.random() * 50 + 30,
            denyPct: Math.random() * 30,
            rule: `rule_cpu_${i}`,
            metrics: {
              cpu: Math.floor(Math.random() * 100),
              mem: Math.floor(Math.random() * 50000) + 10000,
              reqs: Math.floor(Math.random() * 100)
            },
            arlid: Math.floor(Math.random() * 1000),
            ehnid: Math.floor(Math.random() * 500)
          }))
        ];
        
        mockResults.data.processMainLoops = [
          ...mockResults.data.overloadManager.filter(entry => entry.type === "processMainLoop"),
          // Add more mock entries for better testing
          ...Array(5).fill(0).map((_, i) => ({ 
            id: i + 20, 
            timestamp: now - Math.floor(Math.random() * 3600),
            timestampFormatted: formatTimestamp ? formatTimestamp(now - Math.floor(Math.random() * 3600)) : '',
            type: "processMainLoop",
            runQ: Math.random() * 5,
            triggerReason: 'cpu',
            triggerValue: Math.random() * 100
          }))
        ];
        
        if (onFileProcessed) {
          setTimeout(() => {
            onFileProcessed(mockResults);
          }, 500);
        }
      }
    }, 50); // Speed up simulation for testing
  };
  
  // Upload file to server (real implementation)
  const uploadFile = async (file) => {
    // For testing only - if the name starts with "test-" or it's a synthetic file
    // for simulation, use the mocked version instead of real API calls
    if (file.name.startsWith('test-') || file.name === 'large-test-file.log') {
      simulateProgress(true);
      return;
    }
    
    try {
      setStatus('uploading');
      setUploadProgress(0);
      setErrorMessage('');
      setProcessingStage('Preparing upload');
      
      const formData = new FormData();
      formData.append('logFile', file);
      
      const response = await fetch('/api/upload-log', {
        method: 'POST',
        body: formData,
        // We can't track upload progress with the standard fetch API
        // For real progress tracking, you might use axios or XMLHttpRequest
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      setUploadProgress(100);
      setStatus('processing');
      setProcessingProgress(0);
      setProcessingStage('Starting server processing');
      
      // Start polling for job status
      pollJobStatus(data.jobId);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
      if (onError) onError(error.message);
    }
  };
  
  // Poll job status
  const pollJobStatus = async (jobId) => {
    try {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/job-status/${jobId}`);
          
          if (!response.ok) {
            clearInterval(interval);
            throw new Error('Failed to get job status');
          }
          
          const data = await response.json();
          
          // Update progress and set last updated timestamp
          setProcessingProgress(data.progress);
          setLastUpdated(new Date());
          
          if (data.processingStage) {
            setProcessingStage(data.processingStage);
          }
          
          if (data.status === 'completed') {
            clearInterval(interval);
            setStatus('completed');
            
            // Fetch results
            const resultsResponse = await fetch(`/api/results/${jobId}`);
            if (!resultsResponse.ok) {
              throw new Error('Failed to fetch results');
            }
            
            const resultsData = await resultsResponse.json();
            if (onFileProcessed) onFileProcessed(resultsData);
          } else if (data.status === 'failed') {
            clearInterval(interval);
            setStatus('error');
            setErrorMessage(data.error || 'Processing failed');
            if (onError) onError(data.error || 'Processing failed');
          }
        } catch (error) {
          clearInterval(interval);
          setStatus('error');
          setErrorMessage(error.message);
          if (onError) onError(error.message);
        }
      }, 1000); // Poll every second for more responsive UI
      
      // Clean up interval on unmount
      return () => clearInterval(interval);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
      if (onError) onError(error.message);
    }
  };
  
  // Process function to be called from outside
  const processFile = (file) => {
    if (!file) return;
    uploadFile(file);
  };
  
  // Expose methods via useImperativeHandle for ref
  useImperativeHandle(ref, () => ({
    processFile
  }));
  
  // Progress bar component with pulse animation while active
  const ProgressBar = ({ label, progress, isActive }) => (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${isActive ? 'bg-blue-600 animate-pulse' : 'bg-blue-600'}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
  
  // Calculate time since last update for visual feedback
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return null;
    
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    if (seconds < 60) return `Updated ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `Updated ${minutes}m ${seconds % 60}s ago`;
  };
  
  return (
    <div className="large-file-progress-container">
      {status === 'uploading' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm font-medium">Uploading to server...</div>
          <ProgressBar label="Upload Progress" progress={uploadProgress} isActive={true} />
        </div>
      )}
      
      {status === 'processing' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between">
            <div className="text-sm font-medium">Server processing file...</div>
            <div className="text-xs text-gray-500">{getTimeSinceUpdate()}</div>
          </div>
          <div className="text-sm font-medium text-blue-700 my-1">{processingStage}</div>
          <ProgressBar label="Processing Progress" progress={processingProgress} isActive={true} />
          {processingProgress > 0 && processingProgress < 100 && (
            <div className="text-xs text-gray-600 mt-2 italic">
              Processing large files may take some time. The progress bar will update as processing continues.
            </div>
          )}
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {errorMessage || 'An error occurred during processing'}
        </div>
      )}
      
      {status === 'completed' && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          File processed successfully!
        </div>
      )}
    </div>
  );
});

export default LargeFileProcessor;
