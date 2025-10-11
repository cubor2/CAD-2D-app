import React, { useRef, useEffect, useState } from 'react';
import { Circle, Square, Minus, Type, MousePointer, Edit3 } from 'lucide-react';

// Variable globale pour stocker selectedEdge (contourner les problèmes de closure React)
let globalSelectedEdge = null;

const CADEditor = () => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('select');
  const [editingPoint, setEditingPoint] = useState(null); // {elementId, pointType, originalElement}
  const [selectedEdge, setSelectedEdge] = useState(null); // {elementId, edge: 'top'|'right'|'bottom'|'left'}
  const selectedEdgeRef = useRef(null); // Ref pour garder selectedEdge synchronisé
  const [showDimensions, setShowDimensions] = useState(false);
  
  // Synchroniser la ref avec le state
  useEffect(() => {
    console.log('selectedEdge changed:', selectedEdge); // Debug
    selectedEdgeRef.current = selectedEdge;
  }, [selectedEdge]);
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewport, setViewport] = useState({ 
    x: 0, 
    y: 0, 
    zoom: 3.779527559055118 // 96 DPI: 1mm = 3.78 pixels (96 / 25.4mm)
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

  const GRID_SIZE = 1; // 1mm
  const MAJOR_GRID = 10; // traits épais tous les 10mm

  // Sauvegarder dans l'historique
  const saveToHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Mettre à jour les éléments avec historique
  const updateElements = (newElements) => {
    setElements(newElements);
    saveToHistory(newElements);
  };

  // Convertir coordonnées écran vers monde
  const screenToWorld = (screenX, screenY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - rect.width / 2 - viewport.x) / viewport.zoom;
    const y = (screenY - rect.top - rect.height / 2 - viewport.y) / viewport.zoom;
    return { x, y };
  };

  // Convertir coordonnées monde vers écran
  const worldToScreen = (worldX, worldY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = worldX * viewport.zoom + rect.width / 2 + viewport.x;
    const y = worldY * viewport.zoom + rect.height / 2 + viewport.y;
    return { x, y };
  };

  // Snap à la grille
  const snapToGridFn = (point) => {
    return {
      x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(point.y / GRID_SIZE) * GRID_SIZE
    };
  };

  // Trouver les points de snap sur les éléments
  const findSnapPoints = (point, excludeIds = [], includeSelectedControlPoints = false) => {
    const snapPoints = [];
    const SNAP_DISTANCE = 8 / viewport.zoom; // Augmenté pour les points spécifiques
    const EDGE_SNAP_DISTANCE = 10 / viewport.zoom; // Distance plus grande pour les edges

    elements.forEach(el => {
      if (excludeIds.includes(el.id)) return;
      
      if (el.type === 'line') {
        // Points clés de la ligne (TOUJOURS inclus avec haute priorité)
        snapPoints.push(
          { x: el.x1, y: el.y1, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x2, y: el.y2, type: 'endpoint', priority: 20, elementId: el.id },
          { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2, type: 'midpoint', priority: 15, elementId: el.id }
        );
        
        // Snap sur la ligne elle-même (priorité plus faible)
        const lineSnap = pointToLineSegment(point, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
        if (lineSnap.distance < EDGE_SNAP_DISTANCE) {
          snapPoints.push({ x: lineSnap.x, y: lineSnap.y, type: 'edge', priority: 3, distance: lineSnap.distance, elementId: el.id });
        }
      } else if (el.type === 'rectangle') {
        // Coins (TOUJOURS inclus avec très haute priorité)
        snapPoints.push(
          { x: el.x, y: el.y, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x + el.width, y: el.y, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x, y: el.y + el.height, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.x + el.width, y: el.y + el.height, type: 'endpoint', priority: 20, elementId: el.id }
        );
        
        // Centre et milieux des côtés (TOUJOURS inclus avec haute priorité)
        snapPoints.push(
          { x: el.x + el.width / 2, y: el.y + el.height / 2, type: 'center', priority: 18, elementId: el.id },
          { x: el.x + el.width / 2, y: el.y, type: 'midpoint', priority: 15, elementId: el.id },
          { x: el.x + el.width, y: el.y + el.height / 2, type: 'midpoint', priority: 15, elementId: el.id },
          { x: el.x + el.width / 2, y: el.y + el.height, type: 'midpoint', priority: 15, elementId: el.id },
          { x: el.x, y: el.y + el.height / 2, type: 'midpoint', priority: 15, elementId: el.id }
        );
        
        // Snap sur les bords du rectangle (priorité plus faible)
        const edges = [
          [{ x: el.x, y: el.y }, { x: el.x + el.width, y: el.y }], // haut
          [{ x: el.x + el.width, y: el.y }, { x: el.x + el.width, y: el.y + el.height }], // droite
          [{ x: el.x + el.width, y: el.y + el.height }, { x: el.x, y: el.y + el.height }], // bas
          [{ x: el.x, y: el.y + el.height }, { x: el.x, y: el.y }] // gauche
        ];
        
        edges.forEach(edge => {
          const edgeSnap = pointToLineSegment(point, edge[0], edge[1]);
          if (edgeSnap.distance < EDGE_SNAP_DISTANCE) {
            snapPoints.push({ x: edgeSnap.x, y: edgeSnap.y, type: 'edge', priority: 3, distance: edgeSnap.distance, elementId: el.id });
          }
        });
      } else if (el.type === 'circle') {
        // Tous les points du cercle (TOUJOURS inclus avec haute priorité)
        snapPoints.push(
          { x: el.cx, y: el.cy, type: 'center', priority: 18, elementId: el.id },
          { x: el.cx + el.radius, y: el.cy, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.cx - el.radius, y: el.cy, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.cx, y: el.cy + el.radius, type: 'endpoint', priority: 20, elementId: el.id },
          { x: el.cx, y: el.cy - el.radius, type: 'endpoint', priority: 20, elementId: el.id }
        );
      }
    });

    // Trouver le point de snap le plus proche avec priorité
    let closest = null;
    let minScore = Infinity;

    snapPoints.forEach(sp => {
      const dist = sp.distance !== undefined ? sp.distance : Math.sqrt((sp.x - point.x) ** 2 + (sp.y - point.y) ** 2);
      const maxDist = sp.type === 'edge' ? EDGE_SNAP_DISTANCE : SNAP_DISTANCE;
      
      if (dist < maxDist) {
        // Score basé sur la distance et la priorité (priorité plus haute = meilleur score)
        const score = dist / sp.priority;
        if (score < minScore) {
          minScore = score;
          closest = sp;
        }
      }
    });

    return closest;
  };

  // Appliquer le snap
  const applySnap = (point, excludeIds = [], includeSelectedControlPoints = false) => {
    let snapped = { ...point };
    let snap = null;

    if (snapToElements) {
      snap = findSnapPoints(point, excludeIds, includeSelectedControlPoints);
      if (snap) {
        snapped = { x: snap.x, y: snap.y };
      }
    }

    if (!snap && snapToGrid) {
      snapped = snapToGridFn(point);
    }

    setSnapPoint(snap);
    return snapped;
  };

  // Dessiner la grille
  const drawGrid = (ctx) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    const startX = Math.floor((-canvasWidth / 2 - viewport.x) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
    const endX = Math.ceil((canvasWidth / 2 - viewport.x) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor((-canvasHeight / 2 - viewport.y) / viewport.zoom / GRID_SIZE) * GRID_SIZE;
    const endY = Math.ceil((canvasHeight / 2 - viewport.y) / viewport.zoom / GRID_SIZE) * GRID_SIZE;

    // Ne dessiner la grille fine que si le zoom est suffisant
    if (viewport.zoom > 0.5) {
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1;

      // Grille fine (1mm) - seulement si zoom > 0.5
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

    // Grille moyenne (10mm) - toujours visible
    ctx.strokeStyle = viewport.zoom > 0.5 ? '#3a3a3a' : '#2a2a2a';
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

  // Dessiner une croix d'origine
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

  // Dessiner un élément
  const drawElement = (ctx, el, isSelected = false) => {
    ctx.save();

    if (isSelected) {
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = el.stroke || '#ffffff';
      ctx.lineWidth = el.strokeWidth || 1.5;
    }

    ctx.fillStyle = el.fill || 'transparent';

    if (el.type === 'line') {
      const start = worldToScreen(el.x1, el.y1);
      const end = worldToScreen(el.x2, el.y2);
      
      // Vérifier si cette ligne est sélectionnée pour suppression
      const isLineSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'line';
      
      ctx.strokeStyle = isLineSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || '#ffffff'));
      ctx.lineWidth = isLineSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Afficher dimensions pendant le dessin
      if (isSelected || el === currentElement || showDimensions) {
        const length = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2);
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(`${length.toFixed(1)}mm`, midX + 5, midY - 5);
      }
      
      // Afficher les points de contrôle si sélectionné
      if (isSelected) {
        const controlPoints = [
          worldToScreen(el.x1, el.y1), // début
          worldToScreen(el.x2, el.y2), // fin
          worldToScreen((el.x1 + el.x2) / 2, (el.y1 + el.y2) / 2) // milieu
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
      
      // Dessiner les côtés individuellement pour pouvoir en mettre un en surbrillance
      const edges = {
        top: [topLeft.x, topLeft.y, topLeft.x + width, topLeft.y],
        right: [topLeft.x + width, topLeft.y, topLeft.x + width, topLeft.y + height],
        bottom: [topLeft.x + width, topLeft.y + height, topLeft.x, topLeft.y + height],
        left: [topLeft.x, topLeft.y + height, topLeft.x, topLeft.y]
      };
      
      Object.keys(edges).forEach(edgeName => {
        const [x1, y1, x2, y2] = edges[edgeName];
        
        // Vérifier si ce côté est sélectionné
        const isEdgeSelected = selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === edgeName;
        
        ctx.strokeStyle = isEdgeSelected ? '#ffff00' : (isSelected ? '#00aaff' : (el.stroke || '#ffffff'));
        ctx.lineWidth = isEdgeSelected ? 3 : (isSelected ? 2 : (el.strokeWidth || 1.5));
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      
      // Fill (seulement si pas de côté sélectionné)
      if (!selectedEdge || selectedEdge.elementId !== el.id) {
        ctx.fillStyle = el.fill || 'transparent';
        ctx.beginPath();
        ctx.rect(topLeft.x, topLeft.y, width, height);
        ctx.fill();
      }

      // Afficher dimensions
      if (isSelected || el === currentElement || showDimensions) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText(`${Math.abs(el.width).toFixed(1)}mm`, topLeft.x + width / 2 - 20, topLeft.y - 5);
        ctx.fillText(`${Math.abs(el.height).toFixed(1)}mm`, topLeft.x + width + 5, topLeft.y + height / 2);
      }
      
      // Afficher les points de contrôle si sélectionné
      if (isSelected) {
        const controlPoints = [
          worldToScreen(el.x, el.y), // coin haut-gauche
          worldToScreen(el.x + el.width, el.y), // coin haut-droite
          worldToScreen(el.x, el.y + el.height), // coin bas-gauche
          worldToScreen(el.x + el.width, el.y + el.height), // coin bas-droite
          worldToScreen(el.x + el.width / 2, el.y + el.height / 2), // centre
          worldToScreen(el.x + el.width / 2, el.y), // milieu haut
          worldToScreen(el.x + el.width, el.y + el.height / 2), // milieu droite
          worldToScreen(el.x + el.width / 2, el.y + el.height), // milieu bas
          worldToScreen(el.x, el.y + el.height / 2) // milieu gauche
        ];
        
        controlPoints.forEach((pt, idx) => {
          ctx.fillStyle = idx === 4 ? '#ff6600' : '#00aaff'; // Centre en orange
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
      
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Afficher dimensions
      if (isSelected || el === currentElement || showDimensions) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        if (el.radiusX && el.radiusY && Math.abs(el.radiusX - el.radiusY) > 0.1) {
          // Ellipse
          ctx.fillText(`${(el.radiusX * 2).toFixed(1)}×${(el.radiusY * 2).toFixed(1)}mm`, center.x + radiusX + 5, center.y);
        } else {
          // Cercle
          const r = el.radius || el.radiusX;
          ctx.fillText(`⌀${(r * 2).toFixed(1)}mm`, center.x + radiusX + 5, center.y);
        }
      }
      
      // Afficher les points de contrôle si sélectionné
      if (isSelected) {
        const controlPoints = [
          worldToScreen(el.cx, el.cy), // centre
          worldToScreen(el.cx + (el.radiusX || el.radius), el.cy), // droite
          worldToScreen(el.cx - (el.radiusX || el.radius), el.cy), // gauche
          worldToScreen(el.cx, el.cy + (el.radiusY || el.radius)), // bas
          worldToScreen(el.cx, el.cy - (el.radiusY || el.radius)) // haut
        ];
        
        controlPoints.forEach((pt, idx) => {
          ctx.fillStyle = idx === 0 ? '#ff6600' : '#00aaff'; // Centre en orange
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

  // Dessiner tout
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    drawGrid(ctx);

    // Dessiner les éléments
    elements.forEach(el => {
      drawElement(ctx, el, selectedIds.includes(el.id));
    });

    // Dessiner l'élément en cours de création
    if (currentElement) {
      drawElement(ctx, currentElement, false);
    }

    // Dessiner la croix d'origine pendant le dessin
    if (drawOrigin) {
      drawOriginCross(ctx, drawOrigin.x, drawOrigin.y);
    }

    // Dessiner la boîte de sélection
    if (selectionBox) {
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      ctx.setLineDash([]);
    }

    // Dessiner le point de snap
    if (snapPoint) {
      const screen = worldToScreen(snapPoint.x, snapPoint.y);
      
      // Rouge si c'est un point spécial ET qu'il n'appartient pas à un élément sélectionné
      const isSpecialPoint = snapPoint.type === 'endpoint' || 
                             snapPoint.type === 'center' || 
                             snapPoint.type === 'midpoint';
      
      const isFromSelectedElement = snapPoint.elementId && selectedIds.includes(snapPoint.elementId);
      
      // Rouge uniquement si point spécial d'un AUTRE élément (pas celui qu'on déplace)
      ctx.strokeStyle = (isSpecialPoint && !isFromSelectedElement) ? '#ff0000' : '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    // Adapter la résolution du canvas pour les écrans haute densité
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    draw();
  }, [elements, viewport, selectedIds, currentElement, snapPoint, selectionBox, drawOrigin, selectedEdge, showDimensions]);

  // Forcer un redraw initial au montage pour éviter le flou
  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        draw();
      }
    }, 100);
    
    const timer2 = setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        draw();
      }
    }, 300);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const point = screenToWorld(e.clientX, e.clientY);
    const snapped = applySnap(point);

    if (e.button === 1 || (e.button === 0 && spacePressed)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === 'edit') {
      // Chercher si on clique sur une ligne sélectionnée
      const LINE_CLICK_DISTANCE = 5 / viewport.zoom;
      let lineFound = false;
      
      for (const el of elements.filter(e => selectedIds.includes(e.id) && e.type === 'line')) {
        const dist = pointToLineDistance(snapped, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
        if (dist < LINE_CLICK_DISTANCE) {
          // Clic sur une ligne
          if (selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === 'line') {
            // Deuxième clic sur la même ligne : on ne fait rien
            console.log('Second click on same line'); // Debug
          } else {
            // Premier clic sur cette ligne : on la sélectionne
            console.log('Selecting line:', el.id); // Debug
            setSelectedEdge({ elementId: el.id, edge: 'line' });
          }
          lineFound = true;
          break;
        }
      }
      
      if (lineFound) {
        return; // IMPORTANT : Sortir complètement de la fonction
      }
      
      // Chercher si on clique sur un côté d'un rectangle sélectionné
      const EDGE_CLICK_DISTANCE = 5 / viewport.zoom;
      let edgeFound = false;
      
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
            // Clic sur un côté
            if (selectedEdge && selectedEdge.elementId === el.id && selectedEdge.edge === edge.name) {
              // Deuxième clic sur le même côté : on ne fait rien
              console.log('Second click on same edge:', edge.name); // Debug
            } else {
              // Premier clic sur ce côté : on le sélectionne
              console.log('Selecting edge:', edge.name, 'for element ID:', el.id, 'element:', el); // Debug
              setSelectedEdge({ elementId: el.id, edge: edge.name });
            }
            edgeFound = true;
            break;
          }
        }
        if (edgeFound) break;
      }
      
      if (edgeFound) {
        return; // IMPORTANT : Sortir complètement de la fonction
      }
      
      // Chercher si on clique sur un point de contrôle d'un élément sélectionné
      const CLICK_DISTANCE = 8 / viewport.zoom;
      
      for (const el of elements.filter(e => selectedIds.includes(e.id))) {
        let controlPoints = [];
        
        if (el.type === 'line') {
          controlPoints = [
            { x: el.x1, y: el.y1, type: 'start', label: 'start' },
            { x: el.x2, y: el.y2, type: 'end', label: 'end' },
            { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2, type: 'midpoint', label: 'midpoint' }
          ];
        } else if (el.type === 'rectangle') {
          controlPoints = [
            { x: el.x, y: el.y, type: 'corner', label: 'topLeft' },
            { x: el.x + el.width, y: el.y, type: 'corner', label: 'topRight' },
            { x: el.x, y: el.y + el.height, type: 'corner', label: 'bottomLeft' },
            { x: el.x + el.width, y: el.y + el.height, type: 'corner', label: 'bottomRight' },
            { x: el.x + el.width / 2, y: el.y + el.height / 2, type: 'center', label: 'center' },
            { x: el.x + el.width / 2, y: el.y, type: 'edge', label: 'top' },
            { x: el.x + el.width, y: el.y + el.height / 2, type: 'edge', label: 'right' },
            { x: el.x + el.width / 2, y: el.y + el.height, type: 'edge', label: 'bottom' },
            { x: el.x, y: el.y + el.height / 2, type: 'edge', label: 'left' }
          ];
        } else if (el.type === 'circle') {
          controlPoints = [
            { x: el.cx, y: el.cy, type: 'center', label: 'center' },
            { x: el.cx + el.radius, y: el.cy, type: 'radius', label: 'right' },
            { x: el.cx - el.radius, y: el.cy, type: 'radius', label: 'left' },
            { x: el.cx, y: el.cy + el.radius, type: 'radius', label: 'bottom' },
            { x: el.cx, y: el.cy - el.radius, type: 'radius', label: 'top' }
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
            // Désélectionner le côté seulement si on commence vraiment à éditer (déplacer un point)
            // setSelectedEdge(null); // COMMENTÉ pour test
            return;
          }
        }
      }

      // Si on arrive ici sans avoir cliqué sur un edge/line/point
      if (!edgeFound && !lineFound) {
        console.log('Clicking elsewhere, clearing selectedEdge'); // Debug
        // setSelectedEdge(null); // COMMENTÉ pour test
      }
      
      // Si pas de point de contrôle cliqué, comportement normal de sélection
      console.log('No control point clicked'); // Debug
      // Ne pas réinitialiser selectedEdge ici car on vient peut-être de le définir
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
        // NE PAS réinitialiser selectedEdge ici
      } else {
        if (!e.shiftKey) {
          setSelectedIds([]);
          setSelectedEdge(null); // Réinitialiser SEULEMENT si on clique dans le vide
        }
      }
      return;
    }

    if (tool === 'select') {
      // Vérifier si on clique sur un élément
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
        setDragStart({ x: snapped.x, y: snapped.y });
        setIsDraggingElements(true);
      } else {
        if (!e.shiftKey) {
          setSelectedIds([]);
        }
        setDragStart({ x: canvasX, y: canvasY });
        setSelectionBox({ x: canvasX, y: canvasY, width: 0, height: 0 });
      }
    } else {
      setIsDrawing(true);
      setStartPoint(snapped);
      setDrawOrigin(snapped);
      setCurrentElement({
        id: Date.now(),
        type: tool,
        ...snapped
      });
    }
  };

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

  // Calculer l'intersection entre deux segments de ligne
  const lineIntersection = (p1, p2, p3, p4) => {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.0001) return null; // Lignes parallèles

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (u >= 0 && u <= 1) { // L'intersection est sur le segment p3-p4
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
        t: t
      };
    }

    return null;
  };

  // Trouver l'intersection la plus proche avec les edges lors du dessin avec Shift
  const findAngularSnapIntersection = (start, end, excludeIds = []) => {
    let closestIntersection = null;
    let minDistance = Infinity;

    elements.forEach(el => {
      if (excludeIds.includes(el.id)) return;

      let segments = [];

      if (el.type === 'line') {
        segments.push([{ x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }]);
      } else if (el.type === 'rectangle') {
        segments.push(
          [{ x: el.x, y: el.y }, { x: el.x + el.width, y: el.y }],
          [{ x: el.x + el.width, y: el.y }, { x: el.x + el.width, y: el.y + el.height }],
          [{ x: el.x + el.width, y: el.y + el.height }, { x: el.x, y: el.y + el.height }],
          [{ x: el.x, y: el.y + el.height }, { x: el.x, y: el.y }]
        );
      }

      segments.forEach(seg => {
        const intersection = lineIntersection(start, end, seg[0], seg[1]);
        if (intersection && intersection.t > 0) { // t > 0 pour que ce soit devant le point de départ
          const dist = Math.sqrt(
            (intersection.x - start.x) ** 2 + (intersection.y - start.y) ** 2
          );
          if (dist < minDistance) {
            minDistance = dist;
            closestIntersection = intersection;
          }
        }
      });
    });

    return closestIntersection;
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

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const point = screenToWorld(e.clientX, e.clientY);
    
    if (isPanning) {
      setViewport(prev => ({
        ...prev,
        x: prev.x + (e.clientX - dragStart.x),
        y: prev.y + (e.clientY - dragStart.y)
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Snap (ne pas exclure les éléments sélectionnés pour permettre le snap sur leurs points de contrôle)
    const snapped = applySnap(point, [], false);

    // Mode édition : modifier un point de contrôle
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
            newY = el.x2 + distance * Math.sin(snapAngle);
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
          
          if (e.shiftKey) {
            const ratio = orig.width / orig.height;
            const proposedRatio = Math.abs(newWidth / newHeight);
            
            if (proposedRatio > ratio) {
              // Largeur domine, ajuster hauteur
              const adjustedHeight = Math.abs(newWidth) / ratio * Math.sign(newHeight);
              setElements(prev => prev.map(item =>
                item.id === el.id ? { 
                  ...item, 
                  x: snapped.x,
                  y: orig.y + orig.height - adjustedHeight,
                  width: newWidth,
                  height: adjustedHeight
                } : item
              ));
            } else {
              // Hauteur domine, ajuster largeur
              const adjustedWidth = Math.abs(newHeight) * ratio * Math.sign(newWidth);
              setElements(prev => prev.map(item =>
                item.id === el.id ? { 
                  ...item, 
                  x: orig.x + orig.width - adjustedWidth,
                  y: snapped.y,
                  width: adjustedWidth,
                  height: newHeight
                } : item
              ));
            }
          } else {
            setElements(prev => prev.map(item =>
              item.id === el.id ? { 
                ...item, 
                x: snapped.x,
                y: snapped.y,
                width: newWidth,
                height: newHeight
              } : item
            ));
          }
        } else if (editingPoint.pointType === 'topRight') {
          const newWidth = snapped.x - orig.x;
          const newHeight = orig.y + orig.height - snapped.y;
          
          if (e.shiftKey) {
            const ratio = orig.width / orig.height;
            const proposedRatio = Math.abs(newWidth / newHeight);
            
            if (proposedRatio > ratio) {
              const adjustedHeight = Math.abs(newWidth) / ratio * Math.sign(newHeight);
              setElements(prev => prev.map(item =>
                item.id === el.id ? { 
                  ...item, 
                  y: orig.y + orig.height - adjustedHeight,
                  width: newWidth,
                  height: adjustedHeight
                } : item
              ));
            } else {
              const adjustedWidth = Math.abs(newHeight) * ratio * Math.sign(newWidth);
              setElements(prev => prev.map(item =>
                item.id === el.id ? { 
                  ...item, 
                  y: snapped.y,
                  width: adjustedWidth,
                  height: newHeight
                } : item
              ));
            }
          } else {
            setElements(prev => prev.map(item =>
              item.id === el.id ? { 
                ...item, 
                y: snapped.y,
                width: newWidth,
                height: newHeight
              } : item
            ));
          }
        } else if (editingPoint.pointType === 'bottomLeft') {
          const newWidth = orig.x + orig.width - snapped.x;
          const newHeight = snapped.y - orig.y;
          
          if (e.shiftKey) {
            const ratio = orig.width / orig.height;
            const proposedRatio = Math.abs(newWidth / newHeight);
            
            if (proposedRatio > ratio) {
              const adjustedHeight = Math.abs(newWidth) / ratio * Math.sign(newHeight);
              setElements(prev => prev.map(item =>
                item.id === el.id ? { 
                  ...item, 
                  x: snapped.x,
                  width: newWidth,
                  height: adjustedHeight
                } : item
              ));
            } else {
              const adjustedWidth = Math.abs(newHeight) * ratio * Math.sign(newWidth);
              setElements(prev => prev.map(item =>
                item.id === el.id ? { 
                  ...item, 
                  x: orig.x + orig.width - adjustedWidth,
                  width: adjustedWidth,
                  height: newHeight
                } : item
              ));
            }
          } else {
            setElements(prev => prev.map(item =>
              item.id === el.id ? { 
                ...item, 
                x: snapped.x,
                width: newWidth,
                height: newHeight
              } : item
            ));
          }
        } else if (editingPoint.pointType === 'bottomRight') {
          const newWidth = snapped.x - orig.x;
          const newHeight = snapped.y - orig.y;
          
          if (e.shiftKey) {
            const ratio = orig.width / orig.height;
            const proposedRatio = Math.abs(newWidth / newHeight);
            
            if (proposedRatio > ratio) {
              const adjustedHeight = Math.abs(newWidth) / ratio * Math.sign(newHeight);
              setElements(prev => prev.map(item =>
                item.id === el.id ? { ...item, width: newWidth, height: adjustedHeight } : item
              ));
            } else {
              const adjustedWidth = Math.abs(newHeight) * ratio * Math.sign(newWidth);
              setElements(prev => prev.map(item =>
                item.id === el.id ? { ...item, width: adjustedWidth, height: newHeight } : item
              ));
            }
          } else {
            setElements(prev => prev.map(item =>
              item.id === el.id ? { ...item, width: newWidth, height: newHeight } : item
            ));
          }
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
        } else if (editingPoint.pointType === 'center') {
          // Ne rien faire pour le centre - on ne peut pas le bouger
        }
      } else if (el.type === 'circle') {
        const orig = editingPoint.originalElement;
        
        if (editingPoint.pointType === 'center') {
          // Ne rien faire pour le centre - on ne peut pas le bouger
        } else {
          const newRadius = Math.sqrt(
            (snapped.x - el.cx) ** 2 + (snapped.y - el.cy) ** 2
          );
          setElements(prev => prev.map(item =>
            item.id === el.id ? { ...item, radius: newRadius } : item
          ));
        }
      }
      
      return;
    }

    if (tool === 'select' && dragStart && selectedIds.length > 0 && isDraggingElements) {
      const dx = snapped.x - dragStart.x;
      const dy = snapped.y - dragStart.y;
      setElements(prev => prev.map(el => {
        if (!selectedIds.includes(el.id)) return el;
        
        if (el.type === 'line') {
          return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
        } else if (el.type === 'rectangle') {
          return { ...el, x: el.x + dx, y: el.y + dy };
        } else if (el.type === 'circle') {
          return { ...el, cx: el.cx + dx, cy: el.cy + dy };
        }
        return el;
      }));
      setDragStart(snapped);
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
          // Snap angulaire : 0°, 45°, 90°, 135°, 180°, etc.
          const dx = endX - startPoint.x;
          const dy = endY - startPoint.y;
          const angle = Math.atan2(dy, dx);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Trouver l'angle le plus proche parmi 0°, 45°, 90°, 135°, 180°, etc.
          const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          
          const angularEndX = startPoint.x + distance * Math.cos(snapAngle);
          const angularEndY = startPoint.y + distance * Math.sin(snapAngle);
          
          // Créer un point très loin dans la direction angulaire pour détecter les intersections
          const farEndX = startPoint.x + 10000 * Math.cos(snapAngle);
          const farEndY = startPoint.y + 10000 * Math.sin(snapAngle);
          
          // Chercher une intersection avec les edges existants
          const intersection = findAngularSnapIntersection(
            startPoint,
            { x: farEndX, y: farEndY },
            []
          );
          
          if (intersection) {
            // Vérifier si l'intersection est proche de la position actuelle de la souris
            const distToIntersection = Math.sqrt(
              (intersection.x - angularEndX) ** 2 + (intersection.y - angularEndY) ** 2
            );
            
            // Si on est proche de l'intersection (dans un rayon de 20mm), snapper dessus
            if (distToIntersection < 20) {
              endX = intersection.x;
              endY = intersection.y;
            } else {
              endX = angularEndX;
              endY = angularEndY;
            }
          } else {
            endX = angularEndX;
            endY = angularEndY;
          }
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
          // Cercle parfait
          setCurrentElement({
            ...currentElement,
            cx: startPoint.x,
            cy: startPoint.y,
            radius: radius,
            radiusX: radius,
            radiusY: radius
          });
        } else {
          // Ellipse (ovale)
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

  const handleMouseUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      setDragStart(null);
      return;
    }
    
    if (editingPoint) {
      setEditingPoint(null);
      setDragStart(null);
      // NE PAS réinitialiser selectedEdge ici
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

  // Gestion du curseur
  const getCursor = () => {
    if (isPanning || spacePressed) return 'grab';
    if (tool === 'select') return 'default';
    if (tool === 'edit') return 'pointer';
    return 'crosshair';
  };

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey); // Debug
      
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
        return;
      }
      
      // Supprimer
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        
        console.log('Delete pressed, tool:', tool, 'selectedEdge:', selectedEdge); // Debug
        
        // Si un côté est sélectionné en mode édition, supprimer ce côté
        if (tool === 'edit' && selectedEdge) {
          console.log('Trying to delete edge:', selectedEdge.edge); // Debug
          const el = elements.find(e => e.id === selectedEdge.elementId);
          console.log('Found element:', el); // Debug
          
          if (el && el.type === 'rectangle') {
            console.log('Deleting edge from rectangle'); // Debug
            // Créer les 3 lignes restantes
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
                  id: Date.now() + Math.random(),
                  type: 'line',
                  ...edges[edge],
                  stroke: el.stroke || '#ffffff',
                  strokeWidth: el.strokeWidth || 1.5
                });
              }
            });
            
            console.log('Created lines:', newLines.length); // Debug
            
            // Remplacer le rectangle par les 3 lignes
            const newElements = elements.filter(e => e.id !== el.id).concat(newLines);
            updateElements(newElements);
            setSelectedIds(newLines.map(l => l.id));
            setSelectedEdge(null);
          }
          return;
        }
        
        console.log('Normal deletion, selectedIds:', selectedIds.length); // Debug
        
        // Suppression normale d'éléments (seulement si pas de côté sélectionné)
        if (selectedIds.length > 0) {
          const newElements = elements.filter(el => !selectedIds.includes(el.id));
          updateElements(newElements);
          setSelectedIds([]);
        }
        return;
      }
      
      // Annuler (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex > 0) {
          setHistoryIndex(prev => prev - 1);
          setElements(history[historyIndex - 1]);
          setSelectedIds([]);
        }
        return;
      }
      
      // Copier
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length > 0) {
          const selectedElements = elements.filter(el => selectedIds.includes(el.id));
          setClipboard(selectedElements);
          setPasteCount(0);
          console.log('Copied:', selectedElements.length, 'elements'); // Debug
        }
        return;
      }
      
      // Couper
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
      
      // Coller (vérifier avant les autres conditions)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        console.log('Paste triggered! Shift:', e.shiftKey, 'Clipboard:', clipboard.length); // Debug
        
        if (clipboard.length > 0) {
          const offset = e.shiftKey ? 0 : (pasteCount + 1) * 10;
          console.log('Using offset:', offset); // Debug
          
          const newElements = clipboard.map(el => {
            const newEl = { ...el, id: Date.now() + Math.random() };
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
            }
            return newEl;
          });
          
          const updatedElements = [...elements, ...newElements];
          updateElements(updatedElements);
          setSelectedIds(newElements.map(el => el.id));
          
          if (!e.shiftKey) {
            setPasteCount(prev => prev + 1);
          }
          
          console.log('Pasted successfully!'); // Debug
        } else {
          console.log('Clipboard is empty!'); // Debug
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
  }, [selectedIds, elements, clipboard, pasteCount, history, historyIndex, tool, selectedEdge]); // REMETTRE selectedEdge

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Barre d'outils gauche */}
      <div className="w-14 bg-gray-800 flex flex-col items-center py-4 gap-2">
        <button 
          onClick={() => setTool('select')}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'select' ? 'bg-gray-700' : ''}`}
          title="Sélection (V)"
        >
          <MousePointer size={20} />
        </button>
        <button 
          onClick={() => setTool('edit')}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'edit' ? 'bg-gray-700' : ''}`}
          title="Édition (A)"
        >
          <Edit3 size={20} />
        </button>
        <button 
          onClick={() => setTool('line')}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'line' ? 'bg-gray-700' : ''}`}
          title="Ligne (L)"
        >
          <Minus size={20} />
        </button>
        <button 
          onClick={() => setTool('rectangle')}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'rectangle' ? 'bg-gray-700' : ''}`}
          title="Rectangle (R)"
        >
          <Square size={20} />
        </button>
        <button 
          onClick={() => setTool('circle')}
          className={`p-2 rounded hover:bg-gray-700 ${tool === 'circle' ? 'bg-gray-700' : ''}`}
          title="Cercle (C)"
        >
          <Circle size={20} />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: getCursor() }}
        />
        
        {/* Barre du haut */}
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
              Éléments
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input 
                type="checkbox" 
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
              />
              Voir les tailles
            </label>
          </div>
          <div className="text-sm">
            Zoom: {((viewport.zoom / 3.779527559055118) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Panneau de propriétés droit */}
      <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Propriétés</h3>
        
        {selectedIds.length > 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Sélection</label>
              <p className="text-sm">{selectedIds.length} élément(s)</p>
            </div>
            
            {selectedIds.length === 1 && (() => {
              const el = elements.find(e => e.id === selectedIds[0]);
              if (!el) return null;
              
              return (
                <div className="space-y-3">
                  {el.type === 'line' && (
                    <>
                      <div>
                        <label className="text-sm text-gray-400">Longueur</label>
                        <p className="text-sm font-mono">
                          {Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2).toFixed(2)} mm
                        </p>
                      </div>
                    </>
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
                  
                  {el.type === 'circle' && (
                    <div>
                      <label className="text-sm text-gray-400">Diamètre</label>
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
          <p className="text-sm text-gray-500">Aucun élément sélectionné</p>
        )}
      </div>
    </div>
  );
};

export default CADEditor;