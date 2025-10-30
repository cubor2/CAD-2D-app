import { useState, useRef } from 'react';

export const useElements = () => {
  const nextIdRef = useRef(1);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const updateElements = (newElements) => {
    setElements(newElements);
    saveToHistory(newElements);
  };

  const addElement = (element) => {
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

  const deleteElements = (ids) => {
    const newElements = elements.filter(el => !ids.includes(el.id));
    updateElements(newElements);
  };

  const updateElement = (id, updates) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    updateElements(newElements);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      
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
      
      const maxId = history[newIndex].reduce((max, el) => Math.max(max, el.id), 0);
      nextIdRef.current = maxId + 1;
      
      return true;
    }
    return false;
  };

  const getNextId = () => nextIdRef.current++;

  const syncNextId = (elementsArray) => {
    if (elementsArray.length === 0) {
      nextIdRef.current = 1;
    } else {
      const maxId = elementsArray.reduce((max, el) => Math.max(max, el.id), 0);
      nextIdRef.current = maxId + 1;
    }
  };

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
    syncNextId
  };
};

