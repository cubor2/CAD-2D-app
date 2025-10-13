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
    setElements(newElements);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setElements(history[historyIndex - 1]);
      return true;
    }
    return false;
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setElements(history[historyIndex + 1]);
      return true;
    }
    return false;
  };

  const getNextId = () => nextIdRef.current++;

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
    getNextId
  };
};

