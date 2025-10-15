# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [Non publié] - 2025-10-15

### Ajouté
- **Double-clic pour passer en mode édition** : En mode sélection, double-cliquer sur un élément passe automatiquement en mode édition
- **Échap pour retourner en sélection** : En mode édition, la touche Échap retourne automatiquement en mode sélection
- **Touche Tab pour basculer** : La touche Tab permet de basculer entre les modes sélection et édition
- **Maintien du ratio avec Shift** : 
  - Pour les rectangles : Shift pendant l'édition maintient le ratio d'aspect original
  - Pour les ellipses : Shift pendant l'édition maintient le ratio d'aspect original
  - Pour les cercles : Shift pendant l'édition garde un cercle parfait
- **Sélection et manipulation des arêtes** :
  - Cliquer sur une arête la sélectionne (rectangles et cercles)
  - Cliquer à nouveau sur une arête sélectionnée permet de la déplacer avec la souris
  - Utiliser les flèches du clavier pour déplacer une arête sélectionnée (1mm ou 5mm avec Shift)
  - Supprimer une arête avec Delete (crée des lignes/arcs à partir des côtés restants)
- **Affichage dynamique dans le panneau propriétés** :
  - Cercles : Affiche "Diamètre (D)"
  - Ellipses : Affiche "Largeur (L)" et "Hauteur (H)"
  - Adaptation automatique selon la forme

### Modifié
- Amélioration du `.gitignore` pour exclure les fichiers temporaires et backups
- Documentation complète du README avec les nouvelles fonctionnalités
- Ajout d'une section "Structure du projet" dans le README
- Mise à jour des raccourcis clavier dans le README

### Documentation
- Création de `CONTRIBUTING.md` : Guide complet sur Git et GitHub
- Création de `CHANGELOG.md` : Suivi des modifications du projet
- Documentation des bonnes pratiques de versioning
- Explications sur les messages de commit et le workflow Git

## [0.1.0] - 2025-10-XX

### Ajouté
- Outils de dessin : Ligne, Rectangle, Cercle, Arc, Texte
- Mode sélection et mode édition
- Système de snap sur grille et éléments
- Règles et guides magnétiques
- Groupement d'éléments
- Historique Undo/Redo complet
- Panneau de propriétés dynamique
- Menus complets (Fichier, Édition, Objet)
- Export SVG, PNG
- Gestion de texte avec édition en ligne
- Raccourcis clavier complets
- Mode clair/sombre

---

## Types de modifications

- **Ajouté** pour les nouvelles fonctionnalités
- **Modifié** pour les changements dans les fonctionnalités existantes
- **Déprécié** pour les fonctionnalités bientôt supprimées
- **Supprimé** pour les fonctionnalités supprimées
- **Corrigé** pour les corrections de bugs
- **Sécurité** pour les vulnérabilités corrigées

