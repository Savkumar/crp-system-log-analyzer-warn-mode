import React, { useState, useRef } from 'react';
import Overview from './Overview';
import RobustStats from './RobustStats';
import OverloadManager from './OverloadManager';
import GhostMonAnalyzer from './GhostMonAnalyzer'; // Assumed to be GhostMonCharts in the changes
import FileUpload from './FileUpload';
import LargeFileProcessor from './LargeFileProcessor';
import TabNavigation from './TabNavigation';
import ReportGenerator from './ReportGenerator';
import { parseLogData } from '../utils/logParser';
import { formatTimestamp } from '../utils/chartUtils';
import pako from 'pako';
import './LoadingOverride.css';

const SystemLogAnalyzer = () => {
  const [loading, setLoading] = useState(true);
  const [logData, setLogData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [rawLogContent, setRawLogContent] = useState('');
  const [isLargeFile, setIsLargeFile] = useState(false);
  const [isGlobalAnnotationMode, setIsGlobalAnnotationMode] = useState(false); // Added annotation state

  const largeFileProcessorRef = useRef(null);
  const LARGE_FILE_THRESHOLD = 200 * 1024 * 1024;

  const handleFileUpload = (event) => {
    const file = event?.target?.files?.[0];
    setLoading(true);
    setError('');
    setIsLargeFile(false);

    if (!file) {
      fetch('/sample-ghostmon-both-keys.log')
        .then(response => response.text())
        .then(processFileContent)
        .catch(err => {
          setError('Failed to load sample file: ' + err.message);
          setLoading(false);
        });
      return;
    }

    if (file.size >= LARGE_FILE_THRESHOLD) {
      setIsLargeFile(true);
      if (largeFileProcessorRef.current && largeFileProcessorRef.current.processFile) {
        largeFileProcessorRef.current.processFile(file);
      }
    } else {
      processFileBrowser(file);
    }
  };

  const processFileBrowser = (file) => {
    const reader = new FileReader();
    const isGzipped = file.name.toLowerCase().endsWith('.gz');

    reader.onload = (e) => {
      try {
        let content;
        if (isGzipped) {
          const compressed = new Uint8Array(e.target.result);
          const decompressed = pako.inflate(compressed);
          content = new TextDecoder('utf-8').decode(decompressed);
        } else {
          content = e.target.result;
        }
        processFileContent(content);
      } catch (err) {
        setError('Error processing file: ' + (err.message || 'Unknown error'));
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };

    if (isGzipped) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const processFileContent = (content) => {
    try {
      setRawLogContent(content);
      const { data, timeRange, error } = parseLogData(content);
      if (error) {
        console.warn('Main log parsing error:', error);
        setLogData(null);
      } else {
        setTimeRange(timeRange);
        setLogData(data);
      }
    } catch (err) {
      setError('Error analyzing log file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleServerProcessedData = (data) => {
    setLoading(false);
    if (!data) {
      setError('No data returned from server');
      return;
    }
    if (data.type === 'standard') {
      setLogData(data.data);
      setTimeRange(data.timeRange);
      setRawLogContent('');
    } else if (data.type === 'ghostmon') {
      setActiveTab('ghostMon');
      setRawLogContent(JSON.stringify(data.data));
    } else {
      setError('Unknown data type returned from server');
    }
  };

  const handleServerError = (errorMsg) => {
    setLoading(false);
    setError('Server processing error: ' + errorMsg);
  };

  React.useEffect(() => {
    handleFileUpload();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'robustStats', label: 'Robust Stats' },
    { id: 'overloadManager', label: 'OverloadManager' },
    { id: 'ghostMon', label: 'GhostMon Analyzer' }
  ];

  const renderAnnotationButton = () => (
    <div className="mb-4"> {/* Added container for the button */}
      <button
        onClick={() => setIsGlobalAnnotationMode(!isGlobalAnnotationMode)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {isGlobalAnnotationMode ? 'Disable Annotations' : 'Enable Annotations'}
      </button>
    </div>
  );


  return (
    <div className={`p-4 max-w-5xl mx-auto ${isLargeFile ? 'large-file-active' : ''}`}>
      <h1 className="text-3xl font-bold mb-4 text-center">System Log Analyzer</h1>

      <div className="flex items-center mb-4">
        <FileUpload onFileUpload={handleFileUpload} />
        <button
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => {
            setIsLargeFile(true);
            const mockFile = new File(
              ["test content".repeat(1000)],
              "large-test-file.log",
              { type: "text/plain" }
            );
            Object.defineProperty(mockFile, 'size', {
              value: LARGE_FILE_THRESHOLD + 1000,
              writable: false
            });
            if (largeFileProcessorRef.current && largeFileProcessorRef.current.processFile) {
              largeFileProcessorRef.current.processFile(mockFile);
            }
          }}
        >
          Simulate Large File
        </button>
      </div>

      {isLargeFile && (
        <div className="mt-2 mb-4 bg-blue-50 p-3 rounded-md border border-blue-200 large-file-progress-container">
          <div className="font-medium mb-1 text-blue-800 text-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            Large File Processing
          </div>
          <div className="text-gray-700 mb-2">
            This file is larger than 200MB. Processing on the server for better performance.
          </div>
          <LargeFileProcessor
            onFileProcessed={(data) => {
              handleServerProcessedData(data);
              setIsLargeFile(false);
            }}
            onError={handleServerError}
            ref={largeFileProcessorRef}
          />
        </div>
      )}

      {loading && !isLargeFile && (
        <div className="text-center py-12">
          <div className="text-lg">Loading and analyzing log data...</div>
          <div className="mt-2 text-gray-500">This may take a moment</div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          {logData && (
            <div className="text-xs text-gray-500 flex flex-wrap justify-between items-center">
              <div>
                {formatTimestamp(timeRange.start, true)} to {formatTimestamp(timeRange.end, true)}
              </div>
              <div>
                {logData.robustStats.length} Robust stats, {logData.overloadManager.length} OverloadManager entries
              </div>
            </div>
          )}

          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabs}
          />
          {renderAnnotationButton()} {/* Moved annotation button here */}
          {activeTab === 'overview' && logData ? (
            <Overview logData={logData} isAnnotationMode={isGlobalAnnotationMode} />
          ) : (
            activeTab === 'overview' && <div className="text-center py-6">No overview data available</div>
          )}

          {activeTab === 'robustStats' && logData ? (
            <RobustStats logData={logData} isAnnotationMode={isGlobalAnnotationMode} />
          ) : (
            activeTab === 'robustStats' && <div className="text-center py-6">No Robust stats data available</div>
          )}

          {activeTab === 'overloadManager' && logData ? (
            <OverloadManager logData={logData} isAnnotationMode={isGlobalAnnotationMode} />
          ) : (
            activeTab === 'overloadManager' && <div className="text-center py-6">No OverloadManager data available</div>
          )}
          {activeTab === 'ghostMon' && <GhostMonAnalyzer logFileContent={rawLogContent} isLoading={loading && !isLargeFile} isAnnotationMode={isGlobalAnnotationMode}/>}

          {!loading && (
            <ReportGenerator
              logData={activeTab === 'ghostMon'
                ? (rawLogContent && rawLogContent.startsWith('[{')
                  ? JSON.parse(rawLogContent)
                  : (activeTab === 'ghostMon' && document.getElementById('ghostmon-analyzer-data')
                    ? JSON.parse(document.getElementById('ghostmon-analyzer-data').textContent || '[]')
                    : null))
                : logData}
              timeRange={timeRange}
              activeTab={activeTab}
              disabled={loading || (activeTab !== 'ghostMon' && !logData) || (activeTab === 'ghostMon' && !rawLogContent)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SystemLogAnalyzer;