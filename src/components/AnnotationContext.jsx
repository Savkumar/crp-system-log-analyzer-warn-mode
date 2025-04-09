import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

// Create a context for annotations
const AnnotationContext = createContext();

/**
 * Provider component for managing annotations across the application
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AnnotationProvider = ({ children }) => {
  // Store annotations by chart ID with memoized state management
  const [annotations, setAnnotations] = useState({});

  // Add or update annotations for a specific chart (memoized)
  const updateAnnotations = useCallback((chartId, chartAnnotations) => {
    setAnnotations(prevAnnotations => ({
      ...prevAnnotations,
      [chartId]: chartAnnotations
    }));
  }, []);

  // Get annotations for a specific chart (memoized)
  const getAnnotationsForChart = useCallback((chartId) => {
    return annotations[chartId] || [];
  }, [annotations]);

  // Get all annotations (memoized)
  const getAllAnnotations = useCallback(() => {
    return annotations;
  }, [annotations]);

  // Clear annotations for a specific chart (memoized)
  const clearAnnotations = useCallback((chartId) => {
    setAnnotations(prevAnnotations => {
      const newAnnotations = { ...prevAnnotations };
      delete newAnnotations[chartId];
      return newAnnotations;
    });
  }, []);

  // Clear all annotations (memoized)
  const clearAllAnnotations = useCallback(() => {
    setAnnotations({});
  }, []);

  // Add a single annotation to a chart (new optimized method)
  const addAnnotation = useCallback((chartId, annotation) => {
    console.log('AnnotationContext: Adding annotation for chart:', chartId);
    console.log('AnnotationContext: Annotation data:', annotation);
    setAnnotations(prevAnnotations => {
      const chartAnnotations = prevAnnotations[chartId] || [];
      return {
        ...prevAnnotations,
        [chartId]: [...chartAnnotations, annotation]
      };
    });
  }, []);

  // Update a single annotation (new optimized method)
  const updateAnnotation = useCallback((chartId, annotationId, changes) => {
    setAnnotations(prevAnnotations => {
      const chartAnnotations = prevAnnotations[chartId] || [];
      const updatedChartAnnotations = chartAnnotations.map(annotation => 
        annotation.id === annotationId ? { ...annotation, ...changes } : annotation
      );
      
      return {
        ...prevAnnotations,
        [chartId]: updatedChartAnnotations
      };
    });
  }, []);

  // Delete a single annotation (new optimized method)
  const deleteAnnotation = useCallback((chartId, annotationId) => {
    setAnnotations(prevAnnotations => {
      const chartAnnotations = prevAnnotations[chartId] || [];
      const filteredAnnotations = chartAnnotations.filter(
        annotation => annotation.id !== annotationId
      );
      
      return {
        ...prevAnnotations,
        [chartId]: filteredAnnotations
      };
    });
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    annotations,
    updateAnnotations,
    getAnnotationsForChart,
    getAllAnnotations,
    clearAnnotations,
    clearAllAnnotations,
    addAnnotation,      // New method
    updateAnnotation,   // New method
    deleteAnnotation    // New method
  }), [
    annotations, 
    updateAnnotations, 
    getAnnotationsForChart, 
    getAllAnnotations, 
    clearAnnotations, 
    clearAllAnnotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation
  ]);

  return (
    <AnnotationContext.Provider value={contextValue}>
      {children}
    </AnnotationContext.Provider>
  );
};

// Custom hook for using the annotation context
export const useAnnotations = () => {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error('useAnnotations must be used within an AnnotationProvider');
  }
  return context;
};

export default AnnotationContext;
