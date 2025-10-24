import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import TopControls from './components/TopControls';
import ContextMenu from './components/ContextMenu';
import MenuBar from './components/MenuBar';
import DesignSystem from './components/DesignSystem';
import LaserExportModal from './components/LaserExportModal';
import { useViewport } from './hooks/useViewport';
import { useElements } from './hooks/useElements';
import { useSelection } from './hooks/useSelection';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useFileOperations } from './hooks/useFileOperations';
import { screenToWorld, worldToScreen } from './utils/transforms';
import { snapToGridFn, pointToLineDistance, pointToPathDistance, isAngleBetween } from './utils/geometry';
import { generateFingerJointPoints } from './utils/fingerJoint';
import { findSnapPoints, findGuideSnapPosition, computeSnap } from './utils/snap';
import { RULER_SIZE, GRID_SIZE, GUIDE_SNAP_DISTANCE } from './constants';
import { getTextDimensions, invalidateTextCache } from './utils/textMeasurement';
import { getElementControlPoints, findNearestControlPoint, getCursorForControlPoint, isPointInElement } from './utils/elementGeometry';

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
  const [dragOriginalElements, setDragOriginalElements] = useState([])
  
  const [editingPoint, setEditingPoint] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isDraggingEdge, setIsDraggingEdge] = useState(false);
  const [edgeOriginalElement, setEdgeOriginalElement] = useState(null);
  
  const [editingTextId, setEditingTextId] = useState(null);
  const [textCursorPosition, setTextCursorPosition] = useState(0);
  const [textSelectionStart, setTextSelectionStart] = useState(0);
  const [textSelectionEnd, setTextSelectionEnd] = useState(0);
  const [isDraggingTextSelection, setIsDraggingTextSelection] = useState(false);
  
  const [clipboard, setClipboard] = useState({ elements: [], groups: [] });
  const [pasteCount, setPasteCount] = useState(0);
  
  const [contextMenu, setContextMenu] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('Sans titre');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // États pour la détection du double-clic (permet de passer en mode édition)
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedId, setLastClickedId] = useState(null);
  
  // État pour la zone de travail (délimite la zone de découpe disponible)
  const [workArea, setWorkArea] = useState({
    width: 300,
    height: 300,
    visible: true
  });
  
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const [showLaserExportModal, setShowLaserExportModal] = useState(false);
  
  const [hoverCursor, setHoverCursor] = useState('default');
  
  const { viewport, isPanning, handlePan, handleZoom, startPan, endPan } = useViewport();
  
  const {
    elements,
    setElements,
    updateElements,
    addElement,
    deleteElements,
    updateElement,
    undo,
    redo,
    getNextId
  } = useElements();
  
  const {
    selectedIds,
    setSelectedIds,
    groups,
    setGroups,
    flashingIds,
    flashType,
    createGroup,
    ungroupSelected,
    selectGroup,
    toggleSelection,
    clearSelection
  } = useSelection();

  // Hook pour toutes les opérations de fichiers (Phase 2.1 du refactoring)
  const {
    handleNew,
    handleOpen,
    handleImportSVG,
    handleSave,
    handleSaveAs,
    handleLaserExport,
    handleLaserExportConfirm,
    handleExport
  } = useFileOperations({
    elements,
    guides,
    workArea,
    currentFileName,
    hasUnsavedChanges,
    updateElements,
    setSelectedIds,
    clearSelection,
    setCurrentFileName,
    setHasUnsavedChanges,
    setGuides,
    setWorkArea,
    getNextId,
    setShowLaserExportModal
  });

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

  const getTextCursorPositionFromClick = useCallback((textElement, clickPoint) => {
    if (!textElement.text) return 0;
    
    // Utiliser directement les coordonnées monde
    const relativeX = clickPoint.x - textElement.x;
    const relativeY = clickPoint.y - textElement.y;
    
    const canvas = getCanvasRef().current;
    if (!canvas) return 0;
    
    const ctx = canvas.getContext('2d');
    ctx.font = `${textElement.fontStyle} ${textElement.fontWeight} ${textElement.fontSize}px ${textElement.fontFamily}`;
    
    const lines = textElement.text.split('\n');
    const lineHeight = textElement.fontSize * 1.2;
    
    // Trouver la ligne la plus proche
    let targetLineIndex = 0;
    let minLineDist = Infinity;
    
    for (let i = 0; i < lines.length; i++) {
      // Calculer la position Y de chaque ligne (alignement vertical middle par défaut)
      const totalHeight = lines.length * lineHeight;
      const startY = textElement.height / 2 - totalHeight / 2;
      const lineY = startY + (i + 0.5) * lineHeight;
      const dist = Math.abs(relativeY - lineY);
      
      if (dist < minLineDist) {
        minLineDist = dist;
        targetLineIndex = i;
      }
    }
    
    // Trouver la position dans la ligne
    const line = lines[targetLineIndex];
    let closestPos = 0;
    let minCharDist = Infinity;
    
    // Calculer l'offset X du texte (alignement horizontal center par défaut)
    const lineWidth = ctx.measureText(line).width;
    const startX = textElement.width / 2 - lineWidth / 2;
    
    for (let j = 0; j <= line.length; j++) {
      const textBefore = line.slice(0, j);
      const charX = startX + ctx.measureText(textBefore).width;
      const dist = Math.abs(relativeX - charX);
      
      if (dist < minCharDist) {
        minCharDist = dist;
        closestPos = j;
      }
    }
    
    // Calculer la position absolue dans le texte complet
    let absolutePos = 0;
    for (let i = 0; i < targetLineIndex; i++) {
      absolutePos += lines[i].length + 1; // +1 pour le \n
    }
    absolutePos += closestPos;
    
    return absolutePos;
  }, [getCanvasRef]);

  const updateSnapPointForDrag = (snapInfo) => {
    if (!snapInfo) {
      setSnapPoint(null);
      return;
    }
    
    const snapType = snapInfo.type;
    if (snapType === 'endpoint' || snapType === 'center' || snapType === 'midpoint') {
      setSnapPoint({
        x: snapInfo.x,
        y: snapInfo.y,
        type: 'controlPoint',
        priority: 200
      });
    } else {
      setSnapPoint(snapInfo);
    }
  };

  const applySnap = (point, excludeIds = [], autoSetSnapPoint = true, shiftPressed = false) => {
    const result = computeSnap(point, {
      elements,
      excludeIds,
      viewport,
      guides,
      showRulers,
      snapToElements: shiftPressed ? false : snapToElements,
      snapToGrid,
      gridSize: GRID_SIZE
    });

    if (autoSetSnapPoint) {
      setSnapPoint(result.snapInfo);
    }
    
    return result;
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
      const selectedGroups = groups.filter(group => 
        group.elementIds.some(id => selectedIds.includes(id))
      );
      setClipboard({ elements: selectedElements, groups: selectedGroups });
      setPasteCount(0);
    }
  }, [selectedIds, elements, groups]);

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
  }, [selectedIds, elements, groups, deleteElements, setSelectedIds]);

  const handlePaste = useCallback((inPlace) => {
    if (clipboard.elements.length > 0) {
      const offset = inPlace ? 0 : (pasteCount + 1) * 10;
      
      const idMapping = {};
      const newElements = clipboard.elements.map(el => {
        const newId = getNextId();
        idMapping[el.id] = newId;
        const newEl = { ...el, id: newId };
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
      
      const updatedElements = [...elements, ...newElements];
      updateElements(updatedElements);
      setSelectedIds(newElements.map(el => el.id));
      
      const newGroups = clipboard.groups.map(group => ({
        id: Date.now() + Math.random(),
        elementIds: group.elementIds.map(oldId => idMapping[oldId]).filter(Boolean)
      })).filter(group => group.elementIds.length >= 2);
      
      if (newGroups.length > 0) {
        setGroups(prev => [...prev, ...newGroups]);
      }
      
      if (!inPlace) {
        setPasteCount(prev => prev + 1);
      }
    }
  }, [clipboard, pasteCount, elements, getNextId, updateElements, setSelectedIds, setGroups]);

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
              stroke: el.stroke || '#2B2B2B',
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
        const radiusX = el.radiusX || el.radius;
        const radiusY = el.radiusY || el.radius;
        
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
              radius: Math.max(radiusX, radiusY),
              radiusX: radiusX,
              radiusY: radiusY,
              startAngle: range.start,
              endAngle: range.end,
              stroke: el.stroke || '#2B2B2B',
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
    if (tool === 'edit' && selectedEdge) {
      updateElements(elements.map(el => {
        if (el.id !== selectedEdge.elementId) return el;
        
        if (el.type === 'rectangle') {
          if (selectedEdge.edge === 'top') {
            return { ...el, y: el.y + dy, height: el.height - dy };
          } else if (selectedEdge.edge === 'bottom') {
            return { ...el, height: el.height + dy };
          } else if (selectedEdge.edge === 'left') {
            return { ...el, x: el.x + dx, width: el.width - dx };
          } else if (selectedEdge.edge === 'right') {
            return { ...el, width: el.width + dx };
          }
        }
        return el;
      }));
      return;
    }
    
    updateElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'fingerJoint') {
        return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
      } else if (el.type === 'curve') {
        return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy, cpx: el.cpx + dx, cpy: el.cpy + dy };
      } else if (el.type === 'rectangle') {
        return { ...el, x: el.x + dx, y: el.y + dy };
      } else if (el.type === 'circle') {
        return { ...el, cx: el.cx + dx, cy: el.cy + dy };
      } else if (el.type === 'arc') {
        return { ...el, cx: el.cx + dx, cy: el.cy + dy };
      } else if (el.type === 'text') {
        return { ...el, x: el.x + dx, y: el.y + dy };
      }
      return el;
    }));
  }, [selectedIds, selectedEdge, tool, elements, updateElements]);

  const handleRotate = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    let centerX = 0, centerY = 0;
    
    selectedElements.forEach(el => {
      if (el.type === 'line' || el.type === 'fingerJoint') {
        centerX += (el.x1 + el.x2) / 2;
        centerY += (el.y1 + el.y2) / 2;
      } else if (el.type === 'rectangle') {
        centerX += el.x + el.width / 2;
        centerY += el.y + el.height / 2;
      } else if (el.type === 'circle') {
        centerX += el.cx;
        centerY += el.cy;
      } else if (el.type === 'arc') {
        centerX += el.cx;
        centerY += el.cy;
      } else if (el.type === 'curve') {
        centerX += (el.x1 + el.x2) / 2;
        centerY += (el.y1 + el.y2) / 2;
      } else if (el.type === 'text') {
        centerX += el.x;
        centerY += el.y;
      }
    });
    
    centerX /= selectedElements.length;
    centerY /= selectedElements.length;
    
    const angle = Math.PI / 4;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    updateElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'fingerJoint') {
        const dx1 = el.x1 - centerX;
        const dy1 = el.y1 - centerY;
        const dx2 = el.x2 - centerX;
        const dy2 = el.y2 - centerY;
        const p1 = snapToGridFn({ x: centerX + dx1 * cos - dy1 * sin, y: centerY + dx1 * sin + dy1 * cos });
        const p2 = snapToGridFn({ x: centerX + dx2 * cos - dy2 * sin, y: centerY + dx2 * sin + dy2 * cos });
        return {
          ...el,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y
        };
      } else if (el.type === 'rectangle') {
        const oldCenterX = el.x + el.width / 2;
        const oldCenterY = el.y + el.height / 2;
        const dx = oldCenterX - centerX;
        const dy = oldCenterY - centerY;
        const newCenter = snapToGridFn({ x: centerX + dx * cos - dy * sin, y: centerY + dx * sin + dy * cos });
        const topLeft = snapToGridFn({ x: newCenter.x - el.height / 2, y: newCenter.y - el.width / 2 });
        return {
          ...el,
          x: topLeft.x,
          y: topLeft.y,
          width: el.height,
          height: el.width
        };
      } else if (el.type === 'circle') {
        const dx = el.cx - centerX;
        const dy = el.cy - centerY;
        const center = snapToGridFn({ x: centerX + dx * cos - dy * sin, y: centerY + dx * sin + dy * cos });
        return {
          ...el,
          cx: center.x,
          cy: center.y
        };
      } else if (el.type === 'arc') {
        const dx = el.cx - centerX;
        const dy = el.cy - centerY;
        const center = snapToGridFn({ x: centerX + dx * cos - dy * sin, y: centerY + dx * sin + dy * cos });
        return {
          ...el,
          cx: center.x,
          cy: center.y,
          startAngle: el.startAngle + angle,
          endAngle: el.endAngle + angle
        };
      } else if (el.type === 'curve') {
        const dx1 = el.x1 - centerX;
        const dy1 = el.y1 - centerY;
        const dx2 = el.x2 - centerX;
        const dy2 = el.y2 - centerY;
        const dxcp = el.cpx - centerX;
        const dycp = el.cpy - centerY;
        const p1 = snapToGridFn({ x: centerX + dx1 * cos - dy1 * sin, y: centerY + dx1 * sin + dy1 * cos });
        const p2 = snapToGridFn({ x: centerX + dx2 * cos - dy2 * sin, y: centerY + dx2 * sin + dy2 * cos });
        const cp = snapToGridFn({ x: centerX + dxcp * cos - dycp * sin, y: centerY + dxcp * sin + dycp * cos });
        return {
          ...el,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          cpx: cp.x,
          cpy: cp.y
        };
      }
      return el;
    }));
  }, [selectedIds, elements, updateElements]);

  const handleFlipHorizontal = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    let centerX = 0;
    
    selectedElements.forEach(el => {
      if (el.type === 'line' || el.type === 'fingerJoint') {
        centerX += (el.x1 + el.x2) / 2;
      } else if (el.type === 'rectangle') {
        centerX += el.x + el.width / 2;
      } else if (el.type === 'circle') {
        centerX += el.cx;
      } else if (el.type === 'arc') {
        centerX += el.cx;
      } else if (el.type === 'curve') {
        centerX += (el.x1 + el.x2) / 2;
      } else if (el.type === 'text') {
        centerX += el.x;
      }
    });
    
    centerX /= selectedElements.length;
    
    updateElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'fingerJoint') {
        const x1 = Math.round((2 * centerX - el.x1) / GRID_SIZE) * GRID_SIZE;
        const x2 = Math.round((2 * centerX - el.x2) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          x1,
          x2
        };
      } else if (el.type === 'rectangle') {
        const x = Math.round((2 * centerX - el.x - el.width) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          x
        };
      } else if (el.type === 'circle') {
        const cx = Math.round((2 * centerX - el.cx) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          cx
        };
      } else if (el.type === 'arc') {
        const cx = Math.round((2 * centerX - el.cx) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          cx,
          startAngle: Math.PI - el.endAngle,
          endAngle: Math.PI - el.startAngle
        };
      } else if (el.type === 'curve') {
        const x1 = Math.round((2 * centerX - el.x1) / GRID_SIZE) * GRID_SIZE;
        const x2 = Math.round((2 * centerX - el.x2) / GRID_SIZE) * GRID_SIZE;
        const cpx = Math.round((2 * centerX - el.cpx) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          x1,
          x2,
          cpx
        };
      }
      return el;
    }));
  }, [selectedIds, elements, updateElements]);

  const handleFlipVertical = useCallback(() => {
    if (selectedIds.length === 0) return;
    
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    let centerY = 0;
    
    selectedElements.forEach(el => {
      if (el.type === 'line' || el.type === 'fingerJoint') {
        centerY += (el.y1 + el.y2) / 2;
      } else if (el.type === 'rectangle') {
        centerY += el.y + el.height / 2;
      } else if (el.type === 'circle') {
        centerY += el.cy;
      } else if (el.type === 'arc') {
        centerY += el.cy;
      } else if (el.type === 'curve') {
        centerY += (el.y1 + el.y2) / 2;
      } else if (el.type === 'text') {
        centerY += el.y;
      }
    });
    
    centerY /= selectedElements.length;
    
    updateElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
      if (el.type === 'line' || el.type === 'fingerJoint') {
        const y1 = Math.round((2 * centerY - el.y1) / GRID_SIZE) * GRID_SIZE;
        const y2 = Math.round((2 * centerY - el.y2) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          y1,
          y2
        };
      } else if (el.type === 'rectangle') {
        const y = Math.round((2 * centerY - el.y - el.height) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          y
        };
      } else if (el.type === 'circle') {
        const cy = Math.round((2 * centerY - el.cy) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          cy
        };
      } else if (el.type === 'arc') {
        const cy = Math.round((2 * centerY - el.cy) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          cy,
          startAngle: -el.endAngle,
          endAngle: -el.startAngle
        };
      } else if (el.type === 'curve') {
        const y1 = Math.round((2 * centerY - el.y1) / GRID_SIZE) * GRID_SIZE;
        const y2 = Math.round((2 * centerY - el.y2) / GRID_SIZE) * GRID_SIZE;
        const cpy = Math.round((2 * centerY - el.cpy) / GRID_SIZE) * GRID_SIZE;
        return {
          ...el,
          y1,
          y2,
          cpy
        };
      }
      return el;
    }));
  }, [selectedIds, elements, updateElements]);

  const handleResizeElement = useCallback((delta, fromOppositeEnd = false) => {
    if (selectedIds.length === 0) return;
    
    updateElements(elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      
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
            const newX2 = el.x2 + delta;
            return { ...el, x2: newX2 };
          }
        } else {
          if (fromOppositeEnd) {
            if (el.y1 > el.y2) {
              const newY1 = el.y1 + delta;
              return { ...el, y1: newY1 };
            } else {
              const newY2 = el.y2 + delta;
              return { ...el, y2: newY2 };
            }
          } else {
            if (el.y1 < el.y2) {
              const newY1 = el.y1 - delta;
              return { ...el, y1: newY1 };
            } else {
              const newY2 = el.y2 - delta;
              return { ...el, y2: newY2 };
            }
          }
        }
      } else if (el.type === 'rectangle') {
        const newWidth = Math.max(1, Math.abs(el.width) + delta);
        const newHeight = Math.max(1, Math.abs(el.height) + delta);
        
        if (fromOppositeEnd) {
          return {
            ...el,
            x: el.x - delta,
            y: el.y + delta,
            width: el.width < 0 ? -newWidth : newWidth,
            height: el.height < 0 ? -newHeight : newHeight
          };
        } else {
          return {
            ...el,
            y: el.y - delta,
            width: el.width < 0 ? -newWidth : newWidth,
            height: el.height < 0 ? -newHeight : newHeight
          };
        }
      } else if (el.type === 'circle') {
        const currentRadius = el.radiusX || el.radius;
        const newRadius = Math.max(1, currentRadius + delta);
        
        if (el.radiusX && el.radiusY && Math.abs(el.radiusX - el.radiusY) > 0.01) {
          const scaleX = newRadius / currentRadius;
          const scaleY = newRadius / currentRadius;
          return {
            ...el,
            radiusX: el.radiusX * scaleX,
            radiusY: el.radiusY * scaleY
          };
        } else {
          return {
            ...el,
            radius: newRadius,
            radiusX: newRadius,
            radiusY: newRadius
          };
        }
      } else if (el.type === 'arc') {
        const currentRadius = el.radiusX || el.radius;
        const newRadius = Math.max(1, currentRadius + delta);
        return {
          ...el,
          radius: newRadius,
          radiusX: newRadius,
          radiusY: newRadius
        };
      } else if (el.type === 'curve') {
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const currentLength = Math.sqrt(dx * dx + dy * dy);
        if (currentLength === 0) return el;
        
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        
        const cdx = el.cpx - el.x1;
        const cdy = el.cpy - el.y1;
        
        if (isHorizontal) {
          if (fromOppositeEnd) {
            const newX1 = el.x1 - delta;
            return {
              ...el,
              x1: newX1,
              cpx: newX1 + cdx,
            };
          } else {
            const newX2 = el.x2 + delta;
            const scale = (newX2 - el.x1) / dx;
            return {
              ...el,
              x2: newX2,
              cpx: el.x1 + cdx * scale
            };
          }
        } else {
          if (fromOppositeEnd) {
            if (el.y1 > el.y2) {
              const newY1 = el.y1 + delta;
              return {
                ...el,
                y1: newY1,
                cpy: newY1 + cdy
              };
            } else {
              const newDy = dy - delta;
              const scale = newDy / dy;
              const newY2 = el.y2 + delta;
              return {
                ...el,
                y2: newY2,
                cpy: el.y1 + cdy * scale
              };
            }
          } else {
            if (el.y1 < el.y2) {
              const newY1 = el.y1 - delta;
              return {
                ...el,
                y1: newY1,
                cpy: newY1 + cdy
              };
            } else {
              const newDy = dy + delta;
              const scale = newDy / dy;
              const newY2 = el.y2 - delta;
              return {
                ...el,
                y2: newY2,
                cpy: el.y1 + cdy * scale
              };
            }
          }
        }
      }
      
      return el;
    }));
  }, [selectedIds, elements, updateElements]);

  // Les fonctions de fichiers sont maintenant dans useFileOperations hook ✅

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [elements]);

  useEffect(() => {
    if (!editingTextId) return;

    const handleKeyDown = (e) => {
      const textEl = elements.find(el => el.id === editingTextId);
      if (!textEl) return;

      if (e.key === 'Escape') {
        updateElements(elements);
        setEditingTextId(null);
        setTextCursorPosition(0);
        setTextSelectionStart(0);
        setTextSelectionEnd(0);
        e.preventDefault();
        return;
      }

      let newText = textEl.text;
      let newCursorPos = textCursorPosition;
      const selStart = Math.min(textSelectionStart, textSelectionEnd);
      const selEnd = Math.max(textSelectionStart, textSelectionEnd);
      const hasSelection = selStart !== selEnd;

      if (e.key === 'ArrowLeft') {
        if (e.shiftKey) {
          setTextCursorPosition(Math.max(0, textCursorPosition - 1));
          setTextSelectionEnd(Math.max(0, textCursorPosition - 1));
        } else {
          const newPos = hasSelection ? selStart : Math.max(0, textCursorPosition - 1);
          setTextCursorPosition(newPos);
          setTextSelectionStart(newPos);
          setTextSelectionEnd(newPos);
        }
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        if (e.shiftKey) {
          setTextCursorPosition(Math.min(newText.length, textCursorPosition + 1));
          setTextSelectionEnd(Math.min(newText.length, textCursorPosition + 1));
        } else {
          const newPos = hasSelection ? selEnd : Math.min(newText.length, textCursorPosition + 1);
          setTextCursorPosition(newPos);
          setTextSelectionStart(newPos);
          setTextSelectionEnd(newPos);
        }
        e.preventDefault();
      } else if (e.key === 'Home') {
        const lines = newText.split('\n');
        let currentPos = 0;
        let lineStart = 0;
        for (let i = 0; i < lines.length; i++) {
          const lineEnd = currentPos + lines[i].length;
          if (textCursorPosition >= currentPos && textCursorPosition <= lineEnd) {
            lineStart = currentPos;
            break;
          }
          currentPos += lines[i].length + 1;
        }
        if (e.shiftKey) {
          setTextCursorPosition(lineStart);
          setTextSelectionEnd(lineStart);
        } else {
          setTextCursorPosition(lineStart);
          setTextSelectionStart(lineStart);
          setTextSelectionEnd(lineStart);
        }
        e.preventDefault();
      } else if (e.key === 'End') {
        const lines = newText.split('\n');
        let currentPos = 0;
        let lineEnd = newText.length;
        for (let i = 0; i < lines.length; i++) {
          const currentLineEnd = currentPos + lines[i].length;
          if (textCursorPosition >= currentPos && textCursorPosition <= currentLineEnd) {
            lineEnd = currentLineEnd;
            break;
          }
          currentPos += lines[i].length + 1;
        }
        if (e.shiftKey) {
          setTextCursorPosition(lineEnd);
          setTextSelectionEnd(lineEnd);
        } else {
          setTextCursorPosition(lineEnd);
          setTextSelectionStart(lineEnd);
          setTextSelectionEnd(lineEnd);
        }
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        if (hasSelection) {
          newText = newText.slice(0, selStart) + newText.slice(selEnd);
          newCursorPos = selStart;
        } else if (textCursorPosition > 0) {
          newText = newText.slice(0, textCursorPosition - 1) + newText.slice(textCursorPosition);
          newCursorPos = textCursorPosition - 1;
        }
        setElements(prev => prev.map(el => 
          el.id === editingTextId ? { ...el, text: newText } : el
        ));
        setTextCursorPosition(newCursorPos);
        setTextSelectionStart(newCursorPos);
        setTextSelectionEnd(newCursorPos);
        e.preventDefault();
      } else if (e.key === 'Delete') {
        if (hasSelection) {
          newText = newText.slice(0, selStart) + newText.slice(selEnd);
          newCursorPos = selStart;
        } else if (textCursorPosition < newText.length) {
          newText = newText.slice(0, textCursorPosition) + newText.slice(textCursorPosition + 1);
          newCursorPos = textCursorPosition;
        }
        setElements(prev => prev.map(el => 
          el.id === editingTextId ? { ...el, text: newText } : el
        ));
        setTextCursorPosition(newCursorPos);
        setTextSelectionStart(newCursorPos);
        setTextSelectionEnd(newCursorPos);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (hasSelection) {
          newText = newText.slice(0, selStart) + '\n' + newText.slice(selEnd);
          newCursorPos = selStart + 1;
        } else {
          newText = newText.slice(0, textCursorPosition) + '\n' + newText.slice(textCursorPosition);
          newCursorPos = textCursorPosition + 1;
        }
        setElements(prev => prev.map(el => 
          el.id === editingTextId ? { ...el, text: newText } : el
        ));
        setTextCursorPosition(newCursorPos);
        setTextSelectionStart(newCursorPos);
        setTextSelectionEnd(newCursorPos);
        e.preventDefault();
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        setTextCursorPosition(newText.length);
        setTextSelectionStart(0);
        setTextSelectionEnd(newText.length);
        e.preventDefault();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (hasSelection) {
          newText = newText.slice(0, selStart) + e.key + newText.slice(selEnd);
          newCursorPos = selStart + 1;
        } else {
          newText = newText.slice(0, textCursorPosition) + e.key + newText.slice(textCursorPosition);
          newCursorPos = textCursorPosition + 1;
        }
        setElements(prev => prev.map(el => 
          el.id === editingTextId ? { ...el, text: newText } : el
        ));
        setTextCursorPosition(newCursorPos);
        setTextSelectionStart(newCursorPos);
        setTextSelectionEnd(newCursorPos);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTextId, textCursorPosition, textSelectionStart, textSelectionEnd, elements, setElements]);

  const { spacePressed } = useKeyboardShortcuts({
    onToolChange: handleToolChange,
    onUndo: undo,
    onRedo: redo,
    onCopy: handleCopy,
    onCut: handleCut,
    onPaste: handlePaste,
    onDelete: handleDelete,
    onGroup: createGroup,
    onUngroup: ungroupSelected,
    onMoveElements: handleMoveElements,
    onResizeElement: handleResizeElement,
    onNew: handleNew,
    onOpen: handleOpen,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    selectedIds,
    tool,
    selectedEdge,
    editingTextId
  });

  const cursor = useMemo(() => {
    if (isPanning || spacePressed) return 'grab';
    
    if (editingTextId) return 'text';
    
    if (isDraggingElements) return 'move';
    
    if (editingPoint) {
      const pointType = editingPoint.pointType;
      if (pointType === 'topLeft' || pointType === 'bottomRight') return 'nwse-resize';
      if (pointType === 'topRight' || pointType === 'bottomLeft') return 'nesw-resize';
      if (pointType === 'top' || pointType === 'bottom') return 'ns-resize';
      if (pointType === 'left' || pointType === 'right') return 'ew-resize';
      if (pointType === 'middle' || pointType === 'control') return 'grabbing';
      if (pointType === 'start' || pointType === 'end') return 'grabbing';
    }
    
    if (isDraggingEdge) {
      const edgeType = selectedEdge?.type;
      if (edgeType === 'top' || edgeType === 'bottom') return 'ns-resize';
      if (edgeType === 'left' || edgeType === 'right') return 'ew-resize';
      return 'move';
    }
    
    if (tool !== 'select' && tool !== 'edit') return 'crosshair';
    
    return hoverCursor;
  }, [isPanning, spacePressed, tool, isDraggingElements, editingPoint, isDraggingEdge, selectedEdge, hoverCursor, editingTextId]);

  // Réinitialiser le hover cursor quand on change de tool pour forcer le re-render avec les bonnes couleurs
  useEffect(() => {
    setHoverCursor('default');
  }, [tool]);

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
    
    const snapped = applySnap(point, [], true, e.shiftKey);
    
    // Vérifier la création de nouveaux guides depuis la règle (priorité haute)
    if (showRulers) {
      const borderWidth = 10;
      const rulerZoneSize = RULER_SIZE + borderWidth;
      
      if (canvasX >= borderWidth && canvasX < rulerZoneSize && canvasY > rulerZoneSize) {
        const snappedPosition = Math.round(point.x);
        const newGuide = { type: 'vertical', position: snappedPosition, id: Date.now() };
        setGuides(prev => [...prev, newGuide]);
        setIsDraggingGuide(newGuide.id);
        return;
      } else if (canvasY >= borderWidth && canvasY < rulerZoneSize && canvasX > rulerZoneSize) {
        const snappedPosition = Math.round(point.y);
        const newGuide = { type: 'horizontal', position: snappedPosition, id: Date.now() };
        setGuides(prev => [...prev, newGuide]);
        setIsDraggingGuide(newGuide.id);
        return;
      }
    }

    if (e.button === 1 || (e.button === 0 && spacePressed)) {
      startPan(e.clientX, e.clientY);
      return;
    }

    if (tool === 'select') {
      const clicked = [...elements].reverse().find(el => {
        if (el.type === 'line') {
          const dist = pointToLineDistance(snapped, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
          return dist < 5 / viewport.zoom;
        } else if (el.type === 'fingerJoint') {
          const pathPoints = generateFingerJointPoints(
            el.x1, el.y1, el.x2, el.y2,
            el.thickness || 3,
            el.toothWidth || 10,
            el.gapWidth || 10,
            el.startWith || 'tooth',
            el.autoAdjust !== false
          );
          const dist = pointToPathDistance(snapped, pathPoints);
          return dist < 5 / viewport.zoom;
        } else if (el.type === 'curve') {
          if (typeof el.cpx === 'undefined' || typeof el.cpy === 'undefined') return false;
          let minDist = Infinity;
          for (let t = 0; t <= 1; t += 0.02) {
            const t2 = t * t;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const x = mt2 * el.x1 + 2 * mt * t * el.cpx + t2 * el.x2;
            const y = mt2 * el.y1 + 2 * mt * t * el.cpy + t2 * el.y2;
            const dx = snapped.x - x;
            const dy = snapped.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            minDist = Math.min(minDist, dist);
          }
          return minDist < 10 / viewport.zoom;
        } else if (el.type === 'rectangle') {
          // Sélection par l'intérieur OU les bords
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
          
          const clickAngle = Math.atan2(dy, dx);
          if (!isAngleBetween(clickAngle, el.startAngle, el.endAngle)) {
            return false;
          }
          
          const radiusX = el.radiusX || el.radius;
          const radiusY = el.radiusY || el.radius;
          const cosAngle = Math.cos(clickAngle);
          const sinAngle = Math.sin(clickAngle);
          const radiusAtAngle = (radiusX * radiusY) / Math.sqrt((radiusY * cosAngle) ** 2 + (radiusX * sinAngle) ** 2);
          
          const radiusTolerance = 15 / viewport.zoom;
          return Math.abs(dist - radiusAtAngle) <= radiusTolerance;
        } else if (el.type === 'text') {
          return isPointInElement(point, el, viewport, 25, pointToLineDistance);
        }
        return false;
      });

      if (clicked) {
        // Détection du double-clic pour passer automatiquement en mode édition
        const currentTime = Date.now();
        const isDoubleClick = currentTime - lastClickTime < 300 && lastClickedId === clicked.id;
        
        if (isDoubleClick) {
          // Double-clic détecté : passer en mode édition avec cet élément
          setTool('edit');
          setSelectedIds([clicked.id]);
          setLastClickTime(0);
          setLastClickedId(null);
          setSnapPoint(null);
          return;
        }
        
        setLastClickTime(currentTime);
        setLastClickedId(clicked.id);
        
        let elementsToSelect = selectedIds.includes(clicked.id) ? selectedIds : [clicked.id];
        
        if (e.shiftKey) {
          toggleSelection(clicked.id);
          elementsToSelect = selectedIds.includes(clicked.id) 
            ? selectedIds.filter(id => id !== clicked.id)
            : [...selectedIds, clicked.id];
        } else if (!selectedIds.includes(clicked.id)) {
          const groupSelected = selectGroup(clicked.id);
          if (!groupSelected) {
            setSelectedIds([clicked.id]);
            elementsToSelect = [clicked.id];
          } else {
            elementsToSelect = selectedIds;
          }
        }
        
        setDragStart({ x: snapped.x, y: snapped.y });
        setIsDraggingElements(true);
        setDragOriginalElements(elements.filter(el => elementsToSelect.includes(el.id)));
        setSnapPoint(null);
      } else {
        // Vérifier si on clique sur un guide existant (priorité basse)
        if (showRulers) {
          const guideClickDist = 2; // Distance réduite pour moins de "stickiness"
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
        }
        
        if (!e.shiftKey) {
          clearSelection();
        }
        setDragStart({ x: canvasX, y: canvasY });
        setSelectionBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
        setSnapPoint(null);
      }
      return;
    }

    if (tool === 'edit') {
      const CLICK_DISTANCE = 20 / viewport.zoom;
      
      // Détection du double-clic pour passer automatiquement en mode sélection
      const currentTime = Date.now();
      const clickedElement = [...elements].reverse().find(el => {
        if (selectedIds.includes(el.id)) {
          if (el.type === 'text') {
            return snapped.x >= el.x && snapped.x <= el.x + el.width &&
                   snapped.y >= el.y && snapped.y <= el.y + el.height;
          } else if (el.type === 'rectangle') {
            return snapped.x >= el.x && snapped.x <= el.x + el.width &&
                   snapped.y >= el.y && snapped.y <= el.y + el.height;
          } else if (el.type === 'circle') {
            const dx = snapped.x - el.cx;
            const dy = snapped.y - el.cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return Math.abs(dist - (el.radiusX || el.radius)) < CLICK_DISTANCE;
          } else if (el.type === 'arc') {
            const dx = snapped.x - el.cx;
            const dy = snapped.y - el.cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(dist - (el.radiusX || el.radius)) < CLICK_DISTANCE) {
              const clickAngle = Math.atan2(dy, dx);
              return isAngleBetween(clickAngle, el.startAngle, el.endAngle);
            }
            return false;
          } else if (el.type === 'line' || el.type === 'fingerJoint') {
            return pointToLineDistance(snapped, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }) < CLICK_DISTANCE;
          } else if (el.type === 'curve') {
            return pointToLineDistance(snapped, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }) < CLICK_DISTANCE;
          }
        }
        return false;
      });
      
      if (clickedElement) {
        const isDoubleClick = currentTime - lastClickTime < 300 && lastClickedId === clickedElement.id;
        
        if (isDoubleClick) {
          // Double-clic détecté : revenir en mode sélection
          const currentSelection = [...selectedIds];
          
          setEditingTextId(null);
          setTextCursorPosition(0);
          setTextSelectionStart(0);
          setTextSelectionEnd(0);
          setEditingPoint(null);
          setSelectedEdge(null);
          setIsDraggingEdge(false);
          setHoverCursor('default');
          setLastClickTime(0);
          setLastClickedId(null);
          setSnapPoint(null);
          
          // Désélectionner puis re-sélectionner pour forcer le re-render avec les bonnes couleurs
          setSelectedIds([]);
          setTool('select');
          
          // Re-sélectionner après un court délai
          setTimeout(() => {
            setSelectedIds(currentSelection);
          }, 0);
          
          return;
        }
        
        setLastClickTime(currentTime);
        setLastClickedId(clickedElement.id);
      }
      
      if (editingTextId) {
        const textEl = elements.find(e => e.id === editingTextId);
        if (textEl) {
          // Utiliser les dimensions de la boîte du texte (pas le texte calculé)
          const isInsideText = snapped.x >= textEl.x && snapped.x <= textEl.x + textEl.width &&
                               snapped.y >= textEl.y && snapped.y <= textEl.y + textEl.height;
          
          if (isInsideText) {
            const cursorPos = getTextCursorPositionFromClick(textEl, snapped);
            setTextCursorPosition(cursorPos);
            setTextSelectionStart(cursorPos);
            setTextSelectionEnd(cursorPos);
            setIsDraggingTextSelection(true);
            return;
          } else {
            updateElements(elements);
            setEditingTextId(null);
            setTextCursorPosition(0);
            setTextSelectionStart(0);
            setTextSelectionEnd(0);
          }
        }
      }
      
      for (const el of elements.filter(e => selectedIds.includes(e.id))) {
        let controlPoints = [];
        
        if (el.type === 'text') {
          // Pour les textes, on détecte d'abord si on clique dans le texte lui-même
          // avant de vérifier les control points (pour permettre l'édition de texte)
          
          // Utiliser les dimensions de la boîte du texte (pas le texte calculé)
          const isInsideText = snapped.x >= el.x && snapped.x <= el.x + el.width &&
                               snapped.y >= el.y && snapped.y <= el.y + el.height;
          
          if (isInsideText) {
            setEditingTextId(el.id);
            const cursorPos = getTextCursorPositionFromClick(el, snapped);
            setTextCursorPosition(cursorPos);
            setTextSelectionStart(cursorPos);
            setTextSelectionEnd(cursorPos);
            setIsDraggingTextSelection(true);
            setSnapPoint(null);
            return;
          }
          
          // Si on ne clique pas dans le texte, vérifier les control points
          controlPoints = getElementControlPoints(el, viewport);
          
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
              setSnapPoint(null);
              return;
            }
          }
        } else if (el.type === 'line' || el.type === 'fingerJoint') {
          // Les coordonnées x1,y1 et x2,y2 sont toujours sur la ligne de base
          // Pas besoin d'ajustement, même pour les créneaux mâles
          controlPoints = [
            { x: el.x1, y: el.y1, label: 'start' },
            { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2, label: 'middle' },
            { x: el.x2, y: el.y2, label: 'end' }
          ];
        } else if (el.type === 'curve') {
          controlPoints = [
            { x: el.x1, y: el.y1, label: 'start' },
            { x: el.cpx, y: el.cpy, label: 'control' },
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
          const radiusX = el.radiusX || el.radius;
          const radiusY = el.radiusY || el.radius;
          controlPoints = [
            { x: el.cx + radiusX * Math.cos(el.startAngle), y: el.cy + radiusY * Math.sin(el.startAngle), label: 'start' },
            { x: el.cx + radiusX * Math.cos(el.endAngle), y: el.cy + radiusY * Math.sin(el.endAngle), label: 'end' }
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
            setSnapPoint(null);
            return;
          }
        }
      }

      
      const EDGE_CLICK_DISTANCE = 5 / viewport.zoom;
      
      for (const el of elements.filter(e => selectedIds.includes(e.id) && e.type === 'rectangle')) {
        const edges = [
          { name: 'top', x1: el.x, y1: el.y, x2: el.x + el.width, y2: el.y },
          { name: 'right', x1: el.x + el.width, y1: el.y, x2: el.x + el.width, y2: el.y + el.height },
          { name: 'bottom', x1: el.x + el.width, y1: el.y + el.height, x2: el.x, y2: el.y + el.height },
          { name: 'left', x1: el.x, y1: el.y + el.height, x2: el.x, y2: el.y }
        ];
        
        for (const edge of edges) {
          const dist = pointToLineDistance(snapped, { x: edge.x1, y: edge.y1 }, { x: edge.x2, y: edge.y2 });
          if (dist < EDGE_CLICK_DISTANCE) {
            if (selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === edge.name) {
              setIsDraggingEdge(true);
              setDragStart({ x: snapped.x, y: snapped.y });
              setEdgeOriginalElement(JSON.parse(JSON.stringify(el)));
              setSnapPoint(null);
            } else {
              setSelectedEdge({ elementId: el.id, edge: edge.name });
              setSnapPoint(null);
            }
            return;
          }
        }
      }
      
      const ARC_CLICK_DISTANCE = 5 / viewport.zoom;
      
      for (const el of elements.filter(e => selectedIds.includes(e.id) && e.type === 'circle')) {
        const radiusX = el.radiusX || el.radius;
        const radiusY = el.radiusY || el.radius;
        
        const dx = snapped.x - el.cx;
        const dy = snapped.y - el.cy;
        const clickAngle = Math.atan2(dy, dx);
        
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        const cosAngle = Math.cos(clickAngle);
        const sinAngle = Math.sin(clickAngle);
        const radiusAtAngle = (radiusX * radiusY) / Math.sqrt((radiusY * cosAngle) ** 2 + (radiusX * sinAngle) ** 2);
        const distToEllipse = Math.abs(distToCenter - radiusAtAngle);
        
        if (distToEllipse < ARC_CLICK_DISTANCE) {
          let quarter = '';
          const normalizedAngle = clickAngle < 0 ? clickAngle + Math.PI * 2 : clickAngle;
          
          if (normalizedAngle >= 0 && normalizedAngle < Math.PI / 2) {
            quarter = 'right';
          } else if (normalizedAngle >= Math.PI / 2 && normalizedAngle < Math.PI) {
            quarter = 'bottom';
          } else if (normalizedAngle >= Math.PI && normalizedAngle < Math.PI * 1.5) {
            quarter = 'left';
          } else {
            quarter = 'top';
          }
          
          if (selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === quarter) {
            setIsDraggingEdge(true);
            setDragStart({ x: snapped.x, y: snapped.y });
            setEdgeOriginalElement(JSON.parse(JSON.stringify(el)));
            setSnapPoint(null);
          } else {
            setSelectedEdge({ elementId: el.id, edge: quarter });
            setSnapPoint(null);
          }
          return;
        }
      }
      
      for (const el of elements.filter(e => selectedIds.includes(e.id) && e.type === 'arc')) {
        const dx = snapped.x - el.cx;
        const dy = snapped.y - el.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const radiusTolerance = 5 / viewport.zoom;
        if (Math.abs(dist - el.radius) > radiusTolerance) {
          continue;
        }
        
        const clickAngle = Math.atan2(dy, dx);
        if (isAngleBetween(clickAngle, el.startAngle, el.endAngle)) {
          if (selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'arc') {
            setIsDraggingEdge(true);
            setDragStart({ x: snapped.x, y: snapped.y });
            setEdgeOriginalElement(JSON.parse(JSON.stringify(el)));
            setSnapPoint(null);
          } else {
            setSelectedEdge({ elementId: el.id, edge: 'arc' });
            setSnapPoint(null);
          }
          return;
        }
      }

      // Vérifier si on clique à l'intérieur d'un rectangle ou texte déjà sélectionné (pour le déplacer)
      // SAUF pour les textes en mode édition (car on veut éditer le texte, pas le déplacer)
      // NOTE: Les lignes et courbes se déplacent uniquement via leurs points de contrôle
      for (const el of elements.filter(e => selectedIds.includes(e.id) && (e.type === 'rectangle' || (e.type === 'text' && tool !== 'edit')))) {
        const isInsideElement = snapped.x >= el.x && snapped.x <= el.x + el.width &&
                                snapped.y >= el.y && snapped.y <= el.y + el.height;
        
        if (isInsideElement) {
          setIsDraggingElements(true);
          setDragStart({ x: snapped.x, y: snapped.y });
          setDragOriginalElements(elements.filter(e => selectedIds.includes(e.id)));
          setSnapPoint(null);
          return;
        }
      }

      for (const el of elements) {
        if (selectedIds.includes(el.id)) continue;
        
        let controlPoints = [];
        if (el.type === 'line' || el.type === 'fingerJoint') {
          // Les coordonnées x1,y1 et x2,y2 sont toujours sur la ligne de base
          controlPoints = [
            { x: el.x1, y: el.y1, label: 'start' },
            { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2, label: 'middle' },
            { x: el.x2, y: el.y2, label: 'end' }
          ];
        } else if (el.type === 'curve') {
          controlPoints = [
            { x: el.x1, y: el.y1, label: 'start' },
            { x: el.cpx, y: el.cpy, label: 'control' },
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
        }
        
        const pointOnElement = controlPoints.find(cp => {
          const dist = Math.sqrt((cp.x - snapped.x) ** 2 + (cp.y - snapped.y) ** 2);
          return dist < CLICK_DISTANCE;
        });
        
        if (pointOnElement) {
          setSelectedIds([el.id]);
          setEditingPoint({
            elementId: el.id,
            pointType: pointOnElement.label,
            originalElement: JSON.parse(JSON.stringify(el)),
            startPoint: snapped
          });
          setDragStart(snapped);
          setSnapPoint(null);
          return;
        }
      }

      // Rechercher en ordre inverse pour prioriser les éléments du dessus
      // Exclure les éléments déjà sélectionnés pour éviter de les "re-cliquer" inutilement
      const clicked = [...elements].reverse().find(el => {
        // Si l'élément est déjà sélectionné, on ne le détecte pas ici
        // (il doit être édité via ses points de contrôle)
        if (selectedIds.includes(el.id)) {
          return false;
        }
        
        if (el.type === 'line') {
          const dist = pointToLineDistance(snapped, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
          return dist < 5 / viewport.zoom;
        } else if (el.type === 'fingerJoint') {
          const pathPoints = generateFingerJointPoints(
            el.x1, el.y1, el.x2, el.y2,
            el.thickness || 3,
            el.toothWidth || 10,
            el.gapWidth || 10,
            el.startWith || 'tooth',
            el.autoAdjust !== false
          );
          const dist = pointToPathDistance(snapped, pathPoints);
          return dist < 5 / viewport.zoom;
        } else if (el.type === 'curve') {
          if (typeof el.cpx === 'undefined' || typeof el.cpy === 'undefined') return false;
          let minDist = Infinity;
          for (let t = 0; t <= 1; t += 0.05) {
            const t2 = t * t;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const x = mt2 * el.x1 + 2 * mt * t * el.cpx + t2 * el.x2;
            const y = mt2 * el.y1 + 2 * mt * t * el.cpy + t2 * el.y2;
            const dx = snapped.x - x;
            const dy = snapped.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            minDist = Math.min(minDist, dist);
          }
          return minDist < 5 / viewport.zoom;
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
        } else if (el.type === 'text') {
          // Sélection par l'intérieur OU les bords (comme les rectangles)
          return snapped.x >= el.x && snapped.x <= el.x + el.width &&
                 snapped.y >= el.y && snapped.y <= el.y + el.height;
        }
        return false;
      });

      if (clicked) {
        if (e.shiftKey) {
          toggleSelection(clicked.id);
        } else {
          // Toujours permettre de changer la sélection, même si l'élément est déjà sélectionné
          setSelectedIds([clicked.id]);
          if (clicked.type === 'text') {
            if (editingTextId && editingTextId !== clicked.id) {
              updateElements(elements);
            }
            setEditingTextId(null);
            setTextCursorPosition(0);
            setTextSelectionStart(0);
            setTextSelectionEnd(0);
          }
        }
      } else {
        if (!e.shiftKey) {
          if (editingTextId) {
            updateElements(elements);
          }
          clearSelection();
          setSelectedEdge(null);
          setEditingTextId(null);
          setTextCursorPosition(0);
          setTextSelectionStart(0);
          setTextSelectionEnd(0);
        }
      }
      setSnapPoint(null);
      return;
    }

    if (tool === 'text') {
      setIsDrawing(true);
      setStartPoint(snapped);
      setDrawOrigin(snapped);
      setCurrentElement({
        id: getNextId(),
        type: 'text',
        x: snapped.x,
        y: snapped.y,
        width: 0,
        height: 0,
        text: 'Texte',
        fontSize: 30,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        fill: '#000000',
        textAlign: 'center',
        verticalAlign: 'middle'
      });
      setSnapPoint(null);
      return;
    }

    if (tool === 'fingerJoint') {
      setIsDrawing(true);
      setStartPoint(snapped);
      setDrawOrigin(snapped);
      setCurrentElement({
        id: getNextId(),
        type: 'fingerJoint',
        x1: snapped.x,
        y1: snapped.y,
        x2: snapped.x,
        y2: snapped.y,
        thickness: 3,
        toothWidth: 10,
        gapWidth: 10,
        startWith: 'tooth',
        autoAdjust: true,
        stroke: '#2B2B2B',
        strokeWidth: 1.5
      });
      setSnapPoint(null);
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
    setSnapPoint(null);
  }, [showRulers, guides, worldToScreenWrapper, spacePressed, startPan, tool, elements, viewport, selectedIds, toggleSelection, selectGroup, setSelectedIds, clearSelection, getNextId, applySnap, screenToWorldWrapper, pointToLineDistance, isAngleBetween, setSelectedEdge, setEditingPoint, darkMode, updateElements, editingTextId, getTextCursorPositionFromClick, setEditingTextId, setTextCursorPosition, setTextSelectionStart, setTextSelectionEnd, setIsDraggingTextSelection, setTool, setDragStart, lastClickTime, lastClickedId]);

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
            const snappedY = Math.round(findGuideSnapPosition('horizontal', point.y, elements, viewport));
            setSnapPoint({ x: point.x, y: snappedY, type: 'guide', priority: 100, isGuide: true });
            return { ...guide, position: snappedY };
          } else {
            const snappedX = Math.round(findGuideSnapPosition('vertical', point.x, elements, viewport));
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

    if (!isDrawing && !isDraggingElements && !editingPoint && !isDraggingEdge && !isDraggingTextSelection && !selectionBox && !editingTextId) {
      let snapX = null;
      let snapY = null;
      let snappedX = point.x;
      let snappedY = point.y;
      let foundControlPoint = false;

      if (selectedIds.length > 0 && tool !== 'text') {
        const selectedElements = elements.filter(e => selectedIds.includes(e.id));
        
        // Vérifier les control points des éléments sélectionnés
        for (const el of selectedElements) {
          // Vérifier les control points (même logique pour tous les types d'éléments)
          const nearest = findNearestControlPoint(point, el, viewport, tool, 20);
          if (nearest) {
            snappedX = nearest.point.x;
            snappedY = nearest.point.y;
            foundControlPoint = true;
            setSnapPoint({
              x: snappedX,
              y: snappedY,
              type: 'controlPoint',
              priority: 200
            });
            
            setHoverCursor(getCursorForControlPoint(nearest.point.label, tool, el.type));
            break;
          }
        }
      }

      if (!foundControlPoint) {
        // Utiliser la fonction unifiée de snap
        const snapResult = computeSnap(point, {
          elements,
          excludeIds: [],
          viewport,
          guides,
          showRulers,
          snapToElements,
          snapToGrid: false, // Pas de snap grille en hover simple
          gridSize: GRID_SIZE
        });
        
        setSnapPoint(snapResult.snapInfo);
        
        const hoveredElement = [...elements].reverse().find(el => 
          selectedIds.includes(el.id) && isPointInElement(point, el, viewport, 10, pointToLineDistance)
        );
        
        if (hoveredElement && tool === 'select') {
          setHoverCursor('move');
        } else {
          setHoverCursor('default');
        }
      }
    }

    if ((tool === 'edit' || tool === 'text') && isDraggingTextSelection && editingTextId) {
      // Ne pas utiliser de snap pendant la sélection de texte pour plus de précision
      const textEl = elements.find(e => e.id === editingTextId);
      if (textEl) {
        const cursorPos = getTextCursorPositionFromClick(textEl, point);
        setTextCursorPosition(cursorPos);
        setTextSelectionEnd(cursorPos);
      }
      return;
    }

    if (tool === 'edit' && isDraggingEdge && dragStart && selectedEdge && edgeOriginalElement) {
      const snapped = applySnap(point, [selectedEdge.elementId], false);
      updateSnapPointForDrag(snapped.snapInfo);
      const dx = snapped.x - dragStart.x;
      const dy = snapped.y - dragStart.y;
      
      setElements(prev => prev.map(el => {
        if (el.id !== selectedEdge.elementId) return el;
        
        if (edgeOriginalElement.type === 'rectangle') {
          if (selectedEdge.edge === 'top') {
            return { ...el, y: edgeOriginalElement.y + dy, height: edgeOriginalElement.height - dy };
          } else if (selectedEdge.edge === 'bottom') {
            return { ...el, y: edgeOriginalElement.y, height: edgeOriginalElement.height + dy };
          } else if (selectedEdge.edge === 'left') {
            return { ...el, x: edgeOriginalElement.x + dx, width: edgeOriginalElement.width - dx };
          } else if (selectedEdge.edge === 'right') {
            return { ...el, x: edgeOriginalElement.x, width: edgeOriginalElement.width + dx };
          }
        }
        return el;
      }));
      
      return;
    }

    if (tool === 'edit' && editingPoint && dragStart) {
      const snapped = applySnap(point, [editingPoint.elementId], false);
      const el = elements.find(e => e.id === editingPoint.elementId);
      if (!el) return;

      if (el.type === 'text' || el.type === 'rectangle') {
        updateSnapPointForDrag(snapped.snapInfo);
        
        const orig = editingPoint.originalElement;
        const origCenterX = orig.x + orig.width / 2;
        const origCenterY = orig.y + orig.height / 2;
        
        if (editingPoint.pointType === 'topLeft') {
          let newWidth = orig.x + orig.width - snapped.x;
          let newHeight = orig.y + orig.height - snapped.y;
          
          if (e.shiftKey) {
            const widthScale = Math.abs(newWidth) / orig.width;
            const heightScale = Math.abs(newHeight) / orig.height;
            const scale = (widthScale + heightScale) / 2;
            newWidth = Math.round(orig.width * scale / GRID_SIZE) * GRID_SIZE;
            newHeight = Math.round(orig.height * scale / GRID_SIZE) * GRID_SIZE;
            const newX = Math.round((origCenterX - newWidth / 2) / GRID_SIZE) * GRID_SIZE;
            const newY = Math.round((origCenterY - newHeight / 2) / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, x: newX, y: newY, width: newWidth, height: newHeight } : item
            ));
          } else {
            const newX = Math.round((orig.x + orig.width - newWidth) / GRID_SIZE) * GRID_SIZE;
            const newY = Math.round((orig.y + orig.height - newHeight) / GRID_SIZE) * GRID_SIZE;
            newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE;
            newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, x: newX, y: newY, width: newWidth, height: newHeight } : item
            ));
          }
        } else if (editingPoint.pointType === 'topRight') {
          let newWidth = snapped.x - orig.x;
          let newHeight = orig.y + orig.height - snapped.y;
          
          if (e.shiftKey) {
            const widthScale = Math.abs(newWidth) / orig.width;
            const heightScale = Math.abs(newHeight) / orig.height;
            const scale = (widthScale + heightScale) / 2;
            newWidth = Math.round(orig.width * scale / GRID_SIZE) * GRID_SIZE;
            newHeight = Math.round(orig.height * scale / GRID_SIZE) * GRID_SIZE;
            const newX = Math.round((origCenterX - newWidth / 2) / GRID_SIZE) * GRID_SIZE;
            const newY = Math.round((origCenterY - newHeight / 2) / GRID_SIZE) * GRID_SIZE;
          setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, x: newX, y: newY, width: newWidth, height: newHeight } : item
            ));
          } else {
            const newY = Math.round((orig.y + orig.height - newHeight) / GRID_SIZE) * GRID_SIZE;
            newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE;
            newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, y: newY, width: newWidth, height: newHeight } : item
            ));
          }
        } else if (editingPoint.pointType === 'bottomLeft') {
          let newWidth = orig.x + orig.width - snapped.x;
          let newHeight = snapped.y - orig.y;
          
          if (e.shiftKey) {
            const widthScale = Math.abs(newWidth) / orig.width;
            const heightScale = Math.abs(newHeight) / orig.height;
            const scale = (widthScale + heightScale) / 2;
            newWidth = Math.round(orig.width * scale / GRID_SIZE) * GRID_SIZE;
            newHeight = Math.round(orig.height * scale / GRID_SIZE) * GRID_SIZE;
            const newX = Math.round((origCenterX - newWidth / 2) / GRID_SIZE) * GRID_SIZE;
            const newY = Math.round((origCenterY - newHeight / 2) / GRID_SIZE) * GRID_SIZE;
          setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, x: newX, y: newY, width: newWidth, height: newHeight } : item
            ));
          } else {
            const newX = Math.round((orig.x + orig.width - newWidth) / GRID_SIZE) * GRID_SIZE;
            newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE;
            newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, x: newX, width: newWidth, height: newHeight } : item
            ));
          }
        } else if (editingPoint.pointType === 'bottomRight') {
          let newWidth = snapped.x - orig.x;
          let newHeight = snapped.y - orig.y;
          
          if (e.shiftKey) {
            const widthScale = Math.abs(newWidth) / orig.width;
            const heightScale = Math.abs(newHeight) / orig.height;
            const scale = (widthScale + heightScale) / 2;
            newWidth = Math.round(orig.width * scale / GRID_SIZE) * GRID_SIZE;
            newHeight = Math.round(orig.height * scale / GRID_SIZE) * GRID_SIZE;
            const newX = Math.round((origCenterX - newWidth / 2) / GRID_SIZE) * GRID_SIZE;
            const newY = Math.round((origCenterY - newHeight / 2) / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, x: newX, y: newY, width: newWidth, height: newHeight } : item
            ));
          } else {
            newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE;
            newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE;
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, width: newWidth, height: newHeight } : item
          ));
          }
        } else if (editingPoint.pointType === 'top') {
          let newHeight = orig.y + orig.height - snapped.y;
          
          if (e.shiftKey) {
            const symmetricHeight = Math.round(2 * (origCenterY - snapped.y) / GRID_SIZE) * GRID_SIZE;
            const newY = Math.round((origCenterY - symmetricHeight / 2) / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, y: newY, height: symmetricHeight } : item
            ));
          } else {
            newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, y: snapped.y, height: newHeight } : item
            ));
          }
        } else if (editingPoint.pointType === 'bottom') {
          let newHeight = snapped.y - orig.y;
          
          if (e.shiftKey) {
            const symmetricHeight = Math.round(2 * (snapped.y - origCenterY) / GRID_SIZE) * GRID_SIZE;
            const newY = Math.round((origCenterY - symmetricHeight / 2) / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, y: newY, height: symmetricHeight } : item
            ));
          } else {
            newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, height: newHeight } : item
            ));
          }
        } else if (editingPoint.pointType === 'left') {
          let newWidth = orig.x + orig.width - snapped.x;
          
          if (e.shiftKey) {
            const symmetricWidth = Math.round(2 * (origCenterX - snapped.x) / GRID_SIZE) * GRID_SIZE;
            const newX = Math.round((origCenterX - symmetricWidth / 2) / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, x: newX, width: symmetricWidth } : item
            ));
          } else {
            newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, x: snapped.x, width: newWidth } : item
            ));
          }
        } else if (editingPoint.pointType === 'right') {
          let newWidth = snapped.x - orig.x;
          
          if (e.shiftKey) {
            const symmetricWidth = Math.round(2 * (snapped.x - origCenterX) / GRID_SIZE) * GRID_SIZE;
            const newX = Math.round((origCenterX - symmetricWidth / 2) / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, x: newX, width: symmetricWidth } : item
            ));
          } else {
            newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, width: newWidth } : item
            ));
          }
        }
      } else if (el.type === 'line' || el.type === 'fingerJoint') {
        updateSnapPointForDrag(snapped.snapInfo);
        
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
        } else if (editingPoint.pointType === 'middle' && el.type === 'line') {
          setElements(prev => prev.map(item => {
            if (item.id === el.id) {
              return {
                id: item.id,
                type: 'curve',
                x1: item.x1,
                y1: item.y1,
                x2: item.x2,
                y2: item.y2,
                cpx: snapped.x,
                cpy: snapped.y,
                stroke: item.stroke || '#2B2B2B',
                strokeWidth: item.strokeWidth || 1.5
              };
            }
            return item;
          }));
          
          setEditingPoint(prev => ({
            ...prev,
            pointType: 'control'
          }));
        } else if (editingPoint.pointType === 'middle' && el.type === 'fingerJoint') {
          // Pour les créneaux, le point du milieu modifie l'épaisseur
          // Calculer la distance perpendiculaire entre le point et la ligne de base
          const dx_line = el.x2 - el.x1;
          const dy_line = el.y2 - el.y1;
          const lineLength = Math.sqrt(dx_line * dx_line + dy_line * dy_line);
          
          if (lineLength > 0) {
            // Vecteur unitaire de la ligne
            const ux = dx_line / lineLength;
            const uy = dy_line / lineLength;
            
            // Vecteur du milieu de la ligne au point cliqué
            const midX = (el.x1 + el.x2) / 2;
            const midY = (el.y1 + el.y2) / 2;
            const toPointX = snapped.x - midX;
            const toPointY = snapped.y - midY;
            
            // Distance perpendiculaire (produit scalaire avec le vecteur perpendiculaire)
            const perpDist = Math.abs(-uy * toPointX + ux * toPointY);
            
            // Nouvelle épaisseur (minimum 1mm)
            const newThickness = Math.max(1, Math.round(perpDist));
            
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, thickness: newThickness } : item
            ));
          }
        }
      } else if (el.type === 'curve') {
        updateSnapPointForDrag(snapped.snapInfo);
        
        if (editingPoint.pointType === 'start') {
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, x1: snapped.x, y1: snapped.y } : item
          ));
        } else if (editingPoint.pointType === 'end') {
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, x2: snapped.x, y2: snapped.y } : item
          ));
        } else if (editingPoint.pointType === 'control') {
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, cpx: snapped.x, cpy: snapped.y } : item
          ));
        }
      } else if (el.type === 'circle') {
        updateSnapPointForDrag(snapped.snapInfo);
        
        const orig = editingPoint.originalElement;
        const origRadiusX = orig.radiusX || orig.radius;
        const origRadiusY = orig.radiusY || orig.radius;
        // Calcul du ratio d'aspect original (cercle = 1:1, ellipse = autre ratio)
        // Shift maintient ce ratio pendant le redimensionnement
        const aspectRatio = origRadiusX / origRadiusY;
        
        if (editingPoint.pointType === 'right') {
          const newRadiusX = Math.abs(snapped.x - el.cx);
          if (e.shiftKey) {
            const newRadiusY = newRadiusX / aspectRatio;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, radiusX: newRadiusX, radiusY: newRadiusY, radius: newRadiusX } : item
            ));
          } else {
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, radiusX: newRadiusX, radius: newRadiusX } : item
            ));
          }
        } else if (editingPoint.pointType === 'left') {
          const newRadiusX = Math.abs(snapped.x - el.cx);
          if (e.shiftKey) {
            const newRadiusY = newRadiusX / aspectRatio;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, radiusX: newRadiusX, radiusY: newRadiusY, radius: newRadiusX } : item
            ));
          } else {
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, radiusX: newRadiusX, radius: newRadiusX } : item
            ));
          }
        } else if (editingPoint.pointType === 'top') {
          const newRadiusY = Math.abs(snapped.y - el.cy);
          if (e.shiftKey) {
            const newRadiusX = newRadiusY * aspectRatio;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, radiusX: newRadiusX, radiusY: newRadiusY, radius: newRadiusY } : item
            ));
          } else {
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, radiusY: newRadiusY, radius: newRadiusY } : item
            ));
          }
        } else if (editingPoint.pointType === 'bottom') {
          const newRadiusY = Math.abs(snapped.y - el.cy);
          if (e.shiftKey) {
            const newRadiusX = newRadiusY * aspectRatio;
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, radiusX: newRadiusX, radiusY: newRadiusY, radius: newRadiusY } : item
            ));
          } else {
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, radiusY: newRadiusY, radius: newRadiusY } : item
            ));
          }
        }
      } else if (el.type === 'arc') {
        updateSnapPointForDrag(snapped.snapInfo);
        
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

    if (tool === 'select' && dragStart && selectedIds.length > 0 && isDraggingElements && dragOriginalElements.length > 0) {
      const currentMouseWorld = screenToWorldWrapper(e.clientX, e.clientY);
      
      const snappedMouse = computeSnap(currentMouseWorld, {
        elements,
        excludeIds: selectedIds,
        viewport,
        guides,
        showRulers,
        snapToElements,
        snapToGrid,
        gridSize: GRID_SIZE
      });
      
      const dx = snappedMouse.x - dragStart.x;
      const dy = snappedMouse.y - dragStart.y;
      
      updateSnapPointForDrag({
        x: snappedMouse.x,
        y: snappedMouse.y,
        type: snappedMouse.snapInfo?.type || 'grid',
        priority: snappedMouse.snapInfo?.priority || 1
      });
      
      setElements(prev => prev.map(el => {
        const originalEl = dragOriginalElements.find(orig => orig.id === el.id);
        if (!originalEl) return el;
        
        if (el.type === 'line' || el.type === 'fingerJoint') {
          return { ...el, x1: originalEl.x1 + dx, y1: originalEl.y1 + dy, x2: originalEl.x2 + dx, y2: originalEl.y2 + dy };
        } else if (el.type === 'curve') {
          return { ...el, x1: originalEl.x1 + dx, y1: originalEl.y1 + dy, x2: originalEl.x2 + dx, y2: originalEl.y2 + dy, cpx: originalEl.cpx + dx, cpy: originalEl.cpy + dy };
        } else if (el.type === 'rectangle') {
          return { ...el, x: originalEl.x + dx, y: originalEl.y + dy };
        } else if (el.type === 'circle') {
          return { ...el, cx: originalEl.cx + dx, cy: originalEl.cy + dy };
        } else if (el.type === 'arc') {
          return { ...el, cx: originalEl.cx + dx, cy: originalEl.cy + dy };
        } else if (el.type === 'text') {
          return { ...el, x: originalEl.x + dx, y: originalEl.y + dy };
        }
        return el;
      }));
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
      const snapped = applySnap(point, [], true, e.shiftKey);
      if (tool === 'line' || tool === 'fingerJoint') {
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
      } else if (tool === 'rectangle' || tool === 'text') {
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
  }, [isDraggingGuide, guides, elements, viewport, setGuides, setSnapPoint, isPanning, handlePan, tool, dragStart, selectedIds, isDraggingElements, dragOriginalElements, snapToElements, showRulers, setElements, selectionBox, isDrawing, startPoint, currentElement, screenToWorldWrapper, applySnap, editingPoint, editingTextId, isDraggingTextSelection, isDraggingEdge, edgeOriginalElement, selectedEdge, getTextCursorPositionFromClick, setTextCursorPosition, setTextSelectionEnd, worldToScreenWrapper, setIsDraggingTextSelection]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingGuide) {
      if (showRulers) {
        const guide = guides.find(g => g.id === isDraggingGuide);
        if (guide) {
          const canvas = getCanvasRef().current;
          const rect = canvas.getBoundingClientRect();
          const borderWidth = 10;
          const rulerZoneSize = RULER_SIZE + borderWidth;
          
          if (guide.type === 'horizontal') {
            const screenY = worldToScreenWrapper(0, guide.position).y;
            if (screenY >= borderWidth && screenY < rulerZoneSize) {
              setGuides(prev => prev.filter(g => g.id !== isDraggingGuide));
            }
          } else {
            const screenX = worldToScreenWrapper(guide.position, 0).x;
            if (screenX >= borderWidth && screenX < rulerZoneSize) {
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
      updateElements(elements);
      setEditingPoint(null);
      setDragStart(null);
      setSnapPoint(null);
      return;
    }

    if (isDraggingEdge) {
      updateElements(elements);
      setIsDraggingEdge(false);
      setDragStart(null);
      setEdgeOriginalElement(null);
      setSnapPoint(null);
      return;
    }

    if (isDraggingTextSelection) {
      setIsDraggingTextSelection(false);
      setSnapPoint(null);
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
        if (el.type === 'line' || el.type === 'fingerJoint') {
          corners.push(worldToScreenWrapper(el.x1, el.y1), worldToScreenWrapper(el.x2, el.y2));
        } else if (el.type === 'curve') {
          corners.push(
            worldToScreenWrapper(el.x1, el.y1),
            worldToScreenWrapper(el.cpx, el.cpy),
            worldToScreenWrapper(el.x2, el.y2)
          );
        } else if (el.type === 'rectangle') {
          corners.push(
            worldToScreenWrapper(el.x, el.y),
            worldToScreenWrapper(el.x + el.width, el.y + el.height)
          );
        } else if (el.type === 'circle') {
          corners.push(worldToScreenWrapper(el.cx, el.cy));
        } else if (el.type === 'arc') {
          corners.push(worldToScreenWrapper(el.cx, el.cy));
        } else if (el.type === 'text') {
          corners.push(worldToScreenWrapper(el.x, el.y));
        }
        return corners.some(c => 
          c.x >= boxWorld.x1 && c.x <= boxWorld.x2 &&
          c.y >= boxWorld.y1 && c.y <= boxWorld.y2
        );
      });
      setSelectedIds(selected.map(el => el.id));
      setSelectionBox(null);
      setDragStart(null);
      setSnapPoint(null);
      return;
    }

    if (isDrawing && currentElement) {
      let elementToAdd = currentElement;
      
      // Vérification de taille minimale pour éviter les éléments invisibles
      const minSize = 2; // 2mm minimum
      
      if (currentElement.type === 'line' || currentElement.type === 'fingerJoint') {
        const length = Math.sqrt(
          (currentElement.x2 - currentElement.x1) ** 2 + 
          (currentElement.y2 - currentElement.y1) ** 2
        );
        if (length < minSize) {
          setCurrentElement(null);
          setIsDrawing(false);
          setStartPoint(null);
          setDrawOrigin(null);
          setSnapPoint(null);
          return;
        }
      }
      
      if (currentElement.type === 'text' || currentElement.type === 'rectangle') {
        if (currentElement.width < 0) {
          elementToAdd = {
            ...elementToAdd,
            x: elementToAdd.x + elementToAdd.width,
            width: -elementToAdd.width
          };
        }
        if (currentElement.height < 0) {
          elementToAdd = {
            ...elementToAdd,
            y: elementToAdd.y + elementToAdd.height,
            height: -elementToAdd.height
          };
        }
      }
      
      if (elementToAdd.type === 'rectangle') {
        if (elementToAdd.width < minSize || elementToAdd.height < minSize) {
          setCurrentElement(null);
          setIsDrawing(false);
          setStartPoint(null);
          setDrawOrigin(null);
          setSnapPoint(null);
          return;
        }
      }
      
      if (elementToAdd.type === 'circle') {
        const radius = elementToAdd.radius || elementToAdd.radiusX || 0;
        if (radius * 2 < minSize) {
          setCurrentElement(null);
          setIsDrawing(false);
          setStartPoint(null);
          setDrawOrigin(null);
          setSnapPoint(null);
          return;
        }
      }
      
      if (elementToAdd.type === 'text') {
        const minSizeText = 10 / viewport.zoom;
        if (elementToAdd.width < minSizeText || elementToAdd.height < minSizeText) {
          setCurrentElement(null);
          setIsDrawing(false);
          setStartPoint(null);
          setDrawOrigin(null);
          setSnapPoint(null);
          return;
        }
        
        const heightInWorld = elementToAdd.height;
        const calculatedFontSize = Math.max(8, Math.min(200, Math.round(heightInWorld * 0.6)));
        elementToAdd = {
          ...elementToAdd,
          fontSize: calculatedFontSize
        };
      }
      
      const newElements = [...elements, elementToAdd];
      updateElements(newElements);
      
      // Sélectionner automatiquement l'élément créé
      setSelectedIds([elementToAdd.id]);
      
      if (elementToAdd.type === 'text') {
        setEditingTextId(elementToAdd.id);
        setTextCursorPosition(elementToAdd.text.length);
        setTextSelectionStart(0);
        setTextSelectionEnd(elementToAdd.text.length);
        setTool('edit');
      }
      
      setCurrentElement(null);
      setIsDrawing(false);
      setStartPoint(null);
      setDrawOrigin(null);
      setSnapPoint(null);
    }

    if (isDraggingElements && dragOriginalElements.length > 0) {
      updateElements(elements);
    }

    setDragStart(null);
    setIsDraggingElements(false);
    setDragOriginalElements([]);
    setSnapPoint(null);
    setHoverCursor('default');
  }, [isDraggingElements, isDraggingGuide, showRulers, guides, worldToScreenWrapper, setGuides, setSnapPoint, isPanning, endPan, editingPoint, setEditingPoint, isDraggingEdge, selectionBox, dragStart, elements, setSelectedIds, isDrawing, currentElement, updateElements, isDraggingTextSelection, setIsDraggingTextSelection, selectedIds, setElements, dragOriginalElements]);

  const handleWheel = useCallback((e) => {
    if (e.shiftKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      handleZoom(zoomFactor);
    }
  }, [handleZoom]);

  return (
    <div className="flex h-screen bg-drawhard-beige text-drawhard-text">
      <div className="flex flex-col flex-1">
        <MenuBar
          onNew={handleNew}
          onOpen={handleOpen}
          onImportSVG={handleImportSVG}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onExport={handleExport}
          onLaserExport={handleLaserExport}
          onUndo={undo}
          onRedo={redo}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDelete={handleDelete}
          onGroup={createGroup}
          onUngroup={ungroupSelected}
          hasSelection={selectedIds.length > 0}
          hasMultipleSelection={selectedIds.length >= 2}
          onOpenDesignSystem={() => setShowDesignSystem(true)}
        />
        
        <div className="flex flex-1">
          <Toolbar 
            tool={tool} 
            onToolChange={handleToolChange}
            onClearSelectedEdge={() => setSelectedEdge(null)}
          />

          <div className="flex-1 relative">
            <TopControls
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
            
            <Canvas
              viewport={viewport}
              elements={elements}
              selectedIds={selectedIds}
              currentElement={currentElement}
              snapPoint={editingTextId ? null : snapPoint}
              selectionBox={selectionBox}
              drawOrigin={drawOrigin}
              selectedEdge={selectedEdge}
              showDimensions={showDimensions}
              darkMode={darkMode}
              showRulers={showRulers}
              guides={guides}
              flashingIds={flashingIds}
              flashType={flashType}
              tool={tool}
              editingTextId={editingTextId}
              textCursorPosition={textCursorPosition}
              textSelectionStart={textSelectionStart}
              textSelectionEnd={textSelectionEnd}
              workArea={workArea}
              isPanning={isPanning}
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
          </div>
        </div>
      </div>
      
      <PropertiesPanel
        selectedIds={selectedIds}
        elements={elements}
        onUpdateElement={updateElement}
        onResizeElement={handleResizeElement}
        setElements={setElements}
        workArea={workArea}
        onWorkAreaChange={setWorkArea}
        onRotate={handleRotate}
        onFlipHorizontal={handleFlipHorizontal}
        onFlipVertical={handleFlipVertical}
      />
      
      {showDesignSystem && (
        <DesignSystem onClose={() => setShowDesignSystem(false)} />
      )}
      
      {showLaserExportModal && (
        <LaserExportModal
          onClose={() => setShowLaserExportModal(false)}
          onExport={handleLaserExportConfirm}
          elements={elements}
          workArea={workArea}
        />
      )}
    </div>
  );
};

export default CADEditor;

