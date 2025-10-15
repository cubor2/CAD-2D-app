import { GRID_SIZE, MAJOR_GRID, RULER_SIZE } from '../constants';
import { worldToScreen } from './transforms';

export const drawGrid = (ctx, canvas, viewport, darkMode, showRulers) => {
  const rect = canvas.getBoundingClientRect();
  const canvasWidth = rect.width;
  const canvasHeight = rect.height;
  
  const startX = Math.floor((-canvasWidth / 2 - viewport.x) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
  const endX = Math.ceil((canvasWidth / 2 - viewport.x) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
  const startY = Math.floor((-canvasHeight / 2 - viewport.y) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
  const endY = Math.ceil((canvasHeight / 2 - viewport.y) / viewport.zoom / GRID_SIZE) * GRID_SIZE;

  if (viewport.zoom > 0.5) {
    ctx.strokeStyle = darkMode ? '#2a2a2a' : '#e0e0e0';
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

  ctx.strokeStyle = viewport.zoom > 0.5 ? (darkMode ? '#3a3a3a' : '#c0c0c0') : (darkMode ? '#2a2a2a' : '#e0e0e0');
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

export const drawRulers = (ctx, canvas, viewport, darkMode, showRulers) => {
  const rect = canvas.getBoundingClientRect();
  const canvasWidth = rect.width;
  const canvasHeight = rect.height;
  
  ctx.fillStyle = darkMode ? '#2a2a2a' : '#f0f0f0';
  ctx.fillRect(0, 0, canvasWidth, RULER_SIZE);
  ctx.fillRect(0, 0, RULER_SIZE, canvasHeight);
  
  ctx.fillStyle = darkMode ? '#3a3a3a' : '#e0e0e0';
  ctx.fillRect(0, 0, RULER_SIZE, RULER_SIZE);
  
  ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let x = Math.floor((-canvasWidth / 2 - viewport.x) / viewport.zoom / 10) * 10; 
       x <= Math.ceil((canvasWidth / 2 - viewport.x) / viewport.zoom / 10) * 10; 
       x += 10) {
    const screenPos = worldToScreen(x, 0, canvas, viewport);
    if (screenPos.x < RULER_SIZE) continue;
    
    ctx.strokeStyle = darkMode ? '#666' : '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenPos.x, RULER_SIZE);
    ctx.lineTo(screenPos.x, RULER_SIZE - 5);
    ctx.stroke();
    
    if (x % 50 === 0) {
      ctx.fillText(x.toString(), screenPos.x, RULER_SIZE / 2);
    }
  }
  
  ctx.save();
  ctx.translate(RULER_SIZE / 2, 0);
  ctx.rotate(-Math.PI / 2);
  
  for (let y = Math.floor((-canvasHeight / 2 - viewport.y) / viewport.zoom / 10) * 10; 
       y <= Math.ceil((canvasHeight / 2 - viewport.y) / viewport.zoom / 10) * 10; 
       y += 10) {
    const screenPos = worldToScreen(0, y, canvas, viewport);
    if (screenPos.y < RULER_SIZE) continue;
    
    ctx.strokeStyle = darkMode ? '#666' : '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-screenPos.y, RULER_SIZE / 2 - 5);
    ctx.lineTo(-screenPos.y, RULER_SIZE / 2);
    ctx.stroke();
    
    if (y % 50 === 0) {
      ctx.fillText(y.toString(), -screenPos.y, 0);
    }
  }
  
  ctx.restore();
  
  if (showRulers) {
    const origin = worldToScreen(0, 0, canvas, viewport);
    ctx.strokeStyle = darkMode ? '#ffffff' : '#000000';
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

export const drawGuides = (ctx, canvas, viewport, guides, showRulers) => {
  const rect = canvas.getBoundingClientRect();
  
  guides.forEach(guide => {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    
    if (guide.type === 'horizontal') {
      const screenY = worldToScreen(0, guide.position, canvas, viewport).y;
      ctx.beginPath();
      ctx.moveTo(showRulers ? RULER_SIZE : 0, screenY);
      ctx.lineTo(rect.width, screenY);
      ctx.stroke();
    } else {
      const screenX = worldToScreen(guide.position, 0, canvas, viewport).x;
      ctx.beginPath();
      ctx.moveTo(screenX, showRulers ? RULER_SIZE : 0);
      ctx.lineTo(screenX, rect.height);
      ctx.stroke();
    }
  });
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

export const drawElement = (ctx, canvas, viewport, el, isSelected, flashingIds, flashType, selectedEdge, showDimensions, darkMode, currentElement, isEditing, textCursorPosition, textSelectionStart, textSelectionEnd) => {
  ctx.save();

  const isFlashing = flashingIds.includes(el.id);
  const flashColor = flashType === 'ungroup' ? '#ff8800' : '#00ff00';
  
  if (isFlashing) {
    ctx.strokeStyle = flashColor;
    ctx.lineWidth = 4;
  } else if (isSelected) {
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = el.stroke || (darkMode ? '#ffffff' : '#000000');
    ctx.lineWidth = el.strokeWidth || 1.5;
  }

  ctx.fillStyle = el.fill || 'transparent';

  if (el.type === 'arc') {
    const center = worldToScreen(el.cx, el.cy, canvas, viewport);
    const radius = el.radius * viewport.zoom;
    
    const isArcSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'arc';
    
    if (isFlashing) {
      ctx.strokeStyle = flashColor;
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = isArcSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || (darkMode ? '#ffffff' : '#000000')));
      ctx.lineWidth = isArcSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
    }
    
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, el.startAngle, el.endAngle);
    ctx.stroke();
    
    if (isSelected || el === currentElement || showDimensions) {
      const midAngle = (el.startAngle + el.endAngle) / 2;
      const textX = center.x + radius * Math.cos(midAngle) * 1.2;
      const textY = center.y + radius * Math.sin(midAngle) * 1.2;
      const arcLength = Math.abs(el.endAngle - el.startAngle) * el.radius;
      ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
      ctx.font = '12px monospace';
      ctx.fillText(`${arcLength.toFixed(1)}mm`, textX, textY);
    }
    
    if (isSelected) {
      const controlPoints = [
        worldToScreen(el.cx + el.radius * Math.cos(el.startAngle), el.cy + el.radius * Math.sin(el.startAngle), canvas, viewport),
        worldToScreen(el.cx + el.radius * Math.cos(el.endAngle), el.cy + el.radius * Math.sin(el.endAngle), canvas, viewport),
        worldToScreen(el.cx, el.cy, canvas, viewport)
      ];
      
      controlPoints.forEach((pt, idx) => {
        ctx.fillStyle = idx === 2 ? '#ff6600' : '#00aaff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  } else if (el.type === 'line') {
    const start = worldToScreen(el.x1, el.y1, canvas, viewport);
    const end = worldToScreen(el.x2, el.y2, canvas, viewport);
    
    const isLineSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'line';
    
    if (isFlashing) {
      ctx.strokeStyle = flashColor;
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = isLineSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || (darkMode ? '#ffffff' : '#000000')));
      ctx.lineWidth = isLineSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
    }
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    if (isSelected || el === currentElement || showDimensions) {
      const length = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
      ctx.font = '12px monospace';
      ctx.fillText(`${length.toFixed(1)}mm`, midX + 5, midY - 5);
    }
    
    if (isSelected) {
      const controlPoints = [
        worldToScreen(el.x1, el.y1, canvas, viewport),
        worldToScreen(el.x2, el.y2, canvas, viewport),
        worldToScreen((el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2, canvas, viewport)
      ];
      
      controlPoints.forEach(pt => {
        ctx.fillStyle = '#00aaff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
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
        ctx.strokeStyle = isEdgeSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || (darkMode ? '#ffffff' : '#000000')));
        ctx.lineWidth = isEdgeSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
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

    if (isSelected || el === currentElement || showDimensions) {
      ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
      ctx.font = '12px monospace';
      ctx.fillText(`${Math.abs(el.width).toFixed(1)}mm`, topLeft.x + width / 2 - 20, topLeft.y - 5);
      ctx.fillText(`${Math.abs(el.height).toFixed(1)}mm`, topLeft.x + width + 5, topLeft.y + height / 2);
    }
    
    if (isSelected) {
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
      
      controlPoints.forEach((pt, idx) => {
        ctx.fillStyle = idx === 4 ? '#ff6600' : '#00aaff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
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
          ctx.strokeStyle = isThisQuarterSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || (darkMode ? '#ffffff' : '#000000')));
          ctx.lineWidth = isThisQuarterSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
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

    if (isSelected || el === currentElement || showDimensions) {
      ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
      ctx.font = '12px monospace';
      if (el.radiusX && el.radiusY && Math.abs(el.radiusX - el.radiusY) > 0.1) {
        ctx.fillText(`${(el.radiusX * 2).toFixed(1)}x${(el.radiusY * 2).toFixed(1)}mm`, center.x + radiusX + 5, center.y);
      } else {
        const r = el.radius || el.radiusX;
        ctx.fillText(`D${(r * 2).toFixed(1)}mm`, center.x + radiusX + 5, center.y);
      }
    }
    
    if (isSelected) {
      const controlPoints = [
        worldToScreen(el.cx, el.cy, canvas, viewport),
        worldToScreen(el.cx + (el.radiusX || el.radius), el.cy, canvas, viewport),
        worldToScreen(el.cx - (el.radiusX || el.radius), el.cy, canvas, viewport),
        worldToScreen(el.cx, el.cy + (el.radiusY || el.radius), canvas, viewport),
        worldToScreen(el.cx, el.cy - (el.radiusY || el.radius), canvas, viewport)
      ];
      
      controlPoints.forEach((pt, idx) => {
        ctx.fillStyle = idx === 0 ? '#ff6600' : '#00aaff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  } else if (el.type === 'text') {
    const pos = worldToScreen(el.x, el.y, canvas, viewport);
    
    ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
    ctx.textBaseline = 'bottom';
    
    const lines = el.text.split('\n');
    const lineHeight = el.fontSize * 1.2;
    
    // Rendu du texte avec sélection
    if (isEditing) {
      // Pendant l'édition, on rend toujours avec la logique de sélection,
      // même si start === end (pour éviter que tout le texte devienne bleu)
      const startPos = Math.min(textSelectionStart, textSelectionEnd);
      const endPos = Math.max(textSelectionStart, textSelectionEnd);

      // Si start === end, on traite ça comme une sélection de longueur 0
      const hasSelection = startPos !== endPos;

      let currentPos = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStart = currentPos;
        const lineEnd = currentPos + line.length;
        const lineY = pos.y - (lines.length - 1 - i) * lineHeight;

        // Si on a une vraie sélection (start !== end), diviser la ligne en parties
        if (hasSelection) {
          // Diviser la ligne en 3 parties : avant sélection, sélectionnée, après sélection
          const selStart = Math.max(startPos, lineStart) - lineStart;
          const selEnd = Math.min(endPos, lineEnd) - lineStart;

          const textBeforeSel = line.slice(0, Math.max(0, selStart));
          const selectedText = selStart < selEnd ? line.slice(selStart, selEnd) : '';
          const textAfterSel = line.slice(Math.max(0, selEnd));

          // Position X de chaque partie
          let currentX = pos.x;
          const beforeSelWidth = ctx.measureText(textBeforeSel).width;
          const selectedWidth = ctx.measureText(selectedText).width;

          // Texte avant la sélection (normal)
          if (textBeforeSel) {
            ctx.fillStyle = el.fill || (darkMode ? '#ffffff' : '#000000');
            ctx.fillText(textBeforeSel, currentX, lineY);
            currentX += beforeSelWidth;
          }

          // Texte sélectionné (blanc sur fond bleu)
          if (selectedText) {
            const selY = lineY - el.fontSize;

            // Rectangle de sélection
            ctx.fillStyle = 'rgba(0, 170, 255, 0.3)';
            ctx.fillRect(currentX, selY, selectedWidth, el.fontSize);

            // Texte sélectionné en blanc
            ctx.fillStyle = '#ffffff';
            ctx.fillText(selectedText, currentX, lineY);
            currentX += selectedWidth;
          }

          // Texte après la sélection (normal)
          if (textAfterSel) {
            ctx.fillStyle = el.fill || (darkMode ? '#ffffff' : '#000000');
            ctx.fillText(textAfterSel, currentX, lineY);
          }
        } else {
          // Pas de sélection : rendre tout le texte normalement (pas en bleu)
          ctx.fillStyle = el.fill || (darkMode ? '#ffffff' : '#000000');
          ctx.fillText(line, pos.x, lineY);
        }

        currentPos += line.length + 1;
      }
    } else {
      // Rendu normal du texte
      ctx.fillStyle = isFlashing ? flashColor : (isSelected || isEditing ? '#00aaff' : (el.fill || (darkMode ? '#ffffff' : '#000000')));
      lines.forEach((line, index) => {
        ctx.fillText(line, pos.x, pos.y - (lines.length - 1 - index) * lineHeight);
      });
    }

    // Le curseur sera rendu après le rectangle de sélection
    
    // AFFICHAGE DES POIGNÉES DE REDIMENSIONNEMENT POUR LES TEXTES
    // Un rectangle en pointillés et 8 poignées bleues apparaissent quand le texte est sélectionné ou en édition
    if (isSelected || isEditing) {
      const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
      const textHeight = lines.length * lineHeight;

      // Rectangle de sélection en pointillés
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(pos.x, pos.y - textHeight, textWidth, textHeight);
      ctx.setLineDash([]);

      // 8 poignées de redimensionnement aux coins et milieux des côtés
      const corners = [
        { x: pos.x, y: pos.y - textHeight },                    // topLeft
        { x: pos.x + textWidth, y: pos.y - textHeight },       // topRight
        { x: pos.x, y: pos.y },                                // bottomLeft
        { x: pos.x + textWidth, y: pos.y },                    // bottomRight
        { x: pos.x + textWidth / 2, y: pos.y - textHeight },   // top
        { x: pos.x + textWidth, y: pos.y - textHeight / 2 },   // right
        { x: pos.x + textWidth / 2, y: pos.y },                // bottom
        { x: pos.x, y: pos.y - textHeight / 2 }                // left
      ];

      corners.forEach((pt, idx) => {
        ctx.fillStyle = '#00aaff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
    
    // Rendu du curseur APRÈS le rectangle de sélection pour qu'il soit visible
    if (isEditing && textCursorPosition !== undefined) {
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
        const cursorX = pos.x + ctx.measureText(textBeforeCursor).width;
        const cursorY = pos.y - (lines.length - 1 - cursorLine) * lineHeight;

        // Clignotement plus fluide avec une fréquence fixe
        const blinkSpeed = 500; // ms
        const shouldShow = Math.floor(Date.now() / blinkSpeed) % 2 === 0;

        if (shouldShow) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cursorX, cursorY - el.fontSize);
          ctx.lineTo(cursorX, cursorY + 2); // Petit padding en bas
          ctx.stroke();
        }
      }
    }
  }

  ctx.restore();
};

export const drawSnapPoint = (ctx, canvas, viewport, snapPoint, selectedIds) => {
  if (!snapPoint) return;
  
  const screen = worldToScreen(snapPoint.x, snapPoint.y, canvas, viewport);
  
  const isSpecialPoint = snapPoint.type === 'endpoint' || 
                         snapPoint.type === 'center' || 
                         snapPoint.type === 'midpoint';
  
  const isFromSelectedElement = snapPoint.elementId && selectedIds.includes(snapPoint.elementId);
  
  let color = '#00ff00';
  if (snapPoint.type === 'guide' || snapPoint.isGuide) {
    color = '#ff00ff';
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
  
  ctx.strokeStyle = '#00aaff';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
  ctx.setLineDash([]);
};

