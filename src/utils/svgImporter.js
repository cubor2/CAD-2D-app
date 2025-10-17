const parseTransform = (transformStr) => {
  if (!transformStr) return { translate: { x: 0, y: 0 }, rotate: 0, scale: { x: 1, y: 1 }, matrix: null };

  const result = {
    translate: { x: 0, y: 0 },
    rotate: 0,
    scale: { x: 1, y: 1 },
    matrix: null
  };

  const translateMatch = transformStr.match(/translate\(([^)]+)\)/);
  if (translateMatch) {
    const values = translateMatch[1].split(/[\s,]+/).map(Number);
    result.translate.x = values[0] || 0;
    result.translate.y = values[1] || 0;
  }

  const rotateMatch = transformStr.match(/rotate\(([^)]+)\)/);
  if (rotateMatch) {
    const values = rotateMatch[1].split(/[\s,]+/).map(Number);
    result.rotate = (values[0] || 0) * (Math.PI / 180);
  }

  const scaleMatch = transformStr.match(/scale\(([^)]+)\)/);
  if (scaleMatch) {
    const values = scaleMatch[1].split(/[\s,]+/).map(Number);
    result.scale.x = values[0] || 1;
    result.scale.y = values[1] !== undefined ? values[1] : values[0] || 1;
  }

  const matrixMatch = transformStr.match(/matrix\(([^)]+)\)/);
  if (matrixMatch) {
    const values = matrixMatch[1].split(/[\s,]+/).map(Number);
    if (values.length === 6) {
      result.matrix = values;
    }
  }

  return result;
};

const applyTransform = (x, y, transform) => {
  let newX = x;
  let newY = y;

  if (transform.matrix) {
    const [a, b, c, d, e, f] = transform.matrix;
    newX = a * x + c * y + e;
    newY = b * x + d * y + f;
    return { x: newX, y: newY };
  }

  newX *= transform.scale.x;
  newY *= transform.scale.y;

  if (transform.rotate !== 0) {
    const cos = Math.cos(transform.rotate);
    const sin = Math.sin(transform.rotate);
    const rotatedX = newX * cos - newY * sin;
    const rotatedY = newX * sin + newY * cos;
    newX = rotatedX;
    newY = rotatedY;
  }

  newX += transform.translate.x;
  newY += transform.translate.y;

  return { x: newX, y: newY };
};

const parsePathData = (pathData) => {
  const commands = [];
  const regex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
  let match;

  while ((match = regex.exec(pathData)) !== null) {
    const command = match[1];
    const params = match[2].trim().split(/[\s,]+/).filter(p => p).map(Number);
    commands.push({ command, params });
  }

  return commands;
};

const subdivideCubicBezier = (p0, p1, p2, p3, segments = 8) => {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
    const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
    
    points.push({ x, y });
  }
  return points;
};

const subdivideQuadraticBezier = (p0, p1, p2, segments = 6) => {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    
    const x = mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x;
    const y = mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y;
    
    points.push({ x, y });
  }
  return points;
};

const subdivideEllipticalArc = (x1, y1, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x2, y2, segments = 12) => {
  if (rx === 0 || ry === 0) {
    return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
  }

  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const xRot = (xAxisRotation * Math.PI) / 180;
  const cos = Math.cos(xRot);
  const sin = Math.sin(xRot);

  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1Prime = cos * dx + sin * dy;
  const y1Prime = -sin * dx + cos * dy;

  let rxSq = rx * rx;
  let rySq = ry * ry;
  const x1PrimeSq = x1Prime * x1Prime;
  const y1PrimeSq = y1Prime * y1Prime;

  let lambda = x1PrimeSq / rxSq + y1PrimeSq / rySq;
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
    rxSq = rx * rx;
    rySq = ry * ry;
  }

  const sign = largeArcFlag !== sweepFlag ? 1 : -1;
  const sq = Math.max(0, (rxSq * rySq - rxSq * y1PrimeSq - rySq * x1PrimeSq) / (rxSq * y1PrimeSq + rySq * x1PrimeSq));
  const coef = sign * Math.sqrt(sq);
  const cxPrime = coef * ((rx * y1Prime) / ry);
  const cyPrime = coef * (-(ry * x1Prime) / rx);

  const cx = cos * cxPrime - sin * cyPrime + (x1 + x2) / 2;
  const cy = sin * cxPrime + cos * cyPrime + (y1 + y2) / 2;

  const theta1 = Math.atan2((y1Prime - cyPrime) / ry, (x1Prime - cxPrime) / rx);
  const dTheta = Math.atan2((-y1Prime - cyPrime) / ry, (-x1Prime - cxPrime) / rx) - theta1;

  let angleDelta = dTheta;
  if (sweepFlag && dTheta < 0) {
    angleDelta = dTheta + 2 * Math.PI;
  } else if (!sweepFlag && dTheta > 0) {
    angleDelta = dTheta - 2 * Math.PI;
  }

  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = theta1 + t * angleDelta;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    
    const x = cos * rx * cosAngle - sin * ry * sinAngle + cx;
    const y = sin * rx * cosAngle + cos * ry * sinAngle + cy;
    
    points.push({ x, y });
  }

  return points;
};

const pathToElements = (pathData, transform, nextId, stroke = '#2B2B2B', strokeWidth = 1.5) => {
  const elements = [];
  const commands = parsePathData(pathData);
  
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  let lastCommand = '';

  commands.forEach(({ command, params }) => {
    switch (command) {
      case 'M': {
        const point = applyTransform(params[0], params[1], transform);
        currentX = point.x;
        currentY = point.y;
        startX = currentX;
        startY = currentY;
        break;
      }
      case 'm': {
        const point = applyTransform(currentX + params[0], currentY + params[1], transform);
        currentX = point.x;
        currentY = point.y;
        startX = currentX;
        startY = currentY;
        break;
      }
      case 'L': {
        const point = applyTransform(params[0], params[1], transform);
        elements.push({
          id: nextId(),
          type: 'line',
          x1: currentX,
          y1: currentY,
          x2: point.x,
          y2: point.y,
          stroke,
          strokeWidth
        });
        currentX = point.x;
        currentY = point.y;
        break;
      }
      case 'l': {
        const point = applyTransform(currentX + params[0], currentY + params[1], transform);
        elements.push({
          id: nextId(),
          type: 'line',
          x1: currentX,
          y1: currentY,
          x2: point.x,
          y2: point.y,
          stroke,
          strokeWidth
        });
        currentX = point.x;
        currentY = point.y;
        break;
      }
      case 'H': {
        const point = applyTransform(params[0], currentY, transform);
        elements.push({
          id: nextId(),
          type: 'line',
          x1: currentX,
          y1: currentY,
          x2: point.x,
          y2: point.y,
          stroke,
          strokeWidth
        });
        currentX = point.x;
        break;
      }
      case 'h': {
        const point = applyTransform(currentX + params[0], currentY, transform);
        elements.push({
          id: nextId(),
          type: 'line',
          x1: currentX,
          y1: currentY,
          x2: point.x,
          y2: point.y,
          stroke,
          strokeWidth
        });
        currentX = point.x;
        break;
      }
      case 'V': {
        const point = applyTransform(currentX, params[0], transform);
        elements.push({
          id: nextId(),
          type: 'line',
          x1: currentX,
          y1: currentY,
          x2: point.x,
          y2: point.y,
          stroke,
          strokeWidth
        });
        currentY = point.y;
        break;
      }
      case 'v': {
        const point = applyTransform(currentX, currentY + params[0], transform);
        elements.push({
          id: nextId(),
          type: 'line',
          x1: currentX,
          y1: currentY,
          x2: point.x,
          y2: point.y,
          stroke,
          strokeWidth
        });
        currentY = point.y;
        break;
      }
      case 'Z':
      case 'z': {
        if (currentX !== startX || currentY !== startY) {
          elements.push({
            id: nextId(),
            type: 'line',
            x1: currentX,
            y1: currentY,
            x2: startX,
            y2: startY,
            stroke,
            strokeWidth
          });
        }
        currentX = startX;
        currentY = startY;
        break;
      }
      case 'C': {
        const p0 = { x: currentX, y: currentY };
        const cp1 = { x: params[0], y: params[1] };
        const cp2 = { x: params[2], y: params[3] };
        const p3 = { x: params[4], y: params[5] };
        
        const bezierPoints = subdivideCubicBezier(p0, cp1, cp2, p3, 10);
        for (let i = 0; i < bezierPoints.length - 1; i++) {
          const start = applyTransform(bezierPoints[i].x, bezierPoints[i].y, transform);
          const end = applyTransform(bezierPoints[i + 1].x, bezierPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        lastControlX = params[2];
        lastControlY = params[3];
        currentX = params[4];
        currentY = params[5];
        break;
      }
      case 'c': {
        const p0 = { x: currentX, y: currentY };
        const cp1 = { x: currentX + params[0], y: currentY + params[1] };
        const cp2 = { x: currentX + params[2], y: currentY + params[3] };
        const p3 = { x: currentX + params[4], y: currentY + params[5] };
        
        const bezierPoints = subdivideCubicBezier(p0, cp1, cp2, p3, 10);
        for (let i = 0; i < bezierPoints.length - 1; i++) {
          const start = applyTransform(bezierPoints[i].x, bezierPoints[i].y, transform);
          const end = applyTransform(bezierPoints[i + 1].x, bezierPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        lastControlX = currentX + params[2];
        lastControlY = currentY + params[3];
        currentX += params[4];
        currentY += params[5];
        break;
      }
      case 'Q': {
        const p0 = { x: currentX, y: currentY };
        const cp = { x: params[0], y: params[1] };
        const p2 = { x: params[2], y: params[3] };
        
        const bezierPoints = subdivideQuadraticBezier(p0, cp, p2, 8);
        for (let i = 0; i < bezierPoints.length - 1; i++) {
          const start = applyTransform(bezierPoints[i].x, bezierPoints[i].y, transform);
          const end = applyTransform(bezierPoints[i + 1].x, bezierPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        lastControlX = params[0];
        lastControlY = params[1];
        currentX = params[2];
        currentY = params[3];
        break;
      }
      case 'q': {
        const p0 = { x: currentX, y: currentY };
        const cp = { x: currentX + params[0], y: currentY + params[1] };
        const p2 = { x: currentX + params[2], y: currentY + params[3] };
        
        const bezierPoints = subdivideQuadraticBezier(p0, cp, p2, 8);
        for (let i = 0; i < bezierPoints.length - 1; i++) {
          const start = applyTransform(bezierPoints[i].x, bezierPoints[i].y, transform);
          const end = applyTransform(bezierPoints[i + 1].x, bezierPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        lastControlX = currentX + params[0];
        lastControlY = currentY + params[1];
        currentX += params[2];
        currentY += params[3];
        break;
      }
      case 'S': {
        const p0 = { x: currentX, y: currentY };
        const cp1 = (lastCommand === 'C' || lastCommand === 'c' || lastCommand === 'S' || lastCommand === 's')
          ? { x: 2 * currentX - lastControlX, y: 2 * currentY - lastControlY }
          : { x: currentX, y: currentY };
        const cp2 = { x: params[0], y: params[1] };
        const p3 = { x: params[2], y: params[3] };
        
        const bezierPoints = subdivideCubicBezier(p0, cp1, cp2, p3, 10);
        for (let i = 0; i < bezierPoints.length - 1; i++) {
          const start = applyTransform(bezierPoints[i].x, bezierPoints[i].y, transform);
          const end = applyTransform(bezierPoints[i + 1].x, bezierPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        lastControlX = params[0];
        lastControlY = params[1];
        currentX = params[2];
        currentY = params[3];
        break;
      }
      case 's': {
        const p0 = { x: currentX, y: currentY };
        const cp1 = (lastCommand === 'C' || lastCommand === 'c' || lastCommand === 'S' || lastCommand === 's')
          ? { x: 2 * currentX - lastControlX, y: 2 * currentY - lastControlY }
          : { x: currentX, y: currentY };
        const cp2 = { x: currentX + params[0], y: currentY + params[1] };
        const p3 = { x: currentX + params[2], y: currentY + params[3] };
        
        const bezierPoints = subdivideCubicBezier(p0, cp1, cp2, p3, 10);
        for (let i = 0; i < bezierPoints.length - 1; i++) {
          const start = applyTransform(bezierPoints[i].x, bezierPoints[i].y, transform);
          const end = applyTransform(bezierPoints[i + 1].x, bezierPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        lastControlX = currentX + params[0];
        lastControlY = currentY + params[1];
        currentX += params[2];
        currentY += params[3];
        break;
      }
      case 'T': {
        const p0 = { x: currentX, y: currentY };
        const cp = (lastCommand === 'Q' || lastCommand === 'q' || lastCommand === 'T' || lastCommand === 't')
          ? { x: 2 * currentX - lastControlX, y: 2 * currentY - lastControlY }
          : { x: currentX, y: currentY };
        const p2 = { x: params[0], y: params[1] };
        
        const bezierPoints = subdivideQuadraticBezier(p0, cp, p2, 8);
        for (let i = 0; i < bezierPoints.length - 1; i++) {
          const start = applyTransform(bezierPoints[i].x, bezierPoints[i].y, transform);
          const end = applyTransform(bezierPoints[i + 1].x, bezierPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        lastControlX = cp.x;
        lastControlY = cp.y;
        currentX = params[0];
        currentY = params[1];
        break;
      }
      case 't': {
        const p0 = { x: currentX, y: currentY };
        const cp = (lastCommand === 'Q' || lastCommand === 'q' || lastCommand === 'T' || lastCommand === 't')
          ? { x: 2 * currentX - lastControlX, y: 2 * currentY - lastControlY }
          : { x: currentX, y: currentY };
        const p2 = { x: currentX + params[0], y: currentY + params[1] };
        
        const bezierPoints = subdivideQuadraticBezier(p0, cp, p2, 8);
        for (let i = 0; i < bezierPoints.length - 1; i++) {
          const start = applyTransform(bezierPoints[i].x, bezierPoints[i].y, transform);
          const end = applyTransform(bezierPoints[i + 1].x, bezierPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        lastControlX = cp.x;
        lastControlY = cp.y;
        currentX += params[0];
        currentY += params[1];
        break;
      }
      case 'A': {
        const rx = params[0];
        const ry = params[1];
        const xAxisRotation = params[2];
        const largeArcFlag = params[3];
        const sweepFlag = params[4];
        const endX = params[5];
        const endY = params[6];
        
        const arcPoints = subdivideEllipticalArc(
          currentX, currentY,
          rx, ry,
          xAxisRotation,
          largeArcFlag,
          sweepFlag,
          endX, endY
        );
        
        for (let i = 0; i < arcPoints.length - 1; i++) {
          const start = applyTransform(arcPoints[i].x, arcPoints[i].y, transform);
          const end = applyTransform(arcPoints[i + 1].x, arcPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        currentX = endX;
        currentY = endY;
        break;
      }
      case 'a': {
        const rx = params[0];
        const ry = params[1];
        const xAxisRotation = params[2];
        const largeArcFlag = params[3];
        const sweepFlag = params[4];
        const endX = currentX + params[5];
        const endY = currentY + params[6];
        
        const arcPoints = subdivideEllipticalArc(
          currentX, currentY,
          rx, ry,
          xAxisRotation,
          largeArcFlag,
          sweepFlag,
          endX, endY
        );
        
        for (let i = 0; i < arcPoints.length - 1; i++) {
          const start = applyTransform(arcPoints[i].x, arcPoints[i].y, transform);
          const end = applyTransform(arcPoints[i + 1].x, arcPoints[i + 1].y, transform);
          elements.push({
            id: nextId(),
            type: 'line',
            x1: start.x,
            y1: start.y,
            x2: end.x,
            y2: end.y,
            stroke,
            strokeWidth
          });
        }
        currentX = endX;
        currentY = endY;
        break;
      }
    }
    lastCommand = command;
  });

  return elements;
};

const parseElement = (element, parentTransform, nextId) => {
  const elements = [];
  const transformStr = element.getAttribute('transform');
  const currentTransform = parseTransform(transformStr);

  const combinedTransform = {
    translate: {
      x: parentTransform.translate.x + currentTransform.translate.x,
      y: parentTransform.translate.y + currentTransform.translate.y
    },
    rotate: parentTransform.rotate + currentTransform.rotate,
    scale: {
      x: parentTransform.scale.x * currentTransform.scale.x,
      y: parentTransform.scale.y * currentTransform.scale.y
    },
    matrix: currentTransform.matrix || parentTransform.matrix
  };

  const stroke = element.getAttribute('stroke') || '#2B2B2B';
  const strokeWidth = parseFloat(element.getAttribute('stroke-width')) || 1.5;

  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    case 'line': {
      const x1 = parseFloat(element.getAttribute('x1')) || 0;
      const y1 = parseFloat(element.getAttribute('y1')) || 0;
      const x2 = parseFloat(element.getAttribute('x2')) || 0;
      const y2 = parseFloat(element.getAttribute('y2')) || 0;
      const p1 = applyTransform(x1, y1, combinedTransform);
      const p2 = applyTransform(x2, y2, combinedTransform);
      elements.push({
        id: nextId(),
        type: 'line',
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        stroke,
        strokeWidth
      });
      break;
    }
    case 'rect': {
      const x = parseFloat(element.getAttribute('x')) || 0;
      const y = parseFloat(element.getAttribute('y')) || 0;
      const width = parseFloat(element.getAttribute('width')) || 0;
      const height = parseFloat(element.getAttribute('height')) || 0;
      const topLeft = applyTransform(x, y, combinedTransform);
      const bottomRight = applyTransform(x + width, y + height, combinedTransform);
      elements.push({
        id: nextId(),
        type: 'rectangle',
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
        stroke,
        strokeWidth
      });
      break;
    }
    case 'circle': {
      const cx = parseFloat(element.getAttribute('cx')) || 0;
      const cy = parseFloat(element.getAttribute('cy')) || 0;
      const r = parseFloat(element.getAttribute('r')) || 0;
      const center = applyTransform(cx, cy, combinedTransform);
      elements.push({
        id: nextId(),
        type: 'circle',
        cx: center.x,
        cy: center.y,
        radius: r * combinedTransform.scale.x,
        radiusX: r * combinedTransform.scale.x,
        radiusY: r * combinedTransform.scale.y,
        stroke,
        strokeWidth
      });
      break;
    }
    case 'ellipse': {
      const cx = parseFloat(element.getAttribute('cx')) || 0;
      const cy = parseFloat(element.getAttribute('cy')) || 0;
      const rx = parseFloat(element.getAttribute('rx')) || 0;
      const ry = parseFloat(element.getAttribute('ry')) || 0;
      const center = applyTransform(cx, cy, combinedTransform);
      elements.push({
        id: nextId(),
        type: 'circle',
        cx: center.x,
        cy: center.y,
        radius: rx * combinedTransform.scale.x,
        radiusX: rx * combinedTransform.scale.x,
        radiusY: ry * combinedTransform.scale.y,
        stroke,
        strokeWidth
      });
      break;
    }
    case 'path': {
      const d = element.getAttribute('d');
      if (d) {
        const pathElements = pathToElements(d, combinedTransform, nextId, stroke, strokeWidth);
        elements.push(...pathElements);
      }
      break;
    }
    case 'text': {
      const x = parseFloat(element.getAttribute('x')) || 0;
      const y = parseFloat(element.getAttribute('y')) || 0;
      const textContent = element.textContent || 'Text';
      const fontSize = parseFloat(element.getAttribute('font-size')) || 16;
      const fontFamily = element.getAttribute('font-family') || 'Arial';
      const fontWeight = element.getAttribute('font-weight') || 'normal';
      const fontStyle = element.getAttribute('font-style') || 'normal';
      const fill = element.getAttribute('fill') || '#000000';
      const position = applyTransform(x, y, combinedTransform);
      elements.push({
        id: nextId(),
        type: 'text',
        x: position.x,
        y: position.y,
        text: textContent,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        fill
      });
      break;
    }
    case 'g': {
      Array.from(element.children).forEach(child => {
        elements.push(...parseElement(child, combinedTransform, nextId));
      });
      break;
    }
    case 'polyline':
    case 'polygon': {
      const pointsStr = element.getAttribute('points') || '';
      const points = pointsStr.trim().split(/[\s,]+/).map(Number);
      
      for (let i = 0; i < points.length - 2; i += 2) {
        const p1 = applyTransform(points[i], points[i + 1], combinedTransform);
        const p2 = applyTransform(points[i + 2], points[i + 3], combinedTransform);
        elements.push({
          id: nextId(),
          type: 'line',
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          stroke,
          strokeWidth
        });
      }
      
      if (tagName === 'polygon' && points.length >= 4) {
        const first = applyTransform(points[0], points[1], combinedTransform);
        const last = applyTransform(points[points.length - 2], points[points.length - 1], combinedTransform);
        elements.push({
          id: nextId(),
          type: 'line',
          x1: last.x,
          y1: last.y,
          x2: first.x,
          y2: first.y,
          stroke,
          strokeWidth
        });
      }
      break;
    }
  }

  return elements;
};

const calculateBoundingBox = (elements) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(el => {
    if (el.type === 'line') {
      minX = Math.min(minX, el.x1, el.x2);
      minY = Math.min(minY, el.y1, el.y2);
      maxX = Math.max(maxX, el.x1, el.x2);
      maxY = Math.max(maxY, el.y1, el.y2);
    } else if (el.type === 'rectangle') {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    } else if (el.type === 'circle') {
      const rx = el.radiusX || el.radius;
      const ry = el.radiusY || el.radius;
      minX = Math.min(minX, el.cx - rx);
      minY = Math.min(minY, el.cy - ry);
      maxX = Math.max(maxX, el.cx + rx);
      maxY = Math.max(maxY, el.cy + ry);
    } else if (el.type === 'arc') {
      minX = Math.min(minX, el.cx - el.radius);
      minY = Math.min(minY, el.cy - el.radius);
      maxX = Math.max(maxX, el.cx + el.radius);
      maxY = Math.max(maxY, el.cy + el.radius);
    } else if (el.type === 'text') {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y - el.fontSize);
      maxX = Math.max(maxX, el.x + el.fontSize * 5);
      maxY = Math.max(maxY, el.y);
    }
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

const scaleAndCenterElements = (elements, workAreaWidth = 300, workAreaHeight = 300) => {
  if (elements.length === 0) return elements;

  const bbox = calculateBoundingBox(elements);
  
  const margin = 30;
  const maxWidth = workAreaWidth - margin * 2;
  const maxHeight = workAreaHeight - margin * 2;
  
  const scaleX = maxWidth / bbox.width;
  const scaleY = maxHeight / bbox.height;
  const scale = Math.min(scaleX, scaleY, 1);
  
  const centerX = (bbox.x + bbox.width / 2) * scale;
  const centerY = (bbox.y + bbox.height / 2) * scale;
  
  const offsetX = -centerX;
  const offsetY = -centerY;

  return elements.map(el => {
    if (el.type === 'line') {
      return {
        ...el,
        x1: el.x1 * scale + offsetX,
        y1: el.y1 * scale + offsetY,
        x2: el.x2 * scale + offsetX,
        y2: el.y2 * scale + offsetY,
        strokeWidth: el.strokeWidth * scale
      };
    } else if (el.type === 'rectangle') {
      return {
        ...el,
        x: el.x * scale + offsetX,
        y: el.y * scale + offsetY,
        width: el.width * scale,
        height: el.height * scale,
        strokeWidth: el.strokeWidth * scale
      };
    } else if (el.type === 'circle') {
      return {
        ...el,
        cx: el.cx * scale + offsetX,
        cy: el.cy * scale + offsetY,
        radius: (el.radius || el.radiusX) * scale,
        radiusX: (el.radiusX || el.radius) * scale,
        radiusY: (el.radiusY || el.radius) * scale,
        strokeWidth: el.strokeWidth * scale
      };
    } else if (el.type === 'arc') {
      return {
        ...el,
        cx: el.cx * scale + offsetX,
        cy: el.cy * scale + offsetY,
        radius: el.radius * scale,
        strokeWidth: el.strokeWidth * scale
      };
    } else if (el.type === 'text') {
      return {
        ...el,
        x: el.x * scale + offsetX,
        y: el.y * scale + offsetY,
        fontSize: el.fontSize * scale
      };
    }
    return el;
  });
};

export const importSVG = (svgString, getNextId, workAreaWidth = 300, workAreaHeight = 300) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid SVG format');
    }

    const svg = doc.querySelector('svg');
    if (!svg) {
      throw new Error('No SVG element found');
    }

    const elements = [];
    const identityTransform = {
      translate: { x: 0, y: 0 },
      rotate: 0,
      scale: { x: 1, y: 1 },
      matrix: null
    };

    Array.from(svg.children).forEach(child => {
      elements.push(...parseElement(child, identityTransform, getNextId));
    });

    const scaledElements = scaleAndCenterElements(elements, workAreaWidth, workAreaHeight);

    return { success: true, elements: scaledElements };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

