# 🐛 AUDIT : Bug de duplication d'IDs d'éléments

**Date :** 30 octobre 2025  
**Sévérité :** 🔴 CRITIQUE  
**Impact :** Les éléments partagent le même ID, causant des comportements erratiques lors de la modification et suppression

---

## 📋 SYMPTÔMES RAPPORTÉS

1. **Longueur incorrecte lors de la création** : Une ligne créée n'a pas la bonne longueur
2. **Modifications affectent plusieurs éléments** : Modifier une ligne affecte une autre ligne non liée
3. **Suppressions multiples** : Supprimer une ligne supprime deux lignes en même temps
4. **Les éléments ne sont pas groupés** : Confirmation que ce ne sont pas des groupes

---

## 🔍 ANALYSE DES CAUSES RACINES

### **Bug #1 : `updateElement` ne sauvegarde pas dans l'historique**

**Fichier :** `src/hooks/useElements.js` (lignes 33-38)

```javascript
const updateElement = (id, updates) => {
  const newElements = elements.map(el => 
    el.id === id ? { ...el, ...updates } : el
  );
  setElements(newElements);  // ❌ PROBLÈME : Pas de sauvegarde dans l'historique
};
```

**Impact :**
- Les modifications via le `PropertiesPanel` ne sont pas enregistrées dans l'historique
- Cela crée une désynchronisation entre `elements` et `history`
- Les undo/redo peuvent restaurer des états incohérents

---

### **Bug #2 : `nextIdRef` n'est jamais synchronisé avec l'historique**

**Problème :** Lors d'un `undo` ou `redo`, on restaure l'état d'`elements`, mais `nextIdRef` continue à s'incrémenter sans tenir compte des IDs présents dans l'état restauré.

**Scénario de collision d'IDs :**

```
Étape 1: Créer ligne A (ID 1) → nextIdRef = 2
Étape 2: Créer ligne B (ID 2) → nextIdRef = 3
Étape 3: Créer ligne C (ID 3) → nextIdRef = 4
Étape 4: UNDO → État = [ligne A(1), ligne B(2)], mais nextIdRef = 4 ❌
Étape 5: Modifier ligne B via PropertiesPanel
         → updateElement ne sauvegarde pas dans l'historique
Étape 6: UNDO → Restaure [ligne A(1)], nextIdRef = 4 toujours
Étape 7: Créer ligne D → Devrait être ID 4, mais...
         → Si on REDO après, on peut avoir ligne C(3) qui revient
Étape 8: Créer ligne E (ID 5) → nextIdRef = 6
Étape 9: UNDO plusieurs fois puis REDO
         → Collision possible si les IDs ne sont pas gérés correctement
```

**Le vrai problème :**
Après plusieurs opérations de création, modification (via PropertiesPanel), undo, et redo :
- `nextIdRef` peut être à 10
- L'historique peut contenir des éléments avec des IDs de 1 à 8
- On peut restaurer un état avec ID 5, puis créer un nouvel élément avec ID 10
- Mais si on fait UNDO puis qu'on modifie via PropertiesPanel (qui n'enregistre pas dans l'historique), puis REDO...
- On peut se retrouver avec deux éléments ayant le même ID !

---

### **Bug #3 : Pas de vérification d'unicité des IDs**

Il n'y a aucune vérification que les IDs sont uniques dans le tableau `elements`. Si une collision se produit, le système ne le détecte pas.

---

## 🔧 SOLUTIONS PROPOSÉES

### **Solution #1 : Corriger `updateElement` (PRIORITÉ HAUTE)**

```javascript
const updateElement = (id, updates) => {
  const newElements = elements.map(el => 
    el.id === id ? { ...el, ...updates } : el
  );
  updateElements(newElements);  // ✅ Utiliser updateElements au lieu de setElements
};
```

**Justification :** Cela garantit que toutes les modifications sont enregistrées dans l'historique.

---

### **Solution #2 : Synchroniser `nextIdRef` lors des undo/redo (PRIORITÉ HAUTE)**

```javascript
const undo = () => {
  if (historyIndex > 0) {
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setElements(history[newIndex]);
    
    // ✅ Synchroniser nextIdRef avec le plus grand ID présent
    const maxId = history[newIndex].reduce((max, el) => Math.max(max, el.id), 0);
    nextIdRef.current = maxId + 1;
    
    return true;
  }
  return false;
};

const redo = () => {
  if (historyIndex < history.length - 1) {
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setElements(history[newIndex]);
    
    // ✅ Synchroniser nextIdRef avec le plus grand ID présent
    const maxId = history[newIndex].reduce((max, el) => Math.max(max, el.id), 0);
    nextIdRef.current = maxId + 1;
    
    return true;
  }
  return false;
};
```

**Justification :** Cela garantit que `nextIdRef` pointe toujours vers un ID disponible, même après des opérations undo/redo.

---

### **Solution #3 : Ajouter une validation de sécurité (OPTIONNEL)**

```javascript
const addElement = (element) => {
  // Vérifier si l'ID existe déjà (ne devrait jamais arriver avec les corrections ci-dessus)
  const idExists = elements.some(el => el.id === nextIdRef.current);
  if (idExists) {
    console.error(`⚠️ ID collision detected: ${nextIdRef.current}`);
    // Trouver le prochain ID disponible
    const maxId = elements.reduce((max, el) => Math.max(max, el.id), 0);
    nextIdRef.current = maxId + 1;
  }
  
  const newElement = { ...element, id: nextIdRef.current++ };
  const newElements = [...elements, newElement];
  updateElements(newElements);
  return newElement;
};
```

---

### **Solution #4 : Synchroniser `nextIdRef` lors du chargement de fichiers**

Quand on charge un fichier CAD, il faut synchroniser `nextIdRef` :

```javascript
// Dans useFileOperations.js ou CADEditor.jsx, après chargement
const handleFileLoad = (loadedElements) => {
  updateElements(loadedElements);
  
  // Synchroniser nextIdRef
  const maxId = loadedElements.reduce((max, el) => Math.max(max, el.id), 0);
  nextIdRef.current = maxId + 1;
};
```

---

## 🎯 PLAN D'ACTION

### **Étape 1 : Corrections immédiates (URGENT)**
1. ✅ Corriger `updateElement` pour utiliser `updateElements`
2. ✅ Synchroniser `nextIdRef` dans `undo()` et `redo()`

### **Étape 2 : Sécurité supplémentaire**
3. ✅ Ajouter validation dans `addElement`
4. ✅ Synchroniser `nextIdRef` lors du chargement de fichiers

### **Étape 3 : Tests**
5. ⏳ Tester le scénario : Créer → Modifier → Undo → Redo → Créer
6. ⏳ Tester l'import de fichiers SVG
7. ⏳ Tester le copier-coller multiple
8. ⏳ Vérifier qu'aucun ID n'est dupliqué dans tous les scénarios

---

## 📊 RISQUES

**Risque #1 :** Les fichiers CAD existants peuvent contenir des éléments avec des IDs dupliqués.  
**Mitigation :** Ajouter une fonction de "nettoyage" qui réattribue des IDs uniques lors du chargement.

**Risque #2 :** Les corrections peuvent affecter les opérations undo/redo.  
**Mitigation :** Tests approfondis sur tous les scénarios d'édition.

---

## 🚀 PROCHAINES ÉTAPES

1. Appliquer les corrections dans `src/hooks/useElements.js`
2. Tester manuellement tous les scénarios problématiques
3. Ajouter des logs temporaires pour tracer les IDs et détecter les collisions
4. Vérifier l'intégration avec `useFileOperations.js`

---

**Status :** 🔄 EN ATTENTE D'IMPLÉMENTATION


