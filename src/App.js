import React from 'react';
import SystemLogAnalyzer from './components/SystemLogAnalyzer';
import { AnnotationProvider } from './components/AnnotationContext';
import './App.css';

function App() {
  return (
    <div className="App">
      <AnnotationProvider>
        <SystemLogAnalyzer />
      </AnnotationProvider>
    </div>
  );
}

export default App;
