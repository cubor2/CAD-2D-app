# Correction du système de snap et divers bugs
**Date**: 22 octobre 2025
**Durée**: ~3h de debug intensif

## 🎯 Objectif principal
Refondre complètement le système de snap pour qu'il soit simple, performant et maintenable, tout en corrigeant plusieurs bugs de l'interface utilisateur.

---

## 🐛 Bugs résolus

### 1. **Système de snap complexe et bugué**
**Problème**: Le système utilisait `draggedControlPoint` pour mémoriser un point fixe au début du drag, mais ce système était trop complexe et ne fonctionnait pas correctement.

**Symptômes**:
- Les cercles verts/rouges ne changeaient pas de couleur
- Pas de snap entre éléments
- Points de snap incorrects ou décalés

**Solution**: 
- Suppression de `draggedControlPoint` (système trop complexe)
- Simplification : utilisation de `computeSnap` directement sur la position actuelle de la souris
- Le point de référence est maintenant dynamique (position snappée actuelle) au lieu d'être fixe

**Fichiers modifiés**:
- `src/CADEditor.jsx`: Suppression de l'état `draggedControlPoint` et simplification de la logique de drag
- `src/utils/snap.js`: Fonction `applyMultiPointSnap` plus simple

**Commit**: Simplifier le système de snap en supprimant draggedControlPoint

---

### 2. **Éléments qui "disparaissent" pendant le drag**
**Problème**: Lors du drag, les éléments partaient très loin (en bas à droite) au lieu de suivre la souris.

**Cause racine**: Plusieurs problèmes en cascade :

#### 2.1 Bug de closure React
Les dépendances de `handleMouseMove` ne contenaient pas `dragOriginalElements`, donc le callback utilisait toujours la valeur initiale `[]`.

**Solution**: Ajout de `dragOriginalElements` aux dépendances du `useCallback`

#### 2.2 Mélange coordonnées écran/monde
`canvasX` et `canvasY` (coordonnées relatives au canvas) étaient passés à `screenToWorldWrapper` qui attend des coordonnées absolutes (`e.clientX/Y`).

**Résultat**: Double soustraction de `rect.left`, causant un décalage énorme.

**Solution**: Utiliser `e.clientX` et `e.clientY` directement au lieu de `canvasX` et `canvasY`

#### 2.3 Décalage de 13mm au début du drag
**Cause**: Conversion incorrecte des coordonnées (voir 2.2)

**Solution**: Même correction que 2.2

**Fichiers modifiés**:
- `src/CADEditor.jsx` (ligne 2328 et 2224)

**Commits**: 
- Corriger le bug de closure React
- Corriger le mélange coordonnées écran/monde

---

### 3. **Téléportation de l'élément au début du drag**
**Problème**: Dès qu'on commençait à déplacer un élément, il se téléportait en haut à gauche.

**Cause**: Timing React - `selectedIds` n'était pas encore mis à jour quand on initialisait `dragOriginalElements`, donc on capturait les mauvais éléments (ou aucun).

**Solution**:
- Création d'une variable locale `elementsToSelect` qui capture immédiatement les bons IDs
- Utilisation de `dragOriginalElements.find()` au lieu de `selectedIds.includes()` dans `handleMouseMove`

**Fichiers modifiés**:
- `src/CADEditor.jsx` (lignes 1310-1329 et 2248-2249)

**Commit**: Corriger la téléportation : capturer elementsToSelect au moment du clic

---

### 4. **Règles et bordures noires mal positionnées**
**Problème**: 
- Les éléments s'affichaient par-dessus les règles
- Les règles s'affichaient par-dessus les bordures noires

**Solution**: Réorganisation de l'ordre de rendu dans `Canvas.jsx` :
1. Grid & Zone de travail (fond)
2. Guides
3. **Éléments** (rectangles, lignes, etc.)
4. **Règles** (au-dessus des éléments)
5. **Bordures noires** (au-dessus des règles)
6. Snap point (tout en haut)

**Fichiers modifiés**:
- `src/components/Canvas.jsx`

**Commit**: Réorganiser l'ordre de rendu : bordures > règles > éléments

---

### 5. **Zone de travail : impossible de taper plusieurs chiffres**
**Problème**: Quand on tapait "500" dans les champs width/height, on perdait le focus après chaque chiffre.

**Cause**: Le composant `WorkAreaSection` était défini **à l'intérieur** de `PropertiesPanel`, donc il était recréé à chaque render, perdant ainsi le focus des inputs.

**Solution**:
- Sortir `WorkAreaSection` en tant que composant indépendant (en dehors de `PropertiesPanel`)
- Utiliser des états locaux (`workAreaWidthInput` et `workAreaHeightInput`)
- Ne mettre à jour `workArea` qu'au `onBlur` ou `Enter`

**Fichiers modifiés**:
- `src/components/PropertiesPanel.jsx`

**Commit**: Sortir WorkAreaSection pour éviter la perte de focus des inputs

---

### 6. **Guides trop "sticky"**
**Problème**: Quand un élément était près d'un guide, impossible de le manipuler car on attrapait toujours le guide.

**Solution**:
- Réduction de la distance de détection des guides de **5px à 2px**
- Déplacement de la vérification des guides **APRÈS** celle des éléments (priorité inversée)
- Création de nouveaux guides depuis la règle reste prioritaire

**Fichiers modifiés**:
- `src/CADEditor.jsx` (lignes 1198-1335)

**Commit**: Réduire la priorité des guides et distance de détection

---

## 📊 Statistiques

- **Bugs corrigés**: 6 problèmes majeurs
- **Lignes de code supprimées**: ~100 (simplification)
- **Fichiers modifiés**: 4 fichiers principaux
- **Commits**: 11 commits atomiques
- **Temps de debug**: ~3h

---

## 🧠 Leçons apprises

### 1. **Closures React et dépendances**
Toujours vérifier que TOUTES les valeurs utilisées dans un `useCallback` sont dans le tableau de dépendances. Une closure stale peut causer des bugs très subtils.

### 2. **Coordonnées écran vs monde**
Dans une application avec zoom/pan, il faut **toujours** être conscient du système de coordonnées :
- Coordonnées **écran** (pixels) : `e.clientX - rect.left`
- Coordonnées **monde** : nécessitent `screenToWorld()`
- Ne jamais mélanger les deux !

### 3. **Timing React**
`setState` n'est PAS immédiat. Si on a besoin de la nouvelle valeur immédiatement, il faut la capturer dans une variable locale.

### 4. **Ordre de rendu**
Dans Canvas, l'ordre d'appel des fonctions de dessin détermine l'ordre d'affichage. Bien le documenter pour éviter les confusions.

### 5. **Composants fonctionnels**
Ne JAMAIS définir un composant à l'intérieur d'un autre composant, sinon il sera recréé à chaque render.

---

## 🎯 Résultat final

✅ Système de snap simple et performant
✅ Drag & drop fluide sans téléportation
✅ Interface cohérente et intuitive
✅ Code maintenable et bien structuré
✅ Règles et bordures correctement affichées
✅ Inputs fonctionnels sans perte de focus
✅ Guides moins intrusifs

Le système est maintenant **production-ready** ! 🚀

