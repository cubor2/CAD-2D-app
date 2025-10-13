# CAD 2D Editor

Application de dessin CAD 2D pour créer des objets destinés à la découpe laser.

## Démarrage rapide

### Installation des dépendances
```bash
npm install
```

### Lancement du serveur de développement
```bash
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

### Build pour la production
```bash
npm run build
```

## Unités et mesures

**1 unité = 1 millimètre (mm)**

Tous les dessins sont créés en millimètres pour une précision optimale lors de la découpe laser. La grille affiche des intervalles de 1mm avec des lignes majeures tous les 10mm (1cm).

## Raccourcis clavier

### Fichier
- **Ctrl/Cmd + N** : Nouveau projet
- **Ctrl/Cmd + O** : Ouvrir un fichier
- **Ctrl/Cmd + S** : Enregistrer
- **Ctrl/Cmd + Shift + S** : Enregistrer sous

### Outils
- **S** : Outil de sélection/déplacement
- **E** : Outil d'édition
- **L** : Outil ligne
- **R** : Outil rectangle
- **C** : Outil cercle

### Navigation
- **Espace + Clic gauche** : Déplacer la vue (pan)
- **Shift + Molette** : Zoom avant/arrière
- **Flèches directionnelles** : Déplacer les éléments sélectionnés (1mm)
- **Shift + Flèches** : Déplacer les éléments sélectionnés (5mm)

### Édition
- **Ctrl/Cmd + Z** : Annuler
- **Ctrl/Cmd + Y** ou **Ctrl/Cmd + Shift + Z** : Rétablir
- **Ctrl/Cmd + X** : Couper
- **Ctrl/Cmd + C** : Copier
- **Ctrl/Cmd + V** : Coller
- **Shift + Ctrl/Cmd + V** : Coller sur place
- **Delete/Backspace** : Supprimer les éléments sélectionnés
- **Ctrl/Cmd + G** : Grouper les éléments sélectionnés
- **Ctrl/Cmd + Shift + G** : Dégrouper
- **Shift + Clic** : Ajouter/retirer de la sélection

### Dessin
- **Shift + Drag** : Contraindre les proportions (cercles, rectangles carrés, lignes à 45°)

## Fonctionnalités

### Dessin
- Dessin de lignes, rectangles, cercles et ellipses
- Édition précise des points de contrôle
- Snap sur grille (1mm)
- Snap sur les éléments (points, centres, milieux, arêtes)
- Règles et guides magnétiques
- Groupement d'éléments
- Affichage des dimensions en millimètres
- Sélection multiple (Shift + Clic ou rectangle de sélection)

### Fichiers
- Enregistrement/ouverture de projets (format JSON)
- Export SVG avec dimensions en millimètres
- Export PNG haute résolution (96 DPI)
- Export DXF (à venir)

### Interface
- Mode clair/sombre
- Historique complet d'actions (Undo/Redo)
- Menus complets avec toutes les commandes standard :
  * Menu Fichier (Nouveau, Ouvrir, Sauver, Exporter)
  * Menu Édition (Annuler, Rétablir, Couper, Copier, Coller, Supprimer)
  * Menu Objet (Grouper, Dégrouper)
- Copier/coller avec décalage automatique
- Panneau de propriétés dynamique
- États de menu intelligents (désactivation si pas de sélection)
- Feedback visuel lors des opérations :
  * Flash vert lors du groupement
  * Flash orange lors du dégroupement

## Export pour découpe laser

### Format SVG (recommandé)
L'export SVG utilise des unités en millimètres avec une correspondance 1:1. Les traits sont en noir (stroke-width: 0.3mm) avec un fond transparent, parfait pour l'importation dans des logiciels de découpe laser comme :
- LightBurn
- RDWorks
- LaserGRBL
- Inkscape

### Format PNG
L'export PNG génère une image en haute résolution (96 DPI / 3.78 pixels par mm) avec :
- Fond blanc
- Traits noirs
- Dimensions précises pour visualisation et impression

## Technologies utilisées

- React 18
- Vite
- Tailwind CSS
- Lucide React (icônes)
- HTML Canvas API

