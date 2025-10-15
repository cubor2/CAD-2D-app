// Classe pour gérer les transformations 2D avec matrices 3x3 (coordonnées homogènes)
export class Matrix {
  constructor(values = [1, 0, 0, 0, 1, 0, 0, 0, 1]) {
    this.values = values;
  }

  // Multiplication de matrices
  multiply(other) {
    const a = this.values;
    const b = other.values;
    return new Matrix([
      a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
      a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
      a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
      a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
      a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
      a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
      a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
      a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
      a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
    ]);
  }

  // Transforme un point
  transformPoint(point) {
    const x = this.values[0] * point.x + this.values[1] * point.y + this.values[2];
    const y = this.values[3] * point.x + this.values[4] * point.y + this.values[5];
    const w = this.values[6] * point.x + this.values[7] * point.y + this.values[8];
    return { x: x / w, y: y / w };
  }

  // Inverse la matrice
  inverse() {
    const det = this.determinant();
    if (Math.abs(det) < 1e-6) return null;

    const inv = new Matrix([
      (this.values[4] * this.values[8] - this.values[5] * this.values[7]) / det,
      (this.values[2] * this.values[7] - this.values[1] * this.values[8]) / det,
      (this.values[1] * this.values[5] - this.values[2] * this.values[4]) / det,
      (this.values[5] * this.values[6] - this.values[3] * this.values[8]) / det,
      (this.values[0] * this.values[8] - this.values[2] * this.values[6]) / det,
      (this.values[2] * this.values[3] - this.values[0] * this.values[5]) / det,
      (this.values[3] * this.values[7] - this.values[4] * this.values[6]) / det,
      (this.values[1] * this.values[6] - this.values[0] * this.values[7]) / det,
      (this.values[0] * this.values[4] - this.values[1] * this.values[3]) / det
    ]);

    return inv;
  }

  determinant() {
    const a = this.values;
    return a[0] * (a[4] * a[8] - a[5] * a[7]) -
           a[1] * (a[3] * a[8] - a[5] * a[6]) +
           a[2] * (a[3] * a[7] - a[4] * a[6]);
  }

  // Matrices de transformation standard
  static translation(tx, ty) {
    return new Matrix([1, 0, tx, 0, 1, ty, 0, 0, 1]);
  }

  static scale(sx, sy, center = { x: 0, y: 0 }) {
    // Scale autour d'un point = translation(-center) * scale * translation(center)
    const t1 = Matrix.translation(-center.x, -center.y);
    const s = new Matrix([sx, 0, 0, 0, sy, 0, 0, 0, 1]);
    const t2 = Matrix.translation(center.x, center.y);
    return t1.multiply(s).multiply(t2);
  }

  static rotation(angle, center = { x: 0, y: 0 }) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const t1 = Matrix.translation(-center.x, -center.y);
    const r = new Matrix([cos, -sin, 0, sin, cos, 0, 0, 0, 1]);
    const t2 = Matrix.translation(center.x, center.y);
    return t1.multiply(r).multiply(t2);
  }
}

