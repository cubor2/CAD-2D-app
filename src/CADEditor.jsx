import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import TopControls from './components/TopControls';
import ContextMenu from './components/ContextMenu';
import MenuBar from './components/MenuBar';
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
  
  const [editingTextId, setEditingTextId] = useState(null);
  const [textCursorPosition, setTextCursorPosition] = useState(0);
  const [textSelectionStart, setTextSelectionStart] = useState(0);
  const [textSelectionEnd, setTextSelectionEnd] = useState(0);
  const [isDraggingTextSelection, setIsDraggingTextSelection] = useState(false);
  
  const [clipboard, setClipboard] = useState([]);
  const [pasteCount, setPasteCount] = useState(0);
  
  const [contextMenu, setContextMenu] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('Sans titre');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
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
    flashingIds,
    flashType,
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

  const getTextCursorPositionFromClick = useCallback((textElement, clickPoint) => {
    const canvas = getCanvasRef().current;
    if (!canvas) return 0;
    if (!textElement.text) return 0;
    
    const pos = worldToScreenWrapper(textElement.x, textElement.y);
    const clickScreen = worldToScreenWrapper(clickPoint.x, clickPoint.y);
    
    const ctx = canvas.getContext('2d');
    ctx.font = `${textElement.fontStyle} ${textElement.fontWeight} ${textElement.fontSize}px ${textElement.fontFamily}`;
    
    const lines = textElement.text.split('\n');
    const lineHeight = textElement.fontSize * 1.2;
    
    let closestPos = 0;
    let minDist = Infinity;
    let currentPos = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineY = pos.y - (lines.length - 1 - i) * lineHeight;
      const distToLine = Math.abs(clickScreen.y - lineY);
      
      if (distToLine < lineHeight / 2) {
        for (let j = 0; j <= line.length; j++) {
          const textBefore = line.slice(0, j);
          const charX = pos.x + ctx.measureText(textBefore).width;
          const dist = Math.abs(clickScreen.x - charX);
          
          if (dist < minDist) {
            minDist = dist;
            closestPos = currentPos + j;
          }
        }
        return closestPos;
      }
      
      currentPos += line.length + 1;
    }
    
    return textElement.text.length;
  }, [worldToScreenWrapper]);

  const getTextControlPointsScreen = useCallback((textElement) => {
    const canvas = getCanvasRef().current;
    if (!canvas) return [];
    
    const pos = worldToScreenWrapper(textElement.x, textElement.y);
    
    const ctx = canvas.getContext('2d');
    ctx.font = `${textElement.fontStyle} ${textElement.fontWeight} ${textElement.fontSize}px ${textElement.fontFamily}`;
    
    const lines = textElement.text ? textElement.text.split('\n') : [''];
    const lineHeight = textElement.fontSize * 1.2;
    const widths = lines.map(line => ctx.measureText(line).width);
    const textWidth = Math.max(...widths, textElement.fontSize * 3);
    const textHeight = lines.length * lineHeight;
    
    return [
      { x: pos.x, y: pos.y - textHeight, label: 'topLeft' },
      { x: pos.x + textWidth, y: pos.y - textHeight, label: 'topRight' },
      { x: pos.x, y: pos.y, label: 'bottomLeft' },
      { x: pos.x + textWidth, y: pos.y, label: 'bottomRight' },
      { x: pos.x + textWidth / 2, y: pos.y - textHeight, label: 'top' },
      { x: pos.x + textWidth, y: pos.y - textHeight / 2, label: 'right' },
      { x: pos.x + textWidth / 2, y: pos.y, label: 'bottom' },
      { x: pos.x, y: pos.y - textHeight / 2, label: 'left' }
    ];
  }, [worldToScreenWrapper]);

  const handleTextResize = useCallback((textElement, handle, dx, dy) => {
    const canvas = getCanvasRef().current;
    if (!canvas) return textElement;
    
    const ctx = canvas.getContext('2d');
    ctx.font = `${textElement.fontStyle} ${textElement.fontWeight} ${textElement.fontSize}px ${textElement.fontFamily}`;
    
    const lines = textElement.text ? textElement.text.split('\n') : [''];
    const lineHeight = textElement.fontSize * 1.2;
    const widths = lines.map(line => ctx.measureText(line).width);
    const oldTextWidthPx = Math.max(...widths, textElement.fontSize * 3);
    const oldTextHeightPx = lines.length * lineHeight;
    
    const oldWidthWorld = oldTextWidthPx / viewport.zoom;
    const oldHeightWorld = oldTextHeightPx / viewport.zoom;
    
    const topLeft = { x: textElement.x, y: textElement.y - oldHeightWorld };
    const topRight = { x: textElement.x + oldWidthWorld, y: textElement.y - oldHeightWorld };
    const bottomLeft = { x: textElement.x, y: textElement.y };
    const bottomRight = { x: textElement.x + oldWidthWorld, y: textElement.y };
    
    const dxScreen = dx * viewport.zoom;
    const dyScreen = dy * viewport.zoom;
    
    let scaleX = 1;
    let scaleY = 1;
    
    switch (handle) {
      case 'topLeft':
        scaleX = Math.max(0.1, (oldTextWidthPx - dxScreen) / oldTextWidthPx);
        scaleY = Math.max(0.1, (oldTextHeightPx - dyScreen) / oldTextHeightPx);
        break;
      case 'topRight':
        scaleX = Math.max(0.1, (oldTextWidthPx + dxScreen) / oldTextWidthPx);
        scaleY = Math.max(0.1, (oldTextHeightPx - dyScreen) / oldTextHeightPx);
        break;
      case 'bottomLeft':
        scaleX = Math.max(0.1, (oldTextWidthPx - dxScreen) / oldTextWidthPx);
        scaleY = Math.max(0.1, (oldTextHeightPx + dyScreen) / oldTextHeightPx);
        break;
      case 'bottomRight':
        scaleX = Math.max(0.1, (oldTextWidthPx + dxScreen) / oldTextWidthPx);
        scaleY = Math.max(0.1, (oldTextHeightPx + dyScreen) / oldTextHeightPx);
        break;
      case 'top':
        scaleY = Math.max(0.1, (oldTextHeightPx - dyScreen) / oldTextHeightPx);
        break;
      case 'right':
        scaleX = Math.max(0.1, (oldTextWidthPx + dxScreen) / oldTextWidthPx);
        break;
      case 'bottom':
        scaleY = Math.max(0.1, (oldTextHeightPx + dyScreen) / oldTextHeightPx);
        break;
      case 'left':
        scaleX = Math.max(0.1, (oldTextWidthPx - dxScreen) / oldTextWidthPx);
        break;
    }
    
    const scale = Math.min(scaleX, scaleY);
    const newFontSize = Math.max(6, Math.min(200, textElement.fontSize * scale));
    
    const newLineHeight = newFontSize * 1.2;
    const newTextHeightPx = lines.length * newLineHeight;
    const newTextWidthPx = oldTextWidthPx * (newFontSize / textElement.fontSize);
    
    const newWidthWorld = newTextWidthPx / viewport.zoom;
    const newHeightWorld = newTextHeightPx / viewport.zoom;
    
    let newX = textElement.x;
    let newY = textElement.y;
    
    switch (handle) {
      case 'topLeft':
        newX = bottomRight.x - newWidthWorld;
        newY = bottomRight.y;
        break;
      case 'topRight':
        newX = bottomLeft.x;
        newY = bottomLeft.y;
        break;
      case 'bottomLeft':
        newX = topRight.x - newWidthWorld;
        newY = topRight.y + newHeightWorld;
        break;
      case 'bottomRight':
        newX = topLeft.x;
        newY = topLeft.y + newHeightWorld;
        break;
      case 'top':
        newX = textElement.x;
        newY = bottomLeft.y;
        break;
      case 'bottom':
        newX = textElement.x;
        newY = topLeft.y + newHeightWorld;
        break;
      case 'left':
        newX = topRight.x - newWidthWorld;
        newY = textElement.y;
        break;
      case 'right':
        newX = topLeft.x;
        newY = textElement.y;
        break;
    }
    
    return {
      ...textElement,
      x: newX,
      y: newY,
      fontSize: newFontSize
    };
  }, [worldToScreenWrapper, viewport]);

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
        } else if (el.type === 'text') {
          newEl.x += offset;
          newEl.y += offset;
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
      } else if (el.type === 'text') {
        return { ...el, x: el.x + dx, y: el.y + dy };
      }
      return el;
    }));
  }, [selectedIds, setElements]);

  const handleNew = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment créer un nouveau projet ?');
      if (!confirm) return;
    }
    updateElements([]);
    setSelectedIds([]);
    clearSelection();
    setCurrentFileName('Sans titre');
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, updateElements, setSelectedIds, clearSelection]);

  const handleOpen = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          updateElements(data.elements || []);
          setGuides(data.guides || []);
          setCurrentFileName(file.name.replace('.json', ''));
          setHasUnsavedChanges(false);
        } catch (error) {
          alert('Erreur lors du chargement du fichier : ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [updateElements, setGuides]);

  const handleSave = useCallback(() => {
    const data = {
      elements,
      guides,
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
  }, [elements, guides, currentFileName]);

  const handleSaveAs = useCallback(() => {
    const newName = prompt('Entrez le nom du fichier :', currentFileName);
    if (!newName) return;
    
    setCurrentFileName(newName);
    
    const data = {
      elements,
      guides,
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
  }, [elements, guides, currentFileName]);

  const handleExport = useCallback((format) => {
    if (elements.length === 0) {
      alert('Aucun élément à exporter !');
      return;
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    const canvas = getCanvasRef().current;
    const ctx = canvas ? canvas.getContext('2d') : null;
    
    elements.forEach(el => {
      if (el.type === 'line') {
        minX = Math.min(minX, el.x1, el.x2);
        minY = Math.min(minY, el.y1, el.y2);
        maxX = Math.max(maxX, el.x1, el.x2);
        maxY = Math.max(maxY, el.y1, el.y2);
      } else if (el.type === 'rectangle') {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
      } else if (el.type === 'circle') {
        const rx = el.radiusX || el.radius;
        const ry = el.radiusY || el.radius;
        minX = Math.min(minX, el.cx - rx);
        minY = Math.min(minY, el.cy - ry);
        maxX = Math.max(maxX, el.cx + rx);
        maxY = Math.max(maxY, el.cy + ry);
      } else if (el.type === 'arc') {
        minX = Math.min(minX, el.cx - el.radius);
        minY = Math.min(minY, el.cy - el.radius);
        maxX = Math.max(maxX, el.cx + el.radius);
        maxY = Math.max(maxY, el.cy + el.radius);
      } else if (el.type === 'text' && ctx) {
        ctx.save();
        ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
        const metrics = ctx.measureText(el.text);
        const textWidth = metrics.width;
        const textHeight = el.fontSize;
        ctx.restore();
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y - textHeight);
        maxX = Math.max(maxX, el.x + textWidth);
        maxY = Math.max(maxY, el.y);
      }
    });
    
    const padding = 5;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    
    if (format === 'svg') {
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${width} ${height}" width="${width}mm" height="${height}mm">\n`;
      svgContent += `  <!-- 1 unité = 1mm -->\n`;
      
      elements.forEach(el => {
        if (el.type === 'line') {
          svgContent += `  <line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="black" stroke-width="0.3" fill="none" />\n`;
        } else if (el.type === 'rectangle') {
          svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" stroke="black" stroke-width="0.3" fill="none" />\n`;
        } else if (el.type === 'circle') {
          const rx = el.radiusX || el.radius;
          const ry = el.radiusY || el.radius;
          if (rx === ry) {
            svgContent += `  <circle cx="${el.cx}" cy="${el.cy}" r="${rx}" stroke="black" stroke-width="0.3" fill="none" />\n`;
          } else {
            svgContent += `  <ellipse cx="${el.cx}" cy="${el.cy}" rx="${rx}" ry="${ry}" stroke="black" stroke-width="0.3" fill="none" />\n`;
          }
        } else if (el.type === 'arc') {
          const startX = el.cx + el.radius * Math.cos(el.startAngle);
          const startY = el.cy + el.radius * Math.sin(el.startAngle);
          const endX = el.cx + el.radius * Math.cos(el.endAngle);
          const endY = el.cy + el.radius * Math.sin(el.endAngle);
          const largeArc = (el.endAngle - el.startAngle) > Math.PI ? 1 : 0;
          svgContent += `  <path d="M ${startX} ${startY} A ${el.radius} ${el.radius} 0 ${largeArc} 1 ${endX} ${endY}" stroke="black" stroke-width="0.3" fill="none" />\n`;
        } else if (el.type === 'text') {
          const escapedText = el.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          svgContent += `  <text x="${el.x}" y="${el.y}" font-family="${el.fontFamily}" font-size="${el.fontSize}" font-weight="${el.fontWeight}" font-style="${el.fontStyle}" fill="black">${escapedText}</text>\n`;
        }
      });
      
      svgContent += '</svg>';
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentFileName}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      const scale = 3.7795275591;
      const canvasWidth = Math.ceil(width * scale);
      const canvasHeight = Math.ceil(height * scale);
      
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasWidth;
      exportCanvas.height = canvasHeight;
      const ctx = exportCanvas.getContext('2d');
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      ctx.save();
      ctx.translate(-minX * scale + padding * scale, -minY * scale + padding * scale);
      ctx.scale(scale, scale);
      
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 0.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      elements.forEach(el => {
        if (el.type === 'text') {
          ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
          ctx.fillStyle = 'black';
          ctx.textBaseline = 'bottom';
          ctx.fillText(el.text, el.x, el.y);
        } else {
          ctx.beginPath();
          if (el.type === 'line') {
            ctx.moveTo(el.x1, el.y1);
            ctx.lineTo(el.x2, el.y2);
            ctx.stroke();
          } else if (el.type === 'rectangle') {
            ctx.rect(el.x, el.y, el.width, el.height);
            ctx.stroke();
          } else if (el.type === 'circle') {
            const rx = el.radiusX || el.radius;
            const ry = el.radiusY || el.radius;
            if (rx === ry) {
              ctx.arc(el.cx, el.cy, rx, 0, Math.PI * 2);
            } else {
              ctx.ellipse(el.cx, el.cy, rx, ry, 0, 0, Math.PI * 2);
            }
            ctx.stroke();
          } else if (el.type === 'arc') {
            ctx.arc(el.cx, el.cy, el.radius, el.startAngle, el.endAngle);
            ctx.stroke();
          }
        }
      });
      
      ctx.restore();
      
      exportCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentFileName}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } else if (format === 'dxf') {
      alert('L\'export DXF sera bientôt implémenté !');
    }
  }, [elements, currentFileName]);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [elements]);

  useEffect(() => {
    if (!editingTextId) return;

    const handleKeyDown = (e) => {
      const textEl = elements.find(el => el.id === editingTextId);
      if (!textEl) return;

      if (e.key === 'Escape') {
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
        } else if (el.type === 'text') {
          const canvas = getCanvasRef().current;
          if (!canvas) return false;
          
          const pos = worldToScreenWrapper(el.x, el.y);
          const clickScreen = worldToScreenWrapper(snapped.x, snapped.y);
          
          const ctx = canvas.getContext('2d');
          ctx.save();
          ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
          const lines = el.text ? el.text.split('\n') : [''];
          const lineHeight = el.fontSize * 1.2;
          const widths = lines.map(line => ctx.measureText(line).width);
          const textWidth = Math.max(...widths, el.fontSize * 3);
          const textHeight = Math.max(lines.length * lineHeight, el.fontSize);
          ctx.restore();
          
          return clickScreen.x >= pos.x && clickScreen.x <= pos.x + textWidth &&
                 clickScreen.y >= pos.y - textHeight && clickScreen.y <= pos.y;
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
      
      if (editingTextId) {
        const textEl = elements.find(e => e.id === editingTextId);
        if (textEl) {
          const canvas = getCanvasRef().current;
          if (canvas) {
            const pos = worldToScreenWrapper(textEl.x, textEl.y);
            const clickScreen = worldToScreenWrapper(snapped.x, snapped.y);
            
            const ctx = canvas.getContext('2d');
            ctx.save();
            ctx.font = `${textEl.fontStyle} ${textEl.fontWeight} ${textEl.fontSize}px ${textEl.fontFamily}`;
            const lines = textEl.text ? textEl.text.split('\n') : [''];
            const lineHeight = textEl.fontSize * 1.2;
            const widths = lines.map(line => ctx.measureText(line).width);
            const textWidth = Math.max(...widths, textEl.fontSize * 3);
            const textHeight = Math.max(lines.length * lineHeight, textEl.fontSize);
            ctx.restore();
            
            const isInsideText = clickScreen.x >= pos.x && clickScreen.x <= pos.x + textWidth &&
                                 clickScreen.y >= pos.y - textHeight && clickScreen.y <= pos.y;
            
            if (isInsideText) {
              const cursorPos = getTextCursorPositionFromClick(textEl, snapped);
              setTextCursorPosition(cursorPos);
              setTextSelectionStart(cursorPos);
              setTextSelectionEnd(cursorPos);
              setIsDraggingTextSelection(true);
              return;
            } else {
              setEditingTextId(null);
              setTextCursorPosition(0);
              setTextSelectionStart(0);
              setTextSelectionEnd(0);
            }
          }
        }
      }
      
      for (const el of elements.filter(e => selectedIds.includes(e.id))) {
        let controlPoints = [];
        
        if (el.type === 'text') {
          if (!editingTextId || editingTextId !== el.id) {
            const handlePointsScreen = getTextControlPointsScreen(el);
            const canvas = getCanvasRef().current;
            if (!canvas) continue;
            const rect = canvas.getBoundingClientRect();
            const clickScreenX = e.clientX - rect.left;
            const clickScreenY = e.clientY - rect.top;
            
            for (const cp of handlePointsScreen) {
              const dist = Math.sqrt((cp.x - clickScreenX) ** 2 + (cp.y - clickScreenY) ** 2);
              
              if (dist < 12) {
                const handleWorld = screenToWorldWrapper(cp.x + rect.left, cp.y + rect.top);
                setEditingPoint({
                  elementId: el.id,
                  pointType: cp.label,
                  originalElement: JSON.parse(JSON.stringify(el)),
                  startPoint: handleWorld
                });
                setDragStart(handleWorld);
                return;
              }
            }
          }
          
          const canvas = getCanvasRef().current;
          if (canvas) {
            const pos = worldToScreenWrapper(el.x, el.y);
            const clickScreen = worldToScreenWrapper(snapped.x, snapped.y);
            
            const ctx = canvas.getContext('2d');
            ctx.save();
            ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
            const lines = el.text ? el.text.split('\n') : [''];
            const lineHeight = el.fontSize * 1.2;
            const widths = lines.map(line => ctx.measureText(line).width);
            const textWidth = Math.max(...widths, el.fontSize * 3);
            const textHeight = Math.max(lines.length * lineHeight, el.fontSize);
            ctx.restore();
            
            const isInsideText = clickScreen.x >= pos.x && clickScreen.x <= pos.x + textWidth &&
                                 clickScreen.y >= pos.y - textHeight && clickScreen.y <= pos.y;
            
            if (isInsideText) {
              setEditingTextId(el.id);
              const cursorPos = getTextCursorPositionFromClick(el, snapped);
              setTextCursorPosition(cursorPos);
              setTextSelectionStart(cursorPos);
              setTextSelectionEnd(cursorPos);
              return;
            }
          }
        } else if (el.type === 'line') {
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
        } else if (el.type === 'text') {
          const canvas = getCanvasRef().current;
          if (!canvas) return false;
          
          const pos = worldToScreenWrapper(el.x, el.y);
          const clickScreen = worldToScreenWrapper(snapped.x, snapped.y);
          
          const ctx = canvas.getContext('2d');
          ctx.save();
          ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
          const lines = el.text ? el.text.split('\n') : [''];
          const lineHeight = el.fontSize * 1.2;
          const widths = lines.map(line => ctx.measureText(line).width);
          const textWidth = Math.max(...widths, el.fontSize * 3);
          const textHeight = Math.max(lines.length * lineHeight, el.fontSize);
          ctx.restore();
          
          return clickScreen.x >= pos.x && clickScreen.x <= pos.x + textWidth &&
                 clickScreen.y >= pos.y - textHeight && clickScreen.y <= pos.y;
        }
        return false;
      });

      if (clicked) {
        if (e.shiftKey) {
          toggleSelection(clicked.id);
        } else if (!selectedIds.includes(clicked.id)) {
          setSelectedIds([clicked.id]);
          if (clicked.type === 'text') {
            setEditingTextId(null);
            setTextCursorPosition(0);
            setTextSelectionStart(0);
            setTextSelectionEnd(0);
          }
        }
      } else {
        if (!e.shiftKey) {
          clearSelection();
          setSelectedEdge(null);
          setEditingTextId(null);
          setTextCursorPosition(0);
          setTextSelectionStart(0);
          setTextSelectionEnd(0);
        }
      }
      return;
    }

    if (tool === 'text') {
      const newText = {
        id: getNextId(),
        type: 'text',
        x: snapped.x,
        y: snapped.y,
        text: 'Texte',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        fill: darkMode ? '#ffffff' : '#000000'
      };
      updateElements([...elements, newText]);
      setSelectedIds([newText.id]);
      setEditingTextId(newText.id);
      setTextCursorPosition(newText.text.length);
      setTextSelectionStart(0);
      setTextSelectionEnd(newText.text.length);
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
  }, [showRulers, guides, worldToScreenWrapper, spacePressed, startPan, tool, elements, viewport, selectedIds, toggleSelection, selectGroup, setSelectedIds, clearSelection, getNextId, applySnap, screenToWorldWrapper, pointToLineDistance, isAngleBetween, setSelectedEdge, setEditingPoint, darkMode, updateElements, getTextControlPointsScreen, editingTextId, getTextCursorPositionFromClick, setEditingTextId, setTextCursorPosition, setTextSelectionStart, setTextSelectionEnd, setIsDraggingTextSelection, setTool, setDragStart]);

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

    if (tool === 'edit' && isDraggingTextSelection && editingTextId) {
      const textEl = elements.find(e => e.id === editingTextId);
      if (textEl) {
        const cursorPos = getTextCursorPositionFromClick(textEl, snapped);
        setTextCursorPosition(cursorPos);
        setTextSelectionEnd(cursorPos);
      }
      return;
    }

    if (tool === 'edit' && editingPoint && dragStart) {
      const el = elements.find(e => e.id === editingPoint.elementId);
      if (!el) return;

      if (el.type === 'text') {
        const dx = snapped.x - dragStart.x;
        const dy = snapped.y - dragStart.y;
        const resizedText = handleTextResize(editingPoint.originalElement, editingPoint.pointType, dx, dy);
        setElements(prev => prev.map(item =>
          item.id === el.id ? resizedText : item
        ));
      } else if (el.type === 'line') {
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
        } else if (el.type === 'text') {
          return { ...el, x: el.x + dx, y: el.y + dy };
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
  }, [isDraggingGuide, guides, elements, viewport, setGuides, setSnapPoint, isPanning, handlePan, tool, dragStart, selectedIds, isDraggingElements, snapToElements, showRulers, setElements, selectionBox, isDrawing, startPoint, currentElement, screenToWorldWrapper, applySnap, editingPoint, editingTextId, isDraggingTextSelection, handleTextResize, getTextCursorPositionFromClick, setTextCursorPosition, setTextSelectionEnd, worldToScreenWrapper, setIsDraggingTextSelection]);

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

    if (isDraggingTextSelection) {
      setIsDraggingTextSelection(false);
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
  }, [isDraggingGuide, showRulers, guides, worldToScreenWrapper, setGuides, setSnapPoint, isPanning, endPan, editingPoint, setEditingPoint, selectionBox, dragStart, elements, setSelectedIds, isDrawing, currentElement, updateElements, isDraggingTextSelection, setIsDraggingTextSelection]);

  const handleWheel = useCallback((e) => {
    if (e.shiftKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      handleZoom(zoomFactor);
    }
  }, [handleZoom]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <MenuBar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onExport={handleExport}
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
      />
      
      <div className="flex flex-1">
        <Toolbar 
          tool={tool} 
          onToolChange={handleToolChange}
          onClearSelectedEdge={() => setSelectedEdge(null)}
        />

        <div className="flex-1 relative">
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
            flashType={flashType}
            tool={tool}
            editingTextId={editingTextId}
            textCursorPosition={textCursorPosition}
            textSelectionStart={textSelectionStart}
            textSelectionEnd={textSelectionEnd}
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

        <PropertiesPanel
          selectedIds={selectedIds}
          elements={elements}
          onUpdateElement={updateElement}
        />
      </div>
    </div>
  );
};

export default CADEditor;

