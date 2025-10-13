import React, { useRef, useEffect, useState } from 'react';
import { Circle, Square, Minus, MousePointer, Edit3 } from 'lucide-react';

const CADEditor = () => {
  const canvasRef = useRef(null);
  const nextIdRef = useRef(1);
  const [tool, setTool] = useState('select');
  const [editingPoint, setEditingPoint] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showDimensions, setShowDimensions] = useState(false);
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewport, setViewport] = useState({ 
    x: 0, 
    y: 0, 
    zoom: 3.779527559055118
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentElement, setCurrentElement] = useState(null);
  const [snapPoint, setSnapPoint] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToElements, setSnapToElements] = useState(true);
  const [dragStart, setDragStart] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [drawOrigin, setDrawOrigin] = useState(null);
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const [clipboard, setClipboard] = useState([]);
  const [pasteCount, setPasteCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [darkMode, setDarkMode] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [guides, setGuides] = useState([]);
  const [isDraggingGuide, setIsDraggingGuide] = useState(null);
  const [groups, setGroups] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [flashingIds, setFlashingIds] = useState([]);

  const GRID_SIZE = 1;
  const MAJOR_GRID = 10;
  const RULER_SIZE = 30;

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

  const createGroup = () => {
    if (selectedIds.length < 2) return;
    
    // D'abord dégrouper tous les éléments sélectionnés qui sont dans des groupes
    const existingGroups = groups.filter(group => 
      selectedIds.some(id => group.elementIds.includes(id))
    );
    
    // Supprimer ces groupes
    setGroups(prev => prev.filter(group => !existingGroups.includes(group)));
    
    // Créer un nouveau groupe avec tous les éléments sélectionnés
    const newGroup = {
      id: Date.now(),
      elementIds: [...selectedIds]
    };
    setGroups(prev => [...prev, newGroup]);
    
    // Scintillement
    setFlashingIds([...selectedIds]);
    setTimeout(() => setFlashingIds([]), 600);
  };

  const ungroupSelected = () => {
    const groupsToRemove = groups.filter(group => 
      selectedIds.some(id => group.elementIds.includes(id))
    );
    const allElementIds = groupsToRemove.flatMap(g => g.elementIds);
    setGroups(prev => prev.filter(group => !groupsToRemove.includes(group)));
    
    // Scintillement
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

  const screenToWorld = (screenX, screenY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - rect.width / 2 - viewport.x) / viewport.zoom;
    const y = (screenY - rect.top - rect.height / 2 - viewport.y) / viewport.zoom;
    return { x, y };
  };

  const worldToScreen = (worldX, worldY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = worldX * viewport.zoom + rect.width / 2 + viewport.x;
    const y = worldY * viewport.zoom + rect.height / 2 + viewport.y;
    return { x, y };
  };

  const snapToGridFn = (point) => {
    return {
      x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(point.y / GRID_SIZE) * GRID_SIZE
    };
  };

  const pointToLineSegment = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return { x: xx, y: yy, distance };
  };

  const findGuideSnapPosition = (guideType, currentPos) => {
    const SNAP_DISTANCE = 8 / viewport.zoom;
    let bestSnap = null;
    let minDist = SNAP_DISTANCE;

    elements.forEach(el => {
      const positions = [];
      
      if (el.type === 'line') {
        if (guideType === 'horizontal') {
          positions.push(el.y1, el.y2, (el.y1 + el.y2) / 2);
        } else {
          positions.push(el.x1, el.x2, (el.x1 + el.x2) / 2);
        }
      } else if (el.type === 'rectangle') {
        if (guideType === 'horizontal') {
          positions.push(el.y, el.y + el.height, el.y + el.height / 2);
        } else {
          positions.push(el.x, el.x + el.width, el.x + el.width / 2);
        }
      } else if (el.type === 'circle') {
        if (guideType === 'horizontal') {
          positions.push(el.cy, el.cy + el.radius, el.cy - el.radius);
        } else {
          positions.push(el.cx, el.cx + el.radius, el.cx - el.radius);
        }
      } else if (el.type === 'arc') {
        if (guideType === 'horizontal') {
          positions.push(el.cy, el.cy + el.radius * Math.sin(el.startAngle), el.cy + el.radius * Math.sin(el.endAngle));
        } else {
          positions.push(el.cx, el.cx + el.radius * Math.cos(el.startAngle), el.cx + el.radius * Math.cos(el.endAngle));
        }
      }
      
      positions.forEach(pos => {
        const dist = Math.abs(pos - currentPos);
        if (dist < minDist) {
          minDist = dist;
          bestSnap = pos;
        }
      });
    });

    return bestSnap !== null ? bestSnap : currentPos;
  };

  const getElementSnapPoints = (el) => {
    const points = [];
    
    if (el.type === 'line') {
      points.push(
        { x: el.x1, y: el.y1 },
        { x: el.x2, y: el.y2 },
        { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2 }
      );
    } else if (el.type === 'rectangle') {
      points.push(
        { x: el.x, y: el.y },
        { x: el.x + el.width, y: el.y },
        { x: el.x, y: el.y + el.height },
        { x: el.x + el.width, y: el.y + el.height },
        { x: el.x + el.width / 2, y: el.y + el.height / 2 },
        { x: el.x + el.width / 2, y: el.y },
        { x: el.x + el.width, y: el.y + el.height / 2 },
        { x: el.x + el.width / 2, y: el.y + el.height },
        { x: el.x, y: el.y + el.height / 2 }
      );
    } else if (el.type === 'circle') {
      points.push(
        { x: el.cx, y: el.cy },
        { x: el.cx + el.radius, y: el.cy },
        { x: el.cx - el.radius, y: el.cy },
        { x: el.cx, y: el.cy + el.radius },
        { x: el.cx, y: el.cy - el.radius }
      );
    } else if (el.type === 'arc') {
      points.push(
        { x: el.cx, y: el.cy },
        { x: el.cx + el.radius * Math.cos(el.startAngle), y: el.cy + el.radius * Math.sin(el.startAngle) },
        { x: el.cx + el.radius * Math.cos(el.endAngle), y: el.cy + el.radius * Math.sin(el.endAngle) },
        { x: el.cx + el.radius * Math.cos((el.startAngle + el.endAngle) / 2), y: el.cy + el.radius * Math.sin((el.startAngle + el.endAngle) / 2) }
      );
    }
    
    return points;
  };

  const applyMultiPointSnap = (elements, selectedIds, dx, dy) => {
    const SNAP_DISTANCE = 8 / viewport.zoom;
    let bestOffsetX = dx;
    let bestOffsetY = dy;
    let foundSnapX = false;
    let foundSnapY = false;

    // Pour chaque élément sélectionné
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    
    for (const selectedEl of selectedElements) {
      const snapPoints = getElementSnapPoints(selectedEl);
      
      // Pour chaque point de snap de cet élément
      for (const point of snapPoints) {
        const movedPoint = { x: point.x + dx, y: point.y + dy };
        
        // Vérifier snap sur guides
        if (showRulers && guides.length > 0) {
          for (const guide of guides) {
            if (guide.type === 'horizontal' && !foundSnapY) {
              if (Math.abs(movedPoint.y - guide.position) < SNAP_DISTANCE) {
                bestOffsetY = guide.position - point.y;
                foundSnapY = true;
              }
            } else if (guide.type === 'vertical' && !foundSnapX) {
              if (Math.abs(movedPoint.x - guide.position) < SNAP_DISTANCE) {
                bestOffsetX = guide.position - point.x;
                foundSnapX = true;
              }
            }
          }
        }
        
        // Vérifier snap sur autres éléments
        if (snapToElements && (!foundSnapX || !foundSnapY)) {
          const snap = findSnapPoints(movedPoint, selectedIds);
          if (snap) {
            if (!foundSnapX) {
              bestOffsetX = snap.x - point.x;
              foundSnapX = true;
            }
            if (!foundSnapY) {
              bestOffsetY = snap.y - point.y;
              foundSnapY = true;
            }
          }
        }
        
        if (foundSnapX && foundSnapY) break;
      }
      
      if (foundSnapX && foundSnapY) break;
    }

    return { dx: bestOffsetX, dy: bestOffsetY };
  };

  const findSnapPoints = (point, excludeIds = []) => {
    const snapPoints = [];
    const SNAP_DISTANCE = 8 / viewport.zoom;
    const EDGE_SNAP_DISTANCE = 10 / viewport.zoom;

    elements.forEach(el => {
      if (excludeIds.includes(el.id)) return;
      
      if (el.type === 'line') {
        snapPoints.push(
          { x: el.x1, y: el.y1, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x2, y: el.y2, type: 'endpoint', priority: 20, elementId: el.id },
          { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2, type: 'midpoint', priority: 15, elementId: el.id }
        );
        
        const lineSnap = pointToLineSegment(point, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
        if (lineSnap.distance < EDGE_SNAP_DISTANCE) {
          snapPoints.push({ x: lineSnap.x, y: lineSnap.y, type: 'edge', priority: 3, distance: lineSnap.distance, elementId: el.id });
        }
      } else if (el.type === 'rectangle') {
        snapPoints.push(
          { x: el.x, y: el.y, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x + el.width, y: el.y, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x, y: el.y + el.height, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x + el.width, y: el.y + el.height, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x + el.width / 2, y: el.y + el.height / 2, type: 'center', priority: 18, elementId: el.id },
          { x: el.x + el.width / 2, y: el.y, type: 'midpoint', priority: 15, elementId: el.id },
          { x: el.x + el.width, y: el.y + el.height / 2, type: 'midpoint', priority: 15, elementId: el.id },
          { x: el.x + el.width / 2, y: el.y + el.height, type: 'midpoint', priority: 15, elementId: el.id },
          { x: el.x, y: el.y + el.height / 2, type: 'midpoint', priority: 15, elementId: el.id }
        );
        
        const edges = [
          [{ x: el.x, y: el.y }, { x: el.x + el.width, y: el.y }],
          [{ x: el.x + el.width, y: el.y }, { x: el.x + el.width, y: el.y + el.height }],
          [{ x: el.x + el.width, y: el.y + el.height }, { x: el.x, y: el.y + el.height }],
          [{ x: el.x, y: el.y + el.height }, { x: el.x, y: el.y }]
        ];
        
        edges.forEach(edge => {
          const edgeSnap = pointToLineSegment(point, edge[0], edge[1]);
          if (edgeSnap.distance < EDGE_SNAP_DISTANCE) {
            snapPoints.push({ x: edgeSnap.x, y: edgeSnap.y, type: 'edge', priority: 3, distance: edgeSnap.distance, elementId: el.id });
          }
        });
      } else if (el.type === 'circle') {
        snapPoints.push(
          { x: el.cx, y: el.cy, type: 'center', priority: 18, elementId: el.id },
          { x: el.cx + el.radius, y: el.cy, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.cx - el.radius, y: el.cy, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.cx, y: el.cy + el.radius, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.cx, y: el.cy - el.radius, type: 'endpoint', priority: 20, elementId: el.id }
        );
      } else if (el.type === 'arc') {
        // Points de début et fin de l'arc
        snapPoints.push(
          { x: el.cx + el.radius * Math.cos(el.startAngle), y: el.cy + el.radius * Math.sin(el.startAngle), type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.cx + el.radius * Math.cos(el.endAngle), y: el.cy + el.radius * Math.sin(el.endAngle), type: 'endpoint', priority: 20, elementId: el.id }
        );
        
        // Centre de l'arc
        snapPoints.push(
          { x: el.cx, y: el.cy, type: 'center', priority: 18, elementId: el.id }
        );
        
        // Point milieu de l'arc
        const midAngle = (el.startAngle + el.endAngle) / 2;
        snapPoints.push(
          { x: el.cx + el.radius * Math.cos(midAngle), y: el.cy + el.radius * Math.sin(midAngle), type: 'midpoint', priority: 15, elementId: el.id }
        );
        
        // Snap sur l'arc lui-même (projection sur l'arc)
        const dx = point.x - el.cx;
        const dy = point.y - el.cy;
        const angleToPoint = Math.atan2(dy, dx);
        
        // Normaliser les angles pour la comparaison
        let normAngle = angleToPoint < 0 ? angleToPoint + Math.PI * 2 : angleToPoint;
        let normStart = el.startAngle < 0 ? el.startAngle + Math.PI * 2 : el.startAngle;
        let normEnd = el.endAngle < 0 ? el.endAngle + Math.PI * 2 : el.endAngle;
        
        if (normStart > normEnd) {
          normEnd += Math.PI * 2;
        }
        
        if (normAngle < normStart) {
          normAngle += Math.PI * 2;
        }
        
        // Si le point est dans la plage angulaire de l'arc
        if (normAngle >= normStart && normAngle <= normEnd) {
          const distToCenter = Math.sqrt(dx * dx + dy * dy);
          const distToArc = Math.abs(distToCenter - el.radius);
          
          if (distToArc < EDGE_SNAP_DISTANCE) {
            const projX = el.cx + el.radius * Math.cos(angleToPoint);
            const projY = el.cy + el.radius * Math.sin(angleToPoint);
            snapPoints.push({ x: projX, y: projY, type: 'edge', priority: 3, distance: distToArc, elementId: el.id });
          }
        }
      }
    });

    let closest = null;
    let minScore = Infinity;

    snapPoints.forEach(sp => {
      const dist = sp.distance !== undefined ? sp.distance : Math.sqrt((sp.x - point.x) ** 2 + (sp.y - point.y) ** 2);
      const maxDist = sp.type === 'edge' ? EDGE_SNAP_DISTANCE : SNAP_DISTANCE;
      
      if (dist < maxDist) {
        const score = dist / sp.priority;
        if (score < minScore) {
          minScore = score;
          closest = sp;
        }
      }
    });

    return closest;
  };

  const applySnap = (point, excludeIds = []) => {
    let snappedX = point.x;
    let snappedY = point.y;
    let snapX = null;
    let snapY = null;

    // Snap sur les guides EN PREMIER (priorité absolue)
    if (showRulers && guides.length > 0) {
      const GUIDE_SNAP_DISTANCE = 5 / viewport.zoom;
      
      for (const guide of guides) {
        if (guide.type === 'horizontal' && !snapY) {
          if (Math.abs(point.y - guide.position) < GUIDE_SNAP_DISTANCE) {
            snappedY = guide.position;
            snapY = { y: guide.position, type: 'guide', priority: 100 };
          }
        } else if (guide.type === 'vertical' && !snapX) {
          if (Math.abs(point.x - guide.position) < GUIDE_SNAP_DISTANCE) {
            snappedX = guide.position;
            snapX = { x: guide.position, type: 'guide', priority: 100 };
          }
        }
      }
    }

    // Snap sur éléments (peut compléter le snap des guides)
    if (snapToElements) {
      const elementSnap = findSnapPoints(point, excludeIds);
      if (elementSnap) {
        // Si pas encore de snap X, prendre celui de l'élément
        if (!snapX) {
          snappedX = elementSnap.x;
          snapX = elementSnap;
        }
        // Si pas encore de snap Y, prendre celui de l'élément
        if (!snapY) {
          snappedY = elementSnap.y;
          snapY = elementSnap;
        }
      }
    }

    // Snap sur grille (seulement pour les axes non déjà snappés)
    if (snapToGrid) {
      if (!snapX) {
        snappedX = Math.round(point.x / GRID_SIZE) * GRID_SIZE;
      }
      if (!snapY) {
        snappedY = Math.round(point.y / GRID_SIZE) * GRID_SIZE;
      }
    }

    // Créer un objet snap combiné pour l'affichage
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

  const drawGrid = (ctx) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    const offsetX = showRulers ? RULER_SIZE : 0;
    const offsetY = showRulers ? RULER_SIZE : 0;
    
    const startX = Math.floor((-canvasWidth / 2 - viewport.x) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil((canvasWidth / 2 - viewport.x) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor((-canvasHeight / 2 - viewport.y) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil((canvasHeight / 2 - viewport.y) / viewport.zoom / GRID_SIZE) * GRID_SIZE;

    if (viewport.zoom > 0.5) {
      ctx.strokeStyle = darkMode ? '#2a2a2a' : '#e0e0e0';
      ctx.lineWidth = 1;

      for (let x = startX; x <= endX; x += GRID_SIZE) {
        const screenPos = worldToScreen(x, 0);
        ctx.beginPath();
        ctx.moveTo(screenPos.x, 0);
        ctx.lineTo(screenPos.x, canvasHeight);
        ctx.stroke();
      }

      for (let y = startY; y <= endY; y += GRID_SIZE) {
        const screenPos = worldToScreen(0, y);
        ctx.beginPath();
        ctx.moveTo(0, screenPos.y);
        ctx.lineTo(canvasWidth, screenPos.y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = viewport.zoom > 0.5 ? (darkMode ? '#3a3a3a' : '#c0c0c0') : (darkMode ? '#2a2a2a' : '#e0e0e0');
    ctx.lineWidth = 2;

    for (let x = Math.floor(startX / MAJOR_GRID) * MAJOR_GRID; x <= endX; x += MAJOR_GRID) {
      const screenPos = worldToScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(screenPos.x, 0);
      ctx.lineTo(screenPos.x, canvasHeight);
      ctx.stroke();
    }

    for (let y = Math.floor(startY / MAJOR_GRID) * MAJOR_GRID; y <= endY; y += MAJOR_GRID) {
      const screenPos = worldToScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(0, screenPos.y);
      ctx.lineTo(canvasWidth, screenPos.y);
      ctx.stroke();
    }
  };

  const drawRulers = (ctx) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    // Fond des règles
    ctx.fillStyle = darkMode ? '#2a2a2a' : '#f0f0f0';
    ctx.fillRect(0, 0, canvasWidth, RULER_SIZE);
    ctx.fillRect(0, 0, RULER_SIZE, canvasHeight);
    
    // Carré coin haut-gauche
    ctx.fillStyle = darkMode ? '#3a3a3a' : '#e0e0e0';
    ctx.fillRect(0, 0, RULER_SIZE, RULER_SIZE);
    
    ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Règle horizontale (haut)
    for (let x = Math.floor((-canvasWidth / 2 - viewport.x) / viewport.zoom / 10) * 10; 
         x <= Math.ceil((canvasWidth / 2 - viewport.x) / viewport.zoom / 10) * 10; 
         x += 10) {
      const screenPos = worldToScreen(x, 0);
      if (screenPos.x < RULER_SIZE) continue;
      
      ctx.strokeStyle = darkMode ? '#666' : '#999';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenPos.x, RULER_SIZE);
      ctx.lineTo(screenPos.x, RULER_SIZE - 5);
      ctx.stroke();
      
      if (x % 50 === 0) {
        ctx.fillText(x.toString(), screenPos.x, RULER_SIZE / 2);
      }
    }
    
    // Règle verticale (gauche)
    ctx.save();
    ctx.translate(RULER_SIZE / 2, 0);
    ctx.rotate(-Math.PI / 2);
    
    for (let y = Math.floor((-canvasHeight / 2 - viewport.y) / viewport.zoom / 10) * 10; 
         y <= Math.ceil((canvasHeight / 2 - viewport.y) / viewport.zoom / 10) * 10; 
         y += 10) {
      const screenPos = worldToScreen(0, y);
      if (screenPos.y < RULER_SIZE) continue;
      
      ctx.strokeStyle = darkMode ? '#666' : '#999';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-screenPos.y, RULER_SIZE / 2 - 5);
      ctx.lineTo(-screenPos.y, RULER_SIZE / 2);
      ctx.stroke();
      
      if (y % 50 === 0) {
        ctx.fillText(y.toString(), -screenPos.y, 0);
      }
    }
    
    ctx.restore();
    
    // Croix à l'origine (0,0) si règles affichées
    if (showRulers) {
      const origin = worldToScreen(0, 0);
      ctx.strokeStyle = darkMode ? '#ffffff' : '#000000';
      ctx.lineWidth = 2;
      const crossSize = 10;
      ctx.beginPath();
      ctx.moveTo(origin.x - crossSize, origin.y);
      ctx.lineTo(origin.x + crossSize, origin.y);
      ctx.moveTo(origin.x, origin.y - crossSize);
      ctx.lineTo(origin.x, origin.y + crossSize);
      ctx.stroke();
    }
  };

  const drawGuides = (ctx) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    guides.forEach(guide => {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      
      if (guide.type === 'horizontal') {
        const screenY = worldToScreen(0, guide.position).y;
        ctx.beginPath();
        ctx.moveTo(showRulers ? RULER_SIZE : 0, screenY);
        ctx.lineTo(rect.width, screenY);
        ctx.stroke();
      } else {
        const screenX = worldToScreen(guide.position, 0).x;
        ctx.beginPath();
        ctx.moveTo(screenX, showRulers ? RULER_SIZE : 0);
        ctx.lineTo(screenX, rect.height);
        ctx.stroke();
      }
    });
  };

  const drawOriginCross = (ctx, worldX, worldY) => {
    const screen = worldToScreen(worldX, worldY);
    const size = 8;
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screen.x - size, screen.y);
    ctx.lineTo(screen.x + size, screen.y);
    ctx.moveTo(screen.x, screen.y - size);
    ctx.lineTo(screen.x, screen.y + size);
    ctx.stroke();
  };

  const drawElement = (ctx, el, isSelected = false) => {
    ctx.save();

    const isFlashing = flashingIds.includes(el.id);
    
    if (isFlashing) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 4;
    } else if (isSelected) {
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = el.stroke || (darkMode ? '#ffffff' : '#000000');
      ctx.lineWidth = el.strokeWidth || 1.5;
    }

    ctx.fillStyle = el.fill || 'transparent';

    if (el.type === 'arc') {
      const center = worldToScreen(el.cx, el.cy);
      const radius = el.radius * viewport.zoom;
      
      const isArcSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'arc';
      
      if (isFlashing) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = isArcSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || (darkMode ? '#ffffff' : '#000000')));
        ctx.lineWidth = isArcSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
      }
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, el.startAngle, el.endAngle);
      ctx.stroke();
      
      if (isSelected || el === currentElement || showDimensions) {
        const midAngle = (el.startAngle + el.endAngle) / 2;
        const textX = center.x + radius * Math.cos(midAngle) * 1.2;
        const textY = center.y + radius * Math.sin(midAngle) * 1.2;
        const arcLength = Math.abs(el.endAngle - el.startAngle) * el.radius;
        ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
        ctx.font = '12px monospace';
        ctx.fillText(`${arcLength.toFixed(1)}mm`, textX, textY);
      }
      
      if (isSelected) {
        const controlPoints = [
          worldToScreen(el.cx + el.radius * Math.cos(el.startAngle), el.cy + el.radius * Math.sin(el.startAngle)),
          worldToScreen(el.cx + el.radius * Math.cos(el.endAngle), el.cy + el.radius * Math.sin(el.endAngle)),
          worldToScreen(el.cx, el.cy)
        ];
        
        controlPoints.forEach((pt, idx) => {
          ctx.fillStyle = idx === 2 ? '#ff6600' : '#00aaff';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    } else if (el.type === 'line') {
      const start = worldToScreen(el.x1, el.y1);
      const end = worldToScreen(el.x2, el.y2);
      
      const isLineSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'line';
      
      if (isFlashing) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = isLineSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || (darkMode ? '#ffffff' : '#000000')));
        ctx.lineWidth = isLineSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
      }
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      if (isSelected || el === currentElement || showDimensions) {
        const length = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2);
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
        ctx.font = '12px monospace';
        ctx.fillText(`${length.toFixed(1)}mm`, midX + 5, midY - 5);
      }
      
      if (isSelected) {
        const controlPoints = [
          worldToScreen(el.x1, el.y1),
          worldToScreen(el.x2, el.y2),
          worldToScreen((el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2)
        ];
        
        controlPoints.forEach(pt => {
          ctx.fillStyle = '#00aaff';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    } else if (el.type === 'rectangle') {
      const topLeft = worldToScreen(el.x, el.y);
      const width = el.width * viewport.zoom;
      const height = el.height * viewport.zoom;
      
      const edges = {
        top: [topLeft.x, topLeft.y, topLeft.x + width, topLeft.y],
        right: [topLeft.x + width, topLeft.y, topLeft.x + width, topLeft.y + height],
        bottom: [topLeft.x + width, topLeft.y + height, topLeft.x, topLeft.y + height],
        left: [topLeft.x, topLeft.y + height, topLeft.x, topLeft.y]
      };
      
      Object.keys(edges).forEach(edgeName => {
        const [x1, y1, x2, y2] = edges[edgeName];
        
        const isEdgeSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === edgeName;
        
        if (isFlashing) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
        } else {
          ctx.strokeStyle = isEdgeSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || (darkMode ? '#ffffff' : '#000000')));
          ctx.lineWidth = isEdgeSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
        }
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      
      if (!selectedEdge || selectedEdge.elementId !== el.id) {
        ctx.fillStyle = el.fill || 'transparent';
        ctx.beginPath();
        ctx.rect(topLeft.x, topLeft.y, width, height);
        ctx.fill();
      }

      if (isSelected || el === currentElement || showDimensions) {
        ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
        ctx.font = '12px monospace';
        ctx.fillText(`${Math.abs(el.width).toFixed(1)}mm`, topLeft.x + width / 2 - 20, topLeft.y - 5);
        ctx.fillText(`${Math.abs(el.height).toFixed(1)}mm`, topLeft.x + width + 5, topLeft.y + height / 2);
      }
      
      if (isSelected) {
        const controlPoints = [
          worldToScreen(el.x, el.y),
          worldToScreen(el.x + el.width, el.y),
          worldToScreen(el.x, el.y + el.height),
          worldToScreen(el.x + el.width, el.y + el.height),
          worldToScreen(el.x + el.width / 2, el.y + el.height / 2),
          worldToScreen(el.x + el.width / 2, el.y),
          worldToScreen(el.x + el.width, el.y + el.height / 2),
          worldToScreen(el.x + el.width / 2, el.y + el.height),
          worldToScreen(el.x, el.y + el.height / 2)
        ];
        
        controlPoints.forEach((pt, idx) => {
          ctx.fillStyle = idx === 4 ? '#ff6600' : '#00aaff';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    } else if (el.type === 'circle') {
      const center = worldToScreen(el.cx, el.cy);
      const radiusX = (el.radiusX || el.radius) * viewport.zoom;
      const radiusY = (el.radiusY || el.radius) * viewport.zoom;
      
      const isQuarterSelected = selectedEdge && selectedEdge.elementId === el.id && 
                                 ['top', 'right', 'bottom', 'left'].includes(selectedEdge.edge);
      
      if (isQuarterSelected) {
        const quarters = {
          right: { start: 0, end: Math.PI / 2 },
          bottom: { start: Math.PI / 2, end: Math.PI },
          left: { start: Math.PI, end: Math.PI * 1.5 },
          top: { start: Math.PI * 1.5, end: Math.PI * 2 }
        };
        
        Object.keys(quarters).forEach(quarterName => {
          const quarter = quarters[quarterName];
          const isThisQuarterSelected = selectedEdge.edge === quarterName;
          
          if (isFlashing) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
          } else {
            ctx.strokeStyle = isThisQuarterSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || (darkMode ? '#ffffff' : '#000000')));
            ctx.lineWidth = isThisQuarterSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
          }
          
          ctx.beginPath();
          ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, quarter.start, quarter.end);
          ctx.stroke();
        });
      } else {
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (isSelected || el === currentElement || showDimensions) {
        ctx.fillStyle = darkMode ? '#ffffff' : '#000000';
        ctx.font = '12px monospace';
        if (el.radiusX && el.radiusY && Math.abs(el.radiusX - el.radiusY) > 0.1) {
          ctx.fillText(`${(el.radiusX * 2).toFixed(1)}x${(el.radiusY * 2).toFixed(1)}mm`, center.x + radiusX + 5, center.y);
        } else {
          const r = el.radius || el.radiusX;
          ctx.fillText(`D${(r * 2).toFixed(1)}mm`, center.x + radiusX + 5, center.y);
        }
      }
      
      if (isSelected) {
        const controlPoints = [
          worldToScreen(el.cx, el.cy),
          worldToScreen(el.cx + (el.radiusX || el.radius), el.cy),
          worldToScreen(el.cx - (el.radiusX || el.radius), el.cy),
          worldToScreen(el.cx, el.cy + (el.radiusY || el.radius)),
          worldToScreen(el.cx, el.cy - (el.radiusY || el.radius))
        ];
        
        controlPoints.forEach((pt, idx) => {
          ctx.fillStyle = idx === 0 ? '#ff6600' : '#00aaff';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    }

    ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Couleurs selon le mode
    ctx.fillStyle = darkMode ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    drawGrid(ctx);

    if (showRulers) {
      drawGuides(ctx);
    }

    elements.forEach(el => {
      const isSelected = selectedIds.includes(el.id);
      drawElement(ctx, el, isSelected);
    });

    if (currentElement) {
      drawElement(ctx, currentElement, false);
    }

    if (drawOrigin) {
      drawOriginCross(ctx, drawOrigin.x, drawOrigin.y);
    }

    if (selectionBox) {
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      ctx.setLineDash([]);
    }

    if (snapPoint) {
      const screen = worldToScreen(snapPoint.x, snapPoint.y);
      
      const isSpecialPoint = snapPoint.type === 'endpoint' || 
                             snapPoint.type === 'center' || 
                             snapPoint.type === 'midpoint';
      
      const isFromSelectedElement = snapPoint.elementId && selectedIds.includes(snapPoint.elementId);
      
      // Magenta si snap sur guide, sinon rouge/vert comme avant
      let color = '#00ff00';
      if (snapPoint.type === 'guide' || snapPoint.isGuide) {
        color = '#ff00ff'; // Magenta pour les guides
      } else if (isSpecialPoint && !isFromSelectedElement) {
        color = '#ff0000';
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (showRulers) {
      drawRulers(ctx);
    }

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    draw();
  }, [elements, viewport, selectedIds, currentElement, snapPoint, selectionBox, drawOrigin, selectedEdge, showDimensions, darkMode, showRulers, guides, flashingIds]);

  useEffect(() => {
    const redraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      draw();
    };
    
    redraw();
    const timer1 = setTimeout(redraw, 100);
    const timer2 = setTimeout(redraw, 300);
    const timer3 = setTimeout(redraw, 500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const pointToLineDistance = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const point = screenToWorld(e.clientX, e.clientY);
    
    // Fermer le menu contextuel
    setContextMenu(null);
    
    // Clic droit pour menu contextuel
    if (e.button === 2) {
      e.preventDefault();
      if (selectedIds.length > 0) {
        setContextMenu({ x: e.clientX, y: e.clientY });
      }
      return;
    }
    
    // Vérifier si on clique sur un guide existant pour le déplacer
    if (showRulers) {
      const GUIDE_CLICK_DISTANCE = 5;
      for (const guide of guides) {
        if (guide.type === 'horizontal') {
          const screenY = worldToScreen(0, guide.position).y;
          if (Math.abs(canvasY - screenY) < GUIDE_CLICK_DISTANCE) {
            setIsDraggingGuide(guide.id);
            return;
          }
        } else {
          const screenX = worldToScreen(guide.position, 0).x;
          if (Math.abs(canvasX - screenX) < GUIDE_CLICK_DISTANCE) {
            setIsDraggingGuide(guide.id);
            return;
          }
        }
      }
      
      // Vérifier si on clique sur les règles pour créer un nouveau guide
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
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
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
          const dist = Math.sqrt((snapped.x - el.cx) ** 2 + (snapped.y - el.cy) ** 2);
          return dist <= el.radius;
        } else if (el.type === 'arc') {
          const dx = snapped.x - el.cx;
          const dy = snapped.y - el.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const radiusTolerance = 15 / viewport.zoom;
          if (Math.abs(dist - el.radius) > radiusTolerance) {
            return false;
          }
          
          const clickAngle = Math.atan2(dy, dx);
          
          const isAngleBetween = (angle, start, end) => {
            const normalizeAngle = (a) => {
              while (a > Math.PI) a -= 2 * Math.PI;
              while (a < -Math.PI) a += 2 * Math.PI;
              return a;
            };
            
            const normAngle = normalizeAngle(angle);
            const normStart = normalizeAngle(start);
            const normEnd = normalizeAngle(end);
            
            let span = normEnd - normStart;
            if (span < 0) span += 2 * Math.PI;
            
            let offset = normAngle - normStart;
            if (offset < 0) offset += 2 * Math.PI;
            
            return offset <= span;
          };
          
          return isAngleBetween(clickAngle, el.startAngle, el.endAngle);
        }
        return false;
      });

      if (clicked) {
        if (e.shiftKey) {
          setSelectedIds(prev => 
            prev.includes(clicked.id) 
              ? prev.filter(id => id !== clicked.id)
              : [...prev, clicked.id]
          );
        } else if (!selectedIds.includes(clicked.id)) {
          // Vérifier si l'élément fait partie d'un groupe
          if (!selectGroup(clicked.id)) {
            setSelectedIds([clicked.id]);
          }
        }
        setDragStart({ x: snapped.x, y: snapped.y });
        setIsDraggingElements(true);
      } else {
        if (!e.shiftKey) {
          setSelectedIds([]);
        }
        setDragStart({ x: canvasX, y: canvasY });
        setSelectionBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
      }
      return;
    }

    if (tool === 'edit') {
      const LINE_CLICK_DISTANCE = 5 / viewport.zoom;
      
      for (const el of elements.filter(e => selectedIds.includes(e.id) && e.type === 'line')) {
        const dist = pointToLineDistance(snapped, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
        if (dist < LINE_CLICK_DISTANCE) {
          if (!(selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'line')) {
            setSelectedEdge({ elementId: el.id, edge: 'line' });
          }
          return;
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
            if (!(selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === edge.name)) {
              setSelectedEdge({ elementId: el.id, edge: edge.name });
            }
            return;
          }
        }
      }
      
      const ARC_CLICK_DISTANCE = 5 / viewport.zoom;
      
      for (const el of elements.filter(e => selectedIds.includes(e.id) && e.type === 'circle')) {
        const radius = el.radius || el.radiusX;
        
        const dx = snapped.x - el.cx;
        const dy = snapped.y - el.cy;
        const clickAngle = Math.atan2(dy, dx);
        
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        const distToCircle = Math.abs(distToCenter - radius);
        
        if (distToCircle < ARC_CLICK_DISTANCE) {
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
          
          if (!(selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === quarter)) {
            setSelectedEdge({ elementId: el.id, edge: quarter });
          }
          return;
        }
      }
      
      for (const el of elements.filter(e => selectedIds.includes(e.id) && e.type === 'arc')) {
        const dx = snapped.x - el.cx;
        const dy = snapped.y - el.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clickAngle = Math.atan2(dy, dx);
        
        let normalizedClickAngle = clickAngle < 0 ? clickAngle + Math.PI * 2 : clickAngle;
        let normalizedStart = el.startAngle;
        let normalizedEnd = el.endAngle;
        
        if (normalizedStart > normalizedEnd) {
          normalizedEnd += Math.PI * 2;
        }
        
        if (normalizedClickAngle < normalizedStart) {
          normalizedClickAngle += Math.PI * 2;
        }
        
        const isInAngleRange = normalizedClickAngle >= normalizedStart && normalizedClickAngle <= normalizedEnd;
        
        if (Math.abs(dist - el.radius) < ARC_CLICK_DISTANCE && isInAngleRange) {
          if (!(selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'arc')) {
            setSelectedEdge({ elementId: el.id, edge: 'arc' });
          }
          return;
        }
      }
      
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
          controlPoints = [
            { x: el.cx + el.radius, y: el.cy, label: 'right' },
            { x: el.cx - el.radius, y: el.cy, label: 'left' },
            { x: el.cx, y: el.cy + el.radius, label: 'bottom' },
            { x: el.cx, y: el.cy - el.radius, label: 'top' }
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
          const dist = Math.sqrt((snapped.x - el.cx) ** 2 + (snapped.y - el.cy) ** 2);
          return dist <= el.radius;
        } else if (el.type === 'arc') {
          const dx = snapped.x - el.cx;
          const dy = snapped.y - el.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const radiusTolerance = 15 / viewport.zoom;
          if (Math.abs(dist - el.radius) > radiusTolerance) {
            return false;
          }
          
          const clickAngle = Math.atan2(dy, dx);
          
          const isAngleBetween = (angle, start, end) => {
            const normalizeAngle = (a) => {
              while (a > Math.PI) a -= 2 * Math.PI;
              while (a < -Math.PI) a += 2 * Math.PI;
              return a;
            };
            
            const normAngle = normalizeAngle(angle);
            const normStart = normalizeAngle(start);
            const normEnd = normalizeAngle(end);
            
            let span = normEnd - normStart;
            if (span < 0) span += 2 * Math.PI;
            
            let offset = normAngle - normStart;
            if (offset < 0) offset += 2 * Math.PI;
            
            return offset <= span;
          };
          
          return isAngleBetween(clickAngle, el.startAngle, el.endAngle);
        }
        return false;
      });

      if (clicked) {
        if (e.shiftKey) {
          setSelectedIds(prev => 
            prev.includes(clicked.id) 
              ? prev.filter(id => id !== clicked.id)
              : [...prev, clicked.id]
          );
        } else if (!selectedIds.includes(clicked.id)) {
          setSelectedIds([clicked.id]);
        }
      } else {
        if (!e.shiftKey) {
          setSelectedIds([]);
          setSelectedEdge(null);
        }
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint(snapped);
    setDrawOrigin(snapped);
    setCurrentElement({
      id: nextIdRef.current++,
      type: tool,
      ...snapped
    });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const point = screenToWorld(e.clientX, e.clientY);
    
    // Déplacement d'un guide
    if (isDraggingGuide) {
      setGuides(prev => prev.map(guide => {
        if (guide.id === isDraggingGuide) {
          if (guide.type === 'horizontal') {
            const snappedY = findGuideSnapPosition('horizontal', point.y);
            // Mettre à jour le snapPoint pour l'affichage
            setSnapPoint({ x: point.x, y: snappedY, type: 'guide', priority: 100, isGuide: true });
            return { ...guide, position: snappedY };
          } else {
            const snappedX = findGuideSnapPosition('vertical', point.x);
            // Mettre à jour le snapPoint pour l'affichage
            setSnapPoint({ x: snappedX, y: point.y, type: 'guide', priority: 100, isGuide: true });
            return { ...guide, position: snappedX };
          }
        }
        return guide;
      }));
      return;
    }
    
    if (isPanning) {
      setViewport(prev => ({
        ...prev,
        x: prev.x + (e.clientX - dragStart.x),
        y: prev.y + (e.clientY - dragStart.y)
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
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
        const newRadius = Math.sqrt((snapped.x - el.cx) ** 2 + (snapped.y - el.cy) ** 2);
        setElements(prev => prev.map(item =>
          item.id === el.id ? { ...item, radius: newRadius } : item
        ));
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
      
      // Utiliser le multi-point snap
      const { dx, dy } = applyMultiPointSnap(elements, selectedIds, rawDx, rawDy);
      
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
  };

  const handleMouseUp = () => {
    if (isDraggingGuide) {
      // Si on relâche le guide sur la règle, on le supprime
      if (showRulers) {
        const guide = guides.find(g => g.id === isDraggingGuide);
        if (guide) {
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          
          if (guide.type === 'horizontal') {
            const screenY = worldToScreen(0, guide.position).y;
            if (screenY < RULER_SIZE) {
              setGuides(prev => prev.filter(g => g.id !== isDraggingGuide));
            }
          } else {
            const screenX = worldToScreen(guide.position, 0).x;
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
      setIsPanning(false);
      setDragStart(null);
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
          corners.push(worldToScreen(el.x1, el.y1), worldToScreen(el.x2, el.y2));
        } else if (el.type === 'rectangle') {
          corners.push(
            worldToScreen(el.x, el.y),
            worldToScreen(el.x + el.width, el.y + el.height)
          );
        } else if (el.type === 'circle') {
          corners.push(worldToScreen(el.cx, el.cy));
        } else if (el.type === 'arc') {
          corners.push(worldToScreen(el.cx, el.cy));
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
  };

  const handleWheel = (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setViewport(prev => ({
        ...prev,
        zoom: Math.max(0.1, Math.min(10, prev.zoom * zoomFactor))
      }));
    }
  };

  const getCursor = () => {
    if (isPanning || spacePressed) return 'grab';
    if (tool === 'select') return 'default';
    if (tool === 'edit') return 'pointer';
    return 'crosshair';
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
        return;
      }
      
      // Raccourcis pour changer d'outil
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (e.key === 's' || e.key === 'S') {
          setTool('select');
          setSelectedEdge(null);
          return;
        }
        if (e.key === 'e' || e.key === 'E') {
          setTool('edit');
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          setTool('line');
          setSelectedEdge(null);
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          setTool('rectangle');
          setSelectedEdge(null);
          return;
        }
        if (e.key === 'c' || e.key === 'C') {
          setTool('circle');
          setSelectedEdge(null);
          return;
        }
      }
      
      // Déplacement avec les flèches
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
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        
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
                  id: nextIdRef.current++,
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
            const newElements = elements.filter(e => e.id !== el.id);
            updateElements(newElements);
            setSelectedIds([]);
            setSelectedEdge(null);
            return;
          }
          
          if (el && el.type === 'arc' && selectedEdge.edge === 'arc') {
            const newElements = elements.filter(e => e.id !== el.id);
            updateElements(newElements);
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
                  id: nextIdRef.current++,
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
          const newElements = elements.filter(el => !selectedIds.includes(el.id));
          updateElements(newElements);
          setSelectedIds([]);
        }
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex > 0) {
          setHistoryIndex(prev => prev - 1);
          setElements(history[historyIndex - 1]);
          setSelectedIds([]);
        }
        return;
      }
      
      // Grouper (Ctrl+G)
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length >= 2) {
          createGroup();
        }
        return;
      }
      
      // Dégrouper (Ctrl+Shift+G)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        ungroupSelected();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length > 0) {
          const selectedElements = elements.filter(el => selectedIds.includes(el.id));
          setClipboard(selectedElements);
          setPasteCount(0);
        }
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length > 0) {
          const selectedElements = elements.filter(el => selectedIds.includes(el.id));
          setClipboard(selectedElements);
          setPasteCount(0);
          const newElements = elements.filter(el => !selectedIds.includes(el.id));
          updateElements(newElements);
          setSelectedIds([]);
        }
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        
        if (clipboard.length > 0) {
          const offset = e.shiftKey ? 0 : (pasteCount + 1) * 10;
          
          const newElements = clipboard.map(el => {
            const newEl = { ...el, id: nextIdRef.current++ };
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
          
          if (!e.shiftKey) {
            setPasteCount(prev => prev + 1);
          }
        }
        return;
      }
    };

    const handleKeyUp = (e) => {
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
  }, [selectedIds, elements, clipboard, pasteCount, history, historyIndex, tool, selectedEdge]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-14 bg-gray-800 flex flex-col items-center py-4 gap-2">
        <button 
          onClick={() => {
            setTool('select');
            setSelectedEdge(null);
          }}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'select' ? 'bg-gray-700' : ''} relative`}
          title="Sélection/Déplacement (S)"
        >
          <MousePointer size={20} />
          <span className="absolute bottom-0 right-0 text-[10px] font-bold text-gray-400">S</span>
        </button>
        <button 
          onClick={() => setTool('edit')}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'edit' ? 'bg-gray-700' : ''} relative`}
          title="Édition (E)"
        >
          <Edit3 size={20} />
          <span className="absolute bottom-0 right-0 text-[10px] font-bold text-gray-400">E</span>
        </button>
        <button 
          onClick={() => {
            setTool('line');
            setSelectedEdge(null);
          }}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'line' ? 'bg-gray-700' : ''} relative`}
          title="Ligne (L)"
        >
          <Minus size={20} />
          <span className="absolute bottom-0 right-0 text-[10px] font-bold text-gray-400">L</span>
        </button>
        <button 
          onClick={() => {
            setTool('rectangle');
            setSelectedEdge(null);
          }}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'rectangle' ? 'bg-gray-700' : ''} relative`}
          title="Rectangle (R)"
        >
          <Square size={20} />
          <span className="absolute bottom-0 right-0 text-[10px] font-bold text-gray-400">R</span>
        </button>
        <button 
          onClick={() => {
            setTool('circle');
            setSelectedEdge(null);
          }}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'circle' ? 'bg-gray-700' : ''} relative`}
          title="Cercle (C)"
        >
          <Circle size={20} />
          <span className="absolute bottom-0 right-0 text-[10px] font-bold text-gray-400">C</span>
        </button>
      </div>

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          style={{ cursor: getCursor() }}
        />
        
        {contextMenu && (
          <div 
            className="absolute bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {selectedIds.length >= 2 && !groups.some(g => 
              selectedIds.length === g.elementIds.length && 
              selectedIds.every(id => g.elementIds.includes(id))
            ) && (
              <button
                onClick={() => {
                  createGroup();
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 whitespace-nowrap"
              >
                Grouper <span className="text-gray-400 ml-2">Ctrl+G</span>
              </button>
            )}
            {groups.some(g => selectedIds.some(id => g.elementIds.includes(id))) && (
              <button
                onClick={() => {
                  ungroupSelected();
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 whitespace-nowrap"
              >
                Dégrouper <span className="text-gray-400 ml-2">Ctrl+Shift+G</span>
              </button>
            )}
          </div>
        )}
        
        <div className="absolute top-4 left-4 bg-gray-800 rounded px-4 py-2 flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input 
                type="checkbox" 
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
              />
              Grille
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input 
                type="checkbox" 
                checked={snapToElements}
                onChange={(e) => setSnapToElements(e.target.checked)}
              />
              Elements
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input 
                type="checkbox" 
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
              />
              Tailles
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input 
                type="checkbox" 
                checked={showRulers}
                onChange={(e) => setShowRulers(e.target.checked)}
              />
              Règles
            </label>
          </div>
          <div className="text-sm">
            Zoom: {((viewport.zoom / 3.779527559055118) * 100).toFixed(0)}%
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            title={darkMode ? "Mode clair" : "Mode foncé"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        {feedbackMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
            {feedbackMessage}
          </div>
        )}
      </div>

      <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Proprietes</h3>
        
        {selectedIds.length > 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Selection</label>
              <p className="text-sm">{selectedIds.length} element(s)</p>
            </div>
            
            {selectedIds.length === 1 && (() => {
              const el = elements.find(e => e.id === selectedIds[0]);
              if (!el) return null;
              
              return (
                <div className="space-y-3">
                  {el.type === 'line' && (
                    <div>
                      <label className="text-sm text-gray-400">Longueur</label>
                      <p className="text-sm font-mono">
                        {Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2).toFixed(2)} mm
                      </p>
                    </div>
                  )}
                  
                  {el.type === 'rectangle' && (
                    <>
                      <div>
                        <label className="text-sm text-gray-400">Largeur</label>
                        <input 
                          type="number"
                          value={Math.abs(el.width).toFixed(2)}
                          onChange={(e) => {
                            const newWidth = parseFloat(e.target.value) || 0;
                            setElements(prev => prev.map(item => 
                              item.id === el.id ? { ...item, width: newWidth } : item
                            ));
                          }}
                          className="w-full bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Hauteur</label>
                        <input 
                          type="number"
                          value={Math.abs(el.height).toFixed(2)}
                          onChange={(e) => {
                            const newHeight = parseFloat(e.target.value) || 0;
                            setElements(prev => prev.map(item => 
                              item.id === el.id ? { ...item, height: newHeight } : item
                            ));
                          }}
                          className="w-full bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                        />
                      </div>
                    </>
                  )}
                  
                  {el.type === 'arc' && (
                    <>
                      <div>
                        <label className="text-sm text-gray-400">Rayon</label>
                        <input 
                          type="number"
                          value={el.radius.toFixed(2)}
                          onChange={(e) => {
                            const newRadius = parseFloat(e.target.value) || 0;
                            setElements(prev => prev.map(item => 
                              item.id === el.id ? { ...item, radius: newRadius } : item
                            ));
                          }}
                          className="w-full bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Longueur d'arc</label>
                        <p className="text-sm font-mono">
                          {(Math.abs(el.endAngle - el.startAngle) * el.radius).toFixed(2)} mm
                        </p>
                      </div>
                    </>
                  )}
                  
                  {el.type === 'circle' && (
                    <div>
                      <label className="text-sm text-gray-400">Diametre</label>
                      <input 
                        type="number"
                        value={(el.radius * 2).toFixed(2)}
                        onChange={(e) => {
                          const newRadius = (parseFloat(e.target.value) || 0) / 2;
                          setElements(prev => prev.map(item => 
                            item.id === el.id ? { ...item, radius: newRadius } : item
                          ));
                        }}
                        className="w-full bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
        
        {selectedIds.length === 0 && (
          <p className="text-sm text-gray-500">Aucun element selectionne</p>
        )}
      </div>
    </div>
  );
};

export default CADEditor;