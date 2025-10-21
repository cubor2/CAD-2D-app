/**
 * Fonctions utilitaires pour la géométrie des éléments
 * Centralise tous les calculs de points de contrôle, bounds, etc.
 */

import { getTextDimensions } from './textMeasurement.js';

/**
 * Obtient les points de contrôle d'un élément
 * @param {Object} element - L'élément dont on veut les points
 * @param {Object} viewport - Viewport avec zoom
 * @param {String} mode - 'edit' ou 'select' (affecte les points pour le texte)
 * @returns {Array} Liste de points { x, y, label }
 */
export const getElementControlPoints = (element, viewport, mode = 'select') => {
  const controlPoints = [];
  
  switch (element.type) {
    case 'text': {
      const { width, height } = getTextDimensions(element, viewport);
      
      // Coins (toujours)
      controlPoints.push(
        { x: element.x, y: element.y - height, label: 'topLeft' },
        { x: element.x + width, y: element.y - height, label: 'topRight' },
        { x: element.x, y: element.y, label: 'bottomLeft' },
        { x: element.x + width, y: element.y, label: 'bottomRight' }
      );
      
      // Points médians (seulement en mode select)
      if (mode !== 'edit') {
        controlPoints.push(
          { x: element.x + width / 2, y: element.y - height, label: 'top' },
          { x: element.x + width, y: element.y - height / 2, label: 'right' },
          { x: element.x + width / 2, y: element.y, label: 'bottom' },
          { x: element.x, y: element.y - height / 2, label: 'left' }
        );
      }
      break;
    }
    
    case 'line':
      controlPoints.push(
        { x: element.x1, y: element.y1, label: 'start' },
        { x: (element.x1 + element.x2) / 2, y: (element.y1 + element.y2) / 2, label: 'middle' },
        { x: element.x2, y: element.y2, label: 'end' }
      );
      break;
    
    case 'curve':
      controlPoints.push(
        { x: element.x1, y: element.y1, label: 'start' },
        { x: element.cpx, y: element.cpy, label: 'control' },
        { x: element.x2, y: element.y2, label: 'end' }
      );
      break;
    
    case 'rectangle':
      controlPoints.push(
        { x: element.x, y: element.y, label: 'topLeft' },
        { x: element.x + element.width, y: element.y, label: 'topRight' },
        { x: element.x, y: element.y + element.height, label: 'bottomLeft' },
        { x: element.x + element.width, y: element.y + element.height, label: 'bottomRight' },
        { x: element.x + element.width / 2, y: element.y, label: 'top' },
        { x: element.x + element.width, y: element.y + element.height / 2, label: 'right' },
        { x: element.x + element.width / 2, y: element.y + element.height, label: 'bottom' },
        { x: element.x, y: element.y + element.height / 2, label: 'left' }
      );
      break;
    
    case 'circle': {
      const radiusX = element.radiusX || element.radius;
      const radiusY = element.radiusY || element.radius;
      controlPoints.push(
        { x: element.cx + radiusX, y: element.cy, label: 'right' },
        { x: element.cx - radiusX, y: element.cy, label: 'left' },
        { x: element.cx, y: element.cy + radiusY, label: 'bottom' },
        { x: element.cx, y: element.cy - radiusY, label: 'top' }
      );
      break;
    }
    
    case 'arc': {
      const radiusX = element.radiusX || element.radius;
      const radiusY = element.radiusY || element.radius;
      controlPoints.push(
        { x: element.cx + radiusX * Math.cos(element.startAngle), y: element.cy + radiusY * Math.sin(element.startAngle), label: 'start' },
        { x: element.cx + radiusX * Math.cos(element.endAngle), y: element.cy + radiusY * Math.sin(element.endAngle), label: 'end' }
      );
      break;
    }
  }
  
  return controlPoints;
};

/**
 * Obtient les arêtes d'un élément texte pour le hover
 * @param {Object} element - L'élément texte
 * @param {Object} viewport - Viewport avec zoom
 * @returns {Array} Liste d'arêtes { x1, y1, x2, y2, label }
 */
export const getTextEdges = (element, viewport) => {
  const { width, height } = getTextDimensions(element, viewport);
  
  return [
    { x1: element.x, y1: element.y - height, x2: element.x + width, y2: element.y - height, label: 'top' },
    { x1: element.x + width, y1: element.y - height, x2: element.x + width, y2: element.y, label: 'right' },
    { x1: element.x + width, y1: element.y, x2: element.x, y2: element.y, label: 'bottom' },
    { x1: element.x, y1: element.y, x2: element.x, y2: element.y - height, label: 'left' }
  ];
};

/**
 * Trouve le point de contrôle le plus proche de la souris
 * @param {Object} mousePoint - Position de la souris { x, y }
 * @param {Object} element - L'élément
 * @param {Object} viewport - Viewport avec zoom
 * @param {String} mode - 'edit' ou 'select'
 * @param {Number} tolerance - Distance max en coordonnées monde
 * @returns {Object|null} { point: { x, y, label }, distance } ou null
 */
export const findNearestControlPoint = (mousePoint, element, viewport, mode = 'select', tolerance = 20) => {
  const controlPoints = getElementControlPoints(element, viewport, mode);
  const maxDist = tolerance / viewport.zoom;
  
  let nearest = null;
  let minDistance = maxDist;
  
  for (const cp of controlPoints) {
    const dist = Math.sqrt((cp.x - mousePoint.x) ** 2 + (cp.y - mousePoint.y) ** 2);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = { point: cp, distance: dist };
    }
  }
  
  return nearest;
};

/**
 * Trouve le point le plus proche sur une arête d'un élément texte
 * @param {Object} mousePoint - Position de la souris { x, y }
 * @param {Object} element - L'élément texte
 * @param {Object} viewport - Viewport avec zoom
 * @param {Number} tolerance - Distance max en coordonnées monde
 * @param {Function} pointToLineDistance - Fonction de calcul de distance point-ligne
 * @returns {Object|null} { x, y, distance, edge } ou null
 */
export const findNearestEdgePoint = (mousePoint, element, viewport, tolerance, pointToLineDistance) => {
  const edges = getTextEdges(element, viewport);
  const maxDist = tolerance / viewport.zoom;
  
  for (const edge of edges) {
    const dist = pointToLineDistance(mousePoint, { x: edge.x1, y: edge.y1 }, { x: edge.x2, y: edge.y2 });
    
    if (dist < maxDist) {
      // Calculer le point projeté sur l'arête
      const t = Math.max(0, Math.min(1, 
        ((mousePoint.x - edge.x1) * (edge.x2 - edge.x1) + (mousePoint.y - edge.y1) * (edge.y2 - edge.y1)) /
        ((edge.x2 - edge.x1) ** 2 + (edge.y2 - edge.y1) ** 2)
      ));
      
      return {
        x: edge.x1 + t * (edge.x2 - edge.x1),
        y: edge.y1 + t * (edge.y2 - edge.y1),
        distance: dist,
        edge: edge.label
      };
    }
  }
  
  return null;
};

/**
 * Obtient le curseur approprié pour un point de contrôle
 * @param {String} label - Label du point de contrôle
 * @param {String} mode - 'edit' ou 'select'
 * @returns {String} Nom du curseur CSS
 */
export const getCursorForControlPoint = (label, mode) => {
  if (mode !== 'edit') {
    return 'default';
  }
  
  switch (label) {
    case 'topLeft':
    case 'bottomRight':
      return 'nwse-resize';
    case 'topRight':
    case 'bottomLeft':
      return 'nesw-resize';
    case 'top':
    case 'bottom':
      return 'ns-resize';
    case 'left':
    case 'right':
      return 'ew-resize';
    case 'middle':
    case 'start':
    case 'end':
    case 'control':
      return 'move';
    default:
      return 'pointer';
  }
};

/**
 * Vérifie si un point est à l'intérieur d'un élément
 * @param {Object} point - Point { x, y }
 * @param {Object} element - L'élément
 * @param {Object} viewport - Viewport avec zoom
 * @param {Number} tolerance - Tolérance en pixels écran (pour les lignes)
 * @param {Function} pointToLineDistance - Fonction de calcul de distance
 * @returns {Boolean}
 */
export const isPointInElement = (point, element, viewport, tolerance = 10, pointToLineDistance) => {
  const toleranceWorld = tolerance / viewport.zoom;
  
  switch (element.type) {
    case 'line': {
      const dist = pointToLineDistance(point, { x: element.x1, y: element.y1 }, { x: element.x2, y: element.y2 });
      return dist < toleranceWorld;
    }
    
    case 'rectangle':
      return point.x >= element.x && point.x <= element.x + element.width &&
             point.y >= element.y && point.y <= element.y + element.height;
    
    case 'circle': {
      const rx = element.radiusX || element.radius;
      const ry = element.radiusY || element.radius;
      const dx = (point.x - element.cx) / rx;
      const dy = (point.y - element.cy) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return Math.abs(dist - 1) < toleranceWorld / rx;
    }
    
    case 'text': {
      const { width, height } = getTextDimensions(element, viewport);
      const margin = 25 / viewport.zoom;
      return point.x >= element.x - margin && point.x <= element.x + width + margin &&
             point.y >= element.y - height - margin && point.y <= element.y + margin;
    }
    
    default:
      return false;
  }
};

