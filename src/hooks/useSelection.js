import { useState } from 'react';

export const useSelection = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [groups, setGroups] = useState([]);
  const [flashingIds, setFlashingIds] = useState([]);

  const createGroup = () => {
    if (selectedIds.length < 2) return;
    
    const existingGroups = groups.filter(group => 
      selectedIds.some(id => group.elementIds.includes(id))
    );
    
    setGroups(prev => prev.filter(group => !existingGroups.includes(group)));
    
    const newGroup = {
      id: Date.now(),
      elementIds: [...selectedIds]
    };
    setGroups(prev => [...prev, newGroup]);
    
    setFlashingIds([...selectedIds]);
    setTimeout(() => setFlashingIds([]), 600);
  };

  const ungroupSelected = () => {
    const groupsToRemove = groups.filter(group => 
      selectedIds.some(id => group.elementIds.includes(id))
    );
    const allElementIds = groupsToRemove.flatMap(g => g.elementIds);
    setGroups(prev => prev.filter(group => !groupsToRemove.includes(group)));
    
    setFlashingIds(allElementIds);
    setTimeout(() => setFlashingIds([]), 600);
  };

  const getGroupForElement = (elementId) => {
    return groups.find(group => group.elementIds.includes(elementId));
  };

  const selectGroup = (elementId) => {
    const group = getGroupForElement(elementId);
    if (group) {
      setSelectedIds(group.elementIds);
      return true;
    }
    return false;
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const selectMultiple = (ids) => {
    setSelectedIds(ids);
  };

  return {
    selectedIds,
    setSelectedIds,
    groups,
    flashingIds,
    createGroup,
    ungroupSelected,
    getGroupForElement,
    selectGroup,
    toggleSelection,
    clearSelection,
    selectMultiple
  };
};

