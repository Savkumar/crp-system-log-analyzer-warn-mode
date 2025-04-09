import React from 'react';

const FileUpload = ({ onFileUpload }) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor="file-upload" 
        className="block py-2 px-3 border border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50 flex items-center justify-center"
      >
        <div className="font-medium mr-2">Upload Log File</div>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={onFileUpload}
          accept=".log,.txt,.gz"
        />
      </label>
    </div>
  );
};

export default FileUpload;
