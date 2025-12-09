# Bugfix - Rotation sans déformation & Amélioration des groupes

**Date:** 9 décembre 2025  
**Status:** ✅ Résolu

## Problèmes corrigés

### 1. Déformation lors des rotations successives

**Problème:**
- Les rotations successives de 45° causaient une déformation cumulative des objets complexes
- Chaque rotation appliquait un arrondi à la grille, créant une erreur cumulative

**Solution:**
- Retrait de tous les `snapToGridFn()` dans la fonction `handleRotate`
- Les coordonnées restent maintenant en précision flottante
- Aucune déformation, même après multiples rotations

**Fichier modifié:** `src/hooks/useElementTransforms.js`

### 2. Bounding box pour les groupes

**Problème:**
- Lorsqu'un groupe est sélectionné, un nuage de points de contrôle individuels s'affichait
- Difficile de visualiser et manipuler les groupes complexes, surtout en mode dézoomé

**Solution:**
- Ajout de `calculateGroupBoundingBox()` pour calculer le rectangle englobant d'un groupe
- Ajout de `drawGroupBoundingBox()` pour afficher un rectangle en pointillés avec 9 points de contrôle
- Les éléments individuels sont dessinés avec le style de sélection mais sans leurs points de contrôle

**Fichiers modifiés:**
- `src/utils/BoundingBox.js` - Fonction de calcul du bounding box incluant les finger joints
- `src/utils/drawing.js` - Fonction de dessin du bounding box + paramètre `hideControlPoints`
- `src/components/Canvas.jsx` - Détection et affichage du bounding box pour les groupes

### 3. Transformation des groupes

**Problème:**
- Impossible de transformer un groupe via ses points de contrôle
- Les 4 coins n'étaient pas cliquables en mode Edit

**Solution:**
- Détection des 9 points du bounding box avant les éléments individuels
- Support complet de la transformation :
  - **Centre** : Déplace tout le groupe
  - **4 coins** : Redimensionnement 2D avec ancrage au coin opposé
  - **4 milieux** : Redimensionnement 1D avec ancrage au côté opposé
- Changement de curseur approprié au survol des points

**Fichiers modifiés:**
- `src/CADEditor.jsx` - Détection et transformation des groupes en modes Select et Edit
- `src/utils/elementGeometry.js` - Ajout du curseur 'move' pour le point central

### 4. Sélection automatique des groupes

**Problème:**
- Cliquer sur un élément d'un groupe en mode Edit ne sélectionnait que cet élément

**Solution:**
- Appel automatique de `selectGroup()` lors du clic sur un élément
- Tout le groupe est maintenant sélectionné automatiquement

**Fichier modifié:** `src/CADEditor.jsx`

### 5. Maintien des proportions avec Shift

**Problème:**
- Shift sur les rectangles utilisait le centre comme ancre (déplacement du rectangle)
- Pas de support de Shift pour les groupes

**Solution:**
- Correction de l'ancrage pour les rectangles : coin opposé reste fixe
- Ajout du support Shift pour les groupes (moyenne des échelles X et Y)

**Fichier modifié:** `src/CADEditor.jsx`

### 6. Historique d'annulation (Ctrl+Z)

**Problème:**
- Les transformations de groupe créaient une entrée d'historique à chaque mouvement de souris
- Ctrl+Z annulait seulement un micro-mouvement au lieu de toute la transformation

**Solution:**
- Utilisation de `setElements()` pendant le drag (pas d'historique)
- Utilisation de `updateElements()` au mouseUp (une seule entrée d'historique)

**Fichier modifié:** `src/CADEditor.jsx`

### 7. Détection des points en mode Select

**Problème:**
- Les 4 coins du bounding box n'étaient pas cliquables en mode Select
- Impossible de déplacer le groupe en cliquant à l'intérieur

**Solution:**
- Ajout de la détection des 9 points du bounding box en mode Select
- Détection de clic à l'intérieur du bounding box pour déplacer le groupe
- Curseur "move" au survol de l'intérieur du bounding box

**Fichier modifié:** `src/CADEditor.jsx`

### 8. Calcul précis du bounding box pour finger joints

**Problème:**
- Le bounding box des finger joints ne prenait pas en compte l'épaisseur des dents
- Décalage des coins du bounding box

**Solution:**
- Calcul des points perpendiculaires avec offset d'épaisseur
- Inclusion de tous les points extrêmes des dents dans le calcul

**Fichier modifié:** `src/utils/BoundingBox.js`

### 9. Détection sans snap pour les points de groupe

**Problème:**
- Les points de contrôle du groupe étaient détectés après snap à la grille
- Décalage visible entre le clic (point vert) et le point de contrôle (point noir)

**Solution:**
- Utilisation de `point` (non-snappé) au lieu de `snapped` pour la détection
- Les points sont maintenant détectés précisément où ils sont affichés

**Fichier modifié:** `src/CADEditor.jsx`

### 10. Zoom centré sur la souris

**Problème:**
- Le zoom se faisait toujours au centre du canvas
- Nécessitait de zoomer puis se déplacer pour recentrer

**Solution:**
- Conversion de la position de la souris en coordonnées monde
- Ajustement du viewport pour garder le point sous la souris fixe
- Support de la position dynamique (recalculé à chaque événement wheel)

**Fichiers modifiés:**
- `src/hooks/useViewport.js` - Export de `setViewport`
- `src/CADEditor.jsx` - Calcul du nouveau viewport dans `handleWheel`

## Fichiers modifiés

- `src/hooks/useElementTransforms.js` - Rotation sans snap
- `src/utils/BoundingBox.js` - Calcul du bounding box avec finger joints
- `src/utils/drawing.js` - Dessin du bounding box + paramètre hideControlPoints
- `src/components/Canvas.jsx` - Intégration du bounding box
- `src/CADEditor.jsx` - Détection et transformation des groupes
- `src/utils/elementGeometry.js` - Curseur pour le centre
- `src/hooks/useViewport.js` - Export de setViewport

## Tests effectués

✅ Rotation multiple sans déformation  
✅ Affichage du bounding box pour les groupes  
✅ Tous les points de contrôle cliquables (9 points)  
✅ Transformation avec Shift (proportions maintenues)  
✅ Sélection automatique des groupes en mode Edit  
✅ Déplacement des groupes en mode Select  
✅ Ctrl+Z annule toute la transformation  
✅ Curseurs appropriés au survol  
✅ Zoom centré sur la souris (zoom avant)

