import { Matrix } from './Matrix';

export class TextBoundingBox {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

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

  // Transforme la boîte avec une matrice
  transform(matrix) {
    const tl = matrix.transformPoint(this.topLeft);
    const tr = matrix.transformPoint(this.topRight);
    const bl = matrix.transformPoint(this.bottomLeft);
    const br = matrix.transformPoint(this.bottomRight);

    // Calculer les nouvelles dimensions
    const newWidth = Math.max(
      Math.abs(tr.x - tl.x),
      Math.abs(br.x - bl.x)
    );
    const newHeight = Math.max(
      Math.abs(bl.y - tl.y),
      Math.abs(br.y - tr.y)
    );

    return new TextBoundingBox(tl.x, tl.y, newWidth, newHeight);
  }
}

export class TextTransform {
  static calculateTextDimensions(text, fontSize, fontFamily, fontStyle, fontWeight, ctx) {
    ctx.save();
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    const width = Math.max(...lines.map(line => ctx.measureText(line).width));
    const height = lines.length * lineHeight;
    ctx.restore();
    return { width, height, lineHeight };
  }

  static getControlPoints(element, ctx) {
    const { width, height } = this.calculateTextDimensions(
      element.text,
      element.fontSize,
      element.fontFamily,
      element.fontStyle,
      element.fontWeight,
      ctx
    );

    // Créer une boîte englobante avec le point de référence en haut à gauche
    const bbox = new TextBoundingBox(element.x, element.y - height, width, height);

    return {
      topLeft: bbox.topLeft,
      topRight: bbox.topRight,
      bottomLeft: bbox.bottomLeft,
      bottomRight: bbox.bottomRight,
      top: bbox.top,
      right: bbox.right,
      bottom: bbox.bottom,
      left: bbox.left,
      width,
      height
    };
  }

  static calculateResizeTransform(element, handle, dx, dy, ctx) {
    const bbox = new TextBoundingBox(
      element.x,
      element.y - this.calculateTextDimensions(element.text, element.fontSize, element.fontFamily, element.fontStyle, element.fontWeight, ctx).height,
      this.calculateTextDimensions(element.text, element.fontSize, element.fontFamily, element.fontStyle, element.fontWeight, ctx).width,
      this.calculateTextDimensions(element.text, element.fontSize, element.fontFamily, element.fontStyle, element.fontWeight, ctx).height
    );

    // Déterminer le point d'ancrage et les facteurs d'échelle
    let anchorPoint;
    let scaleX = 1;
    let scaleY = 1;

    switch (handle) {
      case 'topLeft':
        anchorPoint = bbox.bottomRight;
        scaleX = Math.max(0.1, (bbox.width - dx) / bbox.width);
        scaleY = Math.max(0.1, (bbox.height - dy) / bbox.height);
        break;
      case 'topRight':
        anchorPoint = bbox.bottomLeft;
        scaleX = Math.max(0.1, (bbox.width + dx) / bbox.width);
        scaleY = Math.max(0.1, (bbox.height - dy) / bbox.height);
        break;
      case 'bottomLeft':
        anchorPoint = bbox.topRight;
        scaleX = Math.max(0.1, (bbox.width - dx) / bbox.width);
        scaleY = Math.max(0.1, (bbox.height + dy) / bbox.height);
        break;
      case 'bottomRight':
        anchorPoint = bbox.topLeft;
        scaleX = Math.max(0.1, (bbox.width + dx) / bbox.width);
        scaleY = Math.max(0.1, (bbox.height + dy) / bbox.height);
        break;
      case 'top':
        anchorPoint = bbox.bottom;
        scaleY = Math.max(0.1, (bbox.height - dy) / bbox.height);
        break;
      case 'right':
        anchorPoint = bbox.left;
        scaleX = Math.max(0.1, (bbox.width + dx) / bbox.width);
        break;
      case 'bottom':
        anchorPoint = bbox.top;
        scaleY = Math.max(0.1, (bbox.height + dy) / bbox.height);
        break;
      case 'left':
        anchorPoint = bbox.right;
        scaleX = Math.max(0.1, (bbox.width - dx) / bbox.width);
        break;
    }

    // Créer la matrice de transformation
    const scale = Math.min(scaleX, scaleY);
    const transform = Matrix.scale(scale, scale, anchorPoint);

    // Appliquer la transformation à la boîte
    const newBbox = bbox.transform(transform);

    // Calculer la nouvelle taille de police et position
    return {
      fontSize: Math.max(6, Math.min(200, element.fontSize * scale)),
      x: newBbox.x,
      y: newBbox.y + newBbox.height // Convertir en coordonnée de ligne de base
    };
  }
}

