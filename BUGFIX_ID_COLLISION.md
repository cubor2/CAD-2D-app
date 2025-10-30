# 🔧 CORRECTION : Bug de collision d'IDs d'éléments

**Date :** 30 octobre 2025  
**Status :** ✅ CORRIGÉ  
**Commit :** Synchronisation des IDs et correction de l'historique

---

## 📌 RÉSUMÉ DU PROBLÈME

Les utilisateurs rencontraient un bug critique où :
- Des lignes créées n'avaient pas la bonne longueur
- Modifier une ligne affectait une autre ligne non liée
- Supprimer une ligne supprimait deux lignes simultanément

**Cause racine :** Collision d'IDs due à une mauvaise gestion de `nextIdRef` lors des opérations undo/redo et un problème de sauvegarde dans l'historique.

---

## ✅ CORRECTIONS APPLIQUÉES

### **1. Correction de `updateElement` dans `useElements.js`**

**Avant :**
```javascript
const updateElement = (id, updates) => {
  const newElements = elements.map(el => 
    el.id === id ? { ...el, ...updates } : el
  );
  setElements(newElements);  // ❌ Ne sauvegarde pas dans l'historique
};
```

**Après :**
```javascript
const updateElement = (id, updates) => {
  const newElements = elements.map(el => 
    el.id === id ? { ...el, ...updates } : el
  );
  updateElements(newElements);  // ✅ Sauvegarde dans l'historique
};
```

**Impact :** Toutes les modifications via le PropertiesPanel sont maintenant enregistrées dans l'historique, évitant les désynchronisations.

---

### **2. Synchronisation de `nextIdRef` lors des undo/redo**

**Ajout dans `undo()` :**
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
```

**Ajout identique dans `redo()` :**
```javascript
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

**Impact :** `nextIdRef` est toujours synchronisé avec les IDs présents dans l'état actuel, évitant les collisions.

---

### **3. Validation de sécurité dans `addElement`**

**Ajout d'une vérification de collision :**
```javascript
const addElement = (element) => {
  // ✅ Vérifier si l'ID existe déjà
  const idExists = elements.some(el => el.id === nextIdRef.current);
  if (idExists) {
    console.warn(`⚠️ ID collision detected: ${nextIdRef.current}. Finding next available ID...`);
    const maxId = elements.reduce((max, el) => Math.max(max, el.id), 0);
    nextIdRef.current = maxId + 1;
  }
  
  const newElement = { ...element, id: nextIdRef.current++ };
  const newElements = [...elements, newElement];
  updateElements(newElements);
  return newElement;
};
```

**Impact :** Protection contre les collisions d'IDs même si un bug survient ailleurs. Un warning sera affiché dans la console.

---

### **4. Nouvelle fonction `syncNextId` pour la synchronisation**

**Ajout de la fonction :**
```javascript
const syncNextId = (elementsArray) => {
  if (elementsArray.length === 0) {
    nextIdRef.current = 1;
  } else {
    const maxId = elementsArray.reduce((max, el) => Math.max(max, el.id), 0);
    nextIdRef.current = maxId + 1;
  }
};
```

**Export dans le hook :**
```javascript
return {
  elements,
  setElements,
  updateElements,
  addElement,
  deleteElements,
  updateElement,
  undo,
  redo,
  history,
  historyIndex,
  getNextId,
  syncNextId  // ✅ Nouvelle fonction
};
```

**Impact :** Permet de synchroniser `nextIdRef` manuellement quand nécessaire (chargement de fichiers, import SVG, etc.).

---

### **5. Synchronisation lors du chargement de fichiers**

**Dans `useFileOperations.js` :**

**Fonction `handleNew` :**
```javascript
const handleNew = useCallback(() => {
  if (hasUnsavedChanges) {
    const confirm = window.confirm('...');
    if (!confirm) return;
  }
  updateElements([]);
  syncNextId([]);  // ✅ Réinitialiser nextIdRef à 1
  setSelectedIds([]);
  clearSelection();
  setCurrentFileName('Sans titre');
  setHasUnsavedChanges(false);
}, [...]);
```

**Fonction `handleOpen` :**
```javascript
reader.onload = (event) => {
  try {
    const data = JSON.parse(event.target.result);
    const loadedElements = data.elements || [];
    updateElements(loadedElements);
    syncNextId(loadedElements);  // ✅ Synchroniser avec les IDs chargés
    setGuides(data.guides || []);
    // ...
  } catch (error) {
    alert('Erreur lors du chargement du fichier : ' + error.message);
  }
};
```

**Fonction `handleImportSVG` :**
```javascript
if (result.success) {
  const newElements = [...elements, ...result.elements];
  updateElements(newElements);
  syncNextId(newElements);  // ✅ Synchroniser après l'import
  setHasUnsavedChanges(true);
  alert(`Import réussi ! ${result.elements.length} élément(s) importé(s).`);
}
```

**Impact :** `nextIdRef` est toujours synchronisé après chaque opération de chargement ou d'import.

---

## 📋 FICHIERS MODIFIÉS

1. **`src/hooks/useElements.js`**
   - Correction de `updateElement` pour utiliser `updateElements`
   - Synchronisation de `nextIdRef` dans `undo()` et `redo()`
   - Ajout de validation dans `addElement`
   - Ajout de la fonction `syncNextId`

2. **`src/hooks/useFileOperations.js`**
   - Ajout de `syncNextId` aux paramètres
   - Appel de `syncNextId` dans `handleNew`, `handleOpen`, et `handleImportSVG`

3. **`src/CADEditor.jsx`**
   - Ajout de `syncNextId` à la déstructuration de `useElements()`
   - Passage de `syncNextId` à `useFileOperations`

---

## 🧪 TESTS À EFFECTUER

### **Test 1 : Créer → Modifier → Undo → Créer**
1. Créer une ligne
2. Modifier sa longueur via le PropertiesPanel
3. Faire Undo
4. Créer une nouvelle ligne
5. ✅ Vérifier qu'aucune collision d'ID ne se produit

### **Test 2 : Créer → Undo → Redo → Créer**
1. Créer plusieurs lignes
2. Faire Undo plusieurs fois
3. Faire Redo plusieurs fois
4. Créer une nouvelle ligne
5. ✅ Vérifier qu'aucune collision d'ID ne se produit

### **Test 3 : Charger un fichier puis créer**
1. Créer quelques éléments
2. Sauvegarder le fichier
3. Créer un nouveau projet
4. Charger le fichier
5. Créer de nouveaux éléments
6. ✅ Vérifier que les nouveaux IDs sont supérieurs aux IDs chargés

### **Test 4 : Importer SVG puis créer**
1. Importer un fichier SVG
2. Créer de nouveaux éléments
3. ✅ Vérifier qu'aucune collision d'ID ne se produit

### **Test 5 : Modification d'une ligne**
1. Créer une ligne
2. Modifier sa longueur via le PropertiesPanel
3. ✅ Vérifier que seule cette ligne est modifiée
4. ✅ Vérifier que la modification est enregistrée dans l'historique

### **Test 6 : Suppression**
1. Créer deux lignes
2. Sélectionner une ligne
3. Supprimer la ligne
4. ✅ Vérifier que seule la ligne sélectionnée est supprimée

---

## 🎯 RÉSULTAT ATTENDU

Après ces corrections :
- ✅ Aucune collision d'ID ne devrait se produire
- ✅ Les modifications via le PropertiesPanel sont enregistrées dans l'historique
- ✅ Undo/Redo fonctionne correctement sans créer de doublons
- ✅ Le chargement de fichiers et l'import SVG synchronisent correctement les IDs
- ✅ Chaque élément a un ID unique et stable

---

## 🚨 ATTENTION

Si vous rencontrez un warning dans la console :
```
⚠️ ID collision detected: X. Finding next available ID...
```

Cela signifie qu'une collision a été détectée et automatiquement corrigée. Ce warning ne devrait plus apparaître après ces corrections, mais s'il apparaît, veuillez signaler le scénario qui l'a déclenché.

---

**Status final :** ✅ Bug corrigé, tests recommandés avant validation finale


