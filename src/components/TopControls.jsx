import React from 'react';

const TopControls = React.memo(({
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
    <div className="absolute top-9 left-1/2 transform -translate-x-1/2 bg-drawhard-beige border-2 border-drawhard-dark px-4 py-2 flex gap-3 items-center z-10 shadow-lg text-xs">
      <label className="flex items-center gap-1 cursor-pointer">
        <input 
          type="checkbox" 
          checked={snapToElements}
          onChange={(e) => setSnapToElements(e.target.checked)}
          className="cursor-pointer"
        />
        <span className="uppercase tracking-wide font-bold">Éléments</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input 
          type="checkbox" 
          checked={showDimensions}
          onChange={(e) => setShowDimensions(e.target.checked)}
          className="cursor-pointer"
        />
        <span className="uppercase tracking-wide font-bold">Cotes</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input 
          type="checkbox" 
          checked={showRulers}
          onChange={(e) => setShowRulers(e.target.checked)}
          className="cursor-pointer"
        />
        <span className="uppercase tracking-wide font-bold">Règles</span>
      </label>
      <span className="text-drawhard-dark font-bold">|</span>
      <span className="text-drawhard-hover">unité = 1mm</span>
      <span className="text-drawhard-dark font-bold">|</span>
      <span className="font-mono">Zoom: {((viewport.zoom / 3.779527559055118) * 100).toFixed(0)}%</span>
    </div>
  );
});

TopControls.displayName = 'TopControls';

export default TopControls;

