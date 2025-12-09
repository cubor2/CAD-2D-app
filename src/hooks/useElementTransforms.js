import { useCallback } from 'react';

/**
 * Hook pour gérer les transformations d'éléments (rotation, symétrie, redimensionnement)
 * 
 * @param {Array} selectedIds - IDs des éléments sélectionnés
 * @param {Array} elements - Tous les éléments du canvas
 * @param {Function} updateElements - Fonction pour mettre à jour les éléments
 * @param {number} gridSize - Taille de la grille pour le snap
 * @returns {Object} Fonctions de transformation
 */
export const useElementTransforms = (selectedIds, elements, updateElements, gridSize = 1) => {
  
  // Fonction utilitaire pour snapper au grid
  const snapToGridFn = useCallback((point) => ({
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  }), [gridSize]);

  /**
   * Rotation de 45° (π/4 radians) autour du centre de la sélection
   */
  const handleRotate = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    let centerX = 0;
    let centerY = 0;
    
    selectedElements.forEach(el => {
      if (el.type === 'line' || el.type === 'fingerJoint') {
        centerX += (el.x1 + el.x2) / 2;
        centerY += (el.y1 + el.y2) / 2;
      } else if (el.type === 'rectangle') {
        centerX += el.x + el.width / 2;
        centerY += el.y + el.height / 2;
      } else if (el.type === 'circle') {
        centerX += el.cx;
        centerY += el.cy;
      } else if (el.type === 'arc') {
        centerX += el.cx;
        centerY += el.cy;
      } else if (el.type === 'curve') {
        centerX += (el.x1 + el.x2) / 2;
        centerY += (el.y1 + el.y2) / 2;
      } else if (el.type === 'text') {
        centerX += el.x;
        centerY += el.y;
      }
    });
    
    centerX /= selectedElements.length;
    centerY /= selectedElements.length;
    
    const angle = Math.PI / 4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    updateElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'fingerJoint') {
        const dx1 = el.x1 - centerX;
        const dy1 = el.y1 - centerY;
        const dx2 = el.x2 - centerX;
        const dy2 = el.y2 - centerY;
        const p1 = { x: centerX + dx1 * cos - dy1 * sin, y: centerY + dx1 * sin + dy1 * cos };
        const p2 = { x: centerX + dx2 * cos - dy2 * sin, y: centerY + dx2 * sin + dy2 * cos };
        return {
          ...el,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y
        };
      } else if (el.type === 'rectangle') {
        const oldCenterX = el.x + el.width / 2;
        const oldCenterY = el.y + el.height / 2;
        const dx = oldCenterX - centerX;
        const dy = oldCenterY - centerY;
        const newCenter = { x: centerX + dx * cos - dy * sin, y: centerY + dx * sin + dy * cos };
        const topLeft = { x: newCenter.x - el.height / 2, y: newCenter.y - el.width / 2 };
        return {
          ...el,
          x: topLeft.x,
          y: topLeft.y,
          width: el.height,
          height: el.width
        };
      } else if (el.type === 'circle') {
        const dx = el.cx - centerX;
        const dy = el.cy - centerY;
        const center = { x: centerX + dx * cos - dy * sin, y: centerY + dx * sin + dy * cos };
        return {
          ...el,
          cx: center.x,
          cy: center.y
        };
      } else if (el.type === 'arc') {
        const dx = el.cx - centerX;
        const dy = el.cy - centerY;
        const center = { x: centerX + dx * cos - dy * sin, y: centerY + dx * sin + dy * cos };
        return {
          ...el,
          cx: center.x,
          cy: center.y,
          startAngle: el.startAngle + angle,
          endAngle: el.endAngle + angle
        };
      } else if (el.type === 'curve') {
        const dx1 = el.x1 - centerX;
        const dy1 = el.y1 - centerY;
        const dx2 = el.x2 - centerX;
        const dy2 = el.y2 - centerY;
        const dxcp = el.cpx - centerX;
        const dycp = el.cpy - centerY;
        const p1 = { x: centerX + dx1 * cos - dy1 * sin, y: centerY + dx1 * sin + dy1 * cos };
        const p2 = { x: centerX + dx2 * cos - dy2 * sin, y: centerY + dx2 * sin + dy2 * cos };
        const cp = { x: centerX + dxcp * cos - dycp * sin, y: centerY + dxcp * sin + dycp * cos };
        return {
          ...el,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          cpx: cp.x,
          cpy: cp.y
        };
      }
      return el;
    }));
  }, [selectedIds, elements, updateElements]);

  /**
   * Symétrie horizontale (flip sur l'axe vertical)
   */
  const handleFlipHorizontal = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    let centerX = 0;
    
    selectedElements.forEach(el => {
      if (el.type === 'line' || el.type === 'fingerJoint') {
        centerX += (el.x1 + el.x2) / 2;
      } else if (el.type === 'rectangle') {
        centerX += el.x + el.width / 2;
      } else if (el.type === 'circle') {
        centerX += el.cx;
      } else if (el.type === 'arc') {
        centerX += el.cx;
      } else if (el.type === 'curve') {
        centerX += (el.x1 + el.x2) / 2;
      } else if (el.type === 'text') {
        centerX += el.x;
      }
    });
    
    centerX /= selectedElements.length;
    
    updateElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'fingerJoint') {
        const x1 = Math.round((2 * centerX - el.x1) / gridSize) * gridSize;
        const x2 = Math.round((2 * centerX - el.x2) / gridSize) * gridSize;
        return {
          ...el,
          x1,
          x2
        };
      } else if (el.type === 'rectangle') {
        const x = Math.round((2 * centerX - el.x - el.width) / gridSize) * gridSize;
        return {
          ...el,
          x
        };
      } else if (el.type === 'circle') {
        const cx = Math.round((2 * centerX - el.cx) / gridSize) * gridSize;
        return {
          ...el,
          cx
        };
      } else if (el.type === 'arc') {
        const cx = Math.round((2 * centerX - el.cx) / gridSize) * gridSize;
        return {
          ...el,
          cx,
          startAngle: Math.PI - el.endAngle,
          endAngle: Math.PI - el.startAngle
        };
      } else if (el.type === 'curve') {
        const x1 = Math.round((2 * centerX - el.x1) / gridSize) * gridSize;
        const x2 = Math.round((2 * centerX - el.x2) / gridSize) * gridSize;
        const cpx = Math.round((2 * centerX - el.cpx) / gridSize) * gridSize;
        return {
          ...el,
          x1,
          x2,
          cpx
        };
      }
      return el;
    }));
  }, [selectedIds, elements, updateElements, gridSize]);

  /**
   * Symétrie verticale (flip sur l'axe horizontal)
   */
  const handleFlipVertical = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    let centerY = 0;
    
    selectedElements.forEach(el => {
      if (el.type === 'line' || el.type === 'fingerJoint') {
        centerY += (el.y1 + el.y2) / 2;
      } else if (el.type === 'rectangle') {
        centerY += el.y + el.height / 2;
      } else if (el.type === 'circle') {
        centerY += el.cy;
      } else if (el.type === 'arc') {
        centerY += el.cy;
      } else if (el.type === 'curve') {
        centerY += (el.y1 + el.y2) / 2;
      } else if (el.type === 'text') {
        centerY += el.y;
      }
    });
    
    centerY /= selectedElements.length;
    
    updateElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'fingerJoint') {
        const y1 = Math.round((2 * centerY - el.y1) / gridSize) * gridSize;
        const y2 = Math.round((2 * centerY - el.y2) / gridSize) * gridSize;
        return {
          ...el,
          y1,
          y2
        };
      } else if (el.type === 'rectangle') {
        const y = Math.round((2 * centerY - el.y - el.height) / gridSize) * gridSize;
        return {
          ...el,
          y
        };
      } else if (el.type === 'circle') {
        const cy = Math.round((2 * centerY - el.cy) / gridSize) * gridSize;
        return {
          ...el,
          cy
        };
      } else if (el.type === 'arc') {
        const cy = Math.round((2 * centerY - el.cy) / gridSize) * gridSize;
        return {
          ...el,
          cy,
          startAngle: -el.endAngle,
          endAngle: -el.startAngle
        };
      } else if (el.type === 'curve') {
        const y1 = Math.round((2 * centerY - el.y1) / gridSize) * gridSize;
        const y2 = Math.round((2 * centerY - el.y2) / gridSize) * gridSize;
        const cpy = Math.round((2 * centerY - el.cpy) / gridSize) * gridSize;
        return {
          ...el,
          y1,
          y2,
          cpy
        };
      }
      return el;
    }));
  }, [selectedIds, elements, updateElements, gridSize]);

  /**
   * Redimensionne les éléments sélectionnés
   * @param {number} delta - Changement de taille
   * @param {boolean} fromOppositeEnd - Si true, redimensionne depuis l'extrémité opposée
   */
  const handleResizeElement = useCallback((delta, fromOppositeEnd = false) => {
    if (selectedIds.length === 0) return;
    
    updateElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'fingerJoint') {
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const currentLength = Math.sqrt(dx * dx + dy * dy);
        if (currentLength === 0) return el;
        
        const newLength = Math.max(1, currentLength + delta);
        const scale = newLength / currentLength;
        
        if (fromOppositeEnd) {
          const newX1 = el.x2 - dx * scale;
          const newY1 = el.y2 - dy * scale;
          return { ...el, x1: newX1, y1: newY1 };
        } else {
          const newX2 = el.x1 + dx * scale;
          const newY2 = el.y1 + dy * scale;
          return { ...el, x2: newX2, y2: newY2 };
        }
      } else if (el.type === 'rectangle') {
        const newWidth = Math.max(1, Math.abs(el.width) + delta);
        const newHeight = Math.max(1, Math.abs(el.height) + delta);
        
        if (fromOppositeEnd) {
          return {
            ...el,
            x: el.x - delta,
            y: el.y + delta,
            width: el.width < 0 ? -newWidth : newWidth,
            height: el.height < 0 ? -newHeight : newHeight
          };
        } else {
          return {
            ...el,
            y: el.y - delta,
            width: el.width < 0 ? -newWidth : newWidth,
            height: el.height < 0 ? -newHeight : newHeight
          };
        }
      } else if (el.type === 'circle') {
        const currentRadius = el.radiusX || el.radius;
        const newRadius = Math.max(1, currentRadius + delta);
        
        if (el.radiusX && el.radiusY && Math.abs(el.radiusX - el.radiusY) > 0.01) {
          const scaleX = newRadius / currentRadius;
          const scaleY = newRadius / currentRadius;
          return {
            ...el,
            radiusX: el.radiusX * scaleX,
            radiusY: el.radiusY * scaleY
          };
        } else {
          return {
            ...el,
            radius: newRadius,
            radiusX: newRadius,
            radiusY: newRadius
          };
        }
      } else if (el.type === 'arc') {
        const currentRadius = el.radiusX || el.radius;
        const newRadius = Math.max(1, currentRadius + delta);
        return {
          ...el,
          radius: newRadius,
          radiusX: newRadius,
          radiusY: newRadius
        };
      } else if (el.type === 'curve') {
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const currentLength = Math.sqrt(dx * dx + dy * dy);
        if (currentLength === 0) return el;
        
        const newLength = Math.max(1, currentLength + delta);
        const scale = newLength / currentLength;
        
        const cdx = el.cpx - el.x1;
        const cdy = el.cpy - el.y1;
        
        if (fromOppositeEnd) {
          const newX1 = el.x2 - dx * scale;
          const newY1 = el.y2 - dy * scale;
          return {
            ...el,
            x1: newX1,
            y1: newY1,
            cpx: newX1 + cdx * scale,
            cpy: newY1 + cdy * scale
          };
        } else {
          const newX2 = el.x1 + dx * scale;
          const newY2 = el.y1 + dy * scale;
          return {
            ...el,
            x2: newX2,
            y2: newY2,
            cpx: el.x1 + cdx * scale,
            cpy: el.y1 + cdy * scale
          };
        }
      }
      
      return el;
    }));
  }, [selectedIds, elements, updateElements]);

  return {
    handleRotate,
    handleFlipHorizontal,
    handleFlipVertical,
    handleResizeElement
  };
};

