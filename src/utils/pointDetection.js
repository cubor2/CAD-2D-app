// Détecte si un point est cliqué en coordonnées monde
export function isPointClicked(point, click, viewport, clickDistance = 5) {
  // Distance en coordonnées monde
  const dist = Math.sqrt(
    (point.x - click.x) ** 2 + 
    (point.y - click.y) ** 2
  );
  
  // Seuil ajusté par le zoom
  const threshold = clickDistance / viewport.zoom;
  
  console.log(`DEBUG - Test clic sur ${point.label}:`, {
    point: { x: point.x, y: point.y },
    click: { x: click.x, y: click.y },
    distance: dist,
    threshold: threshold,
    zoom: viewport.zoom,
    isHit: dist < threshold
  });
  
  return dist < threshold;
}

// Calcule les points de contrôle pour un élément texte
export function getTextControlPoints(element, ctx) {
  // Calculer les dimensions du texte
  const lines = element.text.split('\n');
  const lineHeight = element.fontSize * 1.2;
  const textWidth = Math.max(...lines.map(line => {
    ctx.save();
    ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
    const width = ctx.measureText(line).width;
    ctx.restore();
    return width;
  }));
  const textHeight = lines.length * lineHeight;

  // Point de base en bas à gauche
  const baseX = element.x;
  const baseY = element.y;

  // Créer les points de contrôle
  const points = [
    // Points des coins
    { x: baseX, y: baseY - textHeight, label: 'topLeft' },
    { x: baseX + textWidth, y: baseY - textHeight, label: 'topRight' },
    { x: baseX, y: baseY, label: 'bottomLeft' },
    { x: baseX + textWidth, y: baseY, label: 'bottomRight' },
    // Points des bords
    { x: baseX + textWidth / 2, y: baseY - textHeight, label: 'top' },
    { x: baseX + textWidth, y: baseY - textHeight / 2, label: 'right' },
    { x: baseX + textWidth / 2, y: baseY, label: 'bottom' },
    { x: baseX, y: baseY - textHeight / 2, label: 'left' }
  ];

  console.log('DEBUG - Points de contrôle calculés:', {
    element: {
      x: element.x,
      y: element.y,
      text: element.text,
      fontSize: element.fontSize
    },
    dimensions: {
      width: textWidth,
      height: textHeight,
      lineHeight
    },
    points: points.map(p => ({
      label: p.label,
      x: p.x,
      y: p.y,
      offset: {
        x: p.x - baseX,
        y: p.y - baseY
      }
    }))
  });

  return {
    points,
    dimensions: {
      width: textWidth,
      height: textHeight,
      lineHeight
    }
  };
}