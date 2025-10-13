import React from 'react';

const TopControls = React.memo(({
  snapToGrid,
  setSnapToGrid,
  snapToElements,
  setSnapToElements,
  showDimensions,
  setShowDimensions,
  showRulers,
  setShowRulers,
  viewport,
  darkMode,
  setDarkMode
}) => {
  return (
    <div className="absolute top-4 right-4 bg-gray-800 rounded px-4 py-2 flex gap-4 items-center z-10">
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
      <div className="text-sm flex items-center gap-2">
        <span className="text-gray-400">1 unité = 1mm</span>
        <span className="text-gray-600">|</span>
        <span>Zoom: {((viewport.zoom / 3.779527559055118) * 100).toFixed(0)}%</span>
      </div>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        title={darkMode ? "Mode clair" : "Mode foncé"}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
});

TopControls.displayName = 'TopControls';

export default TopControls;

