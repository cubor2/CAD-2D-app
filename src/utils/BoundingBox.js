// Classe pour gérer une boîte englobante avec transformations
export class BoundingBox {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  // Points de contrôle
  get topLeft() { return { x: this.x, y: this.y }; }
  get topRight() { return { x: this.x + this.width, y: this.y }; }
  get bottomLeft() { return { x: this.x, y: this.y + this.height }; }
  get bottomRight() { return { x: this.x + this.width, y: this.y + this.height }; }
  get center() { return { x: this.x + this.width / 2, y: this.y + this.height / 2 }; }

  // Points de contrôle des bords
  get top() { return { x: this.x + this.width / 2, y: this.y }; }
  get right() { return { x: this.x + this.width, y: this.y + this.height / 2 }; }
  get bottom() { return { x: this.x + this.width / 2, y: this.y + this.height }; }
  get left() { return { x: this.x, y: this.y + this.height / 2 }; }

  // Transformations
  scale(sx, sy, anchor) {
    const oldWidth = this.width;
    const oldHeight = this.height;
    this.width *= sx;
    this.height *= sy;

    // Ajuster la position en fonction du point d'ancrage
    switch (anchor) {
      case 'topLeft':
        // Position reste inchangée
        break;
      case 'topRight':
        this.x += oldWidth - this.width;
        break;
      case 'bottomLeft':
        this.y += oldHeight - this.height;
        break;
      case 'bottomRight':
        this.x += oldWidth - this.width;
        this.y += oldHeight - this.height;
        break;
      case 'center':
        this.x += (oldWidth - this.width) / 2;
        this.y += (oldHeight - this.height) / 2;
        break;
      case 'top':
        this.x += (oldWidth - this.width) / 2;
        break;
      case 'right':
        this.x += oldWidth - this.width;
        this.y += (oldHeight - this.height) / 2;
        break;
      case 'bottom':
        this.x += (oldWidth - this.width) / 2;
        this.y += oldHeight - this.height;
        break;
      case 'left':
        this.y += (oldHeight - this.height) / 2;
        break;
    }
    return this;
  }

  // Vérifier si un point est proche d'un point de contrôle
  getControlPointAt(x, y, threshold = 5) {
    const points = [
      { point: this.topLeft, name: 'topLeft' },
      { point: this.topRight, name: 'topRight' },
      { point: this.bottomLeft, name: 'bottomLeft' },
      { point: this.bottomRight, name: 'bottomRight' },
      { point: this.top, name: 'top' },
      { point: this.right, name: 'right' },
      { point: this.bottom, name: 'bottom' },
      { point: this.left, name: 'left' }
    ];

    for (const { point, name } of points) {
      const dx = x - point.x;
      const dy = y - point.y;
      if (Math.sqrt(dx * dx + dy * dy) <= threshold) {
        return name;
      }
    }
    return null;
  }

  // Créer une copie
  clone() {
    return new BoundingBox(this.x, this.y, this.width, this.height);
  }
}

// Fonction pour créer une boîte englobante à partir d'un élément texte
export function createTextBoundingBox(element, ctx) {
  ctx.save();
  ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
  
  const lines = element.text.split('\n');
  const lineHeight = element.fontSize * 1.2;
  const width = Math.max(...lines.map(line => ctx.measureText(line).width));
  const height = lines.length * lineHeight;
  
  ctx.restore();

  // Note: element.y est la ligne de base, donc nous devons décaler y vers le haut
  return new BoundingBox(element.x, element.y - height, width, height);
}

export function calculateGroupBoundingBox(elements) {
  if (elements.length === 0) return null;
  
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
    } else if (el.type === 'fingerJoint') {
      const dx = el.x2 - el.x1;
      const dy = el.y2 - el.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        const perpX = -dy / length;
        const perpY = dx / length;
        const thickness = el.thickness || 3;
        
        const offset = thickness / 2;
        const x1a = el.x1 + perpX * offset;
        const y1a = el.y1 + perpY * offset;
        const x1b = el.x1 - perpX * offset;
        const y1b = el.y1 - perpY * offset;
        const x2a = el.x2 + perpX * offset;
        const y2a = el.y2 + perpY * offset;
        const x2b = el.x2 - perpX * offset;
        const y2b = el.y2 - perpY * offset;
        
        minX = Math.min(minX, x1a, x1b, x2a, x2b);
        minY = Math.min(minY, y1a, y1b, y2a, y2b);
        maxX = Math.max(maxX, x1a, x1b, x2a, x2b);
        maxY = Math.max(maxY, y1a, y1b, y2a, y2b);
      } else {
        minX = Math.min(minX, el.x1, el.x2);
        minY = Math.min(minY, el.y1, el.y2);
        maxX = Math.max(maxX, el.x1, el.x2);
        maxY = Math.max(maxY, el.y1, el.y2);
      }
    } else if (el.type === 'curve') {
      minX = Math.min(minX, el.x1, el.x2, el.cpx);
      minY = Math.min(minY, el.y1, el.y2, el.cpy);
      maxX = Math.max(maxX, el.x1, el.x2, el.cpx);
      maxY = Math.max(maxY, el.y1, el.y2, el.cpy);
    } else if (el.type === 'rectangle') {
      minX = Math.min(minX, el.x, el.x + el.width);
      minY = Math.min(minY, el.y, el.y + el.height);
      maxX = Math.max(maxX, el.x, el.x + el.width);
      maxY = Math.max(maxY, el.y, el.y + el.height);
    } else if (el.type === 'circle' || el.type === 'arc') {
      const radiusX = el.radiusX || el.radius;
      const radiusY = el.radiusY || el.radius;
      minX = Math.min(minX, el.cx - radiusX);
      minY = Math.min(minY, el.cy - radiusY);
      maxX = Math.max(maxX, el.cx + radiusX);
      maxY = Math.max(maxY, el.cy + radiusY);
    } else if (el.type === 'text') {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    }
  });
  
  return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
}

