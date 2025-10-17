# Débogage du redimensionnement du texte

## Problème initial
Le redimensionnement du texte ne fonctionne que partiellement :
- Seul le point de contrôle en bas à gauche répond aux clics
- Le redimensionnement avec ce point est erratique ("téléportation")
- Les trois autres points de contrôle ne répondent pas du tout

## Tentatives de correction

### Tentative 1 : Refactoring dans textResizing.js
**Approche** :
- Création d'un fichier `src/utils/textResizing.js`
- Extraction de la logique de redimensionnement dans une fonction `calculateTextResize`
- Utilisation de coordonnées monde pour les calculs

**Résultat** : Échec
- Le problème de détection des points persiste
- Le redimensionnement reste erratique

### Tentative 2 : Bounding Box et Matrices
**Approche** :
- Création d'une classe `BoundingBox` pour gérer les transformations
- Utilisation de matrices de transformation 2D
- Calcul des points de contrôle basé sur la boîte englobante

**Résultat** : Échec
- Complexité accrue sans amélioration
- Problèmes de précision avec les matrices

### Tentative 3 : Coordonnées écran vs monde
**Approche** :
- Conversion systématique en coordonnées écran pour la détection des clics
- Utilisation d'un seuil fixe en pixels
- Logs détaillés pour le débogage

**Résultat** : Échec
- Problèmes de synchronisation avec le canvas
- Erreurs de référence circulaire dans les hooks

## Leçons apprises

1. **Gestion des coordonnées** :
   - La conversion entre coordonnées monde et écran est délicate
   - Le zoom complique les calculs de distance
   - Les seuils de clic doivent être en pixels écran

2. **Architecture** :
   - La séparation en hooks et utilitaires peut créer des dépendances circulaires
   - Le contexte du canvas doit être géré avec précaution
   - Les transformations de texte sont plus complexes que les formes géométriques

3. **Points à investiguer** :
   - Vérifier la cohérence des coordonnées à chaque étape
   - Examiner le comportement du point en bas à gauche qui fonctionne partiellement
   - Étudier l'impact du zoom sur la détection des clics

## Pistes pour futures tentatives

1. **Simplification** :
   - Commencer par faire fonctionner un seul point de contrôle correctement
   - Utiliser des coordonnées écran uniquement pour la détection
   - Minimiser les conversions de coordonnées

2. **Débogage** :
   - Ajouter des visualisations des points de contrôle
   - Logger les coordonnées à chaque étape
   - Comparer avec le comportement des rectangles

3. **Architecture** :
   - Séparer la détection des clics du redimensionnement
   - Utiliser un système d'événements plus simple
   - Éviter les dépendances circulaires

## Code de référence

Les différentes tentatives sont disponibles dans les commits :
- Tentative 1 : [lien vers le commit]
- Tentative 2 : [lien vers le commit]
- Tentative 3 : [lien vers le commit]

## Notes supplémentaires

Le bug semble être lié à la façon dont les points de contrôle sont calculés et détectés plutôt qu'à la logique de redimensionnement elle-même. Une approche plus simple, focalisée sur la détection des clics, pourrait être plus fructueuse.




