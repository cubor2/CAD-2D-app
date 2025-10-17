# Changelog - CAD 2D Editor pour Découpe Laser

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
