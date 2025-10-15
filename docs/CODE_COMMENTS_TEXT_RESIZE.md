# Commentaires Détaillés - Redimensionnement de Texte

Ce document fournit des commentaires ligne par ligne pour les fonctions critiques de redimensionnement de texte.

## `getTextControlPointsScreen(textElement)`

**Fichier**: `src/CADEditor.jsx`, ligne ~140

```javascript
const getTextControlPointsScreen = useCallback((textElement) => {
  const canvas = getCanvasRef().current;
  if (!canvas) return [];
  
  // ÉTAPE 1: Convertir la position du texte (monde → canvas-relative)
  // textElement.x, textElement.y sont en MONDE (mm)
  // pos.x, pos.y seront en CANVAS-RELATIVE (pixels relatifs au canvas)
  // NOTE: Pour un texte, (x,y) = baseline en bas à gauche
  const pos = worldToScreenWrapper(textElement.x, textElement.y);
  
  const ctx = canvas.getContext('2d');
  ctx.font = `${textElement.fontStyle} ${textElement.fontWeight} ${textElement.fontSize}px ${textElement.fontFamily}`;
  
  const lines = textElement.text ? textElement.text.split('\n') : [''];
  const lineHeight = textElement.fontSize * 1.2;
  
  // ÉTAPE 2: Calculer les dimensions du texte en PIXELS LOGIQUES
  // ctx.measureText() retourne des pixels basés sur fontSize
  // Ces dimensions sont déjà "zoomées" par le rendering du canvas
  // ⚠️ NE PAS multiplier par viewport.zoom ici - c'est déjà géré par worldToScreen
  const widths = lines.map(line => ctx.measureText(line).width);
  const textWidth = Math.max(...widths, textElement.fontSize * 3);
  const textHeight = lines.length * lineHeight;
  
  // ÉTAPE 3: Calculer positions des 8 poignées en CANVAS-RELATIVE
  // Les poignées sont positionnées autour du texte:
  // - pos.x, pos.y = baseline en bas à gauche
  // - textHeight s'étend vers le HAUT (donc pos.y - textHeight)
  // - textWidth s'étend vers la DROITE (donc pos.x + textWidth)
  return [
    { x: pos.x, y: pos.y - textHeight, label: 'topLeft' },              // Coin haut-gauche
    { x: pos.x + textWidth, y: pos.y - textHeight, label: 'topRight' }, // Coin haut-droit
    { x: pos.x, y: pos.y, label: 'bottomLeft' },                        // Coin bas-gauche (baseline)
    { x: pos.x + textWidth, y: pos.y, label: 'bottomRight' },           // Coin bas-droit
    { x: pos.x + textWidth / 2, y: pos.y - textHeight, label: 'top' },  // Milieu haut
    { x: pos.x + textWidth, y: pos.y - textHeight / 2, label: 'right' },// Milieu droit
    { x: pos.x + textWidth / 2, y: pos.y, label: 'bottom' },            // Milieu bas
    { x: pos.x, y: pos.y - textHeight / 2, label: 'left' }              // Milieu gauche
  ];
}, [worldToScreenWrapper]);
```

---

## `handleTextResize(textElement, handle, dx, dy)`

**Fichier**: `src/CADEditor.jsx`, ligne ~167

```javascript
const handleTextResize = useCallback((textElement, handle, dx, dy) => {
  const canvas = getCanvasRef().current;
  if (!canvas) return textElement;
  
  const ctx = canvas.getContext('2d');
  ctx.font = `${textElement.fontStyle} ${textElement.fontWeight} ${textElement.fontSize}px ${textElement.fontFamily}`;
  
  const lines = textElement.text ? textElement.text.split('\n') : [''];
  const lineHeight = textElement.fontSize * 1.2;
  const widths = lines.map(line => ctx.measureText(line).width);
  
  // ÉTAPE 1: Calculer les dimensions ACTUELLES du texte
  // En pixels logiques (fontSize) et en coordonnées monde (mm)
  const oldTextWidthPx = Math.max(...widths, textElement.fontSize * 3);
  const oldTextHeightPx = lines.length * lineHeight;
  
  const oldWidthWorld = oldTextWidthPx / viewport.zoom;
  const oldHeightWorld = oldTextHeightPx / viewport.zoom;
  
  // ÉTAPE 2: Calculer les 4 COINS du texte en COORDONNÉES MONDE
  // ⚠️ IMPORTANT: Pour un texte, (x,y) = baseline en bas à gauche
  // Donc topLeft.y = textElement.y - oldHeightWorld (on monte)
  const topLeft = { x: textElement.x, y: textElement.y - oldHeightWorld };
  const topRight = { x: textElement.x + oldWidthWorld, y: textElement.y - oldHeightWorld };
  const bottomLeft = { x: textElement.x, y: textElement.y };
  const bottomRight = { x: textElement.x + oldWidthWorld, y: textElement.y };
  
  // ÉTAPE 3: Convertir DÉPLACEMENT (dx, dy) de MONDE vers PIXELS
  // ⚠️ CRITIQUE: dx et dy sont des VECTEURS/DELTAS, pas des positions!
  // Pour un vecteur: simplement multiplier par zoom
  // ❌ NE PAS utiliser worldToScreen() - ça ajouterait pan et center incorrectement
  const dxScreen = dx * viewport.zoom;
  const dyScreen = dy * viewport.zoom;
  
  // ÉTAPE 4: Calculer FACTEUR DE SCALE selon la poignée draggée
  // On calcule combien la dimension change en pourcentage
  // Pour handles du haut: dyScreen est négatif (on monte)
  // Pour handles de gauche: dxScreen est négatif (on va à gauche)
  let scaleX = 1;
  let scaleY = 1;
  
  switch (handle) {
    case 'topLeft':
      // Drag vers haut-gauche: diminue width et height
      // -dxScreen car on va à gauche (négatif)
      // -dyScreen car on va en haut (négatif)
      scaleX = Math.max(0.1, (oldTextWidthPx - dxScreen) / oldTextWidthPx);
      scaleY = Math.max(0.1, (oldTextHeightPx - dyScreen) / oldTextHeightPx);
      break;
    case 'topRight':
      // Drag vers haut-droit: augmente width, diminue height
      scaleX = Math.max(0.1, (oldTextWidthPx + dxScreen) / oldTextWidthPx);
      scaleY = Math.max(0.1, (oldTextHeightPx - dyScreen) / oldTextHeightPx);
      break;
    case 'bottomLeft':
      // Drag vers bas-gauche: diminue width, augmente height
      scaleX = Math.max(0.1, (oldTextWidthPx - dxScreen) / oldTextWidthPx);
      scaleY = Math.max(0.1, (oldTextHeightPx + dyScreen) / oldTextHeightPx);
      break;
    case 'bottomRight':
      // Drag vers bas-droit: augmente width et height
      scaleX = Math.max(0.1, (oldTextWidthPx + dxScreen) / oldTextWidthPx);
      scaleY = Math.max(0.1, (oldTextHeightPx + dyScreen) / oldTextHeightPx);
      break;
    case 'top':
      // Drag vers haut: diminue height seulement
      scaleY = Math.max(0.1, (oldTextHeightPx - dyScreen) / oldTextHeightPx);
      break;
    case 'right':
      // Drag vers droite: augmente width seulement
      scaleX = Math.max(0.1, (oldTextWidthPx + dxScreen) / oldTextWidthPx);
      break;
    case 'bottom':
      // Drag vers bas: augmente height seulement
      scaleY = Math.max(0.1, (oldTextHeightPx + dyScreen) / oldTextHeightPx);
      break;
    case 'left':
      // Drag vers gauche: diminue width seulement
      scaleX = Math.max(0.1, (oldTextWidthPx - dxScreen) / oldTextWidthPx);
      break;
  }
  
  // ÉTAPE 5: Appliquer le PLUS PETIT scale pour garder proportions
  // On veut que le texte grandisse uniformément
  const scale = Math.min(scaleX, scaleY);
  
  // ÉTAPE 6: Calculer nouvelle FONT SIZE
  // Limites: min 6px, max 200px pour rester lisible
  const newFontSize = Math.max(6, Math.min(200, textElement.fontSize * scale));
  
  // ÉTAPE 7: Recalculer les NOUVELLES DIMENSIONS
  const newLineHeight = newFontSize * 1.2;
  const newTextHeightPx = lines.length * newLineHeight;
  
  // On scale la largeur proportionnellement à la fontSize
  const newTextWidthPx = oldTextWidthPx * (newFontSize / textElement.fontSize);
  
  // Convertir en coordonnées monde
  const newWidthWorld = newTextWidthPx / viewport.zoom;
  const newHeightWorld = newTextHeightPx / viewport.zoom;
  
  // ÉTAPE 8: REPOSITIONNER le texte pour garder le COIN OPPOSÉ FIXE
  // ⚠️ CRITIQUE: Pour un texte, (x,y) = baseline en bas à gauche
  // Donc quand on drag une poignée, on doit recalculer x et y pour que
  // le coin OPPOSÉ reste à la même position
  let newX = textElement.x;
  let newY = textElement.y;
  
  switch (handle) {
    case 'topLeft':
      // Coin opposé: bottomRight (reste fixe)
      // newX: on va vers la gauche depuis bottomRight
      // newY: baseline reste au niveau de bottomRight (pas de -height!)
      newX = bottomRight.x - newWidthWorld;
      newY = bottomRight.y;
      break;
      
    case 'topRight':
      // Coin opposé: bottomLeft (reste fixe)
      // newX: reste au niveau de bottomLeft
      // newY: baseline reste au niveau de bottomLeft
      newX = bottomLeft.x;
      newY = bottomLeft.y;
      break;
      
    case 'bottomLeft':
      // Coin opposé: topRight (reste fixe)
      // newX: on va vers la gauche depuis topRight
      // newY: baseline DESCEND de la hauteur
      newX = topRight.x - newWidthWorld;
      newY = topRight.y + newHeightWorld;
      break;
      
    case 'bottomRight':
      // Coin opposé: topLeft (reste fixe)
      // newX: reste au niveau de topLeft
      // newY: baseline DESCEND de la hauteur
      newX = topLeft.x;
      newY = topLeft.y + newHeightWorld;
      break;
      
    case 'top':
      // Milieu haut: bas reste fixe
      // newX: ne change pas
      // newY: baseline reste au niveau du bas
      newX = textElement.x;
      newY = bottomLeft.y;
      break;
      
    case 'bottom':
      // Milieu bas: haut reste fixe
      // newX: ne change pas
      // newY: baseline DESCEND depuis le haut
      newX = textElement.x;
      newY = topLeft.y + newHeightWorld;
      break;
      
    case 'left':
      // Milieu gauche: droite reste fixe
      // newX: on va vers la gauche depuis la droite
      // newY: ne change pas
      newX = topRight.x - newWidthWorld;
      newY = textElement.y;
      break;
      
    case 'right':
      // Milieu droit: gauche reste fixe
      // newX: reste au niveau de la gauche
      // newY: ne change pas
      newX = topLeft.x;
      newY = textElement.y;
      break;
  }
  
  // ÉTAPE 9: Retourner le texte MODIFIÉ
  return {
    ...textElement,
    x: newX,
    y: newY,
    fontSize: newFontSize
  };
}, [worldToScreenWrapper, viewport]);
```

---

## Détection de Poignée Cliquée

**Fichier**: `src/CADEditor.jsx`, ligne ~1110

```javascript
// Dans handleMouseDown, outil 'edit', élément de type 'text'

// ÉTAPE 1: Récupérer positions des poignées en CANVAS-RELATIVE
const handlePointsScreen = getTextControlPointsScreen(el);

const canvas = getCanvasRef().current;
if (!canvas) continue;
const rect = canvas.getBoundingClientRect();

// ÉTAPE 2: Convertir position du clic de CLIENT → CANVAS-RELATIVE
// e.clientX, e.clientY sont en coordonnées CLIENT (fenêtre du navigateur)
// On soustrait rect.left/top pour obtenir des coordonnées CANVAS-RELATIVE
const clickScreenX = e.clientX - rect.left;
const clickScreenY = e.clientY - rect.top;

// ÉTAPE 3: Tester chaque poignée pour voir si elle est cliquée
for (const cp of handlePointsScreen) {
  // cp.x et cp.y sont déjà en CANVAS-RELATIVE (retour de getTextControlPointsScreen)
  const dist = Math.sqrt((cp.x - clickScreenX) ** 2 + (cp.y - clickScreenY) ** 2);
  
  // Seuil de 12 pixels pour faciliter le clic
  if (dist < 12) {
    // ÉTAPE 4: Convertir position de la poignée en COORDONNÉES MONDE
    // ⚠️ CRITIQUE: screenToWorldWrapper attend des coordonnées CLIENT, pas canvas-relative!
    // Donc on doit reconvertir: CANVAS-RELATIVE → CLIENT en ajoutant rect.left/top
    const handleWorld = screenToWorldWrapper(cp.x + rect.left, cp.y + rect.top);
    
    // ÉTAPE 5: Sauvegarder position EXACTE de la poignée comme point de départ
    // ⚠️ IMPORTANT: On sauvegarde la position de la POIGNÉE, pas du CLIC
    // Ça évite un "saut" initial causé par la distance entre clic et centre de poignée
    setEditingPoint({
      elementId: el.id,
      pointType: cp.label,
      originalElement: JSON.parse(JSON.stringify(el)),
      startPoint: handleWorld
    });
    setDragStart(handleWorld);
    return;
  }
}
```

---

## Résumé des Pièges à Éviter

### 1. **Vecteur vs Position**
```javascript
// ❌ INCORRECT: Traiter un delta comme une position
const deltaWorld = { x: 10, y: 5 };
const deltaScreen = worldToScreen(deltaWorld.x, deltaWorld.y, canvas, viewport);
// Ajoute incorrectement pan et center!

// ✅ CORRECT: Multiplier par zoom seulement
const deltaScreen = {
  x: deltaWorld.x * viewport.zoom,
  y: deltaWorld.y * viewport.zoom
};
```

### 2. **Canvas-Relative vs Client**
```javascript
// ❌ INCORRECT: Passer canvas-relative à screenToWorld
const handlePos = getTextControlPointsScreen(el)[0];
const worldPos = screenToWorld(handlePos.x, handlePos.y, canvas, viewport);
// screenToWorld attend CLIENT, pas canvas-relative!

// ✅ CORRECT: Convertir canvas-relative → client d'abord
const rect = canvas.getBoundingClientRect();
const worldPos = screenToWorld(
  handlePos.x + rect.left,  // Canvas-relative → Client
  handlePos.y + rect.top,
  canvas,
  viewport
);
```

### 3. **Baseline du Texte**
```javascript
// ⚠️ Pour un texte, (x, y) = BASELINE EN BAS À GAUCHE
// Donc le texte s'étend VERS LE HAUT

// ❌ INCORRECT: Traiter (x,y) comme coin supérieur gauche
const topY = textElement.y;

// ✅ CORRECT: Le haut est en dessous de la baseline
const topY = textElement.y - textHeight;

// Quand on resize par le HAUT, la baseline (y) ne change PAS
case 'topRight':
  newY = bottomLeft.y;  // Baseline reste au niveau du bas
```

### 4. **Initialisation de dragStart**
```javascript
// ❌ INCORRECT: Utiliser position du clic
setDragStart({ x: snapped.x, y: snapped.y });
// Cause un saut initial car le clic n'est pas exactement sur la poignée

// ✅ CORRECT: Utiliser position EXACTE de la poignée
const handleWorld = screenToWorldWrapper(cp.x + rect.left, cp.y + rect.top);
setDragStart(handleWorld);
// Pas de saut car dx et dy seront calculés depuis la vraie position de la poignée
```


