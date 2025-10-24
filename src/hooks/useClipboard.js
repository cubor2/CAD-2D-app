import { useCallback } from 'react';

/**
 * Hook personnalisé pour gérer les opérations de clipboard
 * (Copier, Couper, Coller)
 * 
 * Extrait de CADEditor.jsx pour améliorer la maintenabilité
 * Phase 2.2 du refactoring
 */
export const useClipboard = ({
  selectedIds,
  elements,
  groups,
  clipboard,
  pasteCount,
  setClipboard,
  setPasteCount,
  deleteElements,
  setSelectedIds,
  updateElements,
  setGroups,
  getNextId
}) => {
  
  /**
   * Copier les éléments sélectionnés dans le clipboard
   */
  const handleCopy = useCallback(() => {
    if (selectedIds.length > 0) {
      const selectedElements = elements.filter(el => selectedIds.includes(el.id));
      const selectedGroups = groups.filter(group => 
        group.elementIds.some(id => selectedIds.includes(id))
      );
      setClipboard({ elements: selectedElements, groups: selectedGroups });
      setPasteCount(0);
    }
  }, [selectedIds, elements, groups, setClipboard, setPasteCount]);

  /**
   * Couper les éléments sélectionnés (copier + supprimer)
   */
  const handleCut = useCallback(() => {
    if (selectedIds.length > 0) {
      const selectedElements = elements.filter(el => selectedIds.includes(el.id));
      const selectedGroups = groups.filter(group => 
        group.elementIds.some(id => selectedIds.includes(id))
      );
      setClipboard({ elements: selectedElements, groups: selectedGroups });
      setPasteCount(0);
      deleteElements(selectedIds);
      setSelectedIds([]);
    }
  }, [selectedIds, elements, groups, deleteElements, setSelectedIds, setClipboard, setPasteCount]);

  /**
   * Coller les éléments du clipboard
   * @param {boolean} inPlace - Si true, colle au même endroit. Sinon, décale de 10mm
   */
  const handlePaste = useCallback((inPlace) => {
    if (clipboard.elements.length > 0) {
      const offset = inPlace ? 0 : (pasteCount + 1) * 10;
      
      const idMapping = {};
      const newElements = clipboard.elements.map(el => {
        const newId = getNextId();
        idMapping[el.id] = newId;
        const newEl = { ...el, id: newId };
        
        // Appliquer l'offset selon le type d'élément
        if (el.type === 'line' || el.type === 'fingerJoint') {
          newEl.x1 += offset;
          newEl.y1 += offset;
          newEl.x2 += offset;
          newEl.y2 += offset;
        } else if (el.type === 'curve') {
          newEl.x1 += offset;
          newEl.y1 += offset;
          newEl.x2 += offset;
          newEl.y2 += offset;
          newEl.cpx += offset;
          newEl.cpy += offset;
        } else if (el.type === 'rectangle') {
          newEl.x += offset;
          newEl.y += offset;
        } else if (el.type === 'circle') {
          newEl.cx += offset;
          newEl.cy += offset;
        } else if (el.type === 'arc') {
          newEl.cx += offset;
          newEl.cy += offset;
        } else if (el.type === 'text') {
          newEl.x += offset;
          newEl.y += offset;
        }
        
        return newEl;
      });
      
      // Ajouter les nouveaux éléments
      const updatedElements = [...elements, ...newElements];
      updateElements(updatedElements);
      setSelectedIds(newElements.map(el => el.id));
      
      // Recréer les groupes avec les nouveaux IDs
      const newGroups = clipboard.groups.map(group => ({
        id: Date.now() + Math.random(),
        elementIds: group.elementIds.map(oldId => idMapping[oldId]).filter(Boolean)
      })).filter(group => group.elementIds.length >= 2);
      
      if (newGroups.length > 0) {
        setGroups(prev => [...prev, ...newGroups]);
      }
      
      // Incrémenter le compteur pour le prochain collage (décalage progressif)
      if (!inPlace) {
        setPasteCount(prev => prev + 1);
      }
    }
  }, [clipboard, pasteCount, elements, getNextId, updateElements, setSelectedIds, setGroups, setPasteCount]);

  return {
    handleCopy,
    handleCut,
    handlePaste
  };
};

