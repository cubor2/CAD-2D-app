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

## Fonctionnalités

### Outils disponibles
- **Sélection et déplacement** : Sélectionner et déplacer tous les éléments (lignes, rectangles, cercles, arcs, textes)
- **Création de formes** : Lignes, rectangles, cercles, arcs
- **Texte** : Ajouter et éditer du texte avec mise en forme

### Fonctionnalités des textes
- **Sélection et déplacement** : Utiliser l'outil de sélection pour déplacer les zones de texte
- **Édition de contenu** : Double-cliquer ou utiliser l'outil d'édition pour modifier le texte
- **Redimensionnement** : 8 poignées de redimensionnement (4 coins + 4 milieux de côté)
- **Navigation au clavier** : Flèches, Home, End, Shift+flèches pour la sélection
- **Formatage** : Style, poids et taille de police personnalisables

### Raccourcis clavier
- `Ctrl+Z` / `Cmd+Z` : Annuler
- `Ctrl+Y` / `Cmd+Y` : Refaire
- `Ctrl+C` / `Cmd+C` : Copier
- `Ctrl+V` / `Cmd+V` : Coller
- `Ctrl+X` / `Cmd+X` : Couper
- `Suppr` / `Backspace` : Supprimer
- `Echap` : Désélectionner

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
- **Tab** : Basculer entre sélection et édition
- **L** : Outil ligne
- **R** : Outil rectangle
- **C** : Outil cercle
- **T** : Outil texte

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

### Édition de texte
- **Double-clic** : Entrer en mode édition de texte (outil "edit" uniquement)
- **Flèches directionnelles** : Déplacer le curseur
- **Shift + Flèches** : Sélectionner du texte
- **Ctrl/Cmd + A** : Sélectionner tout le texte
- **Home/End** : Aller au début/fin de la ligne
- **Entrée** : Nouvelle ligne
- **Backspace/Delete** : Supprimer du texte
- **Clic dans le texte** : Positionner le curseur

### Dessin
- **Shift pendant la création** : Contraindre les proportions (cercles, rectangles carrés, lignes à 45°)
- **Shift pendant l'édition** : Maintenir le ratio d'aspect original (rectangles, ellipses)

### Mode Édition avancé
- **Double-clic** (en mode sélection) : Passe automatiquement en mode édition
- **Échap** (en mode édition) : Retourne en mode sélection
- **Clic sur une arête** : Sélectionne l'arête (rectangle/cercle)
- **Double-clic sur une arête** : Permet de la déplacer ou supprimer
- **Delete** sur une arête : Supprime l'arête et crée des lignes/arcs

## Fonctionnalités

### Dessin
- Dessin de lignes, rectangles, cercles et ellipses
- **Édition de texte avec curseur clignotant**
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

## Structure du projet

Le projet suit une architecture modulaire React recommandée :

```
src/
├── components/        # Composants React réutilisables
│   ├── Canvas.jsx       # Composant de rendu Canvas
│   ├── Toolbar.jsx      # Barre d'outils
│   ├── MenuBar.jsx      # Menu principal
│   ├── PropertiesPanel.jsx  # Panneau des propriétés
│   └── ...
├── hooks/            # Hooks React personnalisés
│   ├── useViewport.js   # Gestion du viewport (zoom, pan)
│   ├── useElements.js   # Gestion des éléments (undo/redo)
│   ├── useSelection.js  # Gestion de la sélection
│   └── useKeyboardShortcuts.js  # Raccourcis clavier
├── utils/            # Fonctions utilitaires pures
│   ├── transforms.js    # Conversions de coordonnées
│   ├── geometry.js      # Calculs géométriques
│   ├── drawing.js       # Fonctions de rendu Canvas
│   ├── snap.js          # Système de snapping
│   └── ...
├── constants/        # Constantes globales
│   └── index.js
├── handlers/         # Gestionnaires d'événements complexes
└── CADEditor.jsx     # Composant principal
```

### Principes d'architecture

✅ **Séparation des responsabilités** : Chaque fichier a un rôle précis  
✅ **Composants réutilisables** : Les composants UI sont isolés  
✅ **Logique métier externalisée** : Les hooks contiennent la logique  
✅ **Fonctions pures** : Les utils sont testables et prévisibles  
✅ **Pas de duplication** : Le code commun est mutualisé

## Documentation technique

Pour les développeurs travaillant sur le code :

### 📐 Systèmes de coordonnées
Comprendre les différents systèmes de coordonnées est **crucial** pour éviter des bugs de positionnement et de redimensionnement.

📚 **[Guide complet des systèmes de coordonnées](docs/COORDINATE_SYSTEMS.md)**
- Les 4 systèmes de coordonnées (Monde, Canvas, Client, Canvas-Relative)
- Conversions entre systèmes
- Différence critique entre Position et Delta/Vecteur
- Bugs courants et leurs solutions
- Checklist pour éviter les erreurs

📝 **[Commentaires détaillés du code de redimensionnement](docs/CODE_COMMENTS_TEXT_RESIZE.md)**
- Explication ligne par ligne des fonctions critiques
- `getTextControlPointsScreen()` : Calcul des poignées
- `handleTextResize()` : Algorithme de redimensionnement
- Détection de clic sur les poignées
- Pièges à éviter avec exemples

### 🐛 Debugging
Si vous rencontrez des problèmes avec le positionnement, le redimensionnement ou la détection de clic :
1. Identifiez le système de coordonnées de vos variables
2. Vérifiez si vous manipulez une **position** ou un **delta/vecteur**
3. Consultez la section "Bugs Rencontrés" dans `COORDINATE_SYSTEMS.md`
4. Utilisez les techniques de debug décrites dans la documentation

