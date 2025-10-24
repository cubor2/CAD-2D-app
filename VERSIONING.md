# 🔖 Guide de Versioning

## Version actuelle : 0.1.0

Le numéro de version suit le format **Semantic Versioning** : `MAJOR.MINOR.PATCH`

- **MAJOR** : Changements incompatibles avec les versions précédentes
- **MINOR** : Nouvelles fonctionnalités compatibles
- **PATCH** : Corrections de bugs

---

## 🚀 Comment incrémenter la version

### Option 1 : Scripts npm (Recommandé)

```bash
# Pour une correction de bug (0.1.0 → 0.1.1)
npm run version:patch

# Pour une nouvelle fonctionnalité (0.1.0 → 0.2.0)
npm run version:minor

# Pour un changement majeur (0.1.0 → 1.0.0)
npm run version:major
```

**Ces commandes :**
- ✅ Modifient automatiquement `package.json`
- ✅ Créent un commit Git avec le message "🔖 Version X.Y.Z"
- ✅ Créent un tag Git `vX.Y.Z`

### Option 2 : Commande npm native

```bash
# Même résultat, mais sans emoji
npm version patch
npm version minor
npm version major
```

---

## 📦 Workflow recommandé avant un push

1. **Faire vos modifications** et les commiter normalement
2. **Incrémenter la version** selon le type de changement :
   ```bash
   npm run version:patch   # ou minor / major
   ```
3. **Mettre à jour le CHANGELOG.md** avec les changements de cette version
4. **Commit du CHANGELOG** :
   ```bash
   git add CHANGELOG.md
   git commit -m "📝 Update CHANGELOG for vX.Y.Z"
   ```
5. **Push vers GitHub** avec les tags :
   ```bash
   git push origin refactor/modular-architecture --follow-tags
   ```

---

## 🏷️ Tags Git

Les tags permettent de retrouver facilement une version spécifique :

```bash
# Lister tous les tags
git tag

# Revenir à une version spécifique
git checkout v0.1.0

# Revenir à la dernière version
git checkout refactor/modular-architecture
```

---

## 🔄 Automatisation (GitHub Actions - Optionnel)

Si tu veux automatiser l'incrémentation à chaque push, tu peux créer une GitHub Action.
Pour l'instant, l'approche manuelle avec les scripts npm est plus contrôlée et suit les bonnes pratiques.

---

## 📍 Où la version est affichée ?

La version est affichée automatiquement dans :
- ✅ Interface utilisateur (panneau de propriétés, en bas à gauche)
- ✅ Fichiers `.json` sauvegardés (métadonnées)
- ✅ Exports SVG (en-tête du fichier)

**Tout est synchronisé automatiquement avec `package.json` !** 🎯

