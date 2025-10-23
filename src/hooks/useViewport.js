import { useState } from 'react';

export const useViewport = () => {
  const [viewport, setViewport] = useState({ 
    x: 0, 
    y: 0, 
    zoom: 3.779527559055118
  });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const handlePan = (clientX, clientY) => {
    if (!isPanning || !dragStart) return;
    
    setViewport(prev => ({
      ...prev,
      x: prev.x + (clientX - dragStart.x),
      y: prev.y + (clientY - dragStart.y)
    }));
    setDragStart({ x: clientX, y: clientY });
  };

  const handleZoom = (zoomFactor) => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(15.12, prev.zoom * zoomFactor))
    }));
  };

  const startPan = (clientX, clientY) => {
    setIsPanning(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const endPan = () => {
    setIsPanning(false);
    setDragStart(null);
  };

  return {
    viewport,
    isPanning,
    handlePan,
    handleZoom,
    startPan,
    endPan
  };
};


