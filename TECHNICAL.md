# Documentation Technique - LaserLair CAD 2D

**Dernière mise à jour** : 23 Octobre 2025  
**Version** : 1.0.3

---

## 🆕 Améliorations Récentes (v1.0.3)

### Double-Clic Bidirectionnel
- **Sélection → Édition** : Double-clic active le mode édition
- **Édition → Sélection** : Double-clic revient en mode sélection
- Détection : 300ms entre clics, même élément
- Re-render forcé via manipulation temporaire de `selectedIds`

### Couleurs de Sélection
- **Mode Sélection** : Rouge (#ff0000)
- **Mode Édition** : Bleu électrique (#00aaff)
- Point milieu ligne : Noir (#2B2B2B) en sélection, bleu en édition

### Édition de Texte Avancée
- Sélection de texte à la souris (drag)
- Curseur texte (I-beam) automatique
- Calculs en coordonnées monde pour précision
- Snap points désactivés pendant l'édition
- État : `editingTextId`, `textCursorPosition`, `textSelectionStart/End`

### Curseurs Contextuels
```javascript
// Mode édition
'grabbing'  // Control points, middle, start, end
'text'      // Édition de texte active
'nwse-resize' // Coin diagonaux
'ns-resize'   // Haut/bas
'ew-resize'   // Gauche/droite
```

---

## Architecture globale

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                      CADEditor.jsx                       │
│                  (Composant principal)                   │
├──────────────┬────────────────┬──────────────┬──────────┤
│   MenuBar    │   Toolbar      │  Canvas      │Properties│
│              │                │              │  Panel   │
├──────────────┴────────────────┴──────────────┴──────────┤
│              TopControls (Snap, Zoom, etc.)             │
└─────────────────────────────────────────────────────────┘
```

### Flux de données

```
User Input
    ↓
CADEditor (event handlers)
    ↓
useElements hook → setElements()
    ↓
useHistory hook → save snapshot
    ↓
Canvas re-render → drawing.js
    ↓
Screen display
```

---

## Hooks personnalisés

### `useElements.js`

Gère la liste des éléments dessinés.

```javascript
const { elements, setElements, addElement, updateElement, deleteElements } = useElements();
```

**État** :
```javascript
[
  {
    id: 'uuid-v4',
    type: 'line' | 'rectangle' | 'circle' | 'arc' | 'curve' | 'text',
    stroke: '#2B2B2B',
    strokeWidth: 1.5,
    // ... propriétés spécifiques au type
  }
]
```

**Méthodes** :
- `addElement(element)` : Ajoute un élément
- `updateElement(id, updates)` : Met à jour un élément
- `deleteElements(ids)` : Supprime des éléments
- `setElements(fn)` : Mise à jour complète (pour batch)

---

### `useHistory.js`

Gère l'historique undo/redo (max 50 étapes).

```javascript
const { saveState, undo, redo, canUndo, canRedo } = useHistory(elements, setElements);
```

**Fonctionnement** :
- Sauvegarde automatique après chaque action
- Stack de 50 snapshots maximum
- Compare les états pour éviter les doublons

---

### `useViewport.js`

Gère le pan et le zoom du canvas.

```javascript
const { viewport, setViewport, resetViewport } = useViewport();
```

**État** :
```javascript
{
  x: 0,          // Offset horizontal
  y: 0,          // Offset vertical
  zoom: 3.77953  // Niveau de zoom (1 = 100%)
}
```

---

## Système de dessin (drawing.js)

### Transformation de coordonnées

**World to Screen** :
```javascript
const screenX = worldX * viewport.zoom + viewport.x + canvas.width / 2;
const screenY = worldY * viewport.zoom + viewport.y + canvas.height / 2;
```

**Screen to World** :
```javascript
const worldX = (screenX - viewport.x - canvas.width / 2) / viewport.zoom;
const worldY = (screenY - viewport.y - canvas.height / 2) / viewport.zoom;
```

### Fonctions principales

| Fonction | Description |
|----------|-------------|
| `drawGrid()` | Dessine la grille 10mm |
| `drawRulers()` | Dessine les règles graduées |
| `drawElement()` | Dessine un élément spécifique |
| `drawSnapPoint()` | Dessine l'indicateur de snap (cercle vert) |
| `drawSelectionBox()` | Dessine le rectangle de sélection |
| `drawWorkArea()` | Dessine la zone de travail |

---

## Système de snap (snap.js)

### Types de snap

1. **Endpoint** (priorité 20)
   - Extrémités des lignes, courbes
   - Coins des rectangles
   - Points cardinaux des cercles/arcs

2. **Center** (priorité 18)
   - Centre des rectangles
   - Centre des cercles/arcs

3. **Midpoint** (priorité 15)
   - Milieu des lignes
   - Milieux des côtés des rectangles
   - Milieu des arcs

4. **Edge** (priorité 3)
   - Bords des lignes
   - Bords des rectangles
   - Périmètre des cercles/ellipses/arcs

### Algorithme de snap

```javascript
// 1. Collecter tous les points de snap
const snapPoints = [];
elements.forEach(el => {
  // Ajouter les points clés
  snapPoints.push(...getSnapPoints(el));
  
  // Ajouter les snaps de bord si proche
  if (distanceToBorder < threshold) {
    snapPoints.push(borderPoint);
  }
});

// 2. Calculer le score de chaque point
snapPoints.forEach(sp => {
  const distance = calculateDistance(mousePos, sp);
  const score = distance / sp.priority; // Plus petit = meilleur
});

// 3. Retourner le meilleur
return minScore < threshold ? bestSnapPoint : null;
```

### Formule distance à l'ellipse

Pour un point à l'angle θ sur une ellipse (rx, ry) :

```javascript
const radiusAtAngle = (rx * ry) / Math.sqrt(
  (ry * Math.cos(θ)) ** 2 + 
  (rx * Math.sin(θ)) ** 2
);
```

---

## Géométrie (geometry.js)

### `isAngleBetween(angle, start, end)`

Détermine si un angle est dans l'arc [start, end].

**Gère les cas complexes** :
- Arc traversant 0° (ex: -45° → 45°)
- Arc > 180°
- Angles négatifs

```javascript
const normalizeAngle = (a) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};

const normAngle = normalizeAngle(angle);
const normStart = normalizeAngle(start);
const normEnd = normalizeAngle(end);

let span = normEnd - normStart;
if (span < 0) span += 2 * Math.PI;

let offset = normAngle - normStart;
if (offset < 0) offset += 2 * Math.PI;

return offset <= span;
```

### `pointToLineSegment(point, lineStart, lineEnd)`

Trouve le point le plus proche sur un segment.

**Retourne** :
```javascript
{
  x: number,        // Coordonnée X du point projeté
  y: number,        // Coordonnée Y du point projeté
  distance: number  // Distance au segment
}
```

---

## Export Laser (laserExporter.js)

### Workflow d'export

```
1. User sélectionne machine
   ↓
2. Modal affiche modifications
   ↓
3. User choisit format (PDF/SVG)
   ↓
4. exportForLaser() appelé
   ↓
5. Transformation coordonnées
   ↓
6. Application style machine
   ↓
7. Génération fichier
   ↓
8. Téléchargement automatique
```

### Transformation coordonnées

**Problème** : Canvas centré à (0,0), PDF/SVG top-left (0,0)

**Solution** :
```javascript
const offsetX = workArea.width / 2;
const offsetY = workArea.height / 2;

// Pour chaque élément
exportX = worldX + offsetX;
exportY = worldY + offsetY;
```

### Configuration machine

```javascript
{
  id: 'epilog',
  name: 'Epilog',
  description: '...',
  formats: [
    { name: 'PDF', available: true },
    { name: 'SVG', available: true },
    { name: 'AI', available: false }
  ],
  preferredFormat: 'PDF',
  units: 'mm',
  cutStrokeWidth: 0.01,
  cutStrokeColor: { r: 255, g: 0, b: 0 }
}
```

---

## Types d'éléments

### Line
```javascript
{
  type: 'line',
  x1: number,
  y1: number,
  x2: number,
  y2: number
}
```

### Rectangle
```javascript
{
  type: 'rectangle',
  x: number,      // Coin supérieur gauche
  y: number,
  width: number,
  height: number
}
```

### Circle/Ellipse
```javascript
{
  type: 'circle',
  cx: number,     // Centre X
  cy: number,     // Centre Y
  radius: number, // Pour cercle parfait
  radiusX: number, // Pour ellipse
  radiusY: number  // Pour ellipse
}
```

### Arc
```javascript
{
  type: 'arc',
  cx: number,
  cy: number,
  radius: number,    // Rayon principal
  radiusX: number,   // Support ellipse
  radiusY: number,   // Support ellipse
  startAngle: number, // En radians
  endAngle: number    // En radians
}
```

### Curve (Bézier quadratique)
```javascript
{
  type: 'curve',
  x1: number,     // Point de départ
  y1: number,
  cpx: number,    // Point de contrôle
  cpy: number,
  x2: number,     // Point d'arrivée
  y2: number
}
```

### Text
```javascript
{
  type: 'text',
  x: number,
  y: number,
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: 'normal' | 'bold',
  fontStyle: 'normal' | 'italic'
}
```

---

## Transformations géométriques

### Rotation (45°)

Rotation autour du centre de la sélection :

```javascript
const angle = Math.PI / 4; // 45 degrés
const cos = Math.cos(angle);
const sin = Math.sin(angle);

// Pour chaque point (x, y)
const dx = x - centerX;
const dy = y - centerY;
const newX = centerX + dx * cos - dy * sin;
const newY = centerY + dx * sin + dy * cos;
```

**Cas spécial des arcs** :
```javascript
// Les angles doivent aussi être tournés
startAngle += angle;
endAngle += angle;
```

### Symétrie horizontale

Miroir autour de l'axe vertical du centre :

```javascript
const newX = 2 * centerX - x;
```

**Cas spécial des arcs** :
```javascript
// Angles inversés
newStartAngle = Math.PI - endAngle;
newEndAngle = Math.PI - startAngle;
```

### Symétrie verticale

Miroir autour de l'axe horizontal du centre :

```javascript
const newY = 2 * centerY - y;
```

**Cas spécial des arcs** :
```javascript
// Angles inversés
newStartAngle = -endAngle;
newEndAngle = -startAngle;
```

### Redimensionnement

Pour une sélection multiple :

```javascript
const scaleX = newWidth / currentWidth;
const scaleY = newHeight / currentHeight;

// Pour chaque élément
if (element.type === 'line') {
  x1 = minX + (x1 - minX) * scaleX;
  y1 = minY + (y1 - minY) * scaleY;
  x2 = minX + (x2 - minX) * scaleX;
  y2 = minY + (y2 - minY) * scaleY;
}
```

---

## Performances

### Optimisations appliquées

1. **React.memo** : Composants purs (PropertiesPanel, Canvas)
2. **useCallback** : Stabilité des handlers
3. **useMemo** : Calculs coûteux (bounds, modifications)
4. **Canvas natif** : Pas de SVG DOM (plus rapide)
5. **RequestAnimationFrame** : Rendu fluide

### Métriques visées

- 60 FPS pour le dessin en temps réel
- < 100ms pour snap calculations
- < 500ms pour exports (< 1000 éléments)

---

## Tests

### Tests à implémenter

**Unitaires** :
- [ ] Fonctions géométriques (geometry.js)
- [ ] Calculs de snap (snap.js)
- [ ] Transformations (rotation, symétrie)
- [ ] Export laser (laserExporter.js)

**Intégration** :
- [ ] Workflow complet de dessin
- [ ] Undo/Redo
- [ ] Import/Export fichiers
- [ ] Sélection multiple

**E2E** :
- [ ] Création projet complet
- [ ] Export laser avec vérifications
- [ ] Performance sur 1000+ éléments

---

## Debugging

### Mode debug

Activer en ajoutant dans `CADEditor.jsx` :

```javascript
const DEBUG = true;

if (DEBUG) {
  console.log('Snap point:', snapPoint);
  console.log('Selected IDs:', selectedIds);
  console.log('Viewport:', viewport);
}
```

### Outils Chrome DevTools

- **Performance** : Profiler le rendu Canvas
- **Memory** : Vérifier les fuites mémoire
- **React DevTools** : Inspecter les props/state

---

## Contribuer

### Setup développement

```bash
# Installer les dépendances
npm install

# Lancer en mode dev avec hot reload
npm run dev

# Build de production
npm run build

# Linter
npm run lint

# Format code
npm run format
```

### Convention de code

**Naming** :
- Composants : PascalCase (`MenuBar.jsx`)
- Hooks : camelCase avec `use` (`useElements.js`)
- Fonctions : camelCase (`drawGrid()`)
- Constantes : UPPER_SNAKE_CASE (`GRID_SIZE`)

**Commentaires** :
- Français pour la logique métier
- Anglais acceptable pour code générique

**Commits** :
- Format : `type(scope): message`
- Types : feat, fix, docs, style, refactor, perf, test

Exemples :
```
feat(snap): ajout du snap aux ellipses
fix(export): correction offset coordonnées PDF
docs(readme): mise à jour installation
```

---

## Roadmap technique

### Court terme (v1.1)
- [ ] Tests unitaires (Jest)
- [ ] Tests E2E (Playwright)
- [ ] Performance monitoring
- [ ] Error boundary React

### Moyen terme (v1.5)
- [ ] Web Workers pour exports lourds
- [ ] IndexedDB pour autosave
- [ ] Service Worker pour offline
- [ ] WebAssembly pour calculs intensifs

### Long terme (v2.0)
- [ ] Collaboration temps réel (WebRTC)
- [ ] Cloud sync
- [ ] Plugin system
- [ ] Mobile support (React Native)

---

**Dernière mise à jour** : 17 Octobre 2025
**Version** : 1.0.0





