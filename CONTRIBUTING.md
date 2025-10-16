# Guide de Contribution

## 📚 Bonnes pratiques Git & GitHub

### Qu'est-ce que Git et GitHub ?

**Git** = Système de versioning (comme "Ctrl+Z" avancé pour tout le projet)  
**GitHub** = Plateforme en ligne pour héberger et partager des projets Git

### Les avantages

✅ **Historique complet** : Tu peux revenir à n'importe quelle version  
✅ **Travail en équipe** : Plusieurs personnes peuvent travailler simultanément  
✅ **Backup automatique** : Ton code est sauvegardé en ligne  
✅ **Documentation** : Les messages de commit expliquent chaque changement

---

## 🎯 Workflow recommandé

### 1. Vérifier l'état actuel
```bash
git status
```
Montre les fichiers modifiés et non suivis.

### 2. Ajouter les fichiers à commiter
```bash
# Ajouter un fichier spécifique
git add src/CADEditor.jsx

# Ajouter tous les fichiers modifiés
git add .
```

### 3. Créer un commit avec un message clair
```bash
git commit -m "feat: Ajout du maintien du ratio avec Shift"
```

### 4. Pousser sur GitHub
```bash
git push origin master
```

---

## 📝 Messages de commit

### Format recommandé

```
<type>: <description courte>

<description détaillée optionnelle>
```

### Types de commit

- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `refactor` : Refactorisation sans changement de fonctionnalité
- `docs` : Modification de documentation
- `style` : Formatage, pas de changement de code
- `chore` : Tâches de maintenance

### Exemples

✅ **BON**
```bash
git commit -m "feat: Ajout du double-clic pour passer en mode édition"
git commit -m "fix: Correction du ratio des ellipses avec Shift"
git commit -m "refactor: Séparation du code en hooks réutilisables"
```

❌ **MAUVAIS**
```bash
git commit -m "update"
git commit -m "fix bug"
git commit -m "wip"
```

---

## 🌿 Branches

### Créer une branche pour une fonctionnalité
```bash
# Créer et basculer sur une nouvelle branche
git checkout -b feature/nouvelle-fonctionnalite

# Travailler sur la branche...
git add .
git commit -m "feat: Description de la fonctionnalité"

# Pousser la branche sur GitHub
git push origin feature/nouvelle-fonctionnalite

# Retourner sur master
git checkout master

# Fusionner la branche
git merge feature/nouvelle-fonctionnalite

# Pousser master
git push origin master
```

### Quand utiliser des branches ?

- ✅ Pour tester une nouvelle fonctionnalité
- ✅ Pour expérimenter sans risque
- ✅ Pour collaborer avec d'autres développeurs

---

## 🧹 Garder un dépôt propre

### Fichiers à NE PAS commiter

❌ Fichiers temporaires (`.backup`, `.temp`)  
❌ Fichiers de configuration personnelle (`.vscode`, `.idea`)  
❌ Dépendances (`node_modules`)  
❌ Builds (`dist`, `build`)  
❌ Variables d'environnement (`.env`)

**Solution** : Ajouter ces fichiers dans `.gitignore`

### Nettoyer les fichiers non suivis
```bash
# Voir ce qui serait supprimé
git clean -n

# Supprimer les fichiers non suivis
git clean -f

# Supprimer aussi les dossiers
git clean -fd
```

---

## 🔄 Récupérer les modifications d'autres collaborateurs

```bash
# Récupérer les changements depuis GitHub
git pull origin master
```

---

## ⚠️ En cas de problème

### Annuler des modifications non commitées
```bash
# Annuler les modifications d'un fichier
git restore src/CADEditor.jsx

# Annuler toutes les modifications
git restore .
```

### Annuler le dernier commit (mais garder les modifications)
```bash
git reset --soft HEAD~1
```

### Annuler le dernier commit (et perdre les modifications)
```bash
git reset --hard HEAD~1
```

---

## 📊 Historique et exploration

```bash
# Voir l'historique des commits
git log

# Version courte et lisible
git log --oneline --graph

# Voir les différences
git diff
```

---

## 🎓 Ressources

- [Git Documentation officielle](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Visualiseur Git interactif](https://learngitbranching.js.org/)

---

## 💡 Conseil pour ce projet

### Workflow quotidien simple

1. **Avant de commencer à coder**
   ```bash
   git pull origin master
   ```

2. **Après avoir fait des modifications**
   ```bash
   git status                    # Voir ce qui a changé
   git add .                     # Ajouter tous les fichiers
   git commit -m "feat: ..."     # Commit avec message clair
   git push origin master        # Pousser sur GitHub
   ```

3. **Régulièrement** (tous les 2-3 jours)
   ```bash
   # Nettoyer les fichiers temporaires
   git clean -n                  # Vérifier
   git clean -fd                 # Supprimer
   ```

C'est tout ! Git peut sembler complexe au début, mais ces commandes couvrent 90% de l'utilisation quotidienne. 🚀


