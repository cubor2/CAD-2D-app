/**
 * Génère les points pour dessiner un pattern de créneaux (finger joints)
 * @param {number} x1 - Coordonnée x du point de départ
 * @param {number} y1 - Coordonnée y du point de départ
 * @param {number} x2 - Coordonnée x du point d'arrivée
 * @param {number} y2 - Coordonnée y du point d'arrivée
 * @param {number} thickness - Épaisseur du matériau (profondeur des dents)
 * @param {number} toothWidth - Largeur d'une dent
 * @param {number} gapWidth - Largeur d'un espace
 * @param {string} startWith - 'tooth' pour commencer avec une dent (mâle), 'gap' pour commencer avec un creux (femelle)
 * @param {boolean} autoAdjust - Si true, ajuste automatiquement pour remplir la longueur totale
 * @returns {Array} Tableau de points {x, y} pour dessiner le crénelage
 */
export const generateFingerJointPoints = (x1, y1, x2, y2, thickness, toothWidth, gapWidth, startWith = 'tooth', autoAdjust = true) => {
  const points = [];
  
  // NOTE: x1,y1 et x2,y2 sont TOUJOURS sur la ligne de base (le bas)
  // Pour les créneaux mâles, le path commence en haut mais les coordonnées restent en bas
  
  // Calculer la longueur totale et le vecteur directeur
  const totalLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const dx = (x2 - x1) / totalLength;
  const dy = (y2 - y1) / totalLength;
  
  // Vecteur perpendiculaire (pour la profondeur des dents)
  const perpX = -dy;
  const perpY = dx;
  
  // Point de départ : toujours commencer sur la ligne de base
  points.push({ x: x1, y: y1 });
  
  if (totalLength < toothWidth + gapWidth) {
    // Si la longueur est trop courte, juste tracer une ligne droite
    points.push({ x: x2, y: y2 });
    return points;
  }
  
  // Calculer le pattern optimal avec symétrie
  let currentToothWidth = toothWidth;
  let currentGapWidth = gapWidth;
  
  if (autoAdjust) {
    // Pour garantir la symétrie, on calcule un nombre de segments qui commence et finit avec le même type
    // Si on commence avec une dent, on veut: dent - creux - dent - creux - ... - dent
    // Donc un nombre impair de segments au total
    
    const patternLength = toothWidth + gapWidth; // Une dent + un creux
    const numFullPatterns = Math.floor(totalLength / patternLength);
    
    if (numFullPatterns > 0) {
      if (startWith === 'tooth') {
        // Pour la symétrie : dent + (creux + dent) * n
        // Nombre total de segments = 1 + 2*n (toujours impair)
        const numSegments = 1 + 2 * numFullPatterns;
        const numTeeth = numFullPatterns + 1; // n+1 dents
        const numGaps = numFullPatterns; // n creux
        
        // Ajuster pour remplir exactement la longueur
        currentToothWidth = (totalLength * (toothWidth / patternLength)) / numTeeth;
        currentGapWidth = (totalLength * (gapWidth / patternLength)) / numGaps;
      } else {
        // Pour la symétrie : creux + (dent + creux) * n
        // Nombre total de segments = 1 + 2*n (toujours impair)
        const numSegments = 1 + 2 * numFullPatterns;
        const numGaps = numFullPatterns + 1; // n+1 creux
        const numTeeth = numFullPatterns; // n dents
        
        // Ajuster pour remplir exactement la longueur
        currentGapWidth = (totalLength * (gapWidth / patternLength)) / numGaps;
        currentToothWidth = numTeeth > 0 ? (totalLength * (toothWidth / patternLength)) / numTeeth : toothWidth;
      }
    }
  }
  
  let currentLength = 0;
  let isToothPhase = (startWith === 'tooth');
  let segmentCount = 0;
  
  // Calculer le nombre total de segments pour la symétrie
  const patternLength = toothWidth + gapWidth;
  const numFullPatterns = Math.floor(totalLength / patternLength);
  const totalSegments = startWith === 'tooth' ? (1 + 2 * numFullPatterns) : (1 + 2 * numFullPatterns);
  
  while (currentLength < totalLength - 0.1 && segmentCount < totalSegments) {
    const segmentLength = isToothPhase ? currentToothWidth : currentGapWidth;
    const nextLength = Math.min(currentLength + segmentLength, totalLength);
    
    // Position sur la ligne principale
    const mainX = x1 + dx * nextLength;
    const mainY = y1 + dy * nextLength;
    
    if (isToothPhase) {
      // Pour une dent : monter perpendiculairement, avancer, redescendre
      const startMainX = x1 + dx * currentLength;
      const startMainY = y1 + dy * currentLength;
      
      const startOffsetX = startMainX + perpX * thickness;
      const startOffsetY = startMainY + perpY * thickness;
      
      const endOffsetX = mainX + perpX * thickness;
      const endOffsetY = mainY + perpY * thickness;
      
      // Toujours monter perpendiculairement pour créer la dent
      points.push({ x: startOffsetX, y: startOffsetY });
      points.push({ x: endOffsetX, y: endOffsetY });
      
      // Toujours redescendre sur la ligne principale
      points.push({ x: mainX, y: mainY });
    } else {
      // Rester sur la ligne principale pendant l'espace
      points.push({ x: mainX, y: mainY });
    }
    
    currentLength = nextLength;
    isToothPhase = !isToothPhase;
    segmentCount++;
  }
  
  // S'assurer qu'on termine exactement sur le point final
  const lastPoint = points[points.length - 1];
  if (Math.abs(lastPoint.x - x2) > 0.1 || Math.abs(lastPoint.y - y2) > 0.1) {
    points.push({ x: x2, y: y2 });
  }
  
  return points;
};

/**
 * Obtient les paramètres par défaut pour un crénelage
 */
export const getDefaultFingerJointParams = () => ({
  thickness: 3,
  toothWidth: 10,
  gapWidth: 10,
  startWith: 'tooth',
  autoAdjust: true
});

