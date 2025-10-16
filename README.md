# LaserLair - Brutaliste CAD Editor

**Version 1.0**

Un éditeur CAD 2D minimaliste et puissant avec une identité visuelle brutalist inspirée de Die Hard et AutoCAD.

![LaserLair Logo](public/laserlair-logo.png)

## 🎨 Design System

LaserLair suit une philosophie de design brutaliste caractérisée par :

### Palette de couleurs

- **Fond principal** : `#FFFFFF` (blanc)
- **Grille/lignes** : `#D8D3C7` (gris clair)
- **Interface active** : `#2B2B2B` (noir foncé)
- **Accent** : `#E44A33` (rouge-orange)
- **Texte** : `#1F1F1F` (noir)
- **Hover/secondaire** : `#4A4A4A` (gris foncé)

### Principes de design

- **Coins carrés** : Aucun border-radius, design épuré et fonctionnel
- **Typographie** : Inter Bold, UPPERCASE, large tracking pour les titres
- **Grid System** : Espacement cohérent (4, 8, 12, 24px)
- **Contraste élevé** : Lisibilité maximale
- **Minimalisme** : Pas de fioritures, focus sur la fonctionnalité

## ✨ Fonctionnalités

### Outils de dessin

- **Rectangle** (R) : Création de rectangles avec dimensions précises
- **Cercle** (C) : Création de cercles et ellipses
- **Ligne** (L) : Tracé de segments de ligne
- **Polygone** (P) : Création de polygones réguliers (3-12 côtés)
- **Texte** (T) : Ajout de texte avec styles personnalisables

### Navigation et manipulation

- **Pan** (Molette / Espace + Clic) : Déplacement de la vue
- **Zoom** (Molette + Ctrl) : Zoom avant/arrière
- **Sélection** (V) : Sélection et déplacement d'éléments
- **Suppression** (Suppr) : Suppression d'éléments sélectionnés

### Fonctionnalités avancées

- **Grouping** (Ctrl+G) : Grouper les éléments sélectionnés
- **Ungrouping** (Ctrl+Shift+G) : Dégrouper les éléments
- **Clipboard** :
  - Copier (Ctrl+C)
  - Couper (Ctrl+X)
  - Coller (Ctrl+V)
- **Undo/Redo** :
  - Annuler (Ctrl+Z)
  - Rétablir (Ctrl+Y / Ctrl+Shift+Z)
- **Guides** : Création de guides horizontaux et verticaux par glisser-déposer depuis les règles
- **Snap to Grid** : Alignement automatique sur la grille
- **Snap to Guides** : Alignement automatique sur les guides
- **Zone de travail** : Définir une zone de travail personnalisée (utile pour la découpe laser)

### Édition avancée

- Mode édition pour :
  - Déplacer les points de contrôle des rectangles et cercles
  - Ajuster les rayons des cercles
  - Modifier les dimensions en temps réel
  - Supprimer des sommets (double-clic)
  - Ajouter des sommets (double-clic sur une arête)

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm build
```

## 🛠️ Stack Technique

- **React 18** : Framework UI moderne avec hooks
- **Vite** : Build tool ultra-rapide avec HMR
- **Tailwind CSS** : Utility-first CSS framework
- **Lucide React** : Icônes modernes et légères
- **Canvas API** : Rendu 2D haute performance

## 📁 Structure du projet

```
src/
├── components/
│   ├── Canvas.jsx           # Zone de dessin principale
│   ├── MenuBar.jsx          # Barre de menu supérieure
│   ├── Toolbar.jsx          # Barre d'outils latérale
│   ├── TopControls.jsx      # Contrôles de zoom/navigation
│   ├── PropertiesPanel.jsx  # Panneau de propriétés
│   └── DesignSystem.jsx     # Documentation du design system
├── hooks/
│   ├── useCanvas.js         # Logique de gestion du canvas
│   ├── useSelection.js      # Logique de sélection
│   ├── useViewport.js       # Logique de viewport (pan/zoom)
│   ├── useClipboard.js      # Logique du presse-papier
│   └── useHistory.js        # Logique d'undo/redo
├── utils/
│   ├── drawing.js           # Fonctions de rendu
│   ├── geometry.js          # Calculs géométriques
│   └── snapPoints.js        # Détection des points d'accrochage
├── constants/
│   └── index.js             # Constantes globales
└── CADEditor.jsx            # Composant racine
```

## 🎯 Raccourcis clavier

### Outils
- `V` : Sélection
- `R` : Rectangle
- `C` : Cercle
- `L` : Ligne
- `P` : Polygone
- `T` : Texte

### Navigation
- `Molette` : Pan vertical
- `Shift + Molette` : Pan horizontal
- `Ctrl + Molette` : Zoom
- `Espace + Clic` : Pan manuel

### Édition
- `Ctrl + C` : Copier
- `Ctrl + X` : Couper
- `Ctrl + V` : Coller
- `Suppr` : Supprimer
- `Ctrl + Z` : Annuler
- `Ctrl + Y` : Rétablir
- `Ctrl + G` : Grouper
- `Ctrl + Shift + G` : Dégrouper
- `Échap` : Désélectionner tout

### Affichage
- `Ctrl + 0` : Réinitialiser le zoom
- `Ctrl + R` : Afficher/Masquer les règles

## 🎨 Personnalisation

Les couleurs et constantes peuvent être modifiées dans :
- `tailwind.config.js` : Palette de couleurs
- `src/constants/index.js` : Tailles de grille, règles, etc.

## 🤝 Contributeurs

- **Damien Barré** : Product Owner & UX Designer
- **Claude (Anthropic)** : Développement & Implémentation

## 📝 License

Ce projet est un prototype privé pour Second Knife.

## 🔮 Roadmap Future

- [ ] Export SVG/DXF pour découpe laser
- [ ] Import de fichiers DXF
- [ ] Bibliothèque de formes prédéfinies
- [ ] Calques (layers)
- [ ] Mesures et annotations
- [ ] Mode dark/light toggle
- [ ] Collaboration en temps réel

---

**LaserLair** - Où la précision rencontre le brutalisme. 🔪⚡
