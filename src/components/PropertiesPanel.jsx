import React from 'react';
import { Bold, Italic } from 'lucide-react';

const PropertiesPanel = React.memo(({ selectedIds, elements, onUpdateElement }) => {
  if (selectedIds.length === 0) {
    return (
      <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Proprietes</h3>
        <p className="text-sm text-gray-500">Aucun element selectionne</p>
      </div>
    );
  }

  const selectedElement = selectedIds.length === 1 
    ? elements.find(e => e.id === selectedIds[0])
    : null;

  return (
    <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Proprietes</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Selection</label>
          <p className="text-sm">{selectedIds.length} element(s)</p>
        </div>
        
        {selectedElement && (
          <div className="space-y-3">
            {selectedElement.type === 'line' && (
              <div>
                <label className="text-sm text-gray-400">Longueur</label>
                <p className="text-sm font-mono">
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
                  <label className="text-sm text-gray-400">Largeur</label>
                  <input 
                    type="number"
                    value={Math.abs(selectedElement.width).toFixed(2)}
                    onChange={(e) => {
                      const newWidth = parseFloat(e.target.value) || 0;
                      onUpdateElement(selectedElement.id, { width: newWidth });
                    }}
                    className="w-full bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Hauteur</label>
                  <input 
                    type="number"
                    value={Math.abs(selectedElement.height).toFixed(2)}
                    onChange={(e) => {
                      const newHeight = parseFloat(e.target.value) || 0;
                      onUpdateElement(selectedElement.id, { height: newHeight });
                    }}
                    className="w-full bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                  />
                </div>
              </>
            )}
            
            {selectedElement.type === 'arc' && (
              <>
                <div>
                  <label className="text-sm text-gray-400">Rayon</label>
                  <input 
                    type="number"
                    value={selectedElement.radius.toFixed(2)}
                    onChange={(e) => {
                      const newRadius = parseFloat(e.target.value) || 0;
                      onUpdateElement(selectedElement.id, { radius: newRadius });
                    }}
                    className="w-full bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Longueur d'arc</label>
                  <p className="text-sm font-mono">
                    {(Math.abs(selectedElement.endAngle - selectedElement.startAngle) * selectedElement.radius).toFixed(2)} mm
                  </p>
                </div>
              </>
            )}
            
            {selectedElement.type === 'circle' && (
              <div>
                <label className="text-sm text-gray-400">Diametre</label>
                <input 
                  type="number"
                  value={(selectedElement.radius * 2).toFixed(2)}
                  onChange={(e) => {
                    const newRadius = (parseFloat(e.target.value) || 0) / 2;
                    onUpdateElement(selectedElement.id, { radius: newRadius });
                  }}
                  className="w-full bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                />
              </div>
            )}
            
            {selectedElement.type === 'text' && (
              <>
                <div>
                  <label className="text-sm text-gray-400">Police</label>
                  <select
                    value={selectedElement.fontFamily}
                    onChange={(e) => {
                      onUpdateElement(selectedElement.id, { fontFamily: e.target.value });
                    }}
                    className="w-full bg-gray-700 px-2 py-1 rounded text-sm"
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
                  <label className="text-sm text-gray-400">Taille</label>
                  <input 
                    type="number"
                    value={selectedElement.fontSize}
                    onChange={(e) => {
                      const newSize = parseFloat(e.target.value) || 12;
                      onUpdateElement(selectedElement.id, { fontSize: newSize });
                    }}
                    className="w-full bg-gray-700 px-2 py-1 rounded text-sm font-mono"
                    min="6"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Style</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onUpdateElement(selectedElement.id, { 
                          fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' 
                        });
                      }}
                      className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 transition-colors ${
                        selectedElement.fontWeight === 'bold' 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-700 hover:bg-gray-600'
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
                      className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 transition-colors ${
                        selectedElement.fontStyle === 'italic' 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-700 hover:bg-gray-600'
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
      </div>
    </div>
  );
});

PropertiesPanel.displayName = 'PropertiesPanel';

export default PropertiesPanel;

