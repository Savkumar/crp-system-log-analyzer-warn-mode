# Log Analyzer with Hybrid Processing

This application provides a system log analyzer with a hybrid processing approach for handling different file sizes:

- **Client-side processing** for smaller files (<200MB) - quick and efficient for most log files
- **Server-side processing** for larger files (>200MB) - prevents browser memory issues

## Features

- Automatic detection of file size and routing to appropriate processing method
- Support for plain text (.log, .txt) and compressed (.gz) log files
- Multiple analysis types: Robust Stats, OverloadManager, GhostMon
- Interactive charts and statistics
- Progress tracking for server-side processing

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create required directories (uploads and results):
   ```
   mkdir -p uploads/temp results
   ```

3. Start the development server with both backend and frontend:
   ```
   npm run dev
   ```

   Or start them separately:
   ```
   npm run server   # Start the Express backend on port 3001
   npm start        # Start the React frontend on port 3000
   ```

## How It Works

### Small Files (<200MB)

For files under 200MB, the application:
1. Loads the file in the browser using FileReader API
2. Processes the content entirely client-side
3. Displays the results immediately in the UI

### Large Files (>200MB)

For files over 200MB, the application:
1. Automatically detects the file size
2. Uploads the file to the server
3. Processes it in chunks to optimize memory usage
4. Streams results back to the client
5. Displays real-time progress in the UI

## Architecture

The hybrid approach maintains the same user experience regardless of file size while handling the processing limitations of browsers:

- **Frontend**: React application with components for both processing methods
- **Backend**: Express server with file upload handling and optimized processing

### Key Components

- `SystemLogAnalyzer`: Main component that determines processing method based on file size
- `LargeFileProcessor`: Handles server communication for large files
- `server.js`: Express backend for large file processing

## API Endpoints

- `POST /api/upload-log`: Upload large log files
- `GET /api/job-status/:jobId`: Check processing status
- `GET /api/results/:jobId`: Retrieve processed results

## Customization

You can adjust the file size threshold in `SystemLogAnalyzer.jsx`:

```javascript
const LARGE_FILE_THRESHOLD = 200 * 1024 * 1024; // 200MB
