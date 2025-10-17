import { SNAP_DISTANCE, EDGE_SNAP_DISTANCE, GUIDE_SNAP_DISTANCE } from '../constants';
import { pointToLineSegment, getElementSnapPoints } from './geometry';

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
    } else if (el.type === 'rectangle') {
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
      if (guideType === 'horizontal') {
        positions.push(el.cy, el.cy + el.radius * Math.sin(el.startAngle), el.cy + el.radius * Math.sin(el.endAngle));
      } else {
        positions.push(el.cx, el.cx + el.radius * Math.cos(el.startAngle), el.cx + el.radius * Math.cos(el.endAngle));
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
    } else if (el.type === 'rectangle') {
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
      snapPoints.push(
        { x: el.cx, y: el.cy, type: 'center', priority: 18, elementId: el.id },
        { x: el.cx + el.radius, y: el.cy, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.cx - el.radius, y: el.cy, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.cx, y: el.cy + el.radius, type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.cx, y: el.cy - el.radius, type: 'endpoint', priority: 20, elementId: el.id }
      );
    } else if (el.type === 'arc') {
      snapPoints.push(
        { x: el.cx + el.radius * Math.cos(el.startAngle), y: el.cy + el.radius * Math.sin(el.startAngle), type: 'endpoint', priority: 20, elementId: el.id },
        { x: el.cx + el.radius * Math.cos(el.endAngle), y: el.cy + el.radius * Math.sin(el.endAngle), type: 'endpoint', priority: 20, elementId: el.id }
      );
      
      snapPoints.push(
        { x: el.cx, y: el.cy, type: 'center', priority: 18, elementId: el.id }
      );
      
      const midAngle = (el.startAngle + el.endAngle) / 2;
      snapPoints.push(
        { x: el.cx + el.radius * Math.cos(midAngle), y: el.cy + el.radius * Math.sin(midAngle), type: 'midpoint', priority: 15, elementId: el.id }
      );
      
      const dx = point.x - el.cx;
      const dy = point.y - el.cy;
      const angleToPoint = Math.atan2(dy, dx);
      
      let normAngle = angleToPoint < 0 ? angleToPoint + Math.PI * 2 : angleToPoint;
      let normStart = el.startAngle < 0 ? el.startAngle + Math.PI * 2 : el.startAngle;
      let normEnd = el.endAngle < 0 ? el.endAngle + Math.PI * 2 : el.endAngle;
      
      if (normStart > normEnd) {
        normEnd += Math.PI * 2;
      }
      
      if (normAngle < normStart) {
        normAngle += Math.PI * 2;
      }
      
      if (normAngle >= normStart && normAngle <= normEnd) {
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        const distToArc = Math.abs(distToCenter - el.radius);
        
        if (distToArc < edgeSnapDist) {
          const projX = el.cx + el.radius * Math.cos(angleToPoint);
          const projY = el.cy + el.radius * Math.sin(angleToPoint);
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

export const applyMultiPointSnap = (elements, selectedIds, dx, dy, snapToElements, showRulers, guides, viewport) => {
  const snapDist = SNAP_DISTANCE / viewport.zoom;
  let bestOffsetX = dx;
  let bestOffsetY = dy;
  let foundSnapX = false;
  let foundSnapY = false;

  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  
  for (const selectedEl of selectedElements) {
    const snapPoints = getElementSnapPoints(selectedEl);
    
    for (const point of snapPoints) {
      const movedPoint = { x: point.x + dx, y: point.y + dy };
      
      if (showRulers && guides.length > 0) {
        for (const guide of guides) {
          if (guide.type === 'horizontal' && !foundSnapY) {
            if (Math.abs(movedPoint.y - guide.position) < snapDist) {
              bestOffsetY = guide.position - point.y;
              foundSnapY = true;
            }
          } else if (guide.type === 'vertical' && !foundSnapX) {
            if (Math.abs(movedPoint.x - guide.position) < snapDist) {
              bestOffsetX = guide.position - point.x;
              foundSnapX = true;
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
          }
          if (!foundSnapY) {
            bestOffsetY = snap.y - point.y;
            foundSnapY = true;
          }
        }
      }
      
      if (foundSnapX && foundSnapY) break;
    }
    
    if (foundSnapX && foundSnapY) break;
  }

  return { dx: bestOffsetX, dy: bestOffsetY };
};


