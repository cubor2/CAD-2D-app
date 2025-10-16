import React, { useRef, useEffect } from 'react';
import { 
  drawGrid, 
  drawRulers, 
  drawGuides, 
  drawOriginCross, 
  drawElement, 
  drawSnapPoint, 
  drawSelectionBox,
  drawWorkArea
} from '../utils/drawing';
import { RULER_SIZE } from '../constants';

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
  workArea,
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
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    drawGrid(ctx, canvas, viewport, darkMode, showRulers);
    
    // Dessiner la zone de travail en premier (tout en dessous)
    drawWorkArea(ctx, canvas, viewport, workArea);
    
    // Définir la largeur des bordures noires
    const borderWidth = 10;
    
    // Dessiner les règles (au-dessus de la zone de travail, en dessous du rectangle noir)
    if (showRulers) {
      drawRulers(ctx, canvas, viewport, darkMode, showRulers, borderWidth);
    }
    
    // Dessiner les grosses bordures noires avec fillRect pour une épaisseur fixe (sans le bas)
    // Les bordures commencent à 0 pour couvrir partiellement les règles
    const rulerOffset = showRulers ? RULER_SIZE : 0;
    const x = 0;
    const y = 0;
    const w = rect.width;
    const h = rect.height;
    
    ctx.fillStyle = '#2B2B2B';
    
    // Barre horizontale du haut
    ctx.fillRect(x, y, w, borderWidth);
    
    // Barre verticale gauche (jusqu'en bas de l'écran)
    ctx.fillRect(x, y, borderWidth, h);
    
    // Barre verticale droite (jusqu'en bas de l'écran)
    ctx.fillRect(w - borderWidth, y, borderWidth, h);
    
    // Ajouter les lignes blanches en biseau aux coins du haut (couvrant toute l'épaisseur de la barre)
    const bevelLength = 10;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    
    // Coin haut-gauche (ligne diagonale partant exactement du coin extérieur)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(bevelLength, bevelLength);
    ctx.stroke();
    
    // Coin haut-droite (ligne diagonale partant exactement du coin extérieur)
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w - bevelLength, bevelLength);
    ctx.stroke();

    if (showRulers) {
      drawGuides(ctx, canvas, viewport, guides, showRulers, borderWidth);
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
  }, [elements, viewport, selectedIds, currentElement, snapPoint, selectionBox, drawOrigin, selectedEdge, showDimensions, darkMode, showRulers, guides, flashingIds, flashType, editingTextId, textCursorPosition, textSelectionStart, textSelectionEnd, workArea]);

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

