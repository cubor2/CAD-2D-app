# 🔪 CAD 2D Editor - LaserLair

**Éditeur CAD 2D professionnel optimisé pour la découpe laser**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Guide d'utilisation](#-guide-dutilisation)
- [Raccourcis clavier](#%EF%B8%8F-raccourcis-clavier)
- [Export pour découpe laser](#-export-pour-découpe-laser)
- [Architecture technique](#-architecture-technique)
- [Contribuer](#-contribuer)

---

## 🎯 Vue d'ensemble

**LaserLair CAD 2D Editor** est un éditeur vectoriel spécialement conçu pour la préparation de fichiers destinés aux machines de découpe laser. Il offre une interface intuitive et minimaliste avec toutes les fonctionnalités essentielles pour créer et éditer des designs précis.

### Pourquoi LaserLair ?

- ✅ **Précision millimétrique** : Toutes les dimensions en mm (entiers)
- ✅ **Export optimisé** : Configuration automatique par machine
- ✅ **Interface épurée** : Design "DrawHard" minimaliste
- ✅ **Snap intelligent** : Accrochage aux points clés et bords
- ✅ **100% gratuit** : Open source, pas d'abonnement

---

## ✨ Fonctionnalités

### 🎨 Outils de dessin

| Outil | Raccourci | Description |
|-------|-----------|-------------|
| **Sélection** | `V` | Sélectionner et manipuler les éléments |
| **Ligne** | `L` | Dessiner des lignes droites |
| **Rectangle** | `R` | Dessiner des rectangles (Shift = carré) |
| **Cercle/Ellipse** | `C` | Dessiner des cercles (Shift) et ellipses |
| **Arc** | `A` | Dessiner des arcs et portions d'ellipse |
| **Courbe de Bézier** | `B` | Dessiner des courbes quadratiques |
| **Texte** | `T` | Ajouter du texte (non découpable) |

### 🎯 Manipulation

- **Sélection multiple** : Shift+clic ou rectangle de sélection
- **Déplacement** : Drag & drop avec snap automatique
- **Redimensionnement** : Édition des dimensions avec verrouillage des proportions
- **Rotation** : 45° autour du centre de sélection
- **Symétries** : Horizontale et verticale
- **Points de contrôle** : Édition précise des formes

### 📏 Mesures et précision

- **Zone de travail** : Dimensions configurables (ex: 300×300mm)
- **Grille** : 10mm avec marqueurs tous les 50mm
- **Règles** : Graduations en millimètres
- **Dimensions** : Affichage en temps réel sur le canvas
- **Snap** : 
  - Points clés (extrémités, centres, milieux)
  - Bords des éléments
  - Grille (optionnel)

### 💾 Import/Export

- **Projets** : .json (natif)
- **Images** : PNG (export)
- **Vecteurs** : SVG (standard)
- **Découpe laser** : PDF/SVG optimisés par machine

---

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Étapes

```bash
# Cloner le repository
git clone https://github.com/Second-Knife/CAD-2D-Software.git
cd "CAD 2D Software"

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build
```

---

## 📖 Guide d'utilisation

### 1. Créer un nouveau projet

1. Fichier > Nouveau (ou Ctrl+N)
2. Configurer la zone de travail dans le panneau de droite
3. Commencer à dessiner !

### 2. Dessiner des formes

**Ligne** :
- Sélectionner l'outil Ligne (L)
- Cliquer pour le point de départ
- Cliquer pour le point d'arrivée
- La longueur est éditable dans le panneau de droite

**Rectangle** :
- Sélectionner l'outil Rectangle (R)
- Cliquer et glisser pour définir la taille
- Maintenir Shift pour un carré parfait
- Dimensions éditables (avec verrouillage proportions)

**Cercle/Ellipse** :
- Sélectionner l'outil Cercle (C)
- Cliquer et glisser pour définir le rayon
- Maintenir Shift pour un cercle parfait
- Largeur/hauteur éditables séparément

**Arc** :
- Sélectionner l'outil Arc (A)
- Cliquer pour le centre
- Glisser pour le rayon et angle de départ
- Relâcher pour définir l'angle de fin
- Largeur/hauteur éditables pour faire des ellipses partielles

### 3. Sélectionner et modifier

**Sélection** :
- Clic simple : sélectionner un élément
- Shift+clic : ajouter/retirer de la sélection
- Rectangle de sélection : glisser pour sélectionner plusieurs
- Ctrl+A : tout sélectionner

**Transformation** :
- **Déplacer** : Glisser les éléments sélectionnés
- **Redimensionner** : Éditer largeur/hauteur dans le panneau
- **Rotation** : Bouton "Pivoter 45°" (centre de sélection)
- **Symétrie** : Boutons H (horizontal) / V (vertical)

### 4. Guides et snap

**Activer/désactiver** :
- Snap aux éléments : Icône aimant (TopControls)
- Afficher dimensions : Icône "Cotes"
- Afficher règles : Icône règle
- Snap à la grille : (dans snap aux éléments)

**Guides dynamiques** :
- Activés automatiquement avec les règles
- Glisser depuis les règles pour placer un guide
- Cliquer sur un guide pour le supprimer

### 5. Export pour découpe laser

1. Fichier > "Exporter pour découpe laser..."
2. Sélectionner votre machine dans le dropdown
3. Lire les modifications qui seront appliquées
4. Choisir le format (PDF recommandé)
5. Cliquer sur "Exporter"

**Important** :
- La zone de travail doit correspondre exactement aux dimensions de votre machine
- Les éléments sont exportés avec leur position absolue (pas de centrage)
- Les couleurs et épaisseurs sont automatiquement ajustées

---

## ⌨️ Raccourcis clavier

### Outils
| Raccourci | Action |
|-----------|--------|
| `V` | Outil Sélection |
| `L` | Outil Ligne |
| `R` | Outil Rectangle |
| `C` | Outil Cercle/Ellipse |
| `A` | Outil Arc |
| `B` | Outil Courbe de Bézier |
| `T` | Outil Texte |

### Édition
| Raccourci | Action |
|-----------|--------|
| `Ctrl+Z` | Annuler |
| `Ctrl+Y` | Rétablir |
| `Ctrl+A` | Tout sélectionner |
| `Ctrl+D` | Dupliquer la sélection |
| `Suppr` | Supprimer la sélection |

### Fichier
| Raccourci | Action |
|-----------|--------|
| `Ctrl+N` | Nouveau projet |
| `Ctrl+O` | Ouvrir |
| `Ctrl+S` | Enregistrer |
| `Ctrl+Shift+S` | Enregistrer sous |

### Navigation
| Raccourci | Action |
|-----------|--------|
| `Espace + Drag` | Pan (déplacer la vue) |
| `Middle Click + Drag` | Pan |
| `Molette` | Zoom in/out |

### Sélection
| Raccourci | Action |
|-----------|--------|
| `Shift + Clic` | Ajouter/retirer de la sélection |
| `Shift + Drag` | Dessiner un carré/cercle parfait |

---

## 🖨️ Export pour découpe laser

### Machines supportées

| Machine | Formats | Couleur standard | Épaisseur |
|---------|---------|------------------|-----------|
| **Epilog** | PDF, SVG | Rouge (255,0,0) | 0.01 mm |
| **Trotec** | PDF, SVG | Rouge (255,0,0) | 0.01 mm |
| **Universal Laser** | PDF, SVG | Noir (0,0,0) | 0.001 in |
| **Glowforge** | PDF, SVG | Bleu (#0000ff) | 0.01 mm |
| **BRM Lasers** | PDF, SVG | Rouge (255,0,0) | 0.001 mm |
| **Full Spectrum** | PDF, SVG | Rouge (255,0,0) | 0.254 mm |
| **LightBurn** | LBRN *(à venir)* | - | - |

### Modifications automatiques

Lors de l'export, le logiciel applique automatiquement :

1. **Fond blanc** : Ajouté sur les PDF (standard découpe laser)
2. **Couleur des traits** : Ajustée selon la machine sélectionnée
3. **Épaisseur des traits** : Optimisée pour la machine
4. **Dimensions précises** : Zone de travail respectée au millimètre
5. **Positionnement absolu** : Pas de recentrage automatique

### Conseils d'utilisation

✅ **À faire** :
- Vérifier que la zone de travail correspond à votre matériau
- Utiliser des traits fins (≤ 1mm) pour la découpe
- Tester sur un petit échantillon d'abord

❌ **À éviter** :
- Formes trop petites (< 1mm)
- Traits trop épais
- Zones de détails trop proches (< 2mm)

---

## 🏗️ Architecture technique

### Stack technologique

```
React 18
├── Canvas API (rendu 2D)
├── Tailwind CSS (styling)
├── jsPDF (export PDF)
└── Lucide React (icônes)
```

### Structure du projet

```
src/
├── components/          # Composants React
│   ├── Canvas.jsx      # Canvas principal
│   ├── MenuBar.jsx     # Barre de menu
│   ├── Toolbar.jsx     # Barre d'outils
│   ├── TopControls.jsx # Contrôles supérieurs
│   ├── PropertiesPanel.jsx # Panneau propriétés
│   └── LaserExportModal.jsx # Modal export laser
├── hooks/              # Hooks personnalisés
│   ├── useElements.js  # Gestion des éléments
│   ├── useHistory.js   # Historique undo/redo
│   └── useViewport.js  # Gestion du viewport
├── utils/              # Utilitaires
│   ├── drawing.js      # Fonctions de dessin
│   ├── geometry.js     # Calculs géométriques
│   ├── snap.js         # Système de snap
│   └── laserExporter.js # Export laser
├── constants/          # Constantes
│   ├── index.js        # Constantes générales
│   └── laserMachines.js # Config machines laser
└── CADEditor.jsx       # Composant principal
```

### Système de coordonnées

**Canvas (monde)** :
- Origine : Centre (0, 0)
- Unité : Millimètres
- Y positif vers le bas

**Export (PDF/SVG)** :
- Origine : Top-left (0, 0)
- Transformation automatique : `x + width/2, y + height/2`

### Gestion de l'état

**Elements** : Liste des formes dessinées
```javascript
{
  id: string,
  type: 'line' | 'rectangle' | 'circle' | 'arc' | 'curve' | 'text',
  stroke: string,
  strokeWidth: number,
  // ... propriétés spécifiques
}
```

**Viewport** : État de la vue
```javascript
{
  x: number,        // Offset X
  y: number,        // Offset Y
  zoom: number      // Niveau de zoom
}
```

**History** : Stack undo/redo (max 50)

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créer** une branche (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Guidelines

- Code en français (commentaires, variables)
- Suivre la charte design "DrawHard"
- Tests pour les nouvelles fonctionnalités
- Documentation à jour

---

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 🙏 Remerciements

- **Claude AI** - Assistant de développement extraordinaire 🎶
- **React Team** - Pour ce framework incroyable
- **Tailwind CSS** - Pour le système de styling
- **Lucide** - Pour les icônes magnifiques

---

## 📞 Contact & Support

- **Issues** : [GitHub Issues](https://github.com/Second-Knife/CAD-2D-Software/issues)
- **Discussions** : [GitHub Discussions](https://github.com/Second-Knife/CAD-2D-Software/discussions)
- **Email** : contact@second-knife.com

---

<div align="center">

**Fait avec ❤️ pour la communauté des makers**

[⭐ Star ce projet](https://github.com/Second-Knife/CAD-2D-Software) si vous le trouvez utile !

</div>
