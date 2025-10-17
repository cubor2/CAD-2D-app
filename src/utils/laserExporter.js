import { jsPDF } from 'jspdf';

export const exportForLaser = (elements, machine, format, fileName = 'laser-cut', workArea = { width: 300, height: 300 }) => {
  if (elements.length === 0) {
    throw new Error('Aucun élément à exporter');
  }

  const formatConfig = machine.formats.find(f => f.name === format);
  if (!formatConfig) {
    throw new Error(`Format ${format} non supporté pour ${machine.name}`);
  }

  if (!formatConfig.available) {
    throw new Error(`Le format ${format} n'est pas encore disponible. Utilisez ${machine.preferredFormat} à la place.`);
  }

  if (format === 'SVG') {
    return exportSVGForLaser(elements, machine, workArea, fileName);
  } else if (format === 'PDF') {
    return exportPDFForLaser(elements, machine, workArea, fileName);
  } else if (format === 'DXF') {
    throw new Error(`L'export DXF pour ${machine.name} sera bientôt disponible !`);
  } else if (format === 'AI') {
    throw new Error(`L'export AI pour ${machine.name} sera bientôt disponible !`);
  } else if (format === 'EPS') {
    throw new Error(`L'export EPS pour ${machine.name} sera bientôt disponible !`);
  } else if (format === 'LBRN') {
    throw new Error(`L'export LBRN pour ${machine.name} sera bientôt disponible !`);
  } else {
    throw new Error(`Le format ${format} n'est pas supporté.`);
  }
};

const exportSVGForLaser = (elements, machine, workArea, fileName) => {
  const width = workArea.width;
  const height = workArea.height;
  const offsetX = width / 2;
  const offsetY = height / 2;
  const strokeColor = `rgb(${machine.cutStrokeColor.r}, ${machine.cutStrokeColor.g}, ${machine.cutStrokeColor.b})`;
  const strokeWidth = machine.cutStrokeWidth;

  let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
  svgContent += `<svg xmlns="http://www.w3.org/2000/svg" `;
  svgContent += `viewBox="0 0 ${width} ${height}" `;
  svgContent += `width="${width}${machine.units}" height="${height}${machine.units}">\n`;
  svgContent += `  <!-- ========================================= -->\n`;
  svgContent += `  <!-- Export optimisé pour ${machine.name} -->\n`;
  svgContent += `  <!-- ========================================= -->\n`;
  svgContent += `  <!-- Zone de travail: ${width} × ${height} mm -->\n`;
  svgContent += `  <!-- Couleur de découpe: ${strokeColor} -->\n`;
  svgContent += `  <!-- Épaisseur du trait: ${strokeWidth} mm -->\n`;
  svgContent += `  <!-- Nombre d'éléments: ${elements.length} -->\n`;
  svgContent += `  <!-- Format: ${machine.units} (millimètres) -->\n`;
  svgContent += `  <!-- ========================================= -->\n\n`;

  if (machine.tip) {
    svgContent += `  <!-- ${machine.tip.replace('💡 ', 'TIP: ')} -->\n\n`;
  }

  svgContent += `  <g id="cut-layer" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none">\n`;

  elements.forEach((el, index) => {
    svgContent += `    <!-- Element ${index + 1}: ${el.type} -->\n`;
    
    if (el.type === 'line') {
      svgContent += `    <line x1="${el.x1 + offsetX}" y1="${el.y1 + offsetY}" x2="${el.x2 + offsetX}" y2="${el.y2 + offsetY}" />\n`;
    } else if (el.type === 'rectangle') {
      svgContent += `    <rect x="${el.x + offsetX}" y="${el.y + offsetY}" width="${el.width}" height="${el.height}" />\n`;
    } else if (el.type === 'circle') {
      const rx = el.radiusX || el.radius;
      const ry = el.radiusY || el.radius;
      if (rx === ry) {
        svgContent += `    <circle cx="${el.cx + offsetX}" cy="${el.cy + offsetY}" r="${rx}" />\n`;
      } else {
        svgContent += `    <ellipse cx="${el.cx + offsetX}" cy="${el.cy + offsetY}" rx="${rx}" ry="${ry}" />\n`;
      }
    } else if (el.type === 'arc') {
      const rx = el.radiusX || el.radius;
      const ry = el.radiusY || el.radius;
      const startX = el.cx + rx * Math.cos(el.startAngle);
      const startY = el.cy + ry * Math.sin(el.startAngle);
      const endX = el.cx + rx * Math.cos(el.endAngle);
      const endY = el.cy + ry * Math.sin(el.endAngle);
      const largeArc = (el.endAngle - el.startAngle) > Math.PI ? 1 : 0;
      svgContent += `    <path d="M ${startX + offsetX} ${startY + offsetY} A ${rx} ${ry} 0 ${largeArc} 1 ${endX + offsetX} ${endY + offsetY}" />\n`;
    } else if (el.type === 'curve') {
      if (typeof el.cpx !== 'undefined' && typeof el.cpy !== 'undefined') {
        svgContent += `    <path d="M ${el.x1 + offsetX} ${el.y1 + offsetY} Q ${el.cpx + offsetX} ${el.cpy + offsetY} ${el.x2 + offsetX} ${el.y2 + offsetY}" />\n`;
      } else {
        svgContent += `    <line x1="${el.x1 + offsetX}" y1="${el.y1 + offsetY}" x2="${el.x2 + offsetX}" y2="${el.y2 + offsetY}" />\n`;
      }
    }
  });

  svgContent += `  </g>\n\n`;
  svgContent += `  <!-- ========================================= -->\n`;
  svgContent += `  <!-- Fin de l'export -->\n`;
  svgContent += `  <!-- Créé avec CAD 2D Editor -->\n`;
  svgContent += `  <!-- https://github.com/Second-Knife -->\n`;
  svgContent += `  <!-- ========================================= -->\n`;
  svgContent += `</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}-${machine.id}-laser.svg`;
  a.click();
  URL.revokeObjectURL(url);

  return {
    success: true,
    fileName: `${fileName}-${machine.id}-laser.svg`,
    workAreaWidth: width,
    workAreaHeight: height,
    elementsCount: elements.length
  };
};

const exportPDFForLaser = (elements, machine, workArea, fileName) => {
  const pdfWidth = workArea.width;
  const pdfHeight = workArea.height;
  
  const offsetX = workArea.width / 2;
  const offsetY = workArea.height / 2;
  
  const doc = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight]
  });

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pdfWidth, pdfHeight, 'F');

  doc.setDrawColor(
    machine.cutStrokeColor.r,
    machine.cutStrokeColor.g,
    machine.cutStrokeColor.b
  );
  
  doc.setLineWidth(machine.cutStrokeWidth);

  elements.forEach((el) => {
    if (el.type === 'line') {
      doc.line(
        el.x1 + offsetX,
        el.y1 + offsetY,
        el.x2 + offsetX,
        el.y2 + offsetY
      );
    } else if (el.type === 'rectangle') {
      doc.rect(
        el.x + offsetX,
        el.y + offsetY,
        el.width,
        el.height,
        'S'
      );
    } else if (el.type === 'circle') {
      const rx = el.radiusX || el.radius;
      const ry = el.radiusY || el.radius;
      if (rx === ry) {
        doc.circle(el.cx + offsetX, el.cy + offsetY, rx, 'S');
      } else {
        doc.ellipse(el.cx + offsetX, el.cy + offsetY, rx, ry, 'S');
      }
    } else if (el.type === 'arc') {
      const rx = el.radiusX || el.radius;
      const ry = el.radiusY || el.radius;
      const startX = el.cx + rx * Math.cos(el.startAngle);
      const startY = el.cy + ry * Math.sin(el.startAngle);
      const endX = el.cx + rx * Math.cos(el.endAngle);
      const endY = el.cy + ry * Math.sin(el.endAngle);
      
      doc.line(
        startX + offsetX,
        startY + offsetY,
        endX + offsetX,
        endY + offsetY
      );
    } else if (el.type === 'curve') {
      if (typeof el.cpx !== 'undefined' && typeof el.cpy !== 'undefined') {
        const points = [];
        for (let t = 0; t <= 1; t += 0.05) {
          const t2 = t * t;
          const mt = 1 - t;
          const mt2 = mt * mt;
          const x = mt2 * el.x1 + 2 * mt * t * el.cpx + t2 * el.x2;
          const y = mt2 * el.y1 + 2 * mt * t * el.cpy + t2 * el.y2;
          points.push({ x: x + offsetX, y: y + offsetY });
        }
        for (let i = 0; i < points.length - 1; i++) {
          doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }
      } else {
        doc.line(
          el.x1 + offsetX,
          el.y1 + offsetY,
          el.x2 + offsetX,
          el.y2 + offsetY
        );
      }
    }
  });

  doc.setProperties({
    title: `${fileName} - ${machine.name}`,
    subject: `Export découpe laser pour ${machine.name}`,
    author: 'CAD 2D Editor',
    keywords: `laser, ${machine.id}, ${machine.cutStrokeWidth}mm`,
    creator: 'CAD 2D Editor'
  });

  doc.save(`${fileName}-${machine.id}-laser.pdf`);

  return {
    success: true,
    fileName: `${fileName}-${machine.id}-laser.pdf`,
    workAreaWidth: pdfWidth,
    workAreaHeight: pdfHeight,
    elementsCount: elements.length
  };
};

