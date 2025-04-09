import React, { useState, useRef, useEffect, useCallback, memo } from 'react';

/**
 * Component for adding and displaying annotations on charts
 * @param {Object} props - Component props
 * @param {Array} props.annotations - Array of annotation objects
 * @param {Function} props.onAnnotationAdd - Callback when an annotation is added
 * @param {Function} props.onAnnotationUpdate - Callback when an annotation is updated
 * @param {Function} props.onAnnotationDelete - Callback when an annotation is deleted
 * @param {boolean} props.isAnnotationMode - Whether annotation mode is active
 * @param {Object} props.containerRef - Reference to the chart container
 */
const ChartAnnotation = memo(({
  annotations = [],
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  isAnnotationMode,
  containerRef
}) => {
  const [draggingAnnotation, setDraggingAnnotation] = useState(null);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [annotationText, setAnnotationText] = useState('');
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const throttleRef = useRef(false);

  // Handle creating a new annotation (only in annotation mode)
  const handleCreateAnnotation = useCallback((event) => {
    console.log('ChartAnnotation: Click event received');
    console.log('ChartAnnotation: Annotation mode:', isAnnotationMode);
    console.log('ChartAnnotation: Container ref:', !!containerRef.current);
    
    if (!isAnnotationMode || !containerRef.current) {
      console.log('ChartAnnotation: Click ignored - mode or container invalid');
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100; // x position as percentage
    const y = ((event.clientY - rect.top) / rect.height) * 100; // y position as percentage

    const newAnnotation = {
      id: Date.now(),
      text: 'Click to edit',
      position: { x, y }
    };

    onAnnotationAdd(newAnnotation);

    // Immediately start editing the new annotation
    setTimeout(() => {
      setEditingAnnotation(newAnnotation.id);
      setAnnotationText(newAnnotation.text);
    }, 50);
  }, [isAnnotationMode, containerRef, onAnnotationAdd]);

  // Start dragging an annotation
  const startDrag = useCallback((e, id, currentPos) => {
    e.stopPropagation();

    setDraggingAnnotation(id);
    setStartDragPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      annotX: currentPos.x,
      annotY: currentPos.y
    });

    dragPositionRef.current = { x: currentPos.x, y: currentPos.y };
  }, []);

  // Optimized mouse move handler for dragging with throttling and requestAnimationFrame
  useEffect(() => {
    let animationFrameId = null;
    let timeoutId = null;

    const handleMouseMove = (e) => {
      if (draggingAnnotation === null || !containerRef.current) return;

      // Only update if not already throttled
      if (!throttleRef.current) {
        // Set throttle flag
        throttleRef.current = true;

        // Use requestAnimationFrame for smoother rendering
        animationFrameId = requestAnimationFrame(() => {
          const rect = containerRef.current.getBoundingClientRect();

          // Calculate new position
          const deltaX = e.clientX - startDragPos.mouseX;
          const deltaY = e.clientY - startDragPos.mouseY;

          let newX = startDragPos.annotX + (deltaX / rect.width) * 100;
          let newY = startDragPos.annotY + (deltaY / rect.height) * 100;

          // Constrain to container bounds
          newX = Math.max(0, Math.min(100, newX));
          newY = Math.max(0, Math.min(100, newY));

          // Store the current position
          dragPositionRef.current = { x: newX, y: newY };

          // Update annotation position visually using CSS transform for better performance
          const element = document.getElementById(`annotation-${draggingAnnotation}`);
          if (element) {
            element.style.left = `${newX}%`;
            element.style.top = `${newY}%`;
          }

          // Reset throttle flag after short delay
          timeoutId = setTimeout(() => {
            throttleRef.current = false;
          }, 16); // ~60fps
        });
      }
    };

    const handleMouseUp = () => {
      if (draggingAnnotation !== null) {
        // Update the final position in state only when drag ends
        onAnnotationUpdate(draggingAnnotation, { 
          position: dragPositionRef.current
        });
        setDraggingAnnotation(null);
      }
    };

    if (draggingAnnotation !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      // Clean up all resources
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Cancel any pending animation frame
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      // Clear any pending timeout
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [draggingAnnotation, startDragPos, onAnnotationUpdate, containerRef]);

  // Handle text editing
  const handleTextClick = useCallback((e, id, text) => {
    e.stopPropagation();

    setEditingAnnotation(id);
    setAnnotationText(text);
  }, []);

  // Save edited text
  const handleTextEdit = useCallback((e, id) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (annotationText.trim() !== '') {
        onAnnotationUpdate(id, { text: annotationText });
      }
      setEditingAnnotation(null);
    }
  }, [annotationText, onAnnotationUpdate]);

  // Save text on blur
  const handleTextBlur = useCallback((id) => {
    if (annotationText.trim() !== '') {
      onAnnotationUpdate(id, { text: annotationText });
    }
    setEditingAnnotation(null);
  }, [annotationText, onAnnotationUpdate]);

  return (
    <div 
      className="chart-annotation-container"
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onClick={isAnnotationMode ? handleCreateAnnotation : undefined}
    >
      {/* Display existing annotations - always visible */}
      {annotations.map((annotation) => (
        <div
          id={`annotation-${annotation.id}`}
          key={annotation.id}
          className="annotation-box"
          style={{
            position: 'absolute',
            left: `${annotation.position.x}%`,
            top: `${annotation.position.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            cursor: isAnnotationMode ? 'move' : 'default',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            transition: draggingAnnotation === annotation.id ? 'none' : 'all 0.1s ease'
          }}
          onMouseDown={(e) => isAnnotationMode && startDrag(e, annotation.id, annotation.position)}
        >
          <div 
            className="annotation-handle"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              marginBottom: '3px',
              alignSelf: 'center'
            }}
          ></div>

          {editingAnnotation === annotation.id ? (
            <textarea
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              onKeyDown={(e) => handleTextEdit(e, annotation.id)}
              onBlur={() => handleTextBlur(annotation.id)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                width: '140px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                border: '1px solid #ddd',
                resize: 'both'
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className="annotation-text"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                maxWidth: '150px',
                minWidth: '60px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                cursor: 'pointer'
              }}
              onClick={(e) => isAnnotationMode && handleTextClick(e, annotation.id, annotation.text)}
            >
              {annotation.text}

              {/* Delete button - always visible for better UX */}
              <button
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#f56565',
                  color: 'white',
                  border: 'none',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: isAnnotationMode ? 1 : 0.6,
                  transition: 'opacity 0.2s ease'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAnnotationDelete(annotation.id);
                }}
                title="Delete annotation"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export default ChartAnnotation;