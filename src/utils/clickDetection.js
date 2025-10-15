import { worldToScreen } from './transforms';

export function isPointClickable(point, click, viewport, canvas) {
  // Convertir en coordonnées écran
  const screenPoint = worldToScreen(point.x, point.y, canvas, viewport);
  const screenClick = worldToScreen(click.x, click.y, canvas, viewport);
  
  // Calculer la distance en pixels
  const dx = screenPoint.x - screenClick.x;
  const dy = screenPoint.y - screenClick.y;
  const distanceInPixels = Math.sqrt(dx * dx + dy * dy);
  
  // Distance fixe en pixels (pas besoin de diviser par zoom)
  const CLICK_THRESHOLD = 12;

  console.log(`DEBUG - Click test pour ${point.label}:`, {
    point: {
      world: { x: point.x, y: point.y },
      screen: screenPoint
    },
    click: {
      world: { x: click.x, y: click.y },
      screen: screenClick
    },
    distance: distanceInPixels,
    threshold: CLICK_THRESHOLD,
    isClickable: distanceInPixels < CLICK_THRESHOLD
  });
  
  return distanceInPixels < CLICK_THRESHOLD;
}