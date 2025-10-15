export function getTextControlPoints(element, ctx, viewport, worldToScreen, screenToWorld) {
  // Calculer les dimensions du texte
  ctx.save();
  ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
  const lines = element.text.split('\n');
  const lineHeight = element.fontSize * 1.2;
  const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
  const textHeight = lines.length * lineHeight;
  ctx.restore();

  // Convertir les coordonnées en coordonnées écran
  const screenX = worldToScreen(element.x, element.y).x;
  const screenY = worldToScreen(element.x, element.y).y;

  // Calculer les dimensions en pixels écran
  const screenWidth = textWidth * viewport.zoom;
  const screenHeight = textHeight * viewport.zoom;

  // Créer les points en coordonnées écran
  const screenPoints = [
    { x: screenX, y: screenY - screenHeight, label: 'topLeft' },
    { x: screenX + screenWidth, y: screenY - screenHeight, label: 'topRight' },
    { x: screenX, y: screenY, label: 'bottomLeft' },
    { x: screenX + screenWidth, y: screenY, label: 'bottomRight' },
    { x: screenX + screenWidth / 2, y: screenY - screenHeight, label: 'top' },
    { x: screenX + screenWidth, y: screenY - screenHeight / 2, label: 'right' },
    { x: screenX + screenWidth / 2, y: screenY, label: 'bottom' },
    { x: screenX, y: screenY - screenHeight / 2, label: 'left' }
  ];

  // Convertir les points en coordonnées monde
  const worldPoints = screenPoints.map(point => ({
    x: screenToWorld(point.x, point.y).x,
    y: screenToWorld(point.x, point.y).y,
    label: point.label
  }));

  console.log('DEBUG - Points de contrôle:', {
    element: {
      x: element.x,
      y: element.y,
      text: element.text,
      fontSize: element.fontSize
    },
    screen: {
      x: screenX,
      y: screenY,
      width: screenWidth,
      height: screenHeight
    },
    points: worldPoints.map(p => ({
      label: p.label,
      screen: worldToScreen(p.x, p.y),
      world: { x: p.x, y: p.y }
    }))
  });

  return worldPoints;
}

export function isPointClickable(point, click, viewport) {
  // Distance fixe en pixels écran
  const CLICK_THRESHOLD = 12;

  // Calculer la distance en pixels écran
  const dx = (point.x - click.x) * viewport.zoom;
  const dy = (point.y - click.y) * viewport.zoom;
  const distanceInPixels = Math.sqrt(dx * dx + dy * dy);

  console.log(`DEBUG - Click test pour ${point.label}:`, {
    point: { x: point.x, y: point.y },
    click: { x: click.x, y: click.y },
    distance: {
      pixels: distanceInPixels,
      world: Math.sqrt((point.x - click.x) ** 2 + (point.y - click.y) ** 2)
    },
    threshold: CLICK_THRESHOLD,
    zoom: viewport.zoom,
    isClickable: distanceInPixels < CLICK_THRESHOLD
  });

  return distanceInPixels < CLICK_THRESHOLD;
}

export function calculateTextResize(element, handle, dx, dy, ctx, viewport) {
  // Calculer les dimensions du texte
  ctx.save();
  ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
  const lines = element.text.split('\n');
  const lineHeight = element.fontSize * 1.2;
  const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
  const textHeight = lines.length * lineHeight;
  ctx.restore();

  // Convertir les deltas en pixels écran
  const screenDx = dx * viewport.zoom;
  const screenDy = dy * viewport.zoom;

  // Calculer les facteurs d'échelle en pixels écran
  let scaleX = 1;
  let scaleY = 1;

  switch (handle) {
    case 'topLeft':
      scaleX = (textWidth - screenDx) / textWidth;
      scaleY = (textHeight - screenDy) / textHeight;
      break;
    case 'topRight':
      scaleX = (textWidth + screenDx) / textWidth;
      scaleY = (textHeight - screenDy) / textHeight;
      break;
    case 'bottomLeft':
      scaleX = (textWidth - screenDx) / textWidth;
      scaleY = (textHeight + screenDy) / textHeight;
      break;
    case 'bottomRight':
      scaleX = (textWidth + screenDx) / textWidth;
      scaleY = (textHeight + screenDy) / textHeight;
      break;
    case 'top':
      scaleY = (textHeight - screenDy) / textHeight;
      break;
    case 'right':
      scaleX = (textWidth + screenDx) / textWidth;
      break;
    case 'bottom':
      scaleY = (textHeight + screenDy) / textHeight;
      break;
    case 'left':
      scaleX = (textWidth - screenDx) / textWidth;
      break;
  }

  // Appliquer les facteurs d'échelle
  const scale = Math.min(scaleX, scaleY);
  const newFontSize = Math.max(6, Math.min(200, element.fontSize * scale));

  // Calculer la nouvelle position
  let newX = element.x;
  let newY = element.y;

  switch (handle) {
    case 'topLeft':
      newX = element.x + dx;
      newY = element.y;
      break;
    case 'topRight':
      newY = element.y;
      break;
    case 'bottomLeft':
      newX = element.x + dx;
      break;
    case 'bottomRight':
      break;
    case 'top':
      newY = element.y;
      break;
    case 'right':
      break;
    case 'bottom':
      break;
    case 'left':
      newX = element.x + dx;
      break;
  }

  console.log('DEBUG - Redimensionnement:', {
    handle,
    original: {
      x: element.x,
      y: element.y,
      fontSize: element.fontSize,
      width: textWidth,
      height: textHeight
    },
    delta: {
      world: { x: dx, y: dy },
      screen: { x: screenDx, y: screenDy }
    },
    scale: {
      x: scaleX,
      y: scaleY,
      final: scale
    },
    new: {
      x: newX,
      y: newY,
      fontSize: newFontSize
    }
  });

  return {
    x: newX,
    y: newY,
    fontSize: newFontSize
  };
}

