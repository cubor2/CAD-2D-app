// Fonction de débogage pour les points de contrôle
export function debugControlPoint(point, click, viewport, worldToScreen) {
  const screenPoint = worldToScreen(point.x, point.y);
  const screenClick = worldToScreen(click.x, click.y);
  
  const worldDist = Math.sqrt(
    (point.x - click.x) ** 2 + 
    (point.y - click.y) ** 2
  );
  
  const screenDist = Math.sqrt(
    (screenPoint.x - screenClick.x) ** 2 + 
    (screenPoint.y - screenClick.y) ** 2
  );

  console.log(`DEBUG - Point ${point.label}:`, {
    world: {
      point: { x: point.x, y: point.y },
      click: { x: click.x, y: click.y },
      distance: worldDist
    },
    screen: {
      point: screenPoint,
      click: screenClick,
      distance: screenDist
    },
    viewport: {
      zoom: viewport.zoom,
      pan: { x: viewport.x, y: viewport.y }
    }
  });
}

// Fonction de débogage pour les transformations
export function debugTransform(element, newDimensions, viewport) {
  console.log('DEBUG - Transformation:', {
    before: {
      x: element.x,
      y: element.y,
      fontSize: element.fontSize
    },
    after: {
      x: newDimensions.x,
      y: newDimensions.y,
      fontSize: newDimensions.fontSize
    },
    delta: {
      x: newDimensions.x - element.x,
      y: newDimensions.y - element.y,
      fontSize: newDimensions.fontSize - element.fontSize
    },
    viewport: {
      zoom: viewport.zoom,
      pan: { x: viewport.x, y: viewport.y }
    }
  });
}

