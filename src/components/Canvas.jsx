import React, { useRef, useEffect } from 'react';
import { 
  drawGrid, 
  drawRulers, 
  drawGuides, 
  drawOriginCross, 
  drawElement, 
  drawSnapPoint, 
  drawSelectionBox 
} from '../utils/drawing';

const Canvas = React.memo(({
  viewport,
  elements,
  selectedIds,
  currentElement,
  snapPoint,
  selectionBox,
  drawOrigin,
  selectedEdge,
  showDimensions,
  darkMode,
  showRulers,
  guides,
  flashingIds,
  flashType,
  tool,
  editingTextId,
  textCursorPosition,
  textSelectionStart,
  textSelectionEnd,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onContextMenu,
  cursor
}) => {
  const canvasRef = useRef(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.fillStyle = darkMode ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    drawGrid(ctx, canvas, viewport, darkMode, showRulers);

    if (showRulers) {
      drawGuides(ctx, canvas, viewport, guides, showRulers);
    }

    elements.forEach(el => {
      const isSelected = selectedIds.includes(el.id);
      const isEditing = editingTextId === el.id && tool === 'edit';
      drawElement(ctx, canvas, viewport, el, isSelected, flashingIds, flashType, selectedEdge, showDimensions, darkMode, currentElement, isEditing, textCursorPosition, textSelectionStart, textSelectionEnd);
    });

    if (currentElement) {
      drawElement(ctx, canvas, viewport, currentElement, false, flashingIds, flashType, selectedEdge, showDimensions, darkMode, currentElement, false);
    }

    if (drawOrigin) {
      drawOriginCross(ctx, canvas, viewport, drawOrigin.x, drawOrigin.y);
    }

    drawSelectionBox(ctx, selectionBox);
    drawSnapPoint(ctx, canvas, viewport, snapPoint, selectedIds);

    if (showRulers) {
      drawRulers(ctx, canvas, viewport, darkMode, showRulers);
    }

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    draw();
  }, [elements, viewport, selectedIds, currentElement, snapPoint, selectionBox, drawOrigin, selectedEdge, showDimensions, darkMode, showRulers, guides, flashingIds, flashType, editingTextId, textCursorPosition, textSelectionStart, textSelectionEnd]);

  useEffect(() => {
    const redraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      draw();
    };
    
    redraw();
    const timer1 = setTimeout(redraw, 100);
    const timer2 = setTimeout(redraw, 300);
    const timer3 = setTimeout(redraw, 500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    if (!editingTextId) return;
    
    const interval = setInterval(() => {
      draw();
    }, 530);
    
    return () => clearInterval(interval);
  }, [editingTextId, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      onContextMenu={onContextMenu}
      style={{ cursor }}
    />
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;

