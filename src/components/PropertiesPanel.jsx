import React, { useState, useEffect } from 'react';
import { Bold, Italic, RotateCw, FlipHorizontal, FlipVertical, Lock, Unlock } from 'lucide-react';
import packageJson from '../../package.json';

const WorkAreaSection = ({ workArea, onWorkAreaChange, workAreaWidthInput, setWorkAreaWidthInput, workAreaHeightInput, setWorkAreaHeightInput }) => (
    <div className="pb-3">
      <h4 className="text-sm font-bold pt-3 mb-3 uppercase tracking-extra-wide text-center px-4">Zone de travail</h4>
      <div className="space-y-2 px-4">
        <div>
          <label className="text-xs text-drawhard-hover block mb-1 text-left">Largeur (mm)</label>
          <input 
            type="number"
            value={workAreaWidthInput}
            onChange={(e) => setWorkAreaWidthInput(e.target.value)}
            onBlur={() => {
              const newWidth = parseInt(workAreaWidthInput) || 1;
              onWorkAreaChange({ ...workArea, width: Math.max(1, newWidth) });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newWidth = parseInt(workAreaWidthInput) || 1;
                onWorkAreaChange({ ...workArea, width: Math.max(1, newWidth) });
                e.target.blur();
              }
            }}
            className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
            min="1"
            step="1"
          />
        </div>
        <div>
          <label className="text-xs text-drawhard-hover block mb-1 text-left">Hauteur (mm)</label>
          <input 
            type="number"
            value={workAreaHeightInput}
            onChange={(e) => setWorkAreaHeightInput(e.target.value)}
            onBlur={() => {
              const newHeight = parseInt(workAreaHeightInput) || 1;
              onWorkAreaChange({ ...workArea, height: Math.max(1, newHeight) });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newHeight = parseInt(workAreaHeightInput) || 1;
                onWorkAreaChange({ ...workArea, height: Math.max(1, newHeight) });
                e.target.blur();
              }
            }}
            className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
            min="1"
            step="1"
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input 
            type="checkbox"
            id="showWorkArea"
            checked={workArea.visible}
            onChange={(e) => {
              onWorkAreaChange({ ...workArea, visible: e.target.checked });
            }}
          />
          <label htmlFor="showWorkArea" className="text-xs text-drawhard-hover">Afficher la zone</label>
        </div>
      </div>
    </div>
);

const PropertiesPanel = React.memo(({ selectedIds, elements, onUpdateElement, onResizeElement, setElements, workArea, onWorkAreaChange, onRotate, onFlipHorizontal, onFlipVertical }) => {
  const [maintainProportions, setMaintainProportions] = useState(true);
  const [showAnimation, setShowAnimation] = useState(true);
  const [workAreaWidthInput, setWorkAreaWidthInput] = useState(String(Math.round(workArea.width)));
  const [workAreaHeightInput, setWorkAreaHeightInput] = useState(String(Math.round(workArea.height)));

  useEffect(() => {
    setShowAnimation(false);
  }, []);

  useEffect(() => {
    setWorkAreaWidthInput(String(Math.round(workArea.width)));
    setWorkAreaHeightInput(String(Math.round(workArea.height)));
  }, [workArea.width, workArea.height]);
  
  if (selectedIds.length === 0) {
    return (
      <div className="w-64 bg-drawhard-panel border-l-2 border-drawhard-dark flex flex-col overflow-y-auto">
        <div className="bg-drawhard-accent px-6 py-6 border-b-2 border-drawhard-dark relative">
          <div className="flex items-center justify-center">
            <img 
              src="/laserlair-logo.png" 
              alt="LaserLair" 
              style={{ 
                width: '180px', 
                height: 'auto', 
                filter: 'brightness(0) invert(1)',
                animation: showAnimation ? 'logoFadeInBounce 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
              }} 
            />
          </div>
          <p 
            className="text-white text-xs absolute bottom-2 left-2"
            style={{
              animation: showAnimation ? 'versionSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both' : 'none'
            }}
          >
            Version {packageJson.version}
          </p>
      </div>
      <div className="flex-1">
        <WorkAreaSection 
          workArea={workArea}
          onWorkAreaChange={onWorkAreaChange}
          workAreaWidthInput={workAreaWidthInput}
          setWorkAreaWidthInput={setWorkAreaWidthInput}
          workAreaHeightInput={workAreaHeightInput}
          setWorkAreaHeightInput={setWorkAreaHeightInput}
        />
        <div className="text-center mt-3 px-4">
          <p className="text-sm text-drawhard-hover">Aucun élément sélectionné</p>
        </div>
      </div>
    </div>
  );
  }

  const selectedElement = selectedIds.length === 1 
    ? elements.find(e => e.id === selectedIds[0])
    : null;

  const calculateSelectionBounds = () => {
    if (selectedIds.length === 0) return null;
    
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedElements.forEach(el => {
      if (el.type === 'line' || el.type === 'fingerJoint') {
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
        const rx = el.radiusX || el.radius;
        const ry = el.radiusY || el.radius;
        minX = Math.min(minX, el.cx - rx);
        minY = Math.min(minY, el.cy - ry);
        maxX = Math.max(maxX, el.cx + rx);
        maxY = Math.max(maxY, el.cy + ry);
      } else if (el.type === 'curve') {
        minX = Math.min(minX, el.x1, el.x2, el.cpx || 0);
        minY = Math.min(minY, el.y1, el.y2, el.cpy || 0);
        maxX = Math.max(maxX, el.x1, el.x2, el.cpx || 0);
        maxY = Math.max(maxY, el.y1, el.y2, el.cpy || 0);
      }
    });
    
    return {
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const selectionBounds = selectedIds.length > 1 ? calculateSelectionBounds() : null;

  const handleSelectionResize = (newWidth, newHeight) => {
    if (selectedIds.length === 0) return;
    
    const selectedElements = elements.filter(e => selectedIds.includes(e.id));
    const bounds = calculateSelectionBounds();
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;

    const scaleX = newWidth / bounds.width;
    const scaleY = newHeight / bounds.height;

    let minX = Infinity, minY = Infinity;
    selectedElements.forEach(el => {
      if (el.type === 'line' || el.type === 'fingerJoint') {
        minX = Math.min(minX, el.x1, el.x2);
        minY = Math.min(minY, el.y1, el.y2);
      } else if (el.type === 'rectangle') {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
      } else if (el.type === 'circle') {
        const rx = el.radiusX || el.radius;
        const ry = el.radiusY || el.radius;
        minX = Math.min(minX, el.cx - rx);
        minY = Math.min(minY, el.cy - ry);
      } else if (el.type === 'arc') {
        const rx = el.radiusX || el.radius;
        const ry = el.radiusY || el.radius;
        minX = Math.min(minX, el.cx - rx);
        minY = Math.min(minY, el.cy - ry);
      } else if (el.type === 'curve') {
        minX = Math.min(minX, el.x1, el.x2, el.cpx || 0);
        minY = Math.min(minY, el.y1, el.y2, el.cpy || 0);
      }
    });

    setElements(prev => prev.map(el => {
      if (!selectedIds.includes(el.id)) return el;

      if (el.type === 'line' || el.type === 'fingerJoint') {
        return {
          ...el,
          x1: minX + (el.x1 - minX) * scaleX,
          y1: minY + (el.y1 - minY) * scaleY,
          x2: minX + (el.x2 - minX) * scaleX,
          y2: minY + (el.y2 - minY) * scaleY
        };
      } else if (el.type === 'rectangle') {
        return {
          ...el,
          x: minX + (el.x - minX) * scaleX,
          y: minY + (el.y - minY) * scaleY,
          width: el.width * scaleX,
          height: el.height * scaleY
        };
      } else if (el.type === 'circle') {
        const rx = el.radiusX || el.radius;
        const ry = el.radiusY || el.radius;
        return {
          ...el,
          cx: minX + (el.cx - minX) * scaleX,
          cy: minY + (el.cy - minY) * scaleY,
          ...(el.radiusX ? { radiusX: rx * scaleX, radiusY: ry * scaleY } : { radius: rx * scaleX })
        };
      } else if (el.type === 'arc') {
        const rx = el.radiusX || el.radius;
        const ry = el.radiusY || el.radius;
        return {
          ...el,
          cx: minX + (el.cx - minX) * scaleX,
          cy: minY + (el.cy - minY) * scaleY,
          radius: rx * scaleX,
          radiusX: rx * scaleX,
          radiusY: ry * scaleY
        };
      } else if (el.type === 'curve') {
        return {
          ...el,
          x1: minX + (el.x1 - minX) * scaleX,
          y1: minY + (el.y1 - minY) * scaleY,
          x2: minX + (el.x2 - minX) * scaleX,
          y2: minY + (el.y2 - minY) * scaleY,
          cpx: minX + (el.cpx - minX) * scaleX,
          cpy: minY + (el.cpy - minY) * scaleY
        };
      }
      return el;
    }));
  };

  return (
    <div className="w-64 bg-drawhard-panel border-l-2 border-drawhard-dark flex flex-col overflow-y-auto">
      <div className="bg-drawhard-accent px-6 py-6 border-b-2 border-drawhard-dark relative">
        <div className="flex items-center justify-center">
          <img 
            src="/laserlair-logo.png" 
            alt="LaserLair" 
            style={{ 
              width: '180px', 
              height: 'auto', 
              filter: 'brightness(0) invert(1)',
              animation: showAnimation ? 'logoFadeInBounce 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
            }} 
          />
        </div>
        <p 
          className="text-white text-xs absolute bottom-2 left-2"
          style={{
            animation: showAnimation ? 'versionSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both' : 'none'
          }}
        >
          Version {packageJson.version}
        </p>
      </div>
      <div className="flex-1">
        <WorkAreaSection 
          workArea={workArea}
          onWorkAreaChange={onWorkAreaChange}
          workAreaWidthInput={workAreaWidthInput}
          setWorkAreaWidthInput={setWorkAreaWidthInput}
          workAreaHeightInput={workAreaHeightInput}
          setWorkAreaHeightInput={setWorkAreaHeightInput}
        />
        
        {selectedIds.length > 0 && (
          <div className="border-t-2 border-drawhard-dark pt-3 pb-3">
            <div className="flex items-center justify-between mb-3 px-4">
              <h5 className="text-xs font-bold uppercase tracking-wide text-left">Transformation</h5>
              <p className="text-xs text-drawhard-hover pr-1">{selectedIds.length} élément(s)</p>
            </div>
            <div className="space-y-2 px-4">
                {selectionBounds && (
                  <div>
                    <div className="flex gap-1 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-drawhard-hover block mb-1 text-left">Largeur totale</label>
                        <input
                          type="number"
                          value={Math.round(selectionBounds.width)}
                          onChange={(e) => {
                            const newWidth = parseInt(e.target.value) || 0;
                            if (newWidth <= 0) return;
                            const newHeight = maintainProportions 
                              ? Math.round((newWidth / selectionBounds.width) * selectionBounds.height)
                              : Math.round(selectionBounds.height);
                            handleSelectionResize(newWidth, newHeight);
                          }}
                          className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                          min="1"
                          step="1"
                        />
                      </div>
                      <button
                        onClick={() => setMaintainProportions(!maintainProportions)}
                        className="p-1.5 mb-0.5 bg-drawhard-beige hover:bg-drawhard-hover hover:text-white transition-colors"
                        title={maintainProportions ? "Conserver les proportions" : "Proportions libres"}
                      >
                        {maintainProportions ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                      <div className="flex-1">
                        <label className="text-xs text-drawhard-hover block mb-1 text-left">Hauteur totale</label>
                        <input
                          type="number"
                          value={Math.round(selectionBounds.height)}
                          onChange={(e) => {
                            const newHeight = parseInt(e.target.value) || 0;
                            if (newHeight <= 0) return;
                            const newWidth = maintainProportions 
                              ? Math.round((newHeight / selectionBounds.height) * selectionBounds.width)
                              : Math.round(selectionBounds.width);
                            handleSelectionResize(newWidth, newHeight);
                          }}
                          className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                          min="1"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {selectedElement && (selectedElement.type === 'rectangle' || selectedElement.type === 'circle') && (
                  <div>
                    <div className="flex gap-1 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-drawhard-hover block mb-1 text-left">
                          {selectedElement.type === 'rectangle' ? 'Largeur' : (selectedElement.radiusX && selectedElement.radiusY && Math.abs(selectedElement.radiusX - selectedElement.radiusY) > 0.01) ? 'Largeur (L)' : 'Diamètre (D)'}
                        </label>
                        <input
                          type="number"
                          value={selectedElement.type === 'rectangle' 
                            ? Math.round(Math.abs(selectedElement.width))
                            : (selectedElement.radiusX && selectedElement.radiusY && Math.abs(selectedElement.radiusX - selectedElement.radiusY) > 0.01)
                              ? Math.round(selectedElement.radiusX * 2)
                              : Math.round((selectedElement.radiusX || selectedElement.radius) * 2)
                          }
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            if (selectedElement.type === 'rectangle') {
                              const newHeight = maintainProportions 
                                ? Math.round((newValue / Math.abs(selectedElement.width)) * Math.abs(selectedElement.height))
                                : Math.round(Math.abs(selectedElement.height));
                              onUpdateElement(selectedElement.id, { width: newValue, height: newHeight });
                            } else {
                              const newRadius = newValue / 2;
                              if (selectedElement.radiusX && selectedElement.radiusY && Math.abs(selectedElement.radiusX - selectedElement.radiusY) > 0.01) {
                                const newRadiusY = maintainProportions
                                  ? (newRadius / selectedElement.radiusX) * selectedElement.radiusY
                                  : selectedElement.radiusY;
                                onUpdateElement(selectedElement.id, { radiusX: newRadius, radiusY: newRadiusY });
                              } else {
                                onUpdateElement(selectedElement.id, { radius: newRadius, radiusX: newRadius, radiusY: newRadius });
                              }
                            }
                          }}
                          className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                          min="1"
                          step="1"
                        />
                      </div>
                      <button
                        onClick={() => setMaintainProportions(!maintainProportions)}
                        className="p-1.5 mb-0.5 bg-drawhard-beige hover:bg-drawhard-hover hover:text-white transition-colors"
                        title={maintainProportions ? "Conserver les proportions" : "Proportions libres"}
                      >
                        {maintainProportions ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                      <div className="flex-1">
                        <label className="text-xs text-drawhard-hover block mb-1 text-left">
                          {selectedElement.type === 'rectangle' ? 'Hauteur' : (selectedElement.radiusX && selectedElement.radiusY && Math.abs(selectedElement.radiusX - selectedElement.radiusY) > 0.01) ? 'Hauteur (H)' : 'Diamètre (D)'}
                        </label>
                        <input
                          type="number"
                          value={selectedElement.type === 'rectangle'
                            ? Math.round(Math.abs(selectedElement.height))
                            : (selectedElement.radiusX && selectedElement.radiusY && Math.abs(selectedElement.radiusX - selectedElement.radiusY) > 0.01)
                              ? Math.round(selectedElement.radiusY * 2)
                              : Math.round((selectedElement.radiusY || selectedElement.radius) * 2)
                          }
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            if (selectedElement.type === 'rectangle') {
                              const newWidth = maintainProportions 
                                ? Math.round((newValue / Math.abs(selectedElement.height)) * Math.abs(selectedElement.width))
                                : Math.round(Math.abs(selectedElement.width));
                              onUpdateElement(selectedElement.id, { height: newValue, width: newWidth });
                            } else {
                              const newRadius = newValue / 2;
                              if (selectedElement.radiusX && selectedElement.radiusY && Math.abs(selectedElement.radiusX - selectedElement.radiusY) > 0.01) {
                                const newRadiusX = maintainProportions
                                  ? (newRadius / selectedElement.radiusY) * selectedElement.radiusX
                                  : selectedElement.radiusX;
                                onUpdateElement(selectedElement.id, { radiusY: newRadius, radiusX: newRadiusX });
                              } else {
                                onUpdateElement(selectedElement.id, { radius: newRadius, radiusX: newRadius, radiusY: newRadius });
                              }
                            }
                          }}
                          className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                          min="1"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-drawhard-hover block mb-1 text-left">Rotation</label>
                  <button
                    onClick={onRotate}
                    className="w-full px-3 py-1.5 flex items-center justify-center gap-2 transition-colors border border-drawhard-dark bg-drawhard-beige hover:bg-drawhard-hover hover:text-white"
                  >
                    <RotateCw size={16} />
                    <span className="text-sm">Pivoter 45°</span>
                  </button>
                </div>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-1 text-left">Symétrie</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={onFlipHorizontal}
                      className="px-3 py-1.5 flex items-center justify-center gap-2 transition-colors border border-drawhard-dark bg-drawhard-beige hover:bg-drawhard-hover hover:text-white"
                    >
                      <FlipHorizontal size={16} />
                      <span className="text-xs">H</span>
                    </button>
                    <button
                      onClick={onFlipVertical}
                      className="px-3 py-1.5 flex items-center justify-center gap-2 transition-colors border border-drawhard-dark bg-drawhard-beige hover:bg-drawhard-hover hover:text-white"
                    >
                      <FlipVertical size={16} />
                      <span className="text-xs">V</span>
                    </button>
                  </div>
                </div>
            </div>
          </div>
        )}
        
        {selectedElement && (
          <div className="space-y-2 px-4 pb-3">
            {selectedElement.type === 'line' && (
              <div>
                <label className="text-xs text-drawhard-hover block mb-1 text-left">Longueur</label>
                <input 
                  type="number"
                  value={Math.round(Math.sqrt(
                    (selectedElement.x2 - selectedElement.x1) ** 2 + 
                    (selectedElement.y2 - selectedElement.y1) ** 2
                  ))}
                  onChange={(e) => {
                    const newLength = parseInt(e.target.value) || 0;
                    const currentLength = Math.sqrt(
                      (selectedElement.x2 - selectedElement.x1) ** 2 + 
                      (selectedElement.y2 - selectedElement.y1) ** 2
                    );
                    if (currentLength === 0) return;
                    
                    const delta = newLength - currentLength;
                    onResizeElement(delta, false);
                  }}
                  className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                  min="1"
                  step="1"
                />
              </div>
            )}
            {selectedElement.type === 'fingerJoint' && (
              <div className="space-y-2 border-t-2 border-drawhard-dark pt-3 -mx-4 px-4 mt-3">
                <h5 className="text-xs font-bold uppercase tracking-wide text-left mb-2">Paramètres des créneaux</h5>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-drawhard-hover block mb-1 text-left">Longueur</label>
                    <input 
                      type="number"
                      value={Math.round(Math.sqrt(
                        (selectedElement.x2 - selectedElement.x1) ** 2 + 
                        (selectedElement.y2 - selectedElement.y1) ** 2
                      ))}
                      onChange={(e) => {
                        const newLength = parseInt(e.target.value) || 0;
                        if (newLength < 1) return;
                        
                        const currentLength = Math.sqrt(
                          (selectedElement.x2 - selectedElement.x1) ** 2 + 
                          (selectedElement.y2 - selectedElement.y1) ** 2
                        );
                        if (currentLength === 0) return;
                        
                        const ratio = newLength / currentLength;
                        const dx = selectedElement.x2 - selectedElement.x1;
                        const dy = selectedElement.y2 - selectedElement.y1;
                        
                        onUpdateElement(selectedElement.id, {
                          x2: selectedElement.x1 + dx * ratio,
                          y2: selectedElement.y1 + dy * ratio
                        });
                      }}
                      className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                      min="1"
                      step="1"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-drawhard-hover block mb-1 text-left">Épaisseur</label>
                    <input 
                      type="number"
                      value={Math.round(selectedElement.thickness || 3)}
                      onChange={(e) => {
                        const newThickness = parseInt(e.target.value) || 3;
                        onUpdateElement(selectedElement.id, { thickness: Math.max(1, newThickness) });
                      }}
                      className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                      min="1"
                      step="1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-drawhard-hover block mb-1 text-left">Larg. dent</label>
                    <input 
                      type="number"
                      value={selectedElement.toothWidth || 10}
                      onChange={(e) => {
                        const newToothWidth = parseFloat(e.target.value) || 10;
                        onUpdateElement(selectedElement.id, { toothWidth: Math.max(1, newToothWidth) });
                      }}
                      className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                      min="1"
                      step="1"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-drawhard-hover block mb-1 text-left">Larg. espace</label>
                    <input 
                      type="number"
                      value={selectedElement.gapWidth || 10}
                      onChange={(e) => {
                        const newGapWidth = parseFloat(e.target.value) || 10;
                        onUpdateElement(selectedElement.id, { gapWidth: Math.max(1, newGapWidth) });
                      }}
                      className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                      min="1"
                      step="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-2 text-left">Type de crénelage</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateElement(selectedElement.id, { startWith: 'tooth' })}
                      className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border border-drawhard-dark ${
                        (selectedElement.startWith || 'tooth') === 'tooth'
                          ? 'bg-drawhard-accent text-white'
                          : 'bg-drawhard-beige text-drawhard-dark hover:bg-drawhard-hover hover:text-white'
                      }`}
                    >
                      Mâle
                    </button>
                    <button
                      onClick={() => onUpdateElement(selectedElement.id, { startWith: 'gap' })}
                      className={`flex-1 px-3 py-2 text-xs font-medium transition-colors border border-drawhard-dark ${
                        selectedElement.startWith === 'gap'
                          ? 'bg-drawhard-accent text-white'
                          : 'bg-drawhard-beige text-drawhard-dark hover:bg-drawhard-hover hover:text-white'
                      }`}
                    >
                      Femelle
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {selectedElement.type === 'arc' && (
              <div>
                <div className="flex gap-1 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-drawhard-hover block mb-1 text-left">Largeur</label>
                    <input
                      type="number"
                      value={Math.round((selectedElement.radiusX || selectedElement.radius) * 2)}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        const newRadiusX = newValue / 2;
                        const radiusY = selectedElement.radiusY || selectedElement.radius;
                        
                        if (maintainProportions) {
                          const currentRadiusX = selectedElement.radiusX || selectedElement.radius;
                          const newRadiusY = (newRadiusX / currentRadiusX) * radiusY;
                          onUpdateElement(selectedElement.id, { 
                            radius: newRadiusX,
                            radiusX: newRadiusX, 
                            radiusY: newRadiusY 
                          });
                        } else {
                          onUpdateElement(selectedElement.id, { 
                            radius: newRadiusX,
                            radiusX: newRadiusX,
                            radiusY: radiusY
                          });
                        }
                      }}
                      className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                      min="1"
                      step="1"
                    />
                  </div>
                  <button
                    onClick={() => setMaintainProportions(!maintainProportions)}
                    className="p-1.5 mb-0.5 bg-drawhard-beige hover:bg-drawhard-hover hover:text-white transition-colors"
                    title={maintainProportions ? "Conserver les proportions" : "Proportions libres"}
                  >
                    {maintainProportions ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                  <div className="flex-1">
                    <label className="text-xs text-drawhard-hover block mb-1 text-left">Hauteur</label>
                    <input
                      type="number"
                      value={Math.round((selectedElement.radiusY || selectedElement.radius) * 2)}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        const newRadiusY = newValue / 2;
                        const radiusX = selectedElement.radiusX || selectedElement.radius;
                        
                        if (maintainProportions) {
                          const currentRadiusY = selectedElement.radiusY || selectedElement.radius;
                          const newRadiusX = (newRadiusY / currentRadiusY) * radiusX;
                          onUpdateElement(selectedElement.id, { 
                            radius: newRadiusY,
                            radiusX: newRadiusX, 
                            radiusY: newRadiusY 
                          });
                        } else {
                          onUpdateElement(selectedElement.id, { 
                            radius: newRadiusY,
                            radiusX: radiusX,
                            radiusY: newRadiusY
                          });
                        }
                      }}
                      className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                      min="1"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {selectedElement.type === 'text' && (
              <>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-1 text-left">Police</label>
                  <select
                    value={selectedElement.fontFamily}
                    onChange={(e) => {
                      onUpdateElement(selectedElement.id, { fontFamily: e.target.value });
                    }}
                    className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Helvetica">Helvetica</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-1 text-left">Taille</label>
                  <input 
                    type="number"
                    value={selectedElement.fontSize}
                    onChange={(e) => {
                      const newSize = parseFloat(e.target.value) || 12;
                      onUpdateElement(selectedElement.id, { fontSize: newSize });
                    }}
                    className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-dark"
                    min="6"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-1 text-left">Style</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onUpdateElement(selectedElement.id, { 
                          fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' 
                        });
                      }}
                      className={`flex-1 px-3 py-1.5 flex items-center justify-center gap-2 transition-colors border border-drawhard-dark ${
                        selectedElement.fontWeight === 'bold' 
                          ? 'bg-drawhard-accent text-white' 
                          : 'bg-drawhard-beige hover:bg-drawhard-hover hover:text-white'
                      }`}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() => {
                        onUpdateElement(selectedElement.id, { 
                          fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' 
                        });
                      }}
                      className={`flex-1 px-3 py-1.5 flex items-center justify-center gap-2 transition-colors border border-drawhard-dark ${
                        selectedElement.fontStyle === 'italic' 
                          ? 'bg-drawhard-accent text-white' 
                          : 'bg-drawhard-beige hover:bg-drawhard-hover hover:text-white'
                      }`}
                    >
                      <Italic size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        <div className="border-b-2 border-drawhard-dark mt-4"></div>
      </div>
    </div>
  );
});

PropertiesPanel.displayName = 'PropertiesPanel';

export default PropertiesPanel;

