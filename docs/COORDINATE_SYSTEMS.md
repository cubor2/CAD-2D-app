# Systèmes de Coordonnées - Guide Technique

## 📐 Vue d'ensemble

L'application utilise **4 systèmes de coordonnées différents** qui doivent être correctement convertis entre eux. Une confusion entre ces systèmes est la cause principale des bugs de positionnement et de redimensionnement.

---

## 🎯 Les 4 Systèmes de Coordonnées

### 1. **Coordonnées Monde (World Coordinates)**
- **Unité**: millimètres (mm)
- **Origine**: Centre du plan de travail virtuel (0, 0)
- **Usage**: Position réelle des éléments dans le dessin
- **Exemple**: Un rectangle à `{ x: 100, y: 50, width: 200, height: 100 }` est à 100mm à droite et 50mm en haut du centre

```javascript
// Exemple d'élément en coordonnées monde
const element = {
  type: 'rectangle',
  x: 100,      // 100mm du centre (monde)
  y: 50,       // 50mm du centre (monde)
  width: 200,  // 200mm de large
  height: 100  // 100mm de haut
};
```

### 2. **Coordonnées Écran Canvas (Canvas Screen Coordinates)**
- **Unité**: pixels
- **Origine**: Coin supérieur gauche du canvas (0, 0)
- **Caractéristiques**: 
  - Affectées par le zoom
  - Affectées par le pan (viewport.x, viewport.y)
  - Relatives au canvas, PAS à la fenêtre du navigateur
- **Usage**: Dessin sur le canvas, positionnement des éléments visuels

```javascript
// Conversion monde → écran canvas
const worldToScreen = (worldX, worldY, canvas, viewport) => {
  const rect = canvas.getBoundingClientRect();
  const x = worldX * viewport.zoom + rect.width / 2 + viewport.x;
  const y = worldY * viewport.zoom + rect.height / 2 + viewport.y;
  return { x, y };
};
```

**Formule**:
```
screenX = worldX × zoom + (canvasWidth / 2) + pan.x
screenY = worldY × zoom + (canvasHeight / 2) + pan.y
```

### 3. **Coordonnées Client (Client Coordinates)**
- **Unité**: pixels
- **Origine**: Coin supérieur gauche de la **fenêtre du navigateur** (0, 0)
- **Caractéristiques**: 
  - C'est ce que retournent `e.clientX` et `e.clientY` dans les événements souris
  - Incluent le décalage du canvas par rapport à la fenêtre
- **Usage**: Événements souris/tactiles

```javascript
// Dans un gestionnaire d'événements
const handleMouseDown = (e) => {
  const clientX = e.clientX;  // Position dans la fenêtre
  const clientY = e.clientY;  // Position dans la fenêtre
};
```

### 4. **Coordonnées Canvas Relatives (Canvas-Relative Coordinates)**
- **Unité**: pixels
- **Origine**: Coin supérieur gauche du canvas (0, 0)
- **Caractéristiques**: 
  - Client coordinates - canvas offset
  - Utiles pour la détection de collision sur le canvas
- **Usage**: Hit detection locale, détection de poignées

```javascript
// Conversion client → canvas-relative
const canvas = canvasRef.current;
const rect = canvas.getBoundingClientRect();
const canvasX = e.clientX - rect.left;
const canvasY = e.clientY - rect.top;
```

---

## 🔄 Conversions Critiques

### World ↔ Client

```javascript
// World → Client
const worldToClient = (worldX, worldY) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const screenPos = worldToScreen(worldX, worldY, canvas, viewport);
  return {
    x: screenPos.x + rect.left,
    y: screenPos.y + rect.top
  };
};

// Client → World
const screenToWorld = (clientX, clientY, canvas, viewport) => {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left - rect.width / 2 - viewport.x) / viewport.zoom;
  const y = (clientY - rect.top - rect.height / 2 - viewport.y) / viewport.zoom;
  return { x, y };
};
```

### Delta (Déplacement) vs Position

**⚠️ CRITIQUE**: Les déplacements et les positions se convertissent DIFFÉREMMENT !

```javascript
// ❌ INCORRECT - Convertir un delta comme une position
const dx = 10;  // 10mm de déplacement en monde
const wrongDeltaScreen = worldToScreen(dx, 0, canvas, viewport).x;  
// Ajoute pan.x et canvas center - FAUX!

// ✅ CORRECT - Convertir un delta
const correctDeltaScreen = dx * viewport.zoom;  
// Juste multiplier par zoom - CORRECT!
```

**Règle d'or**:
- **Position**: Utiliser `worldToScreen()` / `screenToWorld()` (applique pan, center, zoom)
- **Delta/Vecteur**: Multiplier/diviser par `zoom` uniquement

---

## 🐛 Bugs Rencontrés et Solutions

### Bug #1: Téléportation du Texte au Redimensionnement

**Symptôme**: Quand on drag une poignée du haut (topLeft, topRight), le texte "téléporte" instantanément vers le haut.

**Cause**: 
1. `dragStart` était initialisé avec la position du **clic** au lieu de la position **exacte de la poignée**
2. Quand on calculait `dx` et `dy`, il y avait un offset initial causé par la distance entre le clic et le centre de la poignée

**Solution**:
```javascript
// ❌ AVANT (Incorrect)
setDragStart({ x: snapped.x, y: snapped.y });  // Position du clic

// ✅ APRÈS (Correct)
const handleWorld = screenToWorldWrapper(cp.x + rect.left, cp.y + rect.top);
setDragStart(handleWorld);  // Position exacte de la poignée
```

### Bug #2: Les Poignées du Haut Ne Fonctionnaient Pas

**Symptôme**: Seules les poignées du bas (bottomLeft, bottomRight) fonctionnaient correctement.

**Cause**: Pour un texte, `(x, y)` représente la **baseline en bas à gauche**, pas le coin supérieur gauche. Quand on redimensionnait par le haut, on déplaçait incorrectement la baseline.

**Solution**:
```javascript
// Pour les poignées du HAUT, la baseline (y) reste FIXE
case 'topLeft':
  newX = bottomRight.x - newWidthWorld;
  newY = bottomRight.y;  // ✅ Baseline reste au niveau du bas
  break;

// Pour les poignées du BAS, la baseline (y) se déplace
case 'bottomRight':
  newX = topLeft.x;
  newY = topLeft.y + newHeightWorld;  // ✅ Baseline descend
  break;
```

### Bug #3: Conversion Incorrecte de Poignée en Coordonnées Monde

**Symptôme**: Les poignées ne se cliquaient pas correctement, ou causaient des sauts au drag.

**Cause**: `getTextControlPointsScreen()` retourne des coordonnées **canvas-relative**, mais on les passait directement à `screenToWorldWrapper()` qui attend des coordonnées **client**.

**Solution**:
```javascript
// ❌ AVANT (Incorrect)
const handleWorld = screenToWorldWrapper(cp.x, cp.y);
// cp.x et cp.y sont canvas-relative, mais screenToWorldWrapper attend client!

// ✅ APRÈS (Correct)
const handleWorld = screenToWorldWrapper(cp.x + rect.left, cp.y + rect.top);
// Convertit canvas-relative → client d'abord
```

### Bug #4: Double Calcul de Delta

**Symptôme**: Le redimensionnement était erratique, avec des changements de taille trop importants.

**Cause**: On convertissait `dx` et `dy` (qui sont des **déplacements**) comme des **positions** avec `worldToScreen()`, ce qui ajoutait incorrectement le pan et le centre.

**Solution**:
```javascript
// ❌ AVANT (Incorrect)
const zeroScreen = worldToScreenWrapper(0, 0);
const deltaScreen = worldToScreenWrapper(dx, dy);
const dxScreen = deltaScreen.x - zeroScreen.x;  // Compliqué et incorrect

// ✅ APRÈS (Correct)
const dxScreen = dx * viewport.zoom;  // Simple et correct
const dyScreen = dy * viewport.zoom;
```

---

## 📚 Fonctions Clés et Leur Rôle

### `getTextControlPointsScreen(textElement)`

**Rôle**: Calculer les positions des 8 poignées de redimensionnement en coordonnées **canvas-relative**.

**Points d'attention**:
- Les dimensions du texte (`textWidth`, `textHeight`) sont en pixels **logiques** (basées sur `fontSize`)
- Ces dimensions sont déjà "zoomées" par le rendering du canvas
- `worldToScreen()` applique le zoom sur les positions, pas besoin de re-multiplier

```javascript
const getTextControlPointsScreen = useCallback((textElement) => {
  const pos = worldToScreenWrapper(textElement.x, textElement.y);
  
  // Dimensions en pixels logiques (fontSize = pixels à l'écran)
  const textWidth = Math.max(...widths, textElement.fontSize * 3);
  const textHeight = lines.length * lineHeight;
  
  // Retourne canvas-relative coordinates
  return [
    { x: pos.x, y: pos.y - textHeight, label: 'topLeft' },
    // ...
  ];
}, [worldToScreenWrapper]);
```

### `handleTextResize(textElement, handle, dx, dy)`

**Rôle**: Redimensionner un texte en gardant le point opposé fixe.

**Algorithme**:
1. Calculer les 4 coins du texte en coordonnées **monde** (avant resize)
2. Convertir `dx`, `dy` (monde) en `dxScreen`, `dyScreen` (pixels) avec `× zoom`
3. Calculer le facteur de scale basé sur le déplacement en pixels
4. Calculer la nouvelle `fontSize` avec ce scale
5. Recalculer les nouvelles dimensions en monde
6. Repositionner le texte pour que le coin **opposé** reste fixe

```javascript
// 1. Sauvegarder les coins en coordonnées monde
const topLeft = { x: textElement.x, y: textElement.y - oldHeightWorld };
const bottomRight = { x: textElement.x + oldWidthWorld, y: textElement.y };

// 2. Convertir delta (vecteur) correctement
const dxScreen = dx * viewport.zoom;  // Pas worldToScreen()!

// 3. Calculer scale
const scaleX = (oldTextWidthPx + dxScreen) / oldTextWidthPx;

// 4. Nouvelle fontSize
const newFontSize = textElement.fontSize * scale;

// 5. Garder le coin opposé fixe
case 'topRight':
  newX = bottomLeft.x;           // X du coin bas-gauche
  newY = bottomLeft.y;           // Y du coin bas-gauche (baseline)
  break;
```

---

## ✅ Checklist pour Éviter les Bugs de Coordonnées

Avant de manipuler des coordonnées, demandez-vous:

1. **Est-ce une position ou un déplacement (delta/vecteur)?**
   - Position → `worldToScreen()` / `screenToWorld()`
   - Delta → `× zoom` ou `/ zoom`

2. **Dans quel système de coordonnées suis-je?**
   - Monde (mm)
   - Canvas-relative (pixels)
   - Client (pixels)
   - Screen canvas (pixels)

3. **Quelle fonction de conversion utiliser?**
   - Monde ↔ Client: `worldToScreen()` + offset / `screenToWorld()`
   - Canvas-relative → Client: `+ rect.left/top`
   - Client → Canvas-relative: `- rect.left/top`

4. **Pour les textes, où est l'origine?**
   - `(x, y)` = **baseline en bas à gauche**
   - Hauteur s'étend vers le **haut** (coordonnées négatives en Y relatif)

5. **Est-ce que je manipule des dimensions rendues?**
   - `ctx.measureText()` retourne des pixels **logiques**
   - Le canvas applique automatiquement des transformations
   - Ne pas re-multiplier par zoom si déjà appliqué par le rendering

---

## 🎓 Exemple Complet: Workflow de Redimensionnement de Texte

```javascript
// 1. Utilisateur clique sur une poignée
handleMouseDown(e) {
  // Coordonnées client du clic
  const clientX = e.clientX;
  const clientY = e.clientY;
  
  // Conversion en canvas-relative pour hit detection
  const canvasX = clientX - rect.left;
  const canvasY = clientY - rect.top;
  
  // Récupérer positions des poignées (canvas-relative)
  const handles = getTextControlPointsScreen(textElement);
  
  // Trouver poignée cliquée
  for (const handle of handles) {
    const dist = distance(handle.x, handle.y, canvasX, canvasY);
    if (dist < 12) {
      // Convertir position poignée: canvas-relative → client → world
      const handleWorld = screenToWorld(
        handle.x + rect.left,  // Canvas-relative → Client
        handle.y + rect.top,
        canvas,
        viewport
      );
      
      // Sauvegarder comme point de départ (MONDE)
      setDragStart(handleWorld);
    }
  }
}

// 2. Utilisateur drag la poignée
handleMouseMove(e) {
  // Nouvelle position en monde
  const currentWorld = screenToWorld(e.clientX, e.clientY, canvas, viewport);
  
  // Calculer déplacement en monde (delta/vecteur)
  const dx = currentWorld.x - dragStart.x;
  const dy = currentWorld.y - dragStart.y;
  
  // Redimensionner
  const resized = handleTextResize(textElement, handle, dx, dy);
}

// 3. Dans handleTextResize
handleTextResize(textElement, handle, dx, dy) {
  // dx et dy sont en MONDE (mm)
  
  // Convertir en pixels pour calcul de scale
  const dxScreen = dx * viewport.zoom;  // Vecteur: juste × zoom
  const dyScreen = dy * viewport.zoom;
  
  // Calculer scale basé sur dimensions en pixels
  const scaleX = (oldWidthPx + dxScreen) / oldWidthPx;
  
  // Nouvelle fontSize (proportionnelle)
  const newFontSize = oldFontSize * scale;
  
  // Repositionner pour garder coin opposé fixe (en MONDE)
  const newX = oppositeCorner.x - newWidthWorld;
  const newY = oppositeCorner.y;  // Baseline fixe pour handle du haut
  
  return { ...textElement, x: newX, y: newY, fontSize: newFontSize };
}
```

---

## 🔧 Debugging: Comment Identifier un Bug de Coordonnées

### Symptômes Communs

| Symptôme | Cause Probable | Solution |
|----------|---------------|----------|
| Élément "saute" au premier mouvement | Delta calculé comme position | Convertir delta avec `× zoom` uniquement |
| Élément se téléporte loin | Mauvais système de coordonnées | Vérifier client vs canvas-relative |
| Comportement change avec zoom | Oubli d'appliquer zoom | Multiplier/diviser par `viewport.zoom` |
| Poignées non cliquables | Coordonnées de détection incorrectes | Vérifier `rect.left/top` dans conversion |
| Élément ne reste pas fixe au resize | Mauvais point d'ancrage | Recalculer position depuis coin opposé |

### Technique de Debug

```javascript
console.log('=== DEBUG COORDINATES ===');
console.log('Client:', { x: e.clientX, y: e.clientY });
console.log('Canvas-relative:', { x: canvasX, y: canvasY });
console.log('World:', worldPos);
console.log('Viewport:', { zoom: viewport.zoom, pan: { x: viewport.x, y: viewport.y }});
console.log('Rect:', rect);
```

---

## 📖 Ressources et Références

- `src/utils/transforms.js` - Fonctions de conversion monde ↔ écran
- `src/CADEditor.jsx` - Logique principale de gestion des coordonnées
- `src/utils/drawing.js` - Rendering des éléments sur canvas
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

**Date de dernière mise à jour**: 2025-10-15  
**Auteur**: Documentation générée suite au debugging intensif du système de redimensionnement de texte


