import React from 'react';
import { Bold, Italic } from 'lucide-react';

const PropertiesPanel = React.memo(({ selectedIds, elements, onUpdateElement, workArea, onWorkAreaChange }) => {
  // Bloc "Zone de travail" (toujours visible)
  const WorkAreaSection = () => (
    <div className="border-b-2 border-drawhard-dark pb-3 mb-4">
      <h4 className="text-sm font-bold pt-3 mb-3 uppercase tracking-extra-wide text-center px-4">Zone de travail</h4>
      <div className="space-y-2 px-4">
        <div>
          <label className="text-xs text-drawhard-hover block mb-1 text-left">Largeur (mm)</label>
          <input 
            type="number"
            value={workArea.width}
            onChange={(e) => {
              const newWidth = parseFloat(e.target.value) || 0;
              onWorkAreaChange({ ...workArea, width: newWidth });
            }}
            className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
            min="0"
          />
        </div>
        <div>
          <label className="text-xs text-drawhard-hover block mb-1 text-left">Hauteur (mm)</label>
          <input 
            type="number"
            value={workArea.height}
            onChange={(e) => {
              const newHeight = parseFloat(e.target.value) || 0;
              onWorkAreaChange({ ...workArea, height: newHeight });
            }}
            className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
            min="0"
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
  
  if (selectedIds.length === 0) {
    return (
      <div className="w-64 bg-drawhard-panel border-l-2 border-drawhard-dark flex flex-col overflow-y-auto">
        <div className="bg-drawhard-accent px-6 py-6 border-b-2 border-drawhard-dark relative">
          <div className="flex items-center justify-center">
            <img 
              src="/laserlair-logo.png" 
              alt="LaserLair" 
              style={{ width: '180px', height: 'auto', filter: 'brightness(0) invert(1)' }} 
            />
          </div>
          <p className="text-white text-xs absolute bottom-2 left-2">Version 1.0</p>
      </div>
      <div className="flex-1">
        <WorkAreaSection />
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

  return (
    <div className="w-64 bg-drawhard-panel border-l-2 border-drawhard-dark flex flex-col overflow-y-auto">
      <div className="bg-drawhard-accent px-6 py-6 border-b-2 border-drawhard-dark relative">
        <div className="flex items-center justify-center">
          <img 
            src="/laserlair-logo.png" 
            alt="LaserLair" 
            style={{ width: '180px', height: 'auto', filter: 'brightness(0) invert(1)' }} 
          />
        </div>
        <p className="text-white text-xs absolute bottom-2 left-2">Version 1.0</p>
      </div>
      <div className="flex-1">
        <WorkAreaSection />
        
        <div>
          <h4 className="text-sm font-bold pt-3 mb-3 uppercase tracking-extra-wide text-center px-4">Sélection</h4>
          <div className="px-4 mb-2">
            <p className="text-sm font-bold text-center">{selectedIds.length} élément(s)</p>
          </div>
        
        {selectedElement && (
          <div className="space-y-2 px-4 pb-3">
            {selectedElement.type === 'line' && (
              <div>
                <label className="text-xs text-drawhard-hover block mb-1 text-left">Longueur</label>
                <p className="text-sm font-mono font-bold">
                  {Math.sqrt(
                    (selectedElement.x2 - selectedElement.x1) ** 2 + 
                    (selectedElement.y2 - selectedElement.y1) ** 2
                  ).toFixed(2)} mm
                </p>
              </div>
            )}
            
            {selectedElement.type === 'rectangle' && (
              <>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-1 text-left">Largeur</label>
                  <input 
                    type="number"
                    value={Math.abs(selectedElement.width).toFixed(2)}
                    onChange={(e) => {
                      const newWidth = parseFloat(e.target.value) || 0;
                      onUpdateElement(selectedElement.id, { width: newWidth });
                    }}
                    className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
                  />
                </div>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-1 text-left">Hauteur</label>
                  <input 
                    type="number"
                    value={Math.abs(selectedElement.height).toFixed(2)}
                    onChange={(e) => {
                      const newHeight = parseFloat(e.target.value) || 0;
                      onUpdateElement(selectedElement.id, { height: newHeight });
                    }}
                    className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
                  />
                </div>
              </>
            )}
            
            {selectedElement.type === 'arc' && (
              <>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-1 text-left">Rayon</label>
                  <input 
                    type="number"
                    value={selectedElement.radius.toFixed(2)}
                    onChange={(e) => {
                      const newRadius = parseFloat(e.target.value) || 0;
                      onUpdateElement(selectedElement.id, { radius: newRadius });
                    }}
                    className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
                  />
                </div>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-1 text-left">Longueur d'arc</label>
                  <p className="text-sm font-mono font-bold">
                    {(Math.abs(selectedElement.endAngle - selectedElement.startAngle) * selectedElement.radius).toFixed(2)} mm
                  </p>
                </div>
              </>
            )}
            
            {selectedElement.type === 'circle' && (
              <>
                {selectedElement.radiusX && selectedElement.radiusY && 
                 Math.abs(selectedElement.radiusX - selectedElement.radiusY) > 0.01 ? (
                  <>
                    <div>
                      <label className="text-xs text-drawhard-hover block mb-1 text-left">Largeur (L)</label>
                      <input 
                        type="number"
                        value={(selectedElement.radiusX * 2).toFixed(2)}
                        onChange={(e) => {
                          const newRadiusX = (parseFloat(e.target.value) || 0) / 2;
                          onUpdateElement(selectedElement.id, { radiusX: newRadiusX });
                        }}
                        className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-drawhard-hover block mb-1 text-left">Hauteur (H)</label>
                      <input 
                        type="number"
                        value={(selectedElement.radiusY * 2).toFixed(2)}
                        onChange={(e) => {
                          const newRadiusY = (parseFloat(e.target.value) || 0) / 2;
                          onUpdateElement(selectedElement.id, { radiusY: newRadiusY });
                        }}
                        className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs text-drawhard-hover block mb-1 text-left">Diamètre (D)</label>
                    <input 
                      type="number"
                      value={((selectedElement.radiusX || selectedElement.radius) * 2).toFixed(2)}
                      onChange={(e) => {
                        const newRadius = (parseFloat(e.target.value) || 0) / 2;
                        onUpdateElement(selectedElement.id, { 
                          radius: newRadius,
                          radiusX: newRadius,
                          radiusY: newRadius
                        });
                      }}
                      className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
                    />
                  </div>
                )}
              </>
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
                    className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
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
                    className="w-full bg-drawhard-beige border border-drawhard-dark px-2 py-1 text-sm font-mono text-center text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
                    min="6"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-xs text-drawhard-hover block mb-2 text-left">Style</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onUpdateElement(selectedElement.id, { 
                          fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' 
                        });
                      }}
                      className={`flex-1 px-3 py-2 flex items-center justify-center gap-2 transition-colors border border-drawhard-dark ${
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
                      className={`flex-1 px-3 py-2 flex items-center justify-center gap-2 transition-colors border border-drawhard-dark ${
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
    </div>
  );
});

PropertiesPanel.displayName = 'PropertiesPanel';

export default PropertiesPanel;

