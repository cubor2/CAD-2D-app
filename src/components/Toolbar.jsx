import React from 'react';
import { MousePointer, Edit3, Minus, Square, Circle } from 'lucide-react';

const Toolbar = React.memo(({ tool, onToolChange, onClearSelectedEdge }) => {
  const tools = [
    { id: 'select', icon: MousePointer, label: 'Sélection/Déplacement (S)', shortcut: 'S' },
    { id: 'edit', icon: Edit3, label: 'Édition (E)', shortcut: 'E' },
    { id: 'line', icon: Minus, label: 'Ligne (L)', shortcut: 'L' },
    { id: 'rectangle', icon: Square, label: 'Rectangle (R)', shortcut: 'R' },
    { id: 'circle', icon: Circle, label: 'Cercle (C)', shortcut: 'C' }
  ];

  const handleToolClick = (toolId) => {
    onToolChange(toolId);
    if (toolId !== 'edit') {
      onClearSelectedEdge();
    }
  };

  return (
    <div className="w-14 bg-gray-800 flex flex-col items-center py-4 gap-2">
      {tools.map(({ id, icon: Icon, label, shortcut }) => (
        <button 
          key={id}
          onClick={() => handleToolClick(id)}
          className={`p-2 rounded hover:bg-gray-700 ${tool === id ? 'bg-gray-700' : ''} relative`}
          title={label}
        >
          <Icon size={20} />
          <span className="absolute bottom-0 right-0 text-[10px] font-bold text-gray-400">{shortcut}</span>
        </button>
      ))}
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;

