# Changelog - Fonctionnalité Texte

## 2025-10-15 : Refonte complète du redimensionnement de texte

### 🎯 Objectif
Corriger le système de redimensionnement du texte avec les 8 poignées (4 coins + 4 milieux) pour qu'il fonctionne comme dans les logiciels de design standards (Figma, Illustrator).

### 🐛 Problèmes identifiés et résolus

#### 1. **Téléportation du texte au début du drag**
**Symptôme** : Dès qu'on commence à dragger une poignée du haut (topLeft, topRight), le texte se téléporte verticalement.

**Cause** : `dragStart` était initialisé avec la position du **clic utilisateur** au lieu de la position **exacte de la poignée**.

**Solution** : 
```javascript
// Avant
setDragStart({ x: snapped.x, y: snapped.y });  // Position du clic

// Après
const handleWorld = screenToWorldWrapper(cp.x + rect.left, cp.y + rect.top);
setDragStart(handleWorld);  // Position exacte de la poignée
```

#### 2. **Les poignées du haut ne fonctionnaient pas correctement**
**Symptôme** : Les poignées topLeft et topRight causaient des déplacements incorrects du texte, alors que bottomLeft et bottomRight fonctionnaient bien.

**Cause** : Pour un texte, `(x, y)` représente la **baseline en bas à gauche**, pas le coin supérieur gauche. Le code ne prenait pas en compte cette spécificité.

**Solution** : Adapter la logique de repositionnement selon la poignée :
```javascript
// Pour poignées du HAUT : la baseline (y) reste FIXE
case 'topLeft':
  newY = bottomRight.y;  // Baseline au niveau du bas

// Pour poignées du BAS : la baseline (y) se déplace
case 'bottomRight':
  newY = topLeft.y + newHeightWorld;  // Baseline descend
```

#### 3. **Mauvaise conversion des coordonnées de poignées**
**Symptôme** : Les poignées ne se cliquaient pas correctement ou causaient des sauts au début du drag.

**Cause** : Confusion entre coordonnées **canvas-relative** et **client**. `getTextControlPointsScreen()` retourne des coordonnées canvas-relative, mais `screenToWorldWrapper()` attend des coordonnées client.

**Solution** : Convertir canvas-relative → client avant la conversion en monde :
```javascript
// Avant
const handleWorld = screenToWorldWrapper(cp.x, cp.y);  // Incorrect!

// Après
const handleWorld = screenToWorldWrapper(cp.x + rect.left, cp.y + rect.top);  // Correct!
```

#### 4. **Calcul incorrect de delta pour le redimensionnement**
**Symptôme** : Le redimensionnement était erratique avec des changements de taille trop importants.

**Cause** : Les déplacements `dx` et `dy` (qui sont des **vecteurs**) étaient convertis comme des **positions** avec `worldToScreen()`, ajoutant incorrectement le pan et le centre.

**Solution** : Utiliser la conversion correcte pour les vecteurs :
```javascript
// Avant (incorrect)
const zeroScreen = worldToScreenWrapper(0, 0);
const deltaScreen = worldToScreenWrapper(dx, dy);
const dxScreen = deltaScreen.x - zeroScreen.x;

// Après (correct)
const dxScreen = dx * viewport.zoom;  // Simple multiplication pour les vecteurs
const dyScreen = dy * viewport.zoom;
```

#### 5. **Réduction drastique de taille au premier mouvement**
**Symptôme** : Quand on commence à dragger une poignée, le texte rétrécit brusquement d'un coup.

**Cause** : Les dimensions du texte dans `getTextControlPointsScreen()` n'étaient pas dans le bon système de coordonnées, créant un décalage entre la position détectée de la poignée et sa vraie position.

**Solution** : Ne pas re-multiplier les dimensions par zoom - elles sont déjà dans le bon système (pixels logiques).

### ✅ Résultat final

Le système de redimensionnement fonctionne maintenant parfaitement :
- ✅ Les 8 poignées (4 coins + 4 milieux) sont toutes cliquables
- ✅ Le redimensionnement est fluide sans saut ni téléportation
- ✅ Le coin opposé reste parfaitement fixe pendant le drag
- ✅ Le texte maintient ses proportions (aspect ratio) tout en scalant la fontSize
- ✅ Fonctionne correctement quel que soit le niveau de zoom
- ✅ Comportement identique aux logiciels standards (Figma, Illustrator)

### 📝 Fichiers modifiés

#### `src/CADEditor.jsx`
- `getTextControlPointsScreen()` : Calcul des positions des 8 poignées en canvas-relative
- `handleTextResize()` : Algorithme de redimensionnement avec anchor point opposé fixe
- `handleMouseDown()` : Détection de clic sur les poignées avec conversion de coordonnées correcte
- `handleMouseMove()` : Passage des deltas corrects à `handleTextResize()`

### 📚 Documentation créée

#### `docs/COORDINATE_SYSTEMS.md` (Nouveau)
Guide technique complet des systèmes de coordonnées :
- Les 4 systèmes utilisés (Monde, Canvas, Client, Canvas-Relative)
- Formules de conversion entre systèmes
- **Différence critique** entre Position et Delta/Vecteur
- Tous les bugs rencontrés avec explications détaillées
- Checklist pour éviter les erreurs futures
- Techniques de debugging

#### `docs/CODE_COMMENTS_TEXT_RESIZE.md` (Nouveau)
Commentaires ligne par ligne du code :
- `getTextControlPointsScreen()` : Pourquoi chaque ligne est écrite comme ça
- `handleTextResize()` : Algorithme complet avec explications de chaque étape
- Détection de clic : Workflow complet client → canvas-relative → monde
- Pièges courants avec exemples ❌ incorrect / ✅ correct

#### `README.md` (Mis à jour)
Ajout d'une section "Documentation technique" :
- Liens vers les guides techniques
- Instructions pour le debugging
- Importance des systèmes de coordonnées

### 🎓 Leçons apprises

1. **Position ≠ Vecteur** : C'est LA source principale de bugs
   - Position : utiliser `worldToScreen()` / `screenToWorld()`
   - Vecteur : multiplier/diviser par `zoom` uniquement

2. **4 systèmes de coordonnées** : Toujours savoir dans quel système on travaille
   - Monde (mm)
   - Canvas-relative (pixels)
   - Client (pixels)
   - Screen canvas (pixels transformés)

3. **Baseline du texte** : `(x, y)` = baseline en bas à gauche, pas le coin supérieur gauche

4. **dragStart** : Doit être la position **exacte** de l'élément manipulé, pas la position du clic

5. **Tests importants** : Tester avec différents niveaux de zoom pour détecter les bugs de coordonnées

### 🔧 Pour les futurs développeurs

Si vous ajoutez une nouvelle fonctionnalité de manipulation d'éléments :
1. Lisez `docs/COORDINATE_SYSTEMS.md` en entier
2. Identifiez tous les systèmes de coordonnées que vous utilisez
3. Faites un schéma des conversions nécessaires
4. Testez avec zoom à 1x, 0.5x, 2x, 5x
5. Vérifiez que les deltas sont convertis comme des vecteurs
6. Assurez-vous que les points d'ancrage restent fixes

### 👥 Contributeurs

Cette refonte a nécessité plusieurs heures de debugging intensif pour identifier et corriger chaque bug de coordonnées. La documentation créée devrait éviter que ces problèmes se reproduisent.

---

**Date** : 15 octobre 2025  
**Statut** : ✅ Complété et documenté


