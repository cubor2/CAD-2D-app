import { GRID_SIZE, MAJOR_GRID, RULER_SIZE } from '../constants';
import { worldToScreen } from './transforms';
import { generateFingerJointPoints } from './fingerJoint';

export const drawGrid = (ctx, canvas, viewport, darkMode, showRulers) => {
  const rect = canvas.getBoundingClientRect();
  const canvasWidth = rect.width;
  const canvasHeight = rect.height;
  
  const startX = Math.floor((-canvasWidth / 2 - viewport.x) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
  const endX = Math.ceil((canvasWidth / 2 - viewport.x) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
  const startY = Math.floor((-canvasHeight / 2 - viewport.y) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
  const endY = Math.ceil((canvasHeight / 2 - viewport.y) / viewport.zoom / GRID_SIZE) * GRID_SIZE;

  const rulerOffset = showRulers ? RULER_SIZE : 0;

  if (viewport.zoom > 0.5) {
    ctx.strokeStyle = '#D8D3C7';
    ctx.lineWidth = 1;

    for (let x = startX; x <= endX; x += GRID_SIZE) {
      const screenPos = worldToScreen(x, 0, canvas, viewport);
      ctx.beginPath();
      ctx.moveTo(screenPos.x, 0);
      ctx.lineTo(screenPos.x, canvasHeight);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += GRID_SIZE) {
      const screenPos = worldToScreen(0, y, canvas, viewport);
      ctx.beginPath();
      ctx.moveTo(0, screenPos.y);
      ctx.lineTo(canvasWidth, screenPos.y);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = viewport.zoom > 0.5 ? '#C0C0C0' : '#D8D3C7';
  ctx.lineWidth = 2;

  for (let x = Math.floor(startX / MAJOR_GRID) * MAJOR_GRID; x <= endX; x += MAJOR_GRID) {
    const screenPos = worldToScreen(x, 0, canvas, viewport);
    ctx.beginPath();
    ctx.moveTo(screenPos.x, 0);
    ctx.lineTo(screenPos.x, canvasHeight);
    ctx.stroke();
  }

  for (let y = Math.floor(startY / MAJOR_GRID) * MAJOR_GRID; y <= endY; y += MAJOR_GRID) {
    const screenPos = worldToScreen(0, y, canvas, viewport);
    ctx.beginPath();
    ctx.moveTo(0, screenPos.y);
    ctx.lineTo(canvasWidth, screenPos.y);
    ctx.stroke();
  }
};

export const drawRulers = (ctx, canvas, viewport, darkMode, showRulers, borderWidth = 10) => {
  const rect = canvas.getBoundingClientRect();
  const canvasWidth = rect.width;
  const canvasHeight = rect.height;
  
  // Décaler les règles pour qu'elles commencent après le bord noir
  const offset = borderWidth;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(offset, offset, canvasWidth - offset, RULER_SIZE);
  ctx.fillRect(offset, offset, RULER_SIZE, canvasHeight - offset);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(offset, offset, RULER_SIZE, RULER_SIZE);
  
  ctx.fillStyle = '#1F1F1F';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let x = Math.floor((-canvasWidth / 2 - viewport.x) / viewport.zoom / 10) * 10; 
       x <= Math.ceil((canvasWidth / 2 - viewport.x) / viewport.zoom / 10) * 10; 
       x += 10) {
    const screenPos = worldToScreen(x, 0, canvas, viewport);
    // Arrêter avant le bord de droite
    if (screenPos.x < RULER_SIZE + offset || screenPos.x > canvasWidth - offset) continue;
    
    ctx.strokeStyle = '#1F1F1F';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenPos.x, offset + RULER_SIZE);
    ctx.lineTo(screenPos.x, offset + RULER_SIZE - 3);
    ctx.stroke();
    
    if (x % 50 === 0) {
      ctx.fillText(x.toString(), screenPos.x, offset + RULER_SIZE / 2);
    }
  }
  
  ctx.save();
  ctx.translate(offset + RULER_SIZE / 2, offset);
  ctx.rotate(-Math.PI / 2);
  
  for (let y = Math.floor((-canvasHeight / 2 - viewport.y) / viewport.zoom / 10) * 10; 
       y <= Math.ceil((canvasHeight / 2 - viewport.y) / viewport.zoom / 10) * 10; 
       y += 10) {
    const screenPos = worldToScreen(0, y, canvas, viewport);
    // Arrêter avant le bord du bas
    if (screenPos.y < RULER_SIZE + offset || screenPos.y > canvasHeight - offset) continue;
    
    ctx.strokeStyle = '#1F1F1F';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-screenPos.y + offset, RULER_SIZE / 2 - 3);
    ctx.lineTo(-screenPos.y + offset, RULER_SIZE / 2);
    ctx.stroke();
    
    if (y % 50 === 0) {
      ctx.fillText(y.toString(), -screenPos.y + offset, 0);
    }
  }
  
  ctx.restore();
  
  if (showRulers) {
    const origin = worldToScreen(0, 0, canvas, viewport);
    ctx.strokeStyle = '#1F1F1F';
    ctx.lineWidth = 2;
    const crossSize = 10;
    ctx.beginPath();
    ctx.moveTo(origin.x - crossSize, origin.y);
    ctx.lineTo(origin.x + crossSize, origin.y);
    ctx.moveTo(origin.x, origin.y - crossSize);
    ctx.lineTo(origin.x, origin.y + crossSize);
    ctx.stroke();
  }
};

export const drawGuides = (ctx, canvas, viewport, guides, showRulers, borderWidth = 10) => {
  const rect = canvas.getBoundingClientRect();
  
  // Les guides commencent après les règles ET les bordures noires
  const startOffset = showRulers ? RULER_SIZE + borderWidth : borderWidth;
  const endOffset = borderWidth;
  
  guides.forEach(guide => {
    ctx.strokeStyle = '#E44A33';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    if (guide.type === 'horizontal') {
      const screenY = worldToScreen(0, guide.position, canvas, viewport).y;
      ctx.beginPath();
      ctx.moveTo(startOffset, screenY);
      ctx.lineTo(rect.width - endOffset, screenY);
      ctx.stroke();
    } else {
      const screenX = worldToScreen(guide.position, 0, canvas, viewport).x;
      ctx.beginPath();
      ctx.moveTo(screenX, startOffset);
      ctx.lineTo(screenX, rect.height - endOffset);
      ctx.stroke();
    }
  });
  ctx.setLineDash([]);
};

export const drawOriginCross = (ctx, canvas, viewport, worldX, worldY) => {
  const screen = worldToScreen(worldX, worldY, canvas, viewport);
  const size = 8;
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screen.x - size, screen.y);
  ctx.lineTo(screen.x + size, screen.y);
  ctx.moveTo(screen.x, screen.y - size);
  ctx.lineTo(screen.x, screen.y + size);
  ctx.stroke();
};

export const drawElement = (ctx, canvas, viewport, el, isSelected, flashingIds, flashType, selectedEdge, showDimensions, darkMode, currentElement, isEditing, textCursorPosition, textSelectionStart, textSelectionEnd, tool, hideControlPoints = false) => {
  ctx.save();

  const isFlashing = flashingIds.includes(el.id);
  const flashColor = flashType === 'ungroup' ? '#ff8800' : '#00ff00';
  const selectionColor = tool === 'edit' ? '#0EA5E9' : '#E44A33';
  
  if (isFlashing) {
    ctx.strokeStyle = flashColor;
    ctx.lineWidth = 4;
  } else if (isSelected) {
    ctx.strokeStyle = selectionColor;
    ctx.lineWidth = 2.5;
  } else {
    ctx.strokeStyle = el.stroke || '#2B2B2B';
    ctx.lineWidth = el.strokeWidth || 1.5;
  }

  ctx.fillStyle = el.fill || 'transparent';

  if (el.type === 'arc') {
    const center = worldToScreen(el.cx, el.cy, canvas, viewport);
    const radiusX = (el.radiusX || el.radius) * viewport.zoom;
    const radiusY = (el.radiusY || el.radius) * viewport.zoom;
    const radius = el.radius * viewport.zoom;
    
    const isArcSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'arc';
    
    if (isFlashing) {
      ctx.strokeStyle = flashColor;
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = isArcSelected ? '#FF8C00' : (isSelected ? selectionColor : (el.stroke || '#2B2B2B'));
      ctx.lineWidth = isArcSelected ? 4 : (isSelected ? 2.5 : (el.strokeWidth || 1.5));
    }
    
    ctx.beginPath();
    if (el.radiusX && el.radiusY && Math.abs(el.radiusX - el.radiusY) > 0.1) {
      ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, el.startAngle, el.endAngle);
    } else {
      ctx.arc(center.x, center.y, radius, el.startAngle, el.endAngle);
    }
    ctx.stroke();
    
    if (showDimensions) {
      const midAngle = (el.startAngle + el.endAngle) / 2;
      const avgRadius = (radiusX + radiusY) / 2;
      const textX = center.x + avgRadius * Math.cos(midAngle) * 1.2;
      const textY = center.y + avgRadius * Math.sin(midAngle) * 1.2;
      const arcLength = Math.abs(el.endAngle - el.startAngle) * (el.radiusX || el.radius);
      ctx.fillStyle = '#1F1F1F';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${Math.round(arcLength)}mm`, textX, textY);
    }
    
    if (isSelected && !hideControlPoints) {
      const rx = el.radiusX || el.radius;
      const ry = el.radiusY || el.radius;
      const controlPoints = [
        worldToScreen(el.cx + rx * Math.cos(el.startAngle), el.cy + ry * Math.sin(el.startAngle), canvas, viewport),
        worldToScreen(el.cx + rx * Math.cos(el.endAngle), el.cy + ry * Math.sin(el.endAngle), canvas, viewport),
        worldToScreen(el.cx, el.cy, canvas, viewport)
      ];
      
      ctx.save();
      controlPoints.forEach((pt, idx) => {
        ctx.fillStyle = idx === 2 ? selectionColor : '#2B2B2B';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.restore();
    }
  } else if (el.type === 'line') {
    const start = worldToScreen(el.x1, el.y1, canvas, viewport);
    const end = worldToScreen(el.x2, el.y2, canvas, viewport);
    
    const isLineSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'line';
    
    if (isFlashing) {
      ctx.strokeStyle = flashColor;
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = isLineSelected ? '#FF8C00' : (isSelected ? selectionColor : (el.stroke || '#2B2B2B'));
      ctx.lineWidth = isLineSelected ? 4 : (isSelected ? 2.5 : (el.strokeWidth || 1.5));
    }
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    if (showDimensions) {
      const length = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.fillStyle = '#1F1F1F';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${Math.round(length)}mm`, midX + 5, midY - 5);
    }
    
    if (isSelected && !hideControlPoints) {
      const controlPoints = [
        worldToScreen(el.x1, el.y1, canvas, viewport),
        worldToScreen((el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2, canvas, viewport),
        worldToScreen(el.x2, el.y2, canvas, viewport)
      ];
      
      ctx.save();
      controlPoints.forEach((pt, idx) => {
        if (idx === 1) {
          ctx.fillStyle = tool === 'edit' ? '#00aaff' : '#2B2B2B';
        } else {
          ctx.fillStyle = '#2B2B2B';
        }
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.restore();
    }
  } else if (el.type === 'fingerJoint') {
    const points = generateFingerJointPoints(
      el.x1, el.y1, el.x2, el.y2,
      el.thickness || 3,
      el.toothWidth || 10,
      el.gapWidth || 10,
      el.startWith || 'tooth',
      el.autoAdjust !== false
    );
    
    if (isFlashing) {
      ctx.strokeStyle = flashColor;
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = isSelected ? selectionColor : (el.stroke || '#2B2B2B');
      ctx.lineWidth = isSelected ? 2.5 : (el.strokeWidth || 1.5);
    }
    
    ctx.beginPath();
    points.forEach((pt, idx) => {
      const screenPt = worldToScreen(pt.x, pt.y, canvas, viewport);
      if (idx === 0) {
        ctx.moveTo(screenPt.x, screenPt.y);
      } else {
        ctx.lineTo(screenPt.x, screenPt.y);
      }
    });
    ctx.stroke();
    
    if (showDimensions) {
      const length = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2);
      const start = worldToScreen(el.x1, el.y1, canvas, viewport);
      const end = worldToScreen(el.x2, el.y2, canvas, viewport);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.fillStyle = '#1F1F1F';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${Math.round(length)}mm`, midX + 5, midY - 5);
    }
    
    if (isSelected && !hideControlPoints) {
      const controlPoints = [
        worldToScreen(el.x1, el.y1, canvas, viewport),
        worldToScreen((el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2, canvas, viewport),
        worldToScreen(el.x2, el.y2, canvas, viewport)
      ];
      
      ctx.save();
      controlPoints.forEach((pt, idx) => {
        if (idx === 1) {
          ctx.fillStyle = tool === 'edit' ? '#00aaff' : '#2B2B2B';
        } else {
          ctx.fillStyle = '#2B2B2B';
        }
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.restore();
    }
  } else if (el.type === 'curve') {
    const start = worldToScreen(el.x1, el.y1, canvas, viewport);
    const control = worldToScreen(el.cpx, el.cpy, canvas, viewport);
    const end = worldToScreen(el.x2, el.y2, canvas, viewport);
    
    if (isFlashing) {
      ctx.strokeStyle = flashColor;
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = isSelected ? selectionColor : (el.stroke || '#2B2B2B');
      ctx.lineWidth = isSelected ? 2.5 : (el.strokeWidth || 1.5);
    }
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
    ctx.stroke();

    if (showDimensions) {
      const length = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.fillStyle = '#1F1F1F';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`~${Math.round(length)}mm`, midX + 5, midY - 5);
    }
    
    if (isSelected && !hideControlPoints) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(control.x, control.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      
      const controlPoints = [
        { pos: start, label: 'start' },
        { pos: control, label: 'control' },
        { pos: end, label: 'end' }
      ];
      
      ctx.save();
      controlPoints.forEach(({ pos, label }) => {
        ctx.fillStyle = label === 'control' ? '#00aaff' : '#2B2B2B';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.restore();
    }
  } else if (el.type === 'rectangle') {
    const topLeft = worldToScreen(el.x, el.y, canvas, viewport);
    const width = el.width * viewport.zoom;
    const height = el.height * viewport.zoom;
    
    const edges = {
      top: [topLeft.x, topLeft.y, topLeft.x + width, topLeft.y],
      right: [topLeft.x + width, topLeft.y, topLeft.x + width, topLeft.y + height],
      bottom: [topLeft.x + width, topLeft.y + height, topLeft.x, topLeft.y + height],
      left: [topLeft.x, topLeft.y + height, topLeft.x, topLeft.y]
    };
    
    Object.keys(edges).forEach(edgeName => {
      const [x1, y1, x2, y2] = edges[edgeName];
      
      const isEdgeSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === edgeName;
      
      if (isFlashing) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
      } else {
      ctx.strokeStyle = isEdgeSelected ? '#FF8C00' : (isSelected ? selectionColor : (el.stroke || '#2B2B2B'));
      ctx.lineWidth = isEdgeSelected ? 4 : (isSelected ? 2.5 : (el.strokeWidth || 1.5));
      }
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    
    if (!selectedEdge || selectedEdge.elementId !== el.id) {
      ctx.fillStyle = el.fill || 'transparent';
      ctx.beginPath();
      ctx.rect(topLeft.x, topLeft.y, width, height);
      ctx.fill();
    }

    if (showDimensions) {
      ctx.fillStyle = '#1F1F1F';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${Math.round(Math.abs(el.width))}mm`, topLeft.x + width / 2 - 20, topLeft.y - 5);
      ctx.fillText(`${Math.round(Math.abs(el.height))}mm`, topLeft.x + width + 5, topLeft.y + height / 2);
    }
    
    if (isSelected && !hideControlPoints) {
      const controlPoints = [
        worldToScreen(el.x, el.y, canvas, viewport),
        worldToScreen(el.x + el.width, el.y, canvas, viewport),
        worldToScreen(el.x, el.y + el.height, canvas, viewport),
        worldToScreen(el.x + el.width, el.y + el.height, canvas, viewport),
        worldToScreen(el.x + el.width / 2, el.y + el.height / 2, canvas, viewport),
        worldToScreen(el.x + el.width / 2, el.y, canvas, viewport),
        worldToScreen(el.x + el.width, el.y + el.height / 2, canvas, viewport),
        worldToScreen(el.x + el.width / 2, el.y + el.height, canvas, viewport),
        worldToScreen(el.x, el.y + el.height / 2, canvas, viewport)
      ];
      
      ctx.save();
      controlPoints.forEach((pt, idx) => {
        ctx.fillStyle = idx === 4 ? selectionColor : '#2B2B2B';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.restore();
    }
  } else if (el.type === 'circle') {
    const center = worldToScreen(el.cx, el.cy, canvas, viewport);
    const radiusX = (el.radiusX || el.radius) * viewport.zoom;
    const radiusY = (el.radiusY || el.radius) * viewport.zoom;
    
    const isQuarterSelected = selectedEdge && selectedEdge.elementId === el.id && 
                               ['top', 'right', 'bottom', 'left'].includes(selectedEdge.edge);
    
    if (isQuarterSelected) {
      const quarters = {
        right: { start: 0, end: Math.PI / 2 },
        bottom: { start: Math.PI / 2, end: Math.PI },
        left: { start: Math.PI, end: Math.PI * 1.5 },
        top: { start: Math.PI * 1.5, end: Math.PI * 2 }
      };
      
      Object.keys(quarters).forEach(quarterName => {
        const quarter = quarters[quarterName];
        const isThisQuarterSelected = selectedEdge.edge === quarterName;
        
        if (isFlashing) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
        } else {
          ctx.strokeStyle = isThisQuarterSelected ? '#FF8C00' : (isSelected ? selectionColor : (el.stroke || '#2B2B2B'));
          ctx.lineWidth = isThisQuarterSelected ? 4 : (isSelected ? 2.5 : (el.strokeWidth || 1.5));
        }
        
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, quarter.start, quarter.end);
        ctx.stroke();
      });
    } else {
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (showDimensions) {
      ctx.fillStyle = '#1F1F1F';
      ctx.font = 'bold 12px monospace';
      if (el.radiusX && el.radiusY && Math.abs(el.radiusX - el.radiusY) > 0.1) {
        ctx.fillText(`${(el.radiusX * 2).toFixed(1)}x${(el.radiusY * 2).toFixed(1)}mm`, center.x + radiusX + 5, center.y);
      } else {
        const r = el.radius || el.radiusX;
        ctx.fillText(`D${(r * 2).toFixed(1)}mm`, center.x + radiusX + 5, center.y);
      }
    }
    
    if (isSelected && !hideControlPoints) {
      const controlPoints = [
        worldToScreen(el.cx, el.cy, canvas, viewport),
        worldToScreen(el.cx + (el.radiusX || el.radius), el.cy, canvas, viewport),
        worldToScreen(el.cx - (el.radiusX || el.radius), el.cy, canvas, viewport),
        worldToScreen(el.cx, el.cy + (el.radiusY || el.radius), canvas, viewport),
        worldToScreen(el.cx, el.cy - (el.radiusY || el.radius), canvas, viewport)
      ];
      
      ctx.save();
      controlPoints.forEach((pt, idx) => {
        ctx.fillStyle = idx === 0 ? selectionColor : '#2B2B2B';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.restore();
    }
  } else if (el.type === 'text') {
    const x = el.x;
    const y = el.y;
    const width = el.width;
    const height = el.height;
    
    if (width <= 0 || height <= 0) {
      return;
    }
    
    const topLeft = worldToScreen(x, y, canvas, viewport);
    const rectWidth = width * viewport.zoom;
    const rectHeight = height * viewport.zoom;
    
    const scaledFontSize = el.fontSize * viewport.zoom;
    ctx.font = `${el.fontStyle} ${el.fontWeight} ${scaledFontSize}px ${el.fontFamily}`;
    
    const lines = el.text.split('\n');
    const lineHeight = scaledFontSize * 1.2;
    
    const textAlign = el.textAlign || 'center';
    const verticalAlign = el.verticalAlign || 'middle';
    
    const totalTextHeight = lines.length * lineHeight;
    let startY;
    if (verticalAlign === 'top') {
      startY = topLeft.y + scaledFontSize * 0.85;
    } else if (verticalAlign === 'bottom') {
      startY = topLeft.y + rectHeight - totalTextHeight + scaledFontSize * 0.85;
    } else {
      startY = topLeft.y + (rectHeight - totalTextHeight) / 2 + scaledFontSize * 0.85;
    }
    
    ctx.textBaseline = 'alphabetic';
    
    let textX;
    if (textAlign === 'center') {
      textX = topLeft.x + rectWidth / 2;
    } else if (textAlign === 'right') {
      textX = topLeft.x + rectWidth;
    } else {
      textX = topLeft.x;
    }
    
    // Rendu du texte avec gestion de la sélection
    if (isEditing && textSelectionStart !== undefined && textSelectionEnd !== undefined) {
      const selStart = Math.min(textSelectionStart, textSelectionEnd);
      const selEnd = Math.max(textSelectionStart, textSelectionEnd);
      const hasSelection = selStart !== selEnd;
      
      let currentPos = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStart = currentPos;
        const lineEnd = currentPos + line.length;
        const lineY = startY + i * lineHeight;
        
        if (hasSelection && selEnd > lineStart && selStart < lineEnd) {
          const selStartInLine = Math.max(0, selStart - lineStart);
          const selEndInLine = Math.min(line.length, selEnd - lineStart);
          
          const textBefore = line.slice(0, selStartInLine);
          const textSelected = line.slice(selStartInLine, selEndInLine);
          const textAfter = line.slice(selEndInLine);
          
          ctx.save();
          
          if (textAlign === 'center') {
            const fullLineWidth = ctx.measureText(line).width;
            const beforeWidth = ctx.measureText(textBefore).width;
            const selectedWidth = ctx.measureText(textSelected).width;
            
            const lineStartX = textX - fullLineWidth / 2;
            
            if (textBefore) {
              ctx.fillStyle = el.fill || '#1F1F1F';
              ctx.textAlign = 'left';
              ctx.fillText(textBefore, lineStartX, lineY);
            }
            
            if (textSelected) {
              ctx.fillStyle = 'rgba(0, 170, 255, 0.3)';
              ctx.fillRect(lineStartX + beforeWidth, lineY - scaledFontSize * 0.8, selectedWidth, scaledFontSize);
              
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'left';
              ctx.fillText(textSelected, lineStartX + beforeWidth, lineY);
            }
            
            if (textAfter) {
              ctx.fillStyle = el.fill || '#1F1F1F';
              ctx.textAlign = 'left';
              ctx.fillText(textAfter, lineStartX + beforeWidth + selectedWidth, lineY);
            }
          } else {
            const beforeWidth = ctx.measureText(textBefore).width;
            const selectedWidth = ctx.measureText(textSelected).width;
            
            let currentX = textX;
            
            if (textBefore) {
              ctx.fillStyle = el.fill || '#1F1F1F';
              ctx.textAlign = 'left';
              ctx.fillText(textBefore, currentX, lineY);
              currentX += beforeWidth;
            }
            
            if (textSelected) {
              ctx.fillStyle = 'rgba(0, 170, 255, 0.3)';
              ctx.fillRect(currentX, lineY - scaledFontSize * 0.8, selectedWidth, scaledFontSize);
              
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'left';
              ctx.fillText(textSelected, currentX, lineY);
              currentX += selectedWidth;
            }
            
            if (textAfter) {
              ctx.fillStyle = el.fill || '#1F1F1F';
              ctx.textAlign = 'left';
              ctx.fillText(textAfter, currentX, lineY);
            }
          }
          
          ctx.restore();
        } else {
          ctx.save();
          if (textAlign === 'center') {
            ctx.textAlign = 'center';
          } else if (textAlign === 'right') {
            ctx.textAlign = 'right';
          } else {
            ctx.textAlign = 'left';
          }
          ctx.fillStyle = el.fill || '#1F1F1F';
          ctx.fillText(line, textX, lineY);
          ctx.restore();
        }
        
        currentPos += line.length + 1;
      }
    } else {
      ctx.save();
      if (textAlign === 'center') {
        ctx.textAlign = 'center';
      } else if (textAlign === 'right') {
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'left';
      }
      ctx.fillStyle = isFlashing ? flashColor : (isSelected || isEditing ? selectionColor : (el.fill || '#1F1F1F'));
      lines.forEach((line, index) => {
        const lineY = startY + index * lineHeight;
        ctx.fillText(line, textX, lineY);
      });
      ctx.restore();
    }

    // Le curseur sera rendu après le rectangle de sélection
    
    // AFFICHAGE DES POIGNÉES DE REDIMENSIONNEMENT POUR LES TEXTES
    // Un rectangle en pointillés et 8 poignées apparaissent quand le texte est sélectionné ou en édition
    if (isSelected || isEditing) {
      // Rectangle de sélection en pointillés (toujours affiché)
      ctx.strokeStyle = selectionColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(topLeft.x, topLeft.y, rectWidth, rectHeight);
      ctx.setLineDash([]);

      // 8 poignées de redimensionnement aux coins et milieux des côtés
      // Masquer les poignées quand l'outil Texte est actif
      if (tool !== 'text') {
        const corners = [
          { x: topLeft.x, y: topLeft.y },                              // topLeft
          { x: topLeft.x + rectWidth, y: topLeft.y },                  // topRight
          { x: topLeft.x, y: topLeft.y + rectHeight },                 // bottomLeft
          { x: topLeft.x + rectWidth, y: topLeft.y + rectHeight },     // bottomRight
          { x: topLeft.x + rectWidth / 2, y: topLeft.y },              // top
          { x: topLeft.x + rectWidth, y: topLeft.y + rectHeight / 2 }, // right
          { x: topLeft.x + rectWidth / 2, y: topLeft.y + rectHeight }, // bottom
          { x: topLeft.x, y: topLeft.y + rectHeight / 2 }              // left
        ];

        ctx.save();
        corners.forEach((pt, idx) => {
          ctx.fillStyle = '#2B2B2B';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        ctx.restore();
      }
    }
    
    // Rendu du curseur APRÈS le rectangle de sélection pour qu'il soit visible
    // Ne pas afficher le curseur s'il y a une sélection active
    const hasActiveSelection = textSelectionStart !== undefined && 
                               textSelectionEnd !== undefined && 
                               textSelectionStart !== textSelectionEnd;
    
    if (isEditing && textCursorPosition !== undefined && !hasActiveSelection) {
      let currentPos = 0;
      let cursorLine = -1, cursorCol = -1;

      // Trouver la ligne et colonne du curseur
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStart = currentPos;
        const lineEnd = currentPos + line.length;

        if (textCursorPosition >= lineStart && textCursorPosition <= lineEnd) {
          cursorLine = i;
          cursorCol = textCursorPosition - lineStart;
          break;
        }
        currentPos += line.length + 1; // +1 pour le caractère de nouvelle ligne
      }

      // Si on n'a pas trouvé la ligne, c'est la fin du texte
      if (cursorLine === -1 && textCursorPosition === el.text.length) {
        cursorLine = lines.length - 1;
        cursorCol = lines[cursorLine].length;
      }

      // Dessiner le curseur
      if (cursorLine >= 0) {
        const cursorLineText = lines[cursorLine];
        const textBeforeCursor = cursorLineText.slice(0, cursorCol);
        const textBeforeWidth = ctx.measureText(textBeforeCursor).width;
        
        let cursorX;
        if (textAlign === 'center') {
          const lineWidth = ctx.measureText(cursorLineText).width;
          cursorX = textX - lineWidth / 2 + textBeforeWidth;
        } else if (textAlign === 'right') {
          const lineWidth = ctx.measureText(cursorLineText).width;
          cursorX = textX - lineWidth + textBeforeWidth;
        } else {
          cursorX = textX + textBeforeWidth;
        }
        
        const cursorY = startY + cursorLine * lineHeight;

        // Clignotement plus fluide avec une fréquence fixe
        const blinkSpeed = 500; // ms
        const shouldShow = Math.floor(Date.now() / blinkSpeed) % 2 === 0;

        if (shouldShow) {
          ctx.strokeStyle = selectionColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cursorX, cursorY - scaledFontSize * 0.8);
          ctx.lineTo(cursorX, cursorY + 2);
          ctx.stroke();
        }
      }
    }
  }

  ctx.restore();
};

export const drawGroupBoundingBox = (ctx, canvas, viewport, boundingBox, tool) => {
  const selectionColor = tool === 'edit' ? '#0EA5E9' : '#E44A33';
  const topLeft = worldToScreen(boundingBox.x, boundingBox.y, canvas, viewport);
  const bottomRight = worldToScreen(boundingBox.x + boundingBox.width, boundingBox.y + boundingBox.height, canvas, viewport);
  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;
  
  ctx.save();
  ctx.strokeStyle = selectionColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(topLeft.x, topLeft.y, width, height);
  ctx.setLineDash([]);
  
  const controlPoints = [
    worldToScreen(boundingBox.topLeft.x, boundingBox.topLeft.y, canvas, viewport),
    worldToScreen(boundingBox.topRight.x, boundingBox.topRight.y, canvas, viewport),
    worldToScreen(boundingBox.bottomLeft.x, boundingBox.bottomLeft.y, canvas, viewport),
    worldToScreen(boundingBox.bottomRight.x, boundingBox.bottomRight.y, canvas, viewport),
    worldToScreen(boundingBox.center.x, boundingBox.center.y, canvas, viewport),
    worldToScreen(boundingBox.top.x, boundingBox.top.y, canvas, viewport),
    worldToScreen(boundingBox.right.x, boundingBox.right.y, canvas, viewport),
    worldToScreen(boundingBox.bottom.x, boundingBox.bottom.y, canvas, viewport),
    worldToScreen(boundingBox.left.x, boundingBox.left.y, canvas, viewport)
  ];
  
  controlPoints.forEach((pt, idx) => {
    ctx.fillStyle = idx === 4 ? selectionColor : '#2B2B2B';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  
  ctx.restore();
};

export const drawSnapPoint = (ctx, canvas, viewport, snapPoint, selectedIds) => {
  if (!snapPoint) return;
  
  const screen = worldToScreen(snapPoint.x, snapPoint.y, canvas, viewport);
  
  const isSpecialPoint = snapPoint.type === 'endpoint' || 
                         snapPoint.type === 'center' || 
                         snapPoint.type === 'midpoint' ||
                         snapPoint.type === 'controlPoint';
  
  const isFromSelectedElement = snapPoint.elementId && selectedIds.includes(snapPoint.elementId);
  
  let color = '#00ff00';
  if (snapPoint.type === 'guide' || snapPoint.isGuide) {
    color = '#1F1F1F';
  } else if (isSpecialPoint && !isFromSelectedElement) {
    color = '#ff0000';
  }
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
  ctx.stroke();
};

export const drawSelectionBox = (ctx, selectionBox) => {
  if (!selectionBox) return;
  
  ctx.strokeStyle = '#E44A33';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
  ctx.setLineDash([]);
};

export const drawWorkArea = (ctx, canvas, viewport, workArea) => {
  if (!workArea || !workArea.visible || workArea.width <= 0 || workArea.height <= 0) return;
  
  // La zone de travail est centrée sur l'origine (0, 0)
  // Elle s'étend de (-width/2, -height/2) à (width/2, height/2)
  const halfWidth = workArea.width / 2;
  const halfHeight = workArea.height / 2;
  
  // Convertir les coins en coordonnées écran
  const topLeft = worldToScreen(-halfWidth, -halfHeight, canvas, viewport);
  const bottomRight = worldToScreen(halfWidth, halfHeight, canvas, viewport);
  
  const screenWidth = bottomRight.x - topLeft.x;
  const screenHeight = bottomRight.y - topLeft.y;
  
  // Dessiner le rectangle de la zone de travail (ligne fine continue)
  ctx.strokeStyle = '#E44A33';
  ctx.lineWidth = 1;
  ctx.strokeRect(topLeft.x, topLeft.y, screenWidth, screenHeight);
  
  // Ajouter une ombre légère pour indiquer la zone hors limites
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  const rect = canvas.getBoundingClientRect();
  
  // Ombre en haut
  if (topLeft.y > 0) {
    ctx.fillRect(0, 0, rect.width, topLeft.y);
  }
  
  // Ombre à gauche
  if (topLeft.x > 0) {
    ctx.fillRect(0, Math.max(0, topLeft.y), topLeft.x, screenHeight);
  }
  
  // Ombre à droite
  if (bottomRight.x < rect.width) {
    ctx.fillRect(bottomRight.x, Math.max(0, topLeft.y), rect.width - bottomRight.x, screenHeight);
  }
  
  // Ombre en bas
  if (bottomRight.y < rect.height) {
    ctx.fillRect(0, bottomRight.y, rect.width, rect.height - bottomRight.y);
  }
  
  // Ajouter un label "Zone de travail"
  ctx.save();
  ctx.font = 'bold 14px Inter';
  ctx.fillStyle = '#E44A33';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  
  const centerX = (topLeft.x + bottomRight.x) / 2;
  const labelY = topLeft.y - 5;
  
  const labelText = `Zone de travail: ${workArea.width} × ${workArea.height} mm`;
  
  ctx.fillStyle = '#E44A33';
  ctx.fillText(labelText, centerX, labelY);
  
  ctx.restore();
};

