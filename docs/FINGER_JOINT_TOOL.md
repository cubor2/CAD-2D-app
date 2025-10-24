# Outil Créneaux (Finger Joint Tool)

## Vue d'ensemble

L'outil créneaux permet de créer des assemblages par emboîtement (finger joints/box joints) pour la découpe laser. Ces créneaux sont essentiels pour assembler des pièces de bois ou d'autres matériaux sans colle ni vis.

## Accès à l'outil

- **Icône** : Motif de créneaux dans la barre d'outils (dernière position)
- **Raccourci clavier** : `F`
- **Position** : Après l'outil Texte dans la toolbar

## Utilisation

### Création d'un crénelage

1. Sélectionnez l'outil créneaux (F)
2. Cliquez sur le point de départ sur le canvas
3. Déplacez la souris et cliquez sur le point d'arrivée
4. Le crénelage est créé automatiquement avec les paramètres par défaut

### Paramètres disponibles

#### Dimensions
- **Longueur** : Longueur totale du crénelage (modifiable en temps réel)
- **Épaisseur** : Épaisseur du matériau (profondeur des dents) - valeurs entières uniquement
- **Largeur dent** : Largeur de chaque dent
- **Largeur espace** : Largeur de chaque espace entre les dents

#### Type de crénelage
- **Mâle** : Les dents dépassent vers le haut (défaut)
- **Femelle** : Les dents sont creusées vers le bas

### Ajustement automatique

L'outil ajuste automatiquement la largeur des dents et des espaces pour :
- Garantir la symétrie (commence et finit par le même type)
- Remplir exactement la longueur totale
- Éviter les dents partielles

## Mode Édition

### Points de contrôle

En mode édition (E), trois points de contrôle sont disponibles :

1. **Point de départ** (noir) : Repositionne le début du crénelage
2. **Point central** (bleu) : 
   - **Curseur** : Main (grab)
   - **Action** : Modifie l'épaisseur perpendiculairement à la ligne
   - Tirez vers le haut/bas pour augmenter/diminuer l'épaisseur
3. **Point d'arrivée** (noir) : Repositionne la fin du crénelage

### Sélection améliorée

La détection des clics utilise le contour complet du crénelage, pas seulement la ligne de base. Cela facilite la sélection des créneaux complexes.

## Caractéristiques techniques

### Géométrie

- **Coordonnées de référence** : Toujours sur la ligne de base (le bas)
- **Path de dessin** : S'adapte selon le type (mâle/femelle)
- **Points d'ancrage** : Sur la ligne de base pour un snap précis avec d'autres éléments

### Symétrie

- Les créneaux mâles commencent et finissent par une ligne horizontale (pas d'angles droits)
- La première et la dernière dent ont toutes leurs bordures pour une finition propre

### Transformations supportées

- **Rotation** : 45° via le bouton ou drag des points
- **Symétrie horizontale** : Inverse la direction
- **Symétrie verticale** : Inverse le type (mâle ↔ femelle)
- **Redimensionnement** : Modification de la longueur totale

## Contraintes et validations

- **Longueur minimale** : 2mm (évite les éléments invisibles)
- **Épaisseur minimale** : 1mm
- **Largeur dent minimale** : 1mm
- **Largeur espace minimale** : 1mm

## Cas d'usage

### Assemblage de boîtes

Utilisez les créneaux mâles et femelles sur les bords opposés de deux pièces pour créer un emboîtement solide.

### Paramètres recommandés

Pour du bois de 3mm :
- Épaisseur : 3mm
- Largeur dent : 10mm
- Largeur espace : 10mm

Pour du bois de 6mm :
- Épaisseur : 6mm
- Largeur dent : 15mm
- Largeur espace : 15mm

## Export laser

Les créneaux sont exportés comme des paths continus, optimisés pour la découpe laser. Le format SVG préserve toute la géométrie pour une découpe précise.

## Fichiers impliqués

### Core
- `src/utils/fingerJoint.js` : Algorithme de génération des points
- `src/utils/drawing.js` : Rendu sur canvas
- `src/components/Toolbar.jsx` : Icône et activation de l'outil

### Édition
- `src/CADEditor.jsx` : Logique de création, édition et détection
- `src/utils/elementGeometry.js` : Points de contrôle et curseurs
- `src/components/PropertiesPanel.jsx` : Interface des paramètres

### Utilitaires
- `src/utils/geometry.js` : Fonctions de calcul de distance au path

## Notes de développement

### Algorithme de génération

L'algorithme `generateFingerJointPoints` :
1. Calcule le vecteur directeur de la ligne de base
2. Calcule le vecteur perpendiculaire pour la profondeur
3. Génère les segments (dents et espaces) en alternance
4. Garantit la symétrie en ajustant les largeurs si `autoAdjust` est activé
5. Retourne un tableau de points formant le contour complet

### Performance

La détection des clics utilise `pointToPathDistance` qui itère sur tous les segments. Pour des créneaux avec beaucoup de dents (>50), cela reste performant grâce à l'optimisation des calculs géométriques.

