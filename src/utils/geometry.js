import { GRID_SIZE } from '../constants';

export const snapToGridFn = (point) => {
  return {
    x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(point.y / GRID_SIZE) * GRID_SIZE
  };
};

export const pointToLineSegment = (point, lineStart, lineEnd) => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return { x: xx, y: yy, distance };
};

export const pointToLineDistance = (point, lineStart, lineEnd) => {
  const result = pointToLineSegment(point, lineStart, lineEnd);
  return result.distance;
};

export const getElementSnapPoints = (el) => {
  const points = [];
  
  if (el.type === 'line') {
    points.push(
      { x: el.x1, y: el.y1 },
      { x: el.x2, y: el.y2 },
      { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2 }
    );
  } else if (el.type === 'rectangle') {
    points.push(
      { x: el.x, y: el.y },
      { x: el.x + el.width, y: el.y },
      { x: el.x, y: el.y + el.height },
      { x: el.x + el.width, y: el.y + el.height },
      { x: el.x + el.width / 2, y: el.y + el.height / 2 },
      { x: el.x + el.width / 2, y: el.y },
      { x: el.x + el.width, y: el.y + el.height / 2 },
      { x: el.x + el.width / 2, y: el.y + el.height },
      { x: el.x, y: el.y + el.height / 2 }
    );
  } else if (el.type === 'circle') {
    points.push(
      { x: el.cx, y: el.cy },
      { x: el.cx + el.radius, y: el.cy },
      { x: el.cx - el.radius, y: el.cy },
      { x: el.cx, y: el.cy + el.radius },
      { x: el.cx, y: el.cy - el.radius }
    );
  } else if (el.type === 'arc') {
    points.push(
      { x: el.cx, y: el.cy },
      { x: el.cx + el.radius * Math.cos(el.startAngle), y: el.cy + el.radius * Math.sin(el.startAngle) },
      { x: el.cx + el.radius * Math.cos(el.endAngle), y: el.cy + el.radius * Math.sin(el.endAngle) },
      { x: el.cx + el.radius * Math.cos((el.startAngle + el.endAngle) / 2), y: el.cy + el.radius * Math.sin((el.startAngle + el.endAngle) / 2) }
    );
  }
  
  return points;
};

export const isAngleBetween = (angle, start, end) => {
  const normalizeAngle = (a) => {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  };
  
  const normAngle = normalizeAngle(angle);
  const normStart = normalizeAngle(start);
  const normEnd = normalizeAngle(end);
  
  let span = normEnd - normStart;
  if (span < 0) span += 2 * Math.PI;
  
  let offset = normAngle - normStart;
  if (offset < 0) offset += 2 * Math.PI;
  
  return offset <= span;
};


