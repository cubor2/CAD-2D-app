import { useEffect, useState } from 'react';

export const useKeyboardShortcuts = ({
  onToolChange,
  onUndo,
  onRedo,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onGroup,
  onUngroup,
  onMoveElements,
  onResizeElement,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  selectedIds,
  tool,
  selectedEdge,
  editingTextId
}) => {
  const [spacePressed, setSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        return;
      }
      
      if (editingTextId) {
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
        return;
      }
      
      if (e.key === 'Escape') {
        if (tool === 'edit') {
          e.preventDefault();
          onToolChange('select');
          return;
        }
      }
      
      if (e.key === 'Tab') {
        e.preventDefault();
        if (tool === 'select') {
          onToolChange('edit');
        } else if (tool === 'edit') {
          onToolChange('select');
        }
        return;
      }
      
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (e.key === 's' || e.key === 'S') {
          onToolChange('select');
          return;
        }
        if (e.key === 'e' || e.key === 'E') {
          onToolChange('edit');
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          onToolChange('line');
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          onToolChange('rectangle');
          return;
        }
        if (e.key === 'c' || e.key === 'C') {
          onToolChange('circle');
          return;
        }
        if (e.key === 't' || e.key === 'T') {
          onToolChange('text');
          return;
        }
      }
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (selectedIds.length === 0) return;
        
        const distance = e.shiftKey ? 5 : 1;
        let dx = 0;
        let dy = 0;
        
        if (e.key === 'ArrowLeft') dx = -distance;
        if (e.key === 'ArrowRight') dx = distance;
        if (e.key === 'ArrowUp') dy = -distance;
        if (e.key === 'ArrowDown') dy = distance;
        
        onMoveElements(dx, dy);
        return;
      }
      
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        if (selectedIds.length === 0) return;
        onResizeElement(1, e.shiftKey);
        return;
      }
      
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        if (selectedIds.length === 0) return;
        onResizeElement(-1, e.shiftKey);
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        onNew();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        onOpen();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        onSaveAs();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        onSave();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        onRedo();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length >= 2) {
          onGroup();
        }
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        onUngroup();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length > 0) {
          onCopy();
        }
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length > 0) {
          onCut();
        }
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        onPaste(e.shiftKey);
        return;
      }
    };

    const handleKeyUp = (e) => {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        return;
      }
      
      if (editingTextId) {
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, tool, selectedEdge, editingTextId, onToolChange, onUndo, onRedo, onCopy, onCut, onPaste, onDelete, onGroup, onUngroup, onMoveElements, onResizeElement, onNew, onOpen, onSave, onSaveAs]);

  return { spacePressed };
};

