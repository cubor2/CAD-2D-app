import React from 'react';

const ContextMenu = React.memo(({ 
  contextMenu, 
  selectedIds, 
  groups, 
  onGroup, 
  onUngroup, 
  onClose 
}) => {
  if (!contextMenu) return null;

  const canGroup = selectedIds.length >= 2 && !groups.some(g => 
    selectedIds.length === g.elementIds.length && 
    selectedIds.every(id => g.elementIds.includes(id))
  );

  const canUngroup = groups.some(g => 
    selectedIds.some(id => g.elementIds.includes(id))
  );

  return (
    <div 
      className="absolute bg-gray-800 border border-gray-600 rounded shadow-lg py-1 z-50"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {canGroup && (
        <button
          onClick={() => {
            onGroup();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 whitespace-nowrap"
        >
          Grouper <span className="text-gray-400 ml-2">Ctrl+G</span>
        </button>
      )}
      {canUngroup && (
        <button
          onClick={() => {
            onUngroup();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 whitespace-nowrap"
        >
          Dégrouper <span className="text-gray-400 ml-2">Ctrl+Shift+G</span>
        </button>
      )}
    </div>
  );
});

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;

