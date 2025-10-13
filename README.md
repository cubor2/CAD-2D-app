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

## Raccourcis clavier

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
- **Ctrl/Cmd + C** : Copier
- **Ctrl/Cmd + X** : Couper
- **Ctrl/Cmd + V** : Coller
- **Shift + Ctrl/Cmd + V** : Coller sur place
- **Ctrl/Cmd + Z** : Annuler
- **Ctrl/Cmd + G** : Grouper les éléments sélectionnés
- **Ctrl/Cmd + Shift + G** : Dégrouper
- **Delete/Backspace** : Supprimer les éléments sélectionnés
- **Shift + Clic** : Ajouter/retirer de la sélection

### Dessin
- **Shift + Drag** : Contraindre les proportions (cercles, rectangles carrés, lignes à 45°)

## Fonctionnalités

- Dessin de lignes, rectangles et cercles
- Édition précise des points de contrôle
- Snap sur grille (1mm)
- Snap sur les éléments (points, centres, milieux, arêtes)
- Règles et guides magnétiques
- Groupement d'éléments
- Affichage des dimensions en millimètres
- Mode clair/sombre
- Historique d'actions (Undo)
- Copier/coller avec décalage automatique
- Sélection multiple (Shift + Clic ou rectangle de sélection)

## Technologies utilisées

- React 18
- Vite
- Tailwind CSS
- Lucide React (icônes)

