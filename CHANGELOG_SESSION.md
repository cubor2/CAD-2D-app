# Changelog - Session du 17 octobre 2025

## 🎨 Nouvelles fonctionnalités

### 1. **Courbes de Bézier quadratiques (Style Flash)**
- Transformation interactive des lignes en courbes en tirant le point du milieu
- Affichage de la "cage de Bézier" (lignes pointillées bleues) lors de l'édition
- Drag immédiat du point de contrôle en un seul geste (clic-maintenir-glisser)
- Support complet de l'édition : déplacement des 3 points de contrôle (début, milieu/contrôle, fin)
- Sélection par rectangle fonctionnelle
- Copier/coller avec décalage automatique

**Fichiers modifiés** :
- `src/CADEditor.jsx` : Logique de transformation ligne → courbe, édition des points de contrôle
- `src/utils/drawing.js` : Rendu des courbes avec `quadraticCurveTo`
- `src/utils/snap.js` : Ajout des points de snap pour les courbes
- `src/utils/geometry.js` : Calcul des points de snap sur les courbes

### 2. **Import SVG amélioré**
- Support complet des arcs elliptiques (`A`/`a` commands)
- Support des courbes de Bézier lisses (`S`/`s`, `T`/`t` commands)
- Algorithme de subdivision pour les arcs elliptiques avec rotation
- Calcul automatique des points de contrôle réfléchis pour les courbes lisses
- Centrage automatique des imports à l'origine (0, 0) du canvas

**Fichiers modifiés** :
- `src/utils/svgImporter.js` : 
  - Fonction `subdivideEllipticalArc` (lignes 119-181)
  - Amélioration de `pathToElements` avec tracking des derniers points de contrôle
  - Correction du centrage dans `scaleAndCenterElements`

## 🐛 Corrections de bugs

### 3. **Bug ellipse → cercle lors de la suppression d'un quartier**
- **Problème** : Lors de la suppression d'un quartier d'ellipse, elle se transformait en cercle
- **Solution** : Conservation des propriétés `radiusX` et `radiusY` dans les arcs créés
- **Rendu** : Utilisation de `ctx.ellipse()` au lieu de `ctx.arc()` pour les arcs elliptiques

**Fichiers modifiés** :
- `src/CADEditor.jsx` : Fonction `handleDelete` (lignes 487-525)
- `src/utils/drawing.js` : Rendu des arcs (lignes 194-249)

### 4. **Sélection des ellipses en mode Edit**
- **Problème** : Impossible de sélectionner les quartiers (bords en orange) des ellipses
- **Solution** : Calcul correct du rayon à l'angle du clic pour les ellipses
- **Formule** : `radiusAtAngle = (radiusX * radiusY) / sqrt((radiusY * cos(angle))² + (radiusX * sin(angle))²)`

**Fichiers modifiés** :
- `src/CADEditor.jsx` : Détection des bords d'ellipses (lignes 1381-1416)

### 5. **Drag immédiat des points de contrôle**
- **Problème** : Il fallait cliquer 2 fois pour déplacer le point bleu du milieu d'une ligne
- **Solution** : 
  - Vérification prioritaire des points de contrôle avant la détection de bords
  - Suppression de la détection de bords (`selectedEdge`) pour les lignes (conflit)
  - Mise à jour automatique de `editingPoint.pointType` lors de la transformation ligne → courbe
  - Zone d'exclusion autour des points de contrôle
  - Augmentation du seuil de détection : 20 pixels

**Fichiers modifiés** :
- `src/CADEditor.jsx` : 
  - Réorganisation de la priorité de détection (lignes 1228-1495)
  - Transformation `'middle'` → `'control'` (lignes 1741-1744)
  - Suppression de la détection de bords pour les lignes

### 6. **Sélection des courbes améliorée**
- **Problème** : Les courbes étaient difficiles à sélectionner avec l'outil "Sélectionner"
- **Solution** : 
  - Augmentation de la précision : pas de 0.05 → 0.02
  - Doublement du seuil : 5 pixels → 10 pixels

**Fichiers modifiés** :
- `src/CADEditor.jsx` : Détection des clics sur courbes (lignes 1095-1109)

### 7. **Snap des courbes**
- **Problème** : Les bords des courbes ne snapaient pas sur les autres éléments
- **Solution** : 
  - Ajout des points de snap : extrémités + 3 points intermédiaires (t = 0.25, 0.5, 0.75)
  - Calcul du point le plus proche sur toute la courbe pour le snap de bord
  - Support des guides horizontaux/verticaux

**Fichiers modifiés** :
- `src/utils/geometry.js` : `getElementSnapPoints` (lignes 55-69)
- `src/utils/snap.js` : 
  - `findGuideSnapPosition` (lignes 18-39)
  - `findSnapPoints` (lignes 91-126)

### 8. **Copier/coller des courbes**
- **Problème** : Les courbes collées restaient au même endroit (pas de décalage)
- **Solution** : Ajout du support des courbes dans `handlePaste` avec offset sur tous les points (x1, y1, x2, y2, cpx, cpy)

**Fichiers modifiés** :
- `src/CADEditor.jsx` : Fonction `handlePaste` (lignes 406-412)

## 🎯 Améliorations UX

### 9. **Affichage des dimensions**
- Les dimensions (cotes) ne s'affichent **que** lorsque la case "COTES" est cochée
- Suppression de l'affichage automatique lors de la sélection

**Fichiers modifiés** :
- `src/utils/drawing.js` : Conditions d'affichage des dimensions pour tous les types d'éléments

## 📊 Statistiques

- **Fichiers modifiés** : 5 fichiers principaux
- **Lignes de code ajoutées** : ~400 lignes
- **Nouvelles fonctionnalités** : 2 majeures (courbes de Bézier, import SVG avancé)
- **Bugs corrigés** : 6 bugs majeurs
- **Améliorations UX** : 3 améliorations significatives

## 🧪 Tests effectués

- ✅ Transformation ligne → courbe en un seul geste
- ✅ Sélection des courbes par clic et par rectangle
- ✅ Copier/coller des courbes avec décalage
- ✅ Import SVG complexe (pen tool Illustrator/Inkscape)
- ✅ Suppression de quartiers d'ellipses sans perte de forme
- ✅ Sélection et suppression des quartiers d'ellipses
- ✅ Snap des courbes sur autres éléments
- ✅ Affichage conditionnel des dimensions

## 🔄 Migration

Aucune migration nécessaire. Les fichiers JSON existants sont compatibles.
Les nouvelles courbes utilisent le type `'curve'` avec les propriétés :
- `x1`, `y1` : Point de départ
- `x2`, `y2` : Point d'arrivée
- `cpx`, `cpy` : Point de contrôle (control point)

---

**Date** : 17 octobre 2025
**Auteur** : Claude (Anthropic)
**Version** : 2.1.0

