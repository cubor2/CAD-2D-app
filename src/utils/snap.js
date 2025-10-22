import { SNAP_DISTANCE, EDGE_SNAP_DISTANCE, GUIDE_SNAP_DISTANCE, GRID_SIZE } from '../constants';
import { pointToLineSegment, getElementSnapPoints, isAngleBetween } from './geometry';

/**
 * Fonction unifiée de snap - centralise toute la logique
 * @param {Object} point - Point à snapper { x, y }
 * @param {Object} options - Options de snap
 * @returns {Object} { x, y, snapInfo } où snapInfo contient { type, priority, x, y }
 */
export const computeSnap = (point, options = {}) => {
  const {
    elements = [],
    excludeIds = [],
    viewport = { zoom: 1 },
    guides = [],
    showRulers = false,
    snapToElements = true,
    snapToGrid = true,
    gridSize = GRID_SIZE
  } = options;
  
  let snappedX = point.x;
  let snappedY = point.y;
  let snapX = null;
  let snapY = null;
  
  // Priorité 1 : Guides (si activés)
  if (showRulers && guides.length > 0) {
    const guideSnapDist = GUIDE_SNAP_DISTANCE / viewport.zoom;
    
    for (const guide of guides) {
      if (guide.type === 'horizontal' && !snapY) {
        if (Math.abs(point.y - guide.position) < guideSnapDist) {
          snappedY = guide.position;
          snapY = { y: guide.position, type: 'guide', priority: 100 };
        }
      } else if (guide.type === 'vertical' && !snapX) {
        if (Math.abs(point.x - guide.position) < guideSnapDist) {
          snappedX = guide.position;
          snapX = { x: guide.position, type: 'guide', priority: 100 };
        }
      }
    }
  }
  
  // Priorité 2 : Éléments (si activés)
  if (snapToElements) {
    const elementSnap = findSnapPoints(point, elements, excludeIds, viewport);
    if (elementSnap) {
      if (!snapX) {
        snappedX = elementSnap.x;
        snapX = elementSnap;
      }
      if (!snapY) {
        snappedY = elementSnap.y;
        snapY = elementSnap;
      }
    }
  }
  
  // Priorité 3 : Grille (si activée)
  if (snapToGrid) {
    if (!snapX) {
      snappedX = Math.round(point.x / gridSize) * gridSize;
      snapX = { x: snappedX, type: 'grid', priority: 1 };
    }
    if (!snapY) {
      snappedY = Math.round(point.y / gridSize) * gridSize;
      snapY = { y: snappedY, type: 'grid', priority: 1 };
    }
  }
  
  // Combiner les snaps X et Y
  let combinedSnap = null;
  if (snapX || snapY) {
    combinedSnap = {
      x: snappedX,
      y: snappedY,
      type: snapX?.type || snapY?.type || 'combined',
      priority: Math.max(snapX?.priority || 0, snapY?.priority || 0),
      isGuide: (snapX?.type === 'guide' || snapY?.type === 'guide')
    };
  }
  
  return {
    x: snappedX,
    y: snappedY,
    snapInfo: combinedSnap
  };
};

export const findGuideSnapPosition = (guideType, currentPos, elements, viewport) => {
  const SNAP_DIST = 8 / viewport.zoom;
  let bestSnap = null;
  let minDist = SNAP_DIST;

  elements.forEach(el => {
    const positions = [];
    
    if (el.type === 'line') {
      if (guideType === 'horizontal') {
        positions.push(el.y1, el.y2, (el.y1 + el.y2) / 2);
      } else {
        positions.push(el.x1, el.x2, (el.x1 + el.x2) / 2);
      }
    } else if (el.type === 'curve') {
      if (el.cpx !== undefined && el.cpy !== undefined) {
        if (guideType === 'horizontal') {
          positions.push(el.y1, el.y2);
          for (let t = 0.25; t <= 0.75; t += 0.25) {
            const t2 = t * t;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const y = mt2 * el.y1 + 2 * mt * t * el.cpy + t2 * el.y2;
            positions.push(y);
          }
        } else {
          positions.push(el.x1, el.x2);
          for (let t = 0.25; t <= 0.75; t += 0.25) {
            const t2 = t * t;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const x = mt2 * el.x1 + 2 * mt * t * el.cpx + t2 * el.x2;
            positions.push(x);
          }
        }
      }
    } else if (el.type === 'rectangle' || el.type === 'text') {
      // Les textes se comportent comme des rectangles pour le snap
      if (guideType === 'horizontal') {
        positions.push(el.y, el.y + el.height, el.y + el.height / 2);
      } else {
        positions.push(el.x, el.x + el.width, el.x + el.width / 2);
      }
    } else if (el.type === 'circle') {
      if (guideType === 'horizontal') {
        positions.push(el.cy, el.cy + el.radius, el.cy - el.radius);
      } else {
        positions.push(el.cx, el.cx + el.radius, el.cx - el.radius);
      }
    } else if (el.type === 'arc') {
      const radiusX = el.radiusX || el.radius;
      const radiusY = el.radiusY || el.radius;
      if (guideType === 'horizontal') {
        positions.push(el.cy, el.cy + radiusY * Math.sin(el.startAngle), el.cy + radiusY * Math.sin(el.endAngle));
      } else {
        positions.push(el.cx, el.cx + radiusX * Math.cos(el.startAngle), el.cx + radiusX * Math.cos(el.endAngle));
      }
    }
    
    positions.forEach(pos => {
      const dist = Math.abs(pos - currentPos);
      if (dist < minDist) {
        minDist = dist;
        bestSnap = pos;
      }
    });
  });

  return bestSnap !== null ? bestSnap : currentPos;
};

export const findSnapPoints = (point, elements, excludeIds, viewport) => {
  const snapPoints = [];
  const snapDist = SNAP_DISTANCE / viewport.zoom;
  const edgeSnapDist = EDGE_SNAP_DISTANCE / viewport.zoom;

  elements.forEach(el => {
    if (excludeIds.includes(el.id)) return;
    
    if (el.type === 'line') {
      snapPoints.push(
        { x: el.x1, y: el.y1, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.x2, y: el.y2, type: 'endpoint', priority: 20, elementId: el.id },
        { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2, type: 'midpoint', priority: 15, elementId: el.id }
      );
      
      const lineSnap = pointToLineSegment(point, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
      if (lineSnap.distance < edgeSnapDist) {
        snapPoints.push({ x: lineSnap.x, y: lineSnap.y, type: 'edge', priority: 3, distance: lineSnap.distance, elementId: el.id });
      }
    } else if (el.type === 'curve') {
      if (el.cpx !== undefined && el.cpy !== undefined) {
        snapPoints.push(
          { x: el.x1, y: el.y1, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x2, y: el.y2, type: 'endpoint', priority: 20, elementId: el.id }
        );
        
        for (let t = 0.25; t <= 0.75; t += 0.25) {
          const t2 = t * t;
          const mt = 1 - t;
          const mt2 = mt * mt;
          const x = mt2 * el.x1 + 2 * mt * t * el.cpx + t2 * el.x2;
          const y = mt2 * el.y1 + 2 * mt * t * el.cpy + t2 * el.y2;
          snapPoints.push({ x, y, type: 'midpoint', priority: 15, elementId: el.id });
        }
        
        let minDist = Infinity;
        let closestPoint = null;
        for (let t = 0; t <= 1; t += 0.05) {
          const t2 = t * t;
          const mt = 1 - t;
          const mt2 = mt * mt;
          const x = mt2 * el.x1 + 2 * mt * t * el.cpx + t2 * el.x2;
          const y = mt2 * el.y1 + 2 * mt * t * el.cpy + t2 * el.y2;
          const dx = point.x - x;
          const dy = point.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            closestPoint = { x, y };
          }
        }
        if (minDist < edgeSnapDist) {
          snapPoints.push({ x: closestPoint.x, y: closestPoint.y, type: 'edge', priority: 3, distance: minDist, elementId: el.id });
        }
      }
    } else if (el.type === 'rectangle' || el.type === 'text') {
      // Les textes se comportent comme des rectangles pour le snap
      snapPoints.push(
        { x: el.x, y: el.y, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.x + el.width, y: el.y, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.x, y: el.y + el.height, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.x + el.width, y: el.y + el.height, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.x + el.width / 2, y: el.y + el.height / 2, type: 'center', priority: 18, elementId: el.id },
        { x: el.x + el.width / 2, y: el.y, type: 'midpoint', priority: 15, elementId: el.id },
        { x: el.x + el.width, y: el.y + el.height / 2, type: 'midpoint', priority: 15, elementId: el.id },
        { x: el.x + el.width / 2, y: el.y + el.height, type: 'midpoint', priority: 15, elementId: el.id },
        { x: el.x, y: el.y + el.height / 2, type: 'midpoint', priority: 15, elementId: el.id }
      );
      
      const edges = [
        [{ x: el.x, y: el.y }, { x: el.x + el.width, y: el.y }],
        [{ x: el.x + el.width, y: el.y }, { x: el.x + el.width, y: el.y + el.height }],
        [{ x: el.x + el.width, y: el.y + el.height }, { x: el.x, y: el.y + el.height }],
        [{ x: el.x, y: el.y + el.height }, { x: el.x, y: el.y }]
      ];
      
      edges.forEach(edge => {
        const edgeSnap = pointToLineSegment(point, edge[0], edge[1]);
        if (edgeSnap.distance < edgeSnapDist) {
          snapPoints.push({ x: edgeSnap.x, y: edgeSnap.y, type: 'edge', priority: 3, distance: edgeSnap.distance, elementId: el.id });
        }
      });
    } else if (el.type === 'circle') {
      const radiusX = el.radiusX || el.radius;
      const radiusY = el.radiusY || el.radius;
      
      snapPoints.push(
        { x: el.cx, y: el.cy, type: 'center', priority: 18, elementId: el.id },
        { x: el.cx + radiusX, y: el.cy, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.cx - radiusX, y: el.cy, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.cx, y: el.cy + radiusY, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.cx, y: el.cy - radiusY, type: 'endpoint', priority: 20, elementId: el.id }
      );
      
      // Snap sur le bord du cercle/ellipse
      const dx = point.x - el.cx;
      const dy = point.y - el.cy;
      const angleToPoint = Math.atan2(dy, dx);
      
      // Calcul de la distance à l'ellipse
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      const cosAngle = Math.cos(angleToPoint);
      const sinAngle = Math.sin(angleToPoint);
      const radiusAtAngle = (radiusX * radiusY) / Math.sqrt((radiusY * cosAngle) ** 2 + (radiusX * sinAngle) ** 2);
      const distToEllipse = Math.abs(distToCenter - radiusAtAngle);
      
      if (distToEllipse < edgeSnapDist) {
        const projX = el.cx + radiusAtAngle * cosAngle;
        const projY = el.cy + radiusAtAngle * sinAngle;
        snapPoints.push({ x: projX, y: projY, type: 'edge', priority: 3, distance: distToEllipse, elementId: el.id });
      }
    } else if (el.type === 'arc') {
      const radiusX = el.radiusX || el.radius;
      const radiusY = el.radiusY || el.radius;
      
      // Calcul des endpoints avec support ellipse
      const startCos = Math.cos(el.startAngle);
      const startSin = Math.sin(el.startAngle);
      const endCos = Math.cos(el.endAngle);
      const endSin = Math.sin(el.endAngle);
      
      snapPoints.push(
        { x: el.cx + radiusX * startCos, y: el.cy + radiusY * startSin, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.cx + radiusX * endCos, y: el.cy + radiusY * endSin, type: 'endpoint', priority: 20, elementId: el.id }
      );
      
      snapPoints.push(
        { x: el.cx, y: el.cy, type: 'center', priority: 18, elementId: el.id }
      );
      
      // Point milieu avec support ellipse
      const midAngle = (el.startAngle + el.endAngle) / 2;
      const midCos = Math.cos(midAngle);
      const midSin = Math.sin(midAngle);
      snapPoints.push(
        { x: el.cx + radiusX * midCos, y: el.cy + radiusY * midSin, type: 'midpoint', priority: 15, elementId: el.id }
      );
      
      // Snap sur le bord de l'arc avec support ellipse
      const dx = point.x - el.cx;
      const dy = point.y - el.cy;
      const angleToPoint = Math.atan2(dy, dx);
      
      if (isAngleBetween(angleToPoint, el.startAngle, el.endAngle)) {
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        const cosAngle = Math.cos(angleToPoint);
        const sinAngle = Math.sin(angleToPoint);
        const radiusAtAngle = (radiusX * radiusY) / Math.sqrt((radiusY * cosAngle) ** 2 + (radiusX * sinAngle) ** 2);
        const distToArc = Math.abs(distToCenter - radiusAtAngle);
        
        if (distToArc < edgeSnapDist) {
          const projX = el.cx + radiusAtAngle * cosAngle;
          const projY = el.cy + radiusAtAngle * sinAngle;
          snapPoints.push({ x: projX, y: projY, type: 'edge', priority: 3, distance: distToArc, elementId: el.id });
        }
      }
    }
  });

  let closest = null;
  let minScore = Infinity;

  snapPoints.forEach(sp => {
    const dist = sp.distance !== undefined ? sp.distance : Math.sqrt((sp.x - point.x) ** 2 + (sp.y - point.y) ** 2);
    const maxDist = sp.type === 'edge' ? edgeSnapDist : snapDist;
    
    if (dist < maxDist) {
      const score = dist / sp.priority;
      if (score < minScore) {
        minScore = score;
        closest = sp;
      }
    }
  });

  return closest;
};

export const applyMultiPointSnap = (elements, selectedIds, dx, dy, snapToElements, showRulers, guides, viewport, snapToGrid = true, gridSize = 1, draggedControlPoint = null) => {
  const snapDist = SNAP_DISTANCE / viewport.zoom;
  let bestOffsetX = dx;
  let bestOffsetY = dy;
  let foundSnapX = false;
  let foundSnapY = false;
  let snapInfoX = null;
  let snapInfoY = null;
  let snapPointX = null;
  let snapPointY = null;

  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  
  // Si on a un point de référence spécifique (celui saisi au clic), utiliser UNIQUEMENT ce point
  // Sinon, utiliser tous les points de l'élément (ancien comportement)
  const pointsToTest = draggedControlPoint ? [draggedControlPoint] : [];
  
  if (pointsToTest.length === 0 && selectedElements.length > 0) {
    // Pas de point spécifique : utiliser tous les points du premier élément (ancien comportement)
    pointsToTest.push(...getElementSnapPoints(selectedElements[0]));
  }
  
  for (const point of pointsToTest) {
    const movedPoint = { x: point.x + dx, y: point.y + dy };
    
    if (showRulers && guides.length > 0) {
      for (const guide of guides) {
        if (guide.type === 'horizontal' && !foundSnapY) {
          if (Math.abs(movedPoint.y - guide.position) < snapDist) {
            bestOffsetY = guide.position - point.y;
            foundSnapY = true;
            snapInfoY = { type: 'guide', priority: 100 };
            snapPointY = guide.position;
          }
        } else if (guide.type === 'vertical' && !foundSnapX) {
          if (Math.abs(movedPoint.x - guide.position) < snapDist) {
            bestOffsetX = guide.position - point.x;
            foundSnapX = true;
            snapInfoX = { type: 'guide', priority: 100 };
            snapPointX = guide.position;
          }
        }
      }
    }
    
    if (snapToElements && (!foundSnapX || !foundSnapY)) {
      const snap = findSnapPoints(movedPoint, elements, selectedIds, viewport);
      if (snap) {
        if (!foundSnapX) {
          bestOffsetX = snap.x - point.x;
          foundSnapX = true;
          snapInfoX = snap;
          snapPointX = snap.x;
        }
        if (!foundSnapY) {
          bestOffsetY = snap.y - point.y;
          foundSnapY = true;
          snapInfoY = snap;
          snapPointY = snap.y;
        }
      }
    }
    
    if (foundSnapX && foundSnapY) break;
  }

  let referencePoint = null;
  
  // Utiliser le control point saisi comme référence, sinon utiliser le premier point
  if (draggedControlPoint) {
    referencePoint = draggedControlPoint;
  } else if (selectedElements.length > 0) {
    const points = getElementSnapPoints(selectedElements[0]);
    if (points && points.length > 0) {
      referencePoint = points[0];
    }
  }

  if (snapToGrid && referencePoint) {
    if (!foundSnapX) {
      const finalX = referencePoint.x + bestOffsetX;
      const snappedX = Math.round(finalX / gridSize) * gridSize;
      bestOffsetX = snappedX - referencePoint.x;
      snapInfoX = { type: 'grid', priority: 1 };
      snapPointX = snappedX;
    }
    if (!foundSnapY) {
      const finalY = referencePoint.y + bestOffsetY;
      const snappedY = Math.round(finalY / gridSize) * gridSize;
      bestOffsetY = snappedY - referencePoint.y;
      snapInfoY = { type: 'grid', priority: 1 };
      snapPointY = snappedY;
    }
  }

  let combinedSnapInfo = null;
  if (snapInfoX || snapInfoY) {
    let finalX = 0;
    let finalY = 0;
    
    if (referencePoint) {
      finalX = snapPointX !== null ? snapPointX : (referencePoint.x + bestOffsetX);
      finalY = snapPointY !== null ? snapPointY : (referencePoint.y + bestOffsetY);
    }
    
    const priorityX = snapInfoX?.priority || 0;
    const priorityY = snapInfoY?.priority || 0;
    const highestPrioritySnap = priorityX >= priorityY ? snapInfoX : snapInfoY;
    
    combinedSnapInfo = {
      x: finalX,
      y: finalY,
      type: highestPrioritySnap?.type || 'combined',
      priority: Math.max(priorityX, priorityY)
    };
  }

  return { dx: bestOffsetX, dy: bestOffsetY, snapInfo: combinedSnapInfo };
};


