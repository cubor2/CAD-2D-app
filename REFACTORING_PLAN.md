# Plan de Refactoring - CADEditor.jsx

## 🎯 Objectif
Réduire `CADEditor.jsx` de 2987 lignes à ~500 lignes sans casser aucune fonctionnalité.

## 📊 État actuel
- **CADEditor.jsx** : 2987 lignes
- **Handlers de souris** : 1500+ lignes à eux seuls
- **Logique métier** : Mélangée avec la présentation

## 🏗️ Architecture cible

```
src/
├── CADEditor.jsx (500 lignes)
│   └── Composant principal (état + orchestration)
├── handlers/
│   ├── mouseHandlers.js (NOUVEAU)
│   │   ├── useMouseDown.js
│   │   ├── useMouseMove.js
│   │   └── useMouseUp.js
│   ├── transformHandlers.js (NOUVEAU)
│   └── textHandlers.js (existant, à enrichir)
├── hooks/
│   ├── useFileOperations.js (NOUVEAU)
│   ├── useClipboard.js (NOUVEAU)
│   ├── useElementTransforms.js (NOUVEAU)
│   └── useTextEditing.js (NOUVEAU)
└── utils/
    └── elementOperations.js (NOUVEAU)
```

## 📝 Phase 1 : Extraction des handlers de souris (CRITIQUE)

### 1.1 Créer `src/handlers/mouseHandlers/handleSelectTool.js`
**Lignes à extraire** : 1400-1532 (logique de sélection dans handleMouseDown)

```javascript
// Responsabilités :
// - Détection de clic sur élément
// - Gestion du double-clic
// - Démarrage du drag
// - Gestion des guides
// - Rectangle de sélection
```

### 1.2 Créer `src/handlers/mouseHandlers/handleEditTool.js`
**Lignes à extraire** : 1535-1996 (logique d'édition dans handleMouseDown)

```javascript
// Responsabilités :
// - Détection des control points
// - Gestion des edges
// - Édition de texte
// - Double-clic pour retour en mode select
```

### 1.3 Créer `src/handlers/mouseHandlers/handleDrawingTools.js`
**Lignes à extraire** : 1999-2054 (création d'éléments)

```javascript
// Responsabilités :
// - Initialisation des éléments (text, fingerJoint, line, etc.)
// - Configuration des paramètres par défaut
```

### 1.4 Créer `src/handlers/mouseHandlers/handleMouseMoveLogic.js`
**Lignes à extraire** : 2090-2649 (logique de handleMouseMove)

```javascript
// Sous-modules :
// - handleControlPointDrag.js (édition de points)
// - handleElementDrag.js (déplacement d'éléments)
// - handleDrawing.js (dessin en cours)
// - handleHover.js (détection de hover)
```

### 1.5 Créer `src/handlers/mouseHandlers/index.js`
**Hook principal qui expose** :

```javascript
export const useMouseHandlers = (dependencies) => {
  const handleMouseDown = useCallback(...);
  const handleMouseMove = useCallback(...);
  const handleMouseUp = useCallback(...);
  
  return { handleMouseDown, handleMouseMove, handleMouseUp };
};
```

## 📝 Phase 2 : Extraction de la logique métier

### 2.1 Créer `src/hooks/useElementTransforms.js`
**Lignes à extraire** : 445-856

```javascript
// Fonctions :
// - handleRotate
// - handleFlipHorizontal
// - handleFlipVertical
// - handleResizeElement
```

### 2.2 Créer `src/hooks/useFileOperations.js`
**Lignes à extraire** : 858-1129

```javascript
// Fonctions :
// - handleNew
// - handleOpen
// - handleSave
// - handleSaveAs
// - handleImportSVG
// - handleExport
// - handleLaserExport
// - handleLaserExportConfirm
```

### 2.3 Créer `src/hooks/useClipboard.js`
**Lignes à extraire** : 231-310

```javascript
// Fonctions :
// - handleCopy
// - handleCut
// - handlePaste
```

### 2.4 Enrichir `src/hooks/useTextEditing.js`
**Lignes à extraire** : 1131-1292 (useEffect text editing)

```javascript
// Responsabilités :
// - Gestion du curseur de texte
// - Gestion de la sélection
// - Gestion des touches clavier
// - getTextCursorPositionFromClick
```

### 2.5 Créer `src/utils/elementOperations.js`
**Lignes à extraire** : 311-403 (handleDelete)

```javascript
// Fonctions :
// - deleteElement
// - convertRectangleToLines
// - convertCircleToArcs
// - handleDelete (orchestration)
```

## 📝 Phase 3 : Simplification de l'état

### 3.1 Créer `src/hooks/useEditorState.js`
**Regrouper les états dispersés** :

```javascript
// Au lieu de 20+ useState, regrouper par thématique :
// - Drawing state (isDrawing, currentElement, startPoint, drawOrigin)
// - Editing state (editingPoint, selectedEdge, isDraggingEdge)
// - Text state (editingTextId, textCursorPosition, textSelection...)
// - Drag state (dragStart, isDraggingElements, dragOriginalElements)
// - UI state (contextMenu, showModals, hoverCursor)
```

## 📝 Phase 4 : Amélioration de la lisibilité

### 4.1 Créer `src/hooks/useCursor.js`
**Lignes à extraire** : 1316-1348

```javascript
// Logique de calcul du curseur actuel
export const useCursor = (dependencies) => {
  return useMemo(() => {
    // ... logique actuelle
  }, [dependencies]);
};
```

### 4.2 Créer `src/utils/clickDetection.js` (améliorer l'existant)
**Centraliser toute la logique de détection de clic** :

```javascript
// Fonctions :
// - detectClickedElement(point, elements, viewport)
// - detectControlPoint(point, element, viewport)
// - detectEdge(point, element, viewport)
// - isClickInsideElement(point, element)
```

## 🎯 Résultat attendu

### Avant
```
CADEditor.jsx : 2987 lignes (TOUT mélangé)
```

### Après
```
CADEditor.jsx : ~500 lignes
├── État (hooks) : ~100 lignes
├── Initialisation (useEffect, callbacks) : ~150 lignes
├── Integration (appels aux hooks) : ~150 lignes
└── JSX (render) : ~100 lignes

+ 15 fichiers bien organisés (~200 lignes chacun)
```

## ⚠️ Stratégie de migration (ZÉRO RISQUE)

### Étape par étape :

1. **Créer les nouveaux fichiers** (sans toucher à CADEditor.jsx)
2. **Tester individuellement** chaque fonction extraite
3. **Remplacer progressivement** dans CADEditor.jsx
4. **Tester après chaque remplacement**
5. **Garder la version actuelle en backup**

### Ordre recommandé :

1. ✅ Phase 2 d'abord (plus simple, moins de risques)
   - useFileOperations.js
   - useClipboard.js
   - useElementTransforms.js
   
2. ✅ Phase 3 (regroupement de l'état)
   - useEditorState.js
   
3. ✅ Phase 1 (plus complexe, mais gros gain)
   - Handlers de souris
   
4. ✅ Phase 4 (polissage)
   - Améliorations diverses

## 📊 Bénéfices attendus

### Maintenabilité
- ✅ Fichiers de ~200 lignes (faciles à comprendre)
- ✅ Responsabilités clairement séparées
- ✅ Tests unitaires possibles
- ✅ Modifications localisées

### Performance
- ✅ Pas d'impact (même code, juste réorganisé)
- ✅ Potentiel d'optimisation future

### Développement
- ✅ Onboarding plus facile
- ✅ Debugging simplifié
- ✅ Ajout de features plus rapide
- ✅ Moins de conflits Git

## 🔍 Risques identifiés

### Risque 1 : Dépendances circulaires
**Mitigation** : Bien définir la hiérarchie des imports

### Risque 2 : Perte de contexte
**Mitigation** : Documenter chaque extraction, garder les commentaires

### Risque 3 : Bugs introduits
**Mitigation** : Tests manuels complets après chaque phase

## 📅 Timeline suggérée

- **Phase 2** : 2-3 heures (faible risque)
- **Phase 3** : 1-2 heures (risque moyen)
- **Phase 1** : 4-5 heures (haute complexité)
- **Phase 4** : 1 heure (polissage)

**Total estimé** : 8-11 heures de travail
**Gain de maintenabilité** : +++++ (invaluable)

## 🚀 Prochaines étapes

1. **Valider ce plan** avec toi
2. **Choisir par quelle phase commencer**
3. **Créer une branche Git** pour le refactoring
4. **Procéder méthodiquement**
5. **Tester exhaustivement**
6. **Merger quand tout fonctionne parfaitement**

---

**Note** : Ce refactoring ne change AUCUNE fonctionnalité. C'est uniquement de la réorganisation du code pour le rendre plus maintenable.

