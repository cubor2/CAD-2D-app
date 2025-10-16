import React from 'react';
import { MousePointer, Edit3, Minus, Square, Circle, Type } from 'lucide-react';

const Toolbar = React.memo(({ tool, onToolChange, onClearSelectedEdge }) => {
  const tools = [
    { id: 'select', icon: MousePointer, label: 'Sélection/Déplacement (S)', shortcut: 'S' },
    { id: 'edit', icon: Edit3, label: 'Édition (E)', shortcut: 'E' },
    { id: 'line', icon: Minus, label: 'Ligne (L)', shortcut: 'L' },
    { id: 'rectangle', icon: Square, label: 'Rectangle (R)', shortcut: 'R' },
    { id: 'circle', icon: Circle, label: 'Cercle (C)', shortcut: 'C' },
    { id: 'text', icon: Type, label: 'Texte (T)', shortcut: 'T' }
  ];

  const handleToolClick = (toolId) => {
    onToolChange(toolId);
    if (toolId !== 'edit') {
      onClearSelectedEdge();
    }
  };

  return (
    <div className="w-14 bg-drawhard-beige border-r-2 border-drawhard-dark flex flex-col items-center">
      {tools.map(({ id, icon: Icon, label, shortcut }) => (
        <button 
          key={id}
          onClick={() => handleToolClick(id)}
          className={`w-full p-2 transition-colors relative ${
            tool === id 
              ? 'bg-drawhard-accent text-white' 
              : 'bg-drawhard-beige text-drawhard-dark hover:bg-drawhard-hover hover:text-white'
          }`}
          title={label}
        >
          <Icon size={20} strokeWidth={2.5} className="mx-auto" />
          <span className="absolute bottom-0 right-3 text-[10px] font-bold opacity-50">{shortcut}</span>
        </button>
      ))}
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

export default Toolbar;

