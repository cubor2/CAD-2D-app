# Audit de CADEditor.jsx

## 📈 Statistiques

| Métrique | Valeur | État |
|----------|--------|------|
| **Lignes totales** | 2987 | 🔴 Critique |
| **Fonctions** | ~40 | 🟡 Élevé |
| **useState** | 23 | 🟡 Élevé |
| **useCallback** | 15+ | 🟡 Élevé |
| **Complexité cyclomatique** | Très élevée | 🔴 Critique |

## 🔍 Analyse détaillée

### Répartition des lignes

```
CADEditor.jsx (2987 lignes)
│
├── Imports (23 lignes)
│
├── État & Hooks (100 lignes)
│   ├── useState × 23
│   ├── useRef × 1
│   ├── useCallback × 15+
│   ├── useEffect × 2
│   └── useMemo × 1
│
├── Fonctions utilitaires (60 lignes)
│   ├── getTextCursorPositionFromClick
│   └── updateSnapPointForDrag, applySnap
│
├── Clipboard Operations (80 lignes)
│   ├── handleCopy
│   ├── handleCut
│   └── handlePaste
│
├── Element Operations (100 lignes)
│   └── handleDelete (complexe avec sous-cas)
│
├── Element Movement (40 lignes)
│   └── handleMoveElements
│
├── Transformations (400 lignes) ⚠️
│   ├── handleRotate (110 lignes)
│   ├── handleFlipHorizontal (70 lignes)
│   ├── handleFlipVertical (70 lignes)
│   └── handleResizeElement (160 lignes)
│
├── File Operations (270 lignes)
│   ├── handleNew, handleOpen
│   ├── handleSave, handleSaveAs
│   ├── handleImportSVG
│   ├── handleExport
│   ├── handleLaserExport
│   └── handleLaserExportConfirm
│
├── Text Editing Logic (160 lignes) ⚠️
│   └── useEffect pour gestion clavier
│
├── Keyboard Shortcuts (20 lignes)
│   └── useKeyboardShortcuts hook
│
├── Cursor Logic (30 lignes)
│   └── useMemo pour calcul du curseur
│
├── 🔴 handleMouseDown (700 lignes) !!! CRITIQUE !!!
│   ├── Guides (40 lignes)
│   ├── Pan detection (5 lignes)
│   ├── Tool: select (130 lignes)
│   ├── Tool: edit (460 lignes) ← LE PIRE
│   ├── Tool: text (20 lignes)
│   ├── Tool: fingerJoint (20 lignes)
│   └── Tool: autres (25 lignes)
│
├── 🔴 handleMouseMove (600 lignes) !!! CRITIQUE !!!
│   ├── Guide dragging (20 lignes)
│   ├── Pan handling (5 lignes)
│   ├── Hover detection (50 lignes)
│   ├── Text selection drag (10 lignes)
│   ├── Edge dragging (25 lignes)
│   ├── Control point editing (350 lignes) ← ÉNORME
│   ├── Element dragging (80 lignes)
│   ├── Selection box (10 lignes)
│   └── Drawing (50 lignes)
│
├── 🟡 handleMouseUp (210 lignes) !! GROS !!
│   ├── Guide cleanup (25 lignes)
│   ├── Pan end (5 lignes)
│   ├── Edit point end (10 lignes)
│   ├── Edge drag end (10 lignes)
│   ├── Text selection end (5 lignes)
│   ├── Selection box end (40 lignes)
│   ├── Drawing end (100 lignes)
│   └── Element drag end (15 lignes)
│
├── handleWheel (7 lignes)
│
└── JSX Render (113 lignes)
    ├── MenuBar
    ├── Toolbar
    ├── TopControls
    ├── Canvas
    ├── ContextMenu
    ├── PropertiesPanel
    ├── DesignSystem modal
    └── LaserExportModal
```

## 🚨 Points critiques identifiés

### 1. handleMouseDown - Outil 'edit' (460 lignes)
**Problème** : Tout est dans un seul `if (tool === 'edit')` gigantesque

**Responsabilités** :
- Détection du double-clic
- Vérification des control points pour les éléments sélectionnés
- Gestion de l'édition de texte inline
- Vérification des edges de rectangles/cercles
- Détection de drag sur éléments entiers
- Vérification des control points pour éléments non-sélectionnés
- Détection de clic sur nouveaux éléments

**Solution** : Découper en 7 sous-fonctions

### 2. handleMouseMove - Control point editing (350 lignes)
**Problème** : Énorme `if (tool === 'edit' && editingPoint)` avec tous les types

**Responsabilités** :
- Text/Rectangle resizing (160 lignes)
- Line/FingerJoint editing (90 lignes)
- Curve control point (50 lignes)
- Circle radius editing (60 lignes)
- Arc angle editing (20 lignes)

**Solution** : Un fichier par type d'élément

### 3. Transformations (400 lignes)
**Problème** : Rotation, flip, resize sont très similaires mais répétitifs

**Responsabilités** :
- Calcul du centre de transformation
- Application de la transformation
- Gestion du snap

**Solution** : Abstraire la logique commune, factory pattern

## 📊 Analyse de complexité

### Complexité cyclomatique (estimation)

| Fonction | Lignes | Complexité | État |
|----------|--------|------------|------|
| **handleMouseDown** | 700 | ~80 | 🔴 Intenable |
| **handleMouseMove** | 600 | ~70 | 🔴 Intenable |
| **handleMouseUp** | 210 | ~30 | 🟡 Limite |
| **handleResizeElement** | 160 | ~25 | 🟡 Limite |
| **handleRotate** | 110 | ~15 | 🟢 OK |
| **handleDelete** | 100 | ~20 | 🟡 Limite |

**Seuil recommandé** : Complexité < 10
**État actuel** : 2 fonctions à complexité 70+ 😱

## 🎯 Impact du refactoring

### Lisibilité
- **Avant** : Trouver une logique = Ctrl+F dans 3000 lignes
- **Après** : Aller directement dans le bon fichier de 200 lignes

### Testabilité
- **Avant** : Impossible de tester unitairement
- **Après** : Chaque fonction testable indépendamment

### Debugging
- **Avant** : Stack trace pointe ligne 2300 dans CADEditor.jsx 🤷
- **Après** : Stack trace pointe `handleRectangleResize.js:45` ✅

### Ajout de features
- **Avant** : Risque élevé de casser quelque chose
- **Après** : Modifications localisées, impact maîtrisé

### Collaboration
- **Avant** : Conflits Git fréquents sur CADEditor.jsx
- **Après** : Chacun travaille sur des fichiers différents

## 💡 Recommandations

### 🟢 À faire en priorité (Phase 2)
1. Extraire `useFileOperations` (gain rapide, risque faible)
2. Extraire `useClipboard` (gain rapide, risque faible)
3. Extraire `useElementTransforms` (gain moyen, risque faible)

### 🟡 À faire ensuite (Phase 3)
4. Regrouper l'état avec `useEditorState` (gain élevé, risque moyen)

### 🔴 À faire en dernier (Phase 1)
5. Refactoriser les handlers de souris (gain ÉNORME, complexité haute)

## 📝 Conclusion

Le fichier `CADEditor.jsx` est **techniquement fonctionnel** mais **humainement inmaintenable**.

**Recommandation** : Refactoring FORTEMENT conseillé
**Priorité** : Haute (avant d'ajouter de nouvelles features)
**Risque** : Gérable avec approche méthodique
**Gain** : Considérable pour la suite du projet

---

**Prêt à commencer ?** On peut procéder phase par phase, en testant à chaque étape. 🚀

