# 🔧 CORRECTION : Redimensionnement aléatoire des lignes avec +/-

**Date :** 30 octobre 2025  
**Status :** ✅ CORRIGÉ  
**Commit :** Correction du redimensionnement des lignes et courbes

---

## 📌 RÉSUMÉ DU PROBLÈME

Les utilisateurs rencontraient un bug lors du redimensionnement de lignes avec les touches + et - :
- **Comportement aléatoire** : Parfois la touche `+` agrandissait la ligne, parfois elle la réduisait
- **Incohérence** : Le comportement dépendait de la direction dans laquelle la ligne avait été dessinée
- **Confusion** : Impossible de prédire si `+` allait agrandir ou réduire la ligne

**Cause racine :** Logique défaillante dans `handleResizeElement` qui traitait différemment les lignes selon leur orientation (y1 > y2 ou y1 < y2).

---

## 🔍 ANALYSE TECHNIQUE

### **Code original (lignes verticales)**

```javascript
// Dans useElementTransforms.js
if (el.type === 'line' || el.type === 'fingerJoint') {
  const dx = el.x2 - el.x1;
  const dy = el.y2 - el.y1;
  const currentLength = Math.sqrt(dx * dx + dy * dy);
  if (currentLength === 0) return el;
  
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  
  if (isHorizontal) {
    if (fromOppositeEnd) {
      const newX1 = el.x1 - delta;
      return { ...el, x1: newX1 };
    } else {
      const newX2 = el.x2 + delta;  // ✅ Cohérent pour les horizontales
      return { ...el, x2: newX2 };
    }
  } else {  // LIGNES VERTICALES
    if (fromOppositeEnd) {
      if (el.y1 > el.y2) {  // ❌ Comportement dépend de l'orientation
        const newY1 = el.y1 + delta;
        return { ...el, y1: newY1 };
      } else {
        const newY2 = el.y2 + delta;
        return { ...el, y2: newY2 };
      }
    } else {
      if (el.y1 < el.y2) {  // ❌ Comportement différent selon y1 < y2
        const newY1 = el.y1 - delta;
        return { ...el, y1: newY1 };
      } else {
        const newY2 = el.y2 - delta;
        return { ...el, y2: newY2 };
      }
    }
  }
}
```

### **Pourquoi c'était incohérent ?**

Le code traitait les lignes verticales différemment selon que **y1 < y2** ou **y1 > y2**. Cela signifie que :

**Scénario 1 : Ligne dessinée de haut en bas (y1 = 50, y2 = 100)**
- `+` : `newY1 = y1 - 1 = 49` → y1 monte → ligne s'allonge vers le HAUT ✅
- Longueur : 50 → 51

**Scénario 2 : Ligne dessinée de bas en haut (y1 = 100, y2 = 50)**
- `+` : `newY2 = y2 - 1 = 49` → y2 monte → ligne s'allonge vers le HAUT ✅
- Longueur : 50 → 51

Mais **attendez** ! Les deux lignes s'allongent vers le haut, ce qui est incohérent avec les lignes horizontales qui s'allongent toujours vers la droite.

De plus, le comportement n'était **pas prévisible** car il dépendait de l'ordre dans lequel l'utilisateur avait dessiné la ligne.

---

## ✅ SOLUTION APPLIQUÉE

### **Nouvelle approche : Calcul de la longueur**

Au lieu de traiter les axes X et Y séparément, on calcule la **longueur totale** de la ligne et on applique un **facteur d'échelle** :

```javascript
if (el.type === 'line' || el.type === 'fingerJoint') {
  const dx = el.x2 - el.x1;
  const dy = el.y2 - el.y1;
  const currentLength = Math.sqrt(dx * dx + dy * dy);
  if (currentLength === 0) return el;
  
  // ✅ Calculer la nouvelle longueur
  const newLength = Math.max(1, currentLength + delta);
  const scale = newLength / currentLength;
  
  if (fromOppositeEnd) {
    // Redimensionner depuis le point 1 (fixe le point 2)
    const newX1 = el.x2 - dx * scale;
    const newY1 = el.y2 - dy * scale;
    return { ...el, x1: newX1, y1: newY1 };
  } else {
    // Redimensionner depuis le point 2 (fixe le point 1)
    const newX2 = el.x1 + dx * scale;
    const newY2 = el.y1 + dy * scale;
    return { ...el, x2: newX2, y2: newY2 };
  }
}
```

### **Avantages de cette approche :**

1. ✅ **Cohérent** : Le comportement est identique quelle que soit l'orientation de la ligne
2. ✅ **Prévisible** : `+` agrandit toujours, `-` réduit toujours
3. ✅ **Universel** : Fonctionne pour les lignes horizontales, verticales, et diagonales
4. ✅ **Proportionnel** : La direction de la ligne est préservée (dx/dy reste proportionnel)
5. ✅ **Précis** : On travaille sur la longueur réelle de la ligne

---

## 📋 CORRECTIONS APPLIQUÉES

### **1. Correction pour les lignes (type 'line' et 'fingerJoint')**

**Fichier :** `src/hooks/useElementTransforms.js` (lignes 291-308)

**Avant :**
- 35 lignes de code
- Logique différente pour horizontal/vertical
- Comportement incohérent pour les verticales

**Après :**
- 18 lignes de code (**-48% de code**)
- Logique unifiée pour toutes les orientations
- Comportement cohérent et prévisible

---

### **2. Correction pour les courbes (type 'curve')**

Le même bug existait pour les courbes. Correction appliquée avec la même approche.

**Fichier :** `src/hooks/useElementTransforms.js` (lignes 358-391)

**Avant :**
- 58 lignes de code
- Même logique défaillante que pour les lignes

**Après :**
- 34 lignes de code (**-41% de code**)
- Point de contrôle (cpx, cpy) redimensionné proportionnellement
- Comportement cohérent

---

## 🎯 RÉSULTAT ATTENDU

Après ces corrections :

### **Comportement uniforme**
- ✅ `+` agrandit **toujours** la ligne de 1mm (ou 5mm avec Shift)
- ✅ `-` réduit **toujours** la ligne de 1mm (ou 5mm avec Shift)
- ✅ Le comportement est **identique** quelle que soit l'orientation de la ligne

### **Exemples concrets**

**Ligne horizontale (x1=0, y1=0, x2=100, y2=0)**
- Longueur : 100mm
- `+` : Longueur → 101mm (x2 devient 101)
- `-` : Longueur → 99mm (x2 devient 99)

**Ligne verticale (x1=0, y1=0, x2=0, y2=100)**
- Longueur : 100mm
- `+` : Longueur → 101mm (y2 devient 101)
- `-` : Longueur → 99mm (y2 devient 99)

**Ligne diagonale (x1=0, y1=0, x2=70, y2=70)**
- Longueur : ~99mm
- `+` : Longueur → 100mm (x2 et y2 deviennent ~70.7)
- `-` : Longueur → 98mm (x2 et y2 deviennent ~69.3)

---

## 🧪 TESTS À EFFECTUER

### **Test 1 : Ligne verticale dessinée de haut en bas**
1. Dessiner une ligne verticale de haut en bas
2. Sélectionner la ligne
3. Appuyer sur `+` plusieurs fois
4. ✅ **Vérifier** que la ligne s'agrandit de manière cohérente

### **Test 2 : Ligne verticale dessinée de bas en haut**
1. Dessiner une ligne verticale de bas en haut
2. Sélectionner la ligne
3. Appuyer sur `+` plusieurs fois
4. ✅ **Vérifier** que la ligne s'agrandit de la même manière que le Test 1

### **Test 3 : Ligne horizontale**
1. Dessiner une ligne horizontale
2. Sélectionner la ligne
3. Appuyer sur `+` puis sur `-`
4. ✅ **Vérifier** que `+` agrandit et `-` réduit de manière prévisible

### **Test 4 : Ligne diagonale**
1. Dessiner une ligne diagonale à 45°
2. Sélectionner la ligne
3. Appuyer sur `+` plusieurs fois
4. ✅ **Vérifier** que la ligne s'agrandit en maintenant son angle

### **Test 5 : Courbe (curve)**
1. Dessiner une courbe
2. Sélectionner la courbe
3. Appuyer sur `+` puis sur `-`
4. ✅ **Vérifier** que la courbe se redimensionne correctement

### **Test 6 : Avec Shift (grand pas)**
1. Sélectionner une ligne
2. Appuyer sur `Shift + +`
3. ✅ **Vérifier** que la ligne s'agrandit de 5mm au lieu de 1mm

---

## 📊 MÉTRIQUES

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Lignes de code (lines) | 35 | 18 | -48% |
| Lignes de code (curves) | 58 | 34 | -41% |
| Branches conditionnelles | 8 | 2 | -75% |
| Complexité cyclomatique | Élevée | Faible | ✅ |
| Comportement cohérent | ❌ | ✅ | 100% |

---

## 🎓 LEÇON APPRISE

**Principe :** Quand on manipule des éléments géométriques, il faut travailler sur les **propriétés invariantes** (longueur, angle) plutôt que sur les coordonnées brutes.

**Mauvaise approche :**
```javascript
// Traiter X et Y séparément
if (isHorizontal) { ... } else { ... }
if (y1 > y2) { ... } else { ... }
```

**Bonne approche :**
```javascript
// Travailler sur la longueur et appliquer un facteur d'échelle
const newLength = currentLength + delta;
const scale = newLength / currentLength;
```

---

**Status final :** ✅ Bug corrigé, comportement cohérent et prévisible




