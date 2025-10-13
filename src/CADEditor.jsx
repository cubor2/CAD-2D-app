import React, { useState, useRef, useCallback, useMemo } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import TopControls from './components/TopControls';
import ContextMenu from './components/ContextMenu';
import { useViewport } from './hooks/useViewport';
import { useElements } from './hooks/useElements';
import { useSelection } from './hooks/useSelection';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { screenToWorld, worldToScreen } from './utils/transforms';
import { snapToGridFn, pointToLineDistance, isAngleBetween } from './utils/geometry';
import { findSnapPoints, findGuideSnapPosition, applyMultiPointSnap } from './utils/snap';
import { RULER_SIZE, GRID_SIZE, GUIDE_SNAP_DISTANCE } from './constants';

const CADEditor = () => {
  const canvasRef = useRef(null);
  
  const [tool, setTool] = useState('select');
  const [darkMode, setDarkMode] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToElements, setSnapToElements] = useState(true);
  
  const [guides, setGuides] = useState([]);
  const [isDraggingGuide, setIsDraggingGuide] = useState(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentElement, setCurrentElement] = useState(null);
  const [drawOrigin, setDrawOrigin] = useState(null);
  
  const [snapPoint, setSnapPoint] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  
  const [editingPoint, setEditingPoint] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  
  const [clipboard, setClipboard] = useState([]);
  const [pasteCount, setPasteCount] = useState(0);
  
  const [contextMenu, setContextMenu] = useState(null);
  
  const { viewport, isPanning, handlePan, handleZoom, startPan, endPan } = useViewport();
  
  const {
    elements,
    setElements,
    updateElements,
    addElement,
    deleteElements,
    updateElement,
    undo,
    getNextId
  } = useElements();
  
  const {
    selectedIds,
    setSelectedIds,
    groups,
    flashingIds,
    createGroup,
    ungroupSelected,
    selectGroup,
    toggleSelection,
    clearSelection
  } = useSelection();

  const getCanvasRef = () => {
    return { current: document.querySelector('canvas') };
  };

  const screenToWorldWrapper = useCallback((screenX, screenY) => {
    const canvas = getCanvasRef().current;
    return canvas ? screenToWorld(screenX, screenY, canvas, viewport) : { x: 0, y: 0 };
  }, [viewport]);

  const worldToScreenWrapper = useCallback((worldX, worldY) => {
    const canvas = getCanvasRef().current;
    return canvas ? worldToScreen(worldX, worldY, canvas, viewport) : { x: 0, y: 0 };
  }, [viewport]);

  const applySnap = (point, excludeIds = []) => {
    let snappedX = point.x;
    let snappedY = point.y;
    let snapX = null;
    let snapY = null;

    if (showRulers && guides.length > 0) {
      const guideSnapDist = GUIDE_SNAP_DISTANCE / viewport.zoom;
      
      for (const guide of guides) {
        if (guide.type === 'horizontal' && !snapY) {
          if (Math.abs(point.y - guide.position) < guideSnapDist) {
            snappedY = guide.position;
            snapY = { y: guide.position, type: 'guide', priority: 100 };
          }
        } else if (guide.type === 'vertical' && !snapX) {
          if (Math.abs(point.x - guide.position) < guideSnapDist) {
            snappedX = guide.position;
            snapX = { x: guide.position, type: 'guide', priority: 100 };
          }
        }
      }
    }

    if (snapToElements) {
      const elementSnap = findSnapPoints(point, elements, excludeIds, viewport);
      if (elementSnap) {
        if (!snapX) {
          snappedX = elementSnap.x;
          snapX = elementSnap;
        }
        if (!snapY) {
          snappedY = elementSnap.y;
          snapY = elementSnap;
        }
      }
    }

    if (snapToGrid) {
      if (!snapX) {
        snappedX = Math.round(point.x / GRID_SIZE) * GRID_SIZE;
      }
      if (!snapY) {
        snappedY = Math.round(point.y / GRID_SIZE) * GRID_SIZE;
      }
    }

    let combinedSnap = null;
    if (snapX || snapY) {
      combinedSnap = {
        x: snappedX,
        y: snappedY,
        type: snapX?.type || snapY?.type || 'combined',
        priority: Math.max(snapX?.priority || 0, snapY?.priority || 0),
        isGuide: (snapX?.type === 'guide' || snapY?.type === 'guide')
      };
    }

    setSnapPoint(combinedSnap);
    return { x: snappedX, y: snappedY };
  };

  const handleToolChange = useCallback((newTool) => {
    setTool(newTool);
    if (newTool !== 'edit') {
      setSelectedEdge(null);
    }
  }, []);

  const handleCopy = useCallback(() => {
    if (selectedIds.length > 0) {
      const selectedElements = elements.filter(el => selectedIds.includes(el.id));
      setClipboard(selectedElements);
      setPasteCount(0);
    }
  }, [selectedIds, elements]);

  const handleCut = useCallback(() => {
    if (selectedIds.length > 0) {
      const selectedElements = elements.filter(el => selectedIds.includes(el.id));
      setClipboard(selectedElements);
      setPasteCount(0);
      deleteElements(selectedIds);
      setSelectedIds([]);
    }
  }, [selectedIds, elements, deleteElements, setSelectedIds]);

  const handlePaste = useCallback((inPlace) => {
    if (clipboard.length > 0) {
      const offset = inPlace ? 0 : (pasteCount + 1) * 10;
      
      const newElements = clipboard.map(el => {
        const newEl = { ...el, id: getNextId() };
        if (el.type === 'line') {
          newEl.x1 += offset;
          newEl.y1 += offset;
          newEl.x2 += offset;
          newEl.y2 += offset;
        } else if (el.type === 'rectangle') {
          newEl.x += offset;
          newEl.y += offset;
        } else if (el.type === 'circle') {
          newEl.cx += offset;
          newEl.cy += offset;
        } else if (el.type === 'arc') {
          newEl.cx += offset;
          newEl.cy += offset;
        }
        return newEl;
      });
      
      const updatedElements = [...elements, ...newElements];
      updateElements(updatedElements);
      setSelectedIds(newElements.map(el => el.id));
      
      if (!inPlace) {
        setPasteCount(prev => prev + 1);
      }
    }
  }, [clipboard, pasteCount, elements, getNextId, updateElements, setSelectedIds]);

  const handleDelete = useCallback(() => {
    if (tool === 'edit' && selectedEdge) {
      const el = elements.find(e => e.id === selectedEdge.elementId);
      
      if (el && el.type === 'rectangle') {
        const newLines = [];
        const edges = {
          top: { x1: el.x, y1: el.y, x2: el.x + el.width, y2: el.y },
          right: { x1: el.x + el.width, y1: el.y, x2: el.x + el.width, y2: el.y + el.height },
          bottom: { x1: el.x + el.width, y1: el.y + el.height, x2: el.x, y2: el.y + el.height },
          left: { x1: el.x, y1: el.y + el.height, x2: el.x, y2: el.y }
        };
        
        Object.keys(edges).forEach(edge => {
          if (edge !== selectedEdge.edge) {
            newLines.push({
              id: getNextId(),
              type: 'line',
              ...edges[edge],
              stroke: darkMode ? '#ffffff' : '#000000',
              strokeWidth: el.strokeWidth || 1.5
            });
          }
        });
        
        const newElements = elements.filter(e => e.id !== el.id).concat(newLines);
        updateElements(newElements);
        setSelectedIds(newLines.map(l => l.id));
        setSelectedEdge(null);
        return;
      }
      
      if (el && el.type === 'line' && selectedEdge.edge === 'line') {
        deleteElements([el.id]);
        setSelectedIds([]);
        setSelectedEdge(null);
        return;
      }
      
      if (el && el.type === 'arc' && selectedEdge.edge === 'arc') {
        deleteElements([el.id]);
        setSelectedIds([]);
        setSelectedEdge(null);
        return;
      }
      
      if (el && el.type === 'circle' && ['top', 'right', 'bottom', 'left'].includes(selectedEdge.edge)) {
        const newArcs = [];
        const quarters = ['top', 'right', 'bottom', 'left'];
        const radius = el.radius || el.radiusX;
        
        quarters.forEach(quarter => {
          if (quarter !== selectedEdge.edge) {
            const angleRanges = {
              right: { start: 0, end: Math.PI / 2 },
              bottom: { start: Math.PI / 2, end: Math.PI },
              left: { start: Math.PI, end: Math.PI * 1.5 },
              top: { start: Math.PI * 1.5, end: Math.PI * 2 }
            };
            
            const range = angleRanges[quarter];
            
            newArcs.push({
              id: getNextId(),
              type: 'arc',
              cx: el.cx,
              cy: el.cy,
              radius: radius,
              startAngle: range.start,
              endAngle: range.end,
              stroke: darkMode ? '#ffffff' : '#000000',
              strokeWidth: el.strokeWidth || 1.5
            });
          }
        });
        
        const newElements = elements.filter(e => e.id !== el.id).concat(newArcs);
        updateElements(newElements);
        setSelectedIds(newArcs.map(l => l.id));
        setSelectedEdge(null);
        return;
      }
    }
    
    if (selectedIds.length > 0) {
      deleteElements(selectedIds);
      setSelectedIds([]);
    }
  }, [tool, selectedEdge, elements, selectedIds, getNextId, darkMode, updateElements, setSelectedIds, setSelectedEdge, deleteElements]);

  const handleMoveElements = useCallback((dx, dy) => {
    setElements(prev => prev.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
      if (el.type === 'line') {
        return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
      } else if (el.type === 'rectangle') {
        return { ...el, x: el.x + dx, y: el.y + dy };
      } else if (el.type === 'circle') {
        return { ...el, cx: el.cx + dx, cy: el.cy + dy };
      } else if (el.type === 'arc') {
        return { ...el, cx: el.cx + dx, cy: el.cy + dy };
      }
      return el;
    }));
  }, [selectedIds, setElements]);

  const { spacePressed } = useKeyboardShortcuts({
    onToolChange: handleToolChange,
    onUndo: undo,
    onCopy: handleCopy,
    onCut: handleCut,
    onPaste: handlePaste,
    onDelete: handleDelete,
    onGroup: createGroup,
    onUngroup: ungroupSelected,
    onMoveElements: handleMoveElements,
    selectedIds,
    tool,
    selectedEdge
  });

  const cursor = useMemo(() => {
    if (isPanning || spacePressed) return 'grab';
    if (tool === 'select') return 'default';
    if (tool === 'edit') return 'pointer';
    return 'crosshair';
  }, [isPanning, spacePressed, tool]);

  // Les gestionnaires d'événements seront dans un fichier séparé ou inline ci-dessous
  // Pour l'instant, je vais créer des versions simplifiées

  const handleMouseDown = useCallback((e) => {
    const canvas = getCanvasRef().current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const point = screenToWorldWrapper(e.clientX, e.clientY);
    
    setContextMenu(null);
    
    if (e.button === 2) {
      e.preventDefault();
      if (selectedIds.length > 0) {
        setContextMenu({ x: e.clientX, y: e.clientY });
      }
      return;
    }
    
    if (showRulers) {
      const guideClickDist = 5;
      for (const guide of guides) {
        if (guide.type === 'horizontal') {
          const screenY = worldToScreenWrapper(0, guide.position).y;
          if (Math.abs(canvasY - screenY) < guideClickDist) {
            setIsDraggingGuide(guide.id);
            return;
          }
        } else {
          const screenX = worldToScreenWrapper(guide.position, 0).x;
          if (Math.abs(canvasX - screenX) < guideClickDist) {
            setIsDraggingGuide(guide.id);
            return;
          }
        }
      }
      
      if (canvasX < RULER_SIZE && canvasY > RULER_SIZE) {
        const newGuide = { type: 'vertical', position: point.x, id: Date.now() };
        setGuides(prev => [...prev, newGuide]);
        setIsDraggingGuide(newGuide.id);
        return;
      } else if (canvasY < RULER_SIZE && canvasX > RULER_SIZE) {
        const newGuide = { type: 'horizontal', position: point.y, id: Date.now() };
        setGuides(prev => [...prev, newGuide]);
        setIsDraggingGuide(newGuide.id);
        return;
      }
    }
    
    const snapped = applySnap(point);

    if (e.button === 1 || (e.button === 0 && spacePressed)) {
      startPan(e.clientX, e.clientY);
      return;
    }

    if (tool === 'select') {
      const clicked = elements.find(el => {
        if (el.type === 'line') {
          const dist = pointToLineDistance(snapped, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
          return dist < 5 / viewport.zoom;
        } else if (el.type === 'rectangle') {
          return snapped.x >= el.x && snapped.x <= el.x + el.width &&
                 snapped.y >= el.y && snapped.y <= el.y + el.height;
        } else if (el.type === 'circle') {
          const radiusX = el.radiusX || el.radius;
          const radiusY = el.radiusY || el.radius;
          const dx = snapped.x - el.cx;
          const dy = snapped.y - el.cy;
          return ((dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY)) <= 1;
        } else if (el.type === 'arc') {
          const dx = snapped.x - el.cx;
          const dy = snapped.y - el.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const radiusTolerance = 15 / viewport.zoom;
          if (Math.abs(dist - el.radius) > radiusTolerance) {
            return false;
          }
          
          const clickAngle = Math.atan2(dy, dx);
          return isAngleBetween(clickAngle, el.startAngle, el.endAngle);
        }
        return false;
      });

      if (clicked) {
        if (e.shiftKey) {
          toggleSelection(clicked.id);
        } else if (!selectedIds.includes(clicked.id)) {
          if (!selectGroup(clicked.id)) {
            setSelectedIds([clicked.id]);
          }
        }
        setDragStart({ x: snapped.x, y: snapped.y });
        setIsDraggingElements(true);
      } else {
        if (!e.shiftKey) {
          clearSelection();
        }
        setDragStart({ x: canvasX, y: canvasY });
        setSelectionBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
      }
      return;
    }

    if (tool === 'edit') {
      const CLICK_DISTANCE = 8 / viewport.zoom;
      
      for (const el of elements.filter(e => selectedIds.includes(e.id))) {
        let controlPoints = [];
        
        if (el.type === 'line') {
          controlPoints = [
            { x: el.x1, y: el.y1, label: 'start' },
            { x: el.x2, y: el.y2, label: 'end' }
          ];
        } else if (el.type === 'rectangle') {
          controlPoints = [
            { x: el.x, y: el.y, label: 'topLeft' },
            { x: el.x + el.width, y: el.y, label: 'topRight' },
            { x: el.x, y: el.y + el.height, label: 'bottomLeft' },
            { x: el.x + el.width, y: el.y + el.height, label: 'bottomRight' },
            { x: el.x + el.width / 2, y: el.y, label: 'top' },
            { x: el.x + el.width, y: el.y + el.height / 2, label: 'right' },
            { x: el.x + el.width / 2, y: el.y + el.height, label: 'bottom' },
            { x: el.x, y: el.y + el.height / 2, label: 'left' }
          ];
        } else if (el.type === 'circle') {
          const radiusX = el.radiusX || el.radius;
          const radiusY = el.radiusY || el.radius;
          controlPoints = [
            { x: el.cx + radiusX, y: el.cy, label: 'right' },
            { x: el.cx - radiusX, y: el.cy, label: 'left' },
            { x: el.cx, y: el.cy + radiusY, label: 'bottom' },
            { x: el.cx, y: el.cy - radiusY, label: 'top' }
          ];
        } else if (el.type === 'arc') {
          controlPoints = [
            { x: el.cx + el.radius * Math.cos(el.startAngle), y: el.cy + el.radius * Math.sin(el.startAngle), label: 'start' },
            { x: el.cx + el.radius * Math.cos(el.endAngle), y: el.cy + el.radius * Math.sin(el.endAngle), label: 'end' }
          ];
        }
        
        for (const cp of controlPoints) {
          const dist = Math.sqrt((cp.x - snapped.x) ** 2 + (cp.y - snapped.y) ** 2);
          if (dist < CLICK_DISTANCE) {
            setEditingPoint({
              elementId: el.id,
              pointType: cp.label,
              originalElement: JSON.parse(JSON.stringify(el)),
              startPoint: { x: snapped.x, y: snapped.y }
            });
            setDragStart({ x: snapped.x, y: snapped.y });
            return;
          }
        }
      }

      const clicked = elements.find(el => {
        if (el.type === 'line') {
          const dist = pointToLineDistance(snapped, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
          return dist < 5 / viewport.zoom;
        } else if (el.type === 'rectangle') {
          return snapped.x >= el.x && snapped.x <= el.x + el.width &&
                 snapped.y >= el.y && snapped.y <= el.y + el.height;
        } else if (el.type === 'circle') {
          const radiusX = el.radiusX || el.radius;
          const radiusY = el.radiusY || el.radius;
          const dx = snapped.x - el.cx;
          const dy = snapped.y - el.cy;
          return ((dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY)) <= 1;
        } else if (el.type === 'arc') {
          const dx = snapped.x - el.cx;
          const dy = snapped.y - el.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const radiusTolerance = 15 / viewport.zoom;
          if (Math.abs(dist - el.radius) > radiusTolerance) {
            return false;
          }
          
          const clickAngle = Math.atan2(dy, dx);
          return isAngleBetween(clickAngle, el.startAngle, el.endAngle);
        }
        return false;
      });

      if (clicked) {
        if (e.shiftKey) {
          toggleSelection(clicked.id);
        } else if (!selectedIds.includes(clicked.id)) {
          setSelectedIds([clicked.id]);
        }
      } else {
        if (!e.shiftKey) {
          clearSelection();
          setSelectedEdge(null);
        }
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint(snapped);
    setDrawOrigin(snapped);
    setCurrentElement({
      id: getNextId(),
      type: tool,
      ...snapped
    });
  }, [showRulers, guides, worldToScreenWrapper, spacePressed, startPan, tool, elements, viewport, selectedIds, toggleSelection, selectGroup, setSelectedIds, clearSelection, getNextId, applySnap, screenToWorldWrapper, pointToLineDistance, isAngleBetween, setSelectedEdge, setEditingPoint]);

  const handleMouseMove = useCallback((e) => {
    const canvas = getCanvasRef().current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const point = screenToWorldWrapper(e.clientX, e.clientY);
    
    if (isDraggingGuide) {
      setGuides(prev => prev.map(guide => {
        if (guide.id === isDraggingGuide) {
          if (guide.type === 'horizontal') {
            const snappedY = findGuideSnapPosition('horizontal', point.y, elements, viewport);
            setSnapPoint({ x: point.x, y: snappedY, type: 'guide', priority: 100, isGuide: true });
            return { ...guide, position: snappedY };
          } else {
            const snappedX = findGuideSnapPosition('vertical', point.x, elements, viewport);
            setSnapPoint({ x: snappedX, y: point.y, type: 'guide', priority: 100, isGuide: true });
            return { ...guide, position: snappedX };
          }
        }
        return guide;
      }));
      return;
    }
    
    if (isPanning) {
      handlePan(e.clientX, e.clientY);
      return;
    }

    const snapped = applySnap(point, []);

    if (tool === 'edit' && editingPoint && dragStart) {
      const el = elements.find(e => e.id === editingPoint.elementId);
      if (!el) return;

      if (el.type === 'line') {
        if (editingPoint.pointType === 'start') {
          let newX = snapped.x;
          let newY = snapped.y;
          
          if (e.shiftKey) {
            const dx = newX - el.x2;
            const dy = newY - el.y2;
            const angle = Math.atan2(dy, dx);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            newX = el.x2 + distance * Math.cos(snapAngle);
            newY = el.y2 + distance * Math.sin(snapAngle);
          }
          
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, x1: newX, y1: newY } : item
          ));
        } else if (editingPoint.pointType === 'end') {
          let newX = snapped.x;
          let newY = snapped.y;
          
          if (e.shiftKey) {
            const dx = newX - el.x1;
            const dy = newY - el.y1;
            const angle = Math.atan2(dy, dx);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            newX = el.x1 + distance * Math.cos(snapAngle);
            newY = el.y1 + distance * Math.sin(snapAngle);
          }
          
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, x2: newX, y2: newY } : item
          ));
        }
      } else if (el.type === 'rectangle') {
        const orig = editingPoint.originalElement;
        
        if (editingPoint.pointType === 'topLeft') {
          const newWidth = orig.x + orig.width - snapped.x;
          const newHeight = orig.y + orig.height - snapped.y;
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, x: snapped.x, y: snapped.y, width: newWidth, height: newHeight } : item
          ));
        } else if (editingPoint.pointType === 'topRight') {
          const newWidth = snapped.x - orig.x;
          const newHeight = orig.y + orig.height - snapped.y;
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, y: snapped.y, width: newWidth, height: newHeight } : item
          ));
        } else if (editingPoint.pointType === 'bottomLeft') {
          const newWidth = orig.x + orig.width - snapped.x;
          const newHeight = snapped.y - orig.y;
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, x: snapped.x, width: newWidth, height: newHeight } : item
          ));
        } else if (editingPoint.pointType === 'bottomRight') {
          const newWidth = snapped.x - orig.x;
          const newHeight = snapped.y - orig.y;
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, width: newWidth, height: newHeight } : item
          ));
        } else if (editingPoint.pointType === 'top') {
          const newHeight = orig.y + orig.height - snapped.y;
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, y: snapped.y, height: newHeight } : item
          ));
        } else if (editingPoint.pointType === 'bottom') {
          const newHeight = snapped.y - orig.y;
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, height: newHeight } : item
          ));
        } else if (editingPoint.pointType === 'left') {
          const newWidth = orig.x + orig.width - snapped.x;
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, x: snapped.x, width: newWidth } : item
          ));
        } else if (editingPoint.pointType === 'right') {
          const newWidth = snapped.x - orig.x;
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, width: newWidth } : item
          ));
        }
      } else if (el.type === 'circle') {
        if (editingPoint.pointType === 'right') {
          const newRadiusX = Math.abs(snapped.x - el.cx);
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, radiusX: newRadiusX, radius: newRadiusX } : item
          ));
        } else if (editingPoint.pointType === 'left') {
          const newRadiusX = Math.abs(snapped.x - el.cx);
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, radiusX: newRadiusX, radius: newRadiusX } : item
          ));
        } else if (editingPoint.pointType === 'top') {
          const newRadiusY = Math.abs(snapped.y - el.cy);
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, radiusY: newRadiusY, radius: newRadiusY } : item
          ));
        } else if (editingPoint.pointType === 'bottom') {
          const newRadiusY = Math.abs(snapped.y - el.cy);
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, radiusY: newRadiusY, radius: newRadiusY } : item
          ));
        }
      } else if (el.type === 'arc') {
        if (editingPoint.pointType === 'start') {
          const dx = snapped.x - el.cx;
          const dy = snapped.y - el.cy;
          const newStartAngle = Math.atan2(dy, dx);
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, startAngle: newStartAngle } : item
          ));
        } else if (editingPoint.pointType === 'end') {
          const dx = snapped.x - el.cx;
          const dy = snapped.y - el.cy;
          const newEndAngle = Math.atan2(dy, dx);
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, endAngle: newEndAngle } : item
          ));
        }
      }
      
      return;
    }

    if (tool === 'select' && dragStart && selectedIds.length > 0 && isDraggingElements) {
      const rawDx = snapped.x - dragStart.x;
      const rawDy = snapped.y - dragStart.y;
      
      const { dx, dy } = applyMultiPointSnap(elements, selectedIds, rawDx, rawDy, snapToElements, showRulers, guides, viewport);
      
      setElements(prev => prev.map(el => {
        if (!selectedIds.includes(el.id)) return el;
        
        if (el.type === 'line') {
          return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
        } else if (el.type === 'rectangle') {
          return { ...el, x: el.x + dx, y: el.y + dy };
        } else if (el.type === 'circle') {
          return { ...el, cx: el.cx + dx, cy: el.cy + dy };
        } else if (el.type === 'arc') {
          return { ...el, cx: el.cx + dx, cy: el.cy + dy };
        }
        return el;
      }));
      setDragStart({ x: dragStart.x + dx, y: dragStart.y + dy });
    }

    if (selectionBox && dragStart) {
      setSelectionBox({
        x: dragStart.x,
        y: dragStart.y,
        width: canvasX - dragStart.x,
        height: canvasY - dragStart.y
      });
    }

    if (isDrawing && startPoint) {
      if (tool === 'line') {
        let endX = snapped.x;
        let endY = snapped.y;
        
        if (e.shiftKey) {
          const dx = endX - startPoint.x;
          const dy = endY - startPoint.y;
          const angle = Math.atan2(dy, dx);
          const distance = Math.sqrt(dx * dx + dy * dy);
          const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          endX = startPoint.x + distance * Math.cos(snapAngle);
          endY = startPoint.y + distance * Math.sin(snapAngle);
        }
        
        setCurrentElement({
          ...currentElement,
          x1: startPoint.x,
          y1: startPoint.y,
          x2: endX,
          y2: endY
        });
      } else if (tool === 'rectangle') {
        const width = snapped.x - startPoint.x;
        const height = snapped.y - startPoint.y;
        setCurrentElement({
          ...currentElement,
          x: startPoint.x,
          y: startPoint.y,
          width: e.shiftKey ? Math.sign(width) * Math.min(Math.abs(width), Math.abs(height)) : width,
          height: e.shiftKey ? Math.sign(height) * Math.min(Math.abs(width), Math.abs(height)) : height
        });
      } else if (tool === 'circle') {
        const radius = Math.sqrt((snapped.x - startPoint.x) ** 2 + (snapped.y - startPoint.y) ** 2);
        
        if (e.shiftKey) {
          setCurrentElement({
            ...currentElement,
            cx: startPoint.x,
            cy: startPoint.y,
            radius: radius,
            radiusX: radius,
            radiusY: radius
          });
        } else {
          const radiusX = Math.abs(snapped.x - startPoint.x);
          const radiusY = Math.abs(snapped.y - startPoint.y);
          setCurrentElement({
            ...currentElement,
            cx: startPoint.x,
            cy: startPoint.y,
            radiusX: radiusX,
            radiusY: radiusY
          });
        }
      }
    }
  }, [isDraggingGuide, guides, elements, viewport, setGuides, setSnapPoint, isPanning, handlePan, tool, dragStart, selectedIds, isDraggingElements, snapToElements, showRulers, setElements, selectionBox, isDrawing, startPoint, currentElement, screenToWorldWrapper, applySnap, editingPoint]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingGuide) {
      if (showRulers) {
        const guide = guides.find(g => g.id === isDraggingGuide);
        if (guide) {
          const canvas = getCanvasRef().current;
          const rect = canvas.getBoundingClientRect();
          
          if (guide.type === 'horizontal') {
            const screenY = worldToScreenWrapper(0, guide.position).y;
            if (screenY < RULER_SIZE) {
              setGuides(prev => prev.filter(g => g.id !== isDraggingGuide));
            }
          } else {
            const screenX = worldToScreenWrapper(guide.position, 0).x;
            if (screenX < RULER_SIZE) {
              setGuides(prev => prev.filter(g => g.id !== isDraggingGuide));
            }
          }
        }
      }
      setIsDraggingGuide(null);
      setSnapPoint(null);
      return;
    }
    
    if (isPanning) {
      endPan();
      return;
    }
    
    if (editingPoint) {
      setEditingPoint(null);
      setDragStart(null);
      return;
    }

    if (selectionBox) {
      const box = selectionBox;
      const boxWorld = {
        x1: Math.min(dragStart.x, dragStart.x + box.width),
        x2: Math.max(dragStart.x, dragStart.x + box.width),
        y1: Math.min(dragStart.y, dragStart.y + box.height),
        y2: Math.max(dragStart.y, dragStart.y + box.height)
      };
      
      const selected = elements.filter(el => {
        const corners = [];
        if (el.type === 'line') {
          corners.push(worldToScreenWrapper(el.x1, el.y1), worldToScreenWrapper(el.x2, el.y2));
        } else if (el.type === 'rectangle') {
          corners.push(
            worldToScreenWrapper(el.x, el.y),
            worldToScreenWrapper(el.x + el.width, el.y + el.height)
          );
        } else if (el.type === 'circle') {
          corners.push(worldToScreenWrapper(el.cx, el.cy));
        } else if (el.type === 'arc') {
          corners.push(worldToScreenWrapper(el.cx, el.cy));
        }
        return corners.some(c => 
          c.x >= boxWorld.x1 && c.x <= boxWorld.x2 &&
          c.y >= boxWorld.y1 && c.y <= boxWorld.y2
        );
      });
      setSelectedIds(selected.map(el => el.id));
      setSelectionBox(null);
      setDragStart(null);
      return;
    }

    if (isDrawing && currentElement) {
      const newElements = [...elements, currentElement];
      updateElements(newElements);
      setCurrentElement(null);
      setIsDrawing(false);
      setStartPoint(null);
      setDrawOrigin(null);
    }

    setDragStart(null);
    setIsDraggingElements(false);
  }, [isDraggingGuide, showRulers, guides, worldToScreenWrapper, setGuides, setSnapPoint, isPanning, endPan, editingPoint, setEditingPoint, selectionBox, dragStart, elements, setSelectedIds, isDrawing, currentElement, updateElements]);

  const handleWheel = useCallback((e) => {
    if (e.shiftKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      handleZoom(zoomFactor);
    }
  }, [handleZoom]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Toolbar 
        tool={tool} 
        onToolChange={handleToolChange}
        onClearSelectedEdge={() => setSelectedEdge(null)}
      />

      <div className="flex-1 relative">
        <Canvas
          viewport={viewport}
          elements={elements}
          selectedIds={selectedIds}
          currentElement={currentElement}
          snapPoint={snapPoint}
          selectionBox={selectionBox}
          drawOrigin={drawOrigin}
          selectedEdge={selectedEdge}
          showDimensions={showDimensions}
          darkMode={darkMode}
          showRulers={showRulers}
          guides={guides}
          flashingIds={flashingIds}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          cursor={cursor}
        />
        
        <ContextMenu
          contextMenu={contextMenu}
          selectedIds={selectedIds}
          groups={groups}
          onGroup={createGroup}
          onUngroup={ungroupSelected}
          onClose={() => setContextMenu(null)}
        />
        
        <TopControls
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          snapToElements={snapToElements}
          setSnapToElements={setSnapToElements}
          showDimensions={showDimensions}
          setShowDimensions={setShowDimensions}
          showRulers={showRulers}
          setShowRulers={setShowRulers}
          viewport={viewport}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      </div>

      <PropertiesPanel
        selectedIds={selectedIds}
        elements={elements}
        onUpdateElement={updateElement}
      />
    </div>
  );
};

export default CADEditor;

