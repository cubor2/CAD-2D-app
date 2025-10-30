# Changelog - CAD 2D Editor pour Découpe Laser

## Version 0.1.1 - 30 Octobre 2025 (En cours)

### 🐛 CORRECTION CRITIQUE : Collision d'IDs d'éléments

**Problème résolu :**
- Les utilisateurs rencontraient un bug où modifier ou supprimer une ligne affectait d'autres lignes
- Cause : Collision d'IDs due à une mauvaise gestion de `nextIdRef` lors des undo/redo

**Corrections appliquées :**
1. **`updateElement` corrigé** : Utilise maintenant `updateElements` pour sauvegarder dans l'historique
2. **Synchronisation `nextIdRef`** : `undo()` et `redo()` synchronisent maintenant `nextIdRef` avec les IDs présents
3. **Validation de sécurité** : `addElement` vérifie maintenant les collisions d'IDs et les corrige automatiquement
4. **Nouvelle fonction `syncNextId`** : Permet de synchroniser `nextIdRef` lors du chargement de fichiers
5. **Chargement de fichiers** : `handleNew`, `handleOpen`, et `handleImportSVG` synchronisent maintenant `nextIdRef`

**Fichiers modifiés :**
- `src/hooks/useElements.js` : Corrections majeures dans la gestion des IDs
- `src/hooks/useFileOperations.js` : Synchronisation lors du chargement
- `src/CADEditor.jsx` : Passage de `syncNextId` au hook

**Impact :**
- ✅ Aucune collision d'ID ne devrait plus se produire
- ✅ Les modifications via le PropertiesPanel sont enregistrées dans l'historique
- ✅ Undo/Redo fonctionne correctement sans créer de doublons
- ✅ Le chargement de fichiers et l'import SVG synchronisent correctement les IDs

**Documentation :**
- `AUDIT_ID_DUPLICATION_BUG.md` : Analyse détaillée du problème
- `BUGFIX_ID_COLLISION.md` : Documentation complète des corrections

---

### 🐛 CORRECTION : Redimensionnement aléatoire des lignes avec +/-

**Problème résolu :**
- Comportement aléatoire lors du redimensionnement de lignes avec les touches `+` et `-`
- Parfois `+` agrandissait la ligne, parfois elle la réduisait
- Le comportement dépendait de la direction dans laquelle la ligne avait été dessinée

**Cause :**
- Logique défaillante dans `handleResizeElement` qui traitait différemment les lignes verticales selon leur orientation (y1 > y2 ou y1 < y2)

**Corrections appliquées :**
1. **Approche unifiée** : Calcul de la longueur totale et application d'un facteur d'échelle
2. **Simplification du code** : -48% de lignes pour les lignes, -41% pour les courbes
3. **Comportement cohérent** : `+` agrandit toujours, `-` réduit toujours, quelle que soit l'orientation

**Fichiers modifiés :**
- `src/hooks/useElementTransforms.js` : Refonte complète de la logique de redimensionnement

**Impact :**
- ✅ Comportement prévisible et cohérent pour toutes les orientations de lignes
- ✅ Fonctionne correctement pour les lignes horizontales, verticales et diagonales
- ✅ Les courbes se redimensionnent également de manière cohérente
- ✅ Code plus simple et maintenable

**Documentation :**
- `BUGFIX_RESIZE_LINES.md` : Documentation détaillée avec exemples

---

## Version 0.1.0 - 24 Octobre 2025

### 🏗️ Refactoring majeur : Architecture modulaire

#### Phase 2.1 : Opérations de fichiers
- **Nouveau hook** : `useFileOperations.js` (-245 lignes de `CADEditor.jsx`)
  - Extraction de toutes les opérations de fichiers (New, Open, Import SVG, Save, Save As, Laser Export, Export)
  - Code mieux organisé et plus maintenable

#### Phase 2.2 : Opérations de clipboard
- **Nouveau hook** : `useClipboard.js` (-57 lignes de `CADEditor.jsx`)
  - Extraction des opérations Copy, Cut, Paste
  - Gestion isolée du clipboard et des groupes

#### Phase 2.3 : Transformations d'éléments
- **Nouveau hook** : `useElementTransforms.js` (-410 lignes de `CADEditor.jsx`)
  - Extraction de `handleRotate` (rotation 45°)
  - Extraction de `handleFlipHorizontal` / `handleFlipVertical` (symétries)
  - Extraction de `handleResizeElement` (redimensionnement)

#### Résultat
- **`CADEditor.jsx`** : Réduit de 2686 → 2284 lignes (**-402 lignes, -15%**)
- **Maintenabilité** : Code modulaire, réutilisable et testable
- **Performance** : Aucune régression, tous les hooks utilisent `useCallback` pour optimisation

### 🔖 Système de versioning automatique

#### Configuration
- **Version actuelle** : 0.1.0 (Semantic Versioning)
- **Scripts npm** :
  - `npm run version:patch` : Corrections de bugs (0.1.0 → 0.1.1)
  - `npm run version:minor` : Nouvelles fonctionnalités (0.1.0 → 0.2.0)
  - `npm run version:major` : Changements majeurs (0.1.0 → 1.0.0)

#### Fonctionnalités
- **Affichage dynamique** : La version est importée depuis `package.json` dans toute l'app
- **Tags Git automatiques** : Chaque incrément crée un commit et un tag `vX.Y.Z`
- **Métadonnées** : Version incluse dans les fichiers `.json` et exports SVG
- **Documentation** : Guide complet dans `VERSIONING.md`

#### Avantages
- ✅ Traçabilité complète des versions
- ✅ Retour facile à une version antérieure via tags Git
- ✅ Workflow standardisé pour les releases

### 🐛 Corrections de bugs

#### Curseur bloqué après création de texte
- **Problème** : Après avoir créé un texte, le curseur restait en mode "text" même après avoir changé d'outil
- **Solution** : `editingTextId` est maintenant réinitialisé automatiquement lors du changement d'outil
- **Impact** : Les cercles de sélection redeviennent visibles correctement

### 🎉 Nouvelle fonctionnalité majeure : Outil Créneaux (Finger Joints)

#### Nouvel outil
- **Outil Créneaux (F)** : Création d'assemblages par emboîtement pour la découpe laser
  - Raccourci clavier : `F`
  - Icône personnalisée explicite dans la toolbar
  - Positionné après l'outil Texte pour un accès facile

#### Paramètres configurables
- **Longueur totale** : Éditable en temps réel
- **Épaisseur matériau** : Profondeur des dents (valeurs entières uniquement)
- **Largeur dent** : Largeur de chaque dent
- **Largeur espace** : Largeur de chaque espace entre les dents
- **Type de crénelage** : Mâle (dents vers le haut) ou Femelle (dents vers le bas)
- **Ajustement automatique** : Les créneaux sont toujours symétriques

#### Édition avancée
- **Points de contrôle** :
  - Points de départ/fin (noirs) sur la ligne de base pour un snap précis
  - Point central (bleu) pour modifier l'épaisseur perpendiculairement
- **Curseurs contextuels** : 
  - Curseur "grab" pour le point central des créneaux
  - Facilite la compréhension de l'action à effectuer
- **Détection de clic améliorée** : Utilise le contour complet du crénelage (pas seulement la ligne de base)

#### Transformations supportées
- **Rotation** : 45° via le bouton
- **Symétrie horizontale** : Inverse la direction
- **Symétrie verticale** : Inverse le type (mâle ↔ femelle)
- **Redimensionnement** : Modification de la longueur totale via le panneau

#### Qualité et sécurité
- **Géométrie optimisée** : Les créneaux mâles commencent et finissent toujours par une ligne horizontale
- **Prévention des erreurs** : Impossible de créer des éléments invisibles (clic simple sans drag)
- **Export laser** : Paths optimisés pour découpe précise

### 🔧 Améliorations générales

#### Interface utilisateur
- **Curseurs contextuels** : Curseur "crosshair" (croix) pour le point central des lignes en mode édition
  - Indique visuellement qu'un arc va être créé
  - Évite les déformations accidentelles
- **Panneau de propriétés** : Layout optimisé pour les créneaux (paramètres groupés sur 2 lignes)
- **Séparateurs** : Espacement amélioré entre les blocs de propriétés

#### Système de snap
- **Points de référence** : Les créneaux utilisent toujours la ligne de base comme référence
- **Compatibilité** : Snap précis avec tous les autres éléments

### 📚 Documentation
- **Guide complet** : [docs/FINGER_JOINT_TOOL.md](docs/FINGER_JOINT_TOOL.md)
  - Vue d'ensemble de l'outil
  - Paramètres détaillés
  - Cas d'usage et recommandations
  - Architecture technique

### 🏗️ Changements techniques
- **Nouveau fichier** : `src/utils/fingerJoint.js` - Algorithme de génération
- **Fonction utilitaire** : `pointToPathDistance` pour détection de clic sur paths complexes
- **Extension** : Support du type `fingerJoint` dans tous les systèmes (drawing, selection, transformation)

---

## Version 1.0.0 - 17 Octobre 2025

### 🎉 Fonctionnalités principales

#### Interface utilisateur
- **Design "DrawHard"** : Interface minimaliste et professionnelle avec palette de couleurs beige/noir
- **MenuBar** : Barre de menu complète (Fichier, Édition, Affichage, Outils)
- **PropertiesPanel** : Panneau latéral droit avec propriétés éditables des éléments
- **TopControls** : Contrôles globaux (snap, dimensions, règles, mode sombre, zoom)
- **Toolbar** : Barre d'outils verticale à gauche avec tous les outils de dessin

#### Outils de dessin
- **Ligne** : Outil de dessin de lignes avec longueur éditable
- **Rectangle** : Outil de dessin de rectangles (shift pour carrés)
- **Cercle/Ellipse** : Outil de dessin de cercles (shift) et ellipses
- **Arc** : Outil de dessin d'arcs avec largeur/hauteur éditables (support ellipses partielles)
- **Courbe de Bézier** : Outil de dessin de courbes quadratiques
- **Texte** : Outil d'ajout de texte avec polices et styles

#### Sélection et manipulation
- **Sélection simple** : Clic sur un élément
- **Sélection multiple** : Shift+clic ou rectangle de sélection
- **Déplacement** : Drag & drop des éléments sélectionnés
- **Redimensionnement** : 
  - Édition des dimensions (largeur/hauteur) avec cadenas pour proportions
  - Support multi-sélection avec dimensions totales éditables
- **Transformations** :
  - Rotation 45° autour du centre de la sélection
  - Symétrie horizontale (H)
  - Symétrie verticale (V)
- **Points de contrôle** : Déplacement des points de contrôle pour lignes, courbes, arcs, cercles

#### Snap et guides
- **Snap aux éléments** : Accrochage automatique aux points clés (endpoints, midpoints, centers)
- **Snap aux bords** : Accrochage aux bords des éléments (lignes, arcs, cercles, ellipses)
- **Snap à la grille** : Accrochage optionnel à la grille (10mm)
- **Guides dynamiques** : Guides horizontaux/verticaux qui s'accrochent aux points des éléments
- **Curseur vert** : Indicateur visuel de snap position

#### Zone de travail
- **Dimensions configurables** : Largeur et hauteur en millimètres (entiers)
- **Affichage optionnel** : Rectangle de délimitation rouge
- **Centrage** : Zone centrée à (0,0) pour faciliter le positionnement

#### Export découpe laser
- **Sélection de machine** : Dropdown avec toutes les machines supportées
  - Epilog (PDF, SVG)
  - Trotec (PDF, SVG)
  - Universal Laser (PDF, SVG)
  - Glowforge (PDF, SVG)
  - BRM Lasers (PDF, SVG)
  - Full Spectrum (PDF, SVG)
  - LightBurn (LBRN - à venir)
  
- **Modifications automatiques** :
  - Ajout fond blanc (PDF)
  - Couleur des traits → rouge pur (RGB 255,0,0)
  - Épaisseur des traits ajustée selon la machine
  
- **Export précis** :
  - Dimensions exactes de la zone de travail
  - Positionnement absolu des éléments (pas de centrage)
  - Support des ellipses partielles
  - Métadonnées incluses

#### Affichage
- **Grille** : Grille 10mm avec lignes principales tous les 50mm
- **Règles** : Règles horizontales et verticales graduées
- **Dimensions** : Affichage des dimensions en millimètres sur le canvas
- **Zoom** : Molette de la souris, affichage du pourcentage
- **Pan** : Barre espace + drag ou middle click
- **Mode sombre** : Inversion des couleurs pour travail de nuit

#### Gestion des fichiers
- **Nouveau** : Créer un nouveau projet vide
- **Ouvrir** : Charger un projet (.json)
- **Enregistrer** : Sauvegarder le projet (.json)
- **Enregistrer sous** : Sauvegarder avec un nouveau nom
- **Export SVG** : Export standard SVG
- **Export PNG** : Export en image PNG
- **Export PDF Laser** : Export optimisé pour découpe laser

#### Historique
- **Undo/Redo** : Historique complet avec Ctrl+Z / Ctrl+Y
- **50 étapes** : Conservation de 50 actions dans l'historique

#### Raccourcis clavier
- **V** : Outil de sélection
- **L** : Outil ligne
- **R** : Outil rectangle
- **C** : Outil cercle/ellipse
- **A** : Outil arc
- **B** : Outil courbe de Bézier
- **T** : Outil texte
- **Suppr** : Supprimer les éléments sélectionnés
- **Ctrl+A** : Tout sélectionner
- **Ctrl+D** : Dupliquer
- **Ctrl+Z** : Annuler
- **Ctrl+Y** : Rétablir
- **Ctrl+S** : Enregistrer
- **Espace** : Pan temporaire

---

## Détails techniques

### Architecture
- **React 18** : Framework UI avec hooks (useState, useCallback, useMemo, useRef)
- **Canvas API** : Rendu 2D natif pour performance optimale
- **jsPDF** : Génération de PDF pour export laser
- **Lucide React** : Icônes modernes et cohérentes
- **Tailwind CSS** : Styling avec classes utilitaires

### Système de coordonnées
- **Origine centrée** : (0,0) au centre de la zone de travail
- **Unités** : Millimètres
- **Transformation** : Offset automatique pour exports (top-left origin)

### Types d'éléments
```javascript
{
  id: string,
  type: 'line' | 'rectangle' | 'circle' | 'arc' | 'curve' | 'text',
  stroke: string,
  strokeWidth: number,
  // + propriétés spécifiques au type
}
```

### Snap system
- **Priority-based** : endpoint (20) > center (18) > midpoint (15) > edge (3)
- **Distance-based** : Calcul de distance pour trouver le point le plus proche
- **Multi-point snap** : Snap simultané X et Y lors du déplacement multiple

### Formule ellipse
Pour calculer le rayon d'une ellipse à un angle donné :
```javascript
radiusAtAngle = (radiusX * radiusY) / √((radiusY * cos(θ))² + (radiusX * sin(θ))²)
```

---

## Améliorations futures
- [ ] Export DXF
- [ ] Export AI (Adobe Illustrator)
- [ ] Export EPS
- [ ] Export LBRN (LightBurn)
- [ ] Outil polygone
- [ ] Outil étoile
- [ ] Calques (layers)
- [ ] Groupement d'éléments
- [ ] Alignement automatique
- [ ] Distribution équitable
- [ ] Opérations booléennes (union, soustraction, intersection)
- [ ] Import SVG/DXF
- [ ] Bibliothèque de formes prédéfinies
- [ ] Mesure de distance entre points

---

## Remerciements
Développé avec ❤️ par l'équipe Second Knife pour simplifier la vie des makers !

**Claude AI** - Assistant de développement extraordinaire 🎶
