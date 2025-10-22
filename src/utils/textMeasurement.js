/**
 * Système de mesure de texte optimisé avec cache
 * Évite la création répétée de canvas et améliore les performances
 */

// Canvas réutilisable pour toutes les mesures
let measurementCanvas = null;
let measurementCtx = null;

// Cache des dimensions de texte (clé: hash de l'élément)
const textDimensionsCache = new Map();

// Taille max du cache pour éviter les fuites mémoire
const MAX_CACHE_SIZE = 1000;

/**
 * Obtient le contexte de mesure réutilisable
 */
const getMeasurementContext = () => {
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas');
    measurementCtx = measurementCanvas.getContext('2d');
  }
  return measurementCtx;
};

/**
 * Crée une clé de cache pour un élément texte
 */
const getCacheKey = (element) => {
  return `${element.text}_${element.fontSize}_${element.fontFamily}_${element.fontWeight}_${element.fontStyle}`;
};

/**
 * Nettoie le cache si trop grand (FIFO)
 */
const cleanCache = () => {
  if (textDimensionsCache.size > MAX_CACHE_SIZE) {
    const firstKey = textDimensionsCache.keys().next().value;
    textDimensionsCache.delete(firstKey);
  }
};

/**
 * Mesure les dimensions d'un élément texte
 * @param {Object} textElement - Élément texte avec propriétés text, fontSize, fontFamily, etc.
 * @param {Object} viewport - Viewport avec zoom (utilisé uniquement pour convertir en coordonnées monde)
 * @returns {Object} { width, height, widthPx, heightPx }
 */
export const getTextDimensions = (textElement, viewport) => {
  const cacheKey = getCacheKey(textElement);
  
  // Vérifier le cache
  if (textDimensionsCache.has(cacheKey)) {
    return textDimensionsCache.get(cacheKey);
  }
  
  // Mesurer le texte
  const ctx = getMeasurementContext();
  const lines = textElement.text.split('\n');
  const lineHeight = textElement.fontSize * 1.2;
  
  ctx.font = `${textElement.fontStyle || 'normal'} ${textElement.fontWeight || 'normal'} ${textElement.fontSize}px ${textElement.fontFamily}`;
  
  const textWidthPx = Math.max(...lines.map(line => ctx.measureText(line).width));
  const textHeightPx = lines.length * lineHeight;
  
  const dimensions = {
    widthPx: textWidthPx,
    heightPx: textHeightPx,
    width: textWidthPx,
    height: textHeightPx
  };
  
  // Stocker dans le cache
  textDimensionsCache.set(cacheKey, dimensions);
  cleanCache();
  
  return dimensions;
};

/**
 * Invalide le cache pour un élément spécifique (après modification)
 */
export const invalidateTextCache = (textElement) => {
  if (textElement) {
    const cacheKey = getCacheKey(textElement);
    textDimensionsCache.delete(cacheKey);
  }
};

/**
 * Vide complètement le cache (utile lors de changements de zoom)
 */
export const clearTextCache = () => {
  textDimensionsCache.clear();
};

