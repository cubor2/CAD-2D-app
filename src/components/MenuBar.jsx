import React, { useState, useRef, useEffect } from 'react';

const MenuBar = React.memo(({ onNew, onOpen, onSave, onSaveAs, onExport }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenu]);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleMenuAction = (action) => {
    setOpenMenu(null);
    action();
  };

  return (
    <div className="h-10 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 flex items-center px-2 text-sm relative" ref={menuRef}>
      <div className="relative">
        <button
          onClick={() => toggleMenu('file')}
          className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Fichier
        </button>
        
        {openMenu === 'file' && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50">
            <MenuItem 
              label="Nouveau" 
              shortcut="Ctrl + N"
              onClick={() => handleMenuAction(onNew)}
            />
            <MenuItem 
              label="Ouvrir..." 
              shortcut="Ctrl + O"
              onClick={() => handleMenuAction(onOpen)}
            />
            <div className="h-px bg-gray-300 dark:bg-gray-700 my-1" />
            <MenuItem 
              label="Enregistrer" 
              shortcut="Ctrl + S"
              onClick={() => handleMenuAction(onSave)}
            />
            <MenuItem 
              label="Enregistrer sous..." 
              shortcut="Ctrl + Shift + S"
              onClick={() => handleMenuAction(onSaveAs)}
            />
            <div className="h-px bg-gray-300 dark:bg-gray-700 my-1" />
            <SubMenuItem
              label="Exporter en..."
              items={[
                { label: 'SVG', onClick: () => handleMenuAction(() => onExport('svg')) },
                { label: 'PNG', onClick: () => handleMenuAction(() => onExport('png')) },
                { label: 'DXF', onClick: () => handleMenuAction(() => onExport('dxf')) },
              ]}
            />
            <div className="h-px bg-gray-300 dark:bg-gray-700 my-1" />
            <MenuItem 
              label="Fermer" 
              shortcut=""
              onClick={() => handleMenuAction(() => {})}
            />
          </div>
        )}
      </div>

      <div className="relative ml-2">
        <button
          onClick={() => toggleMenu('edit')}
          className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Édition
        </button>
      </div>

      <div className="relative ml-2">
        <button
          onClick={() => toggleMenu('object')}
          className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Objet
        </button>
      </div>

      <div className="relative ml-2">
        <button
          onClick={() => toggleMenu('select')}
          className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Sélection
        </button>
      </div>

      <div className="relative ml-2">
        <button
          onClick={() => toggleMenu('view')}
          className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Affichage
        </button>
      </div>

      <div className="relative ml-2">
        <button
          onClick={() => toggleMenu('help')}
          className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          Aide
        </button>
      </div>
    </div>
  );
});

const MenuItem = ({ label, shortcut, onClick }) => (
  <button
    onClick={onClick}
    className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center text-left transition-colors"
  >
    <span>{label}</span>
    {shortcut && <span className="text-gray-500 dark:text-gray-400 text-xs ml-8">{shortcut}</span>}
  </button>
);

const SubMenuItem = ({ label, items }) => {
  const [showSubmenu, setShowSubmenu] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowSubmenu(true)}
      onMouseLeave={() => setShowSubmenu(false)}
    >
      <button
        className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center text-left transition-colors"
      >
        <span>{label}</span>
        <span className="text-gray-500">▸</span>
      </button>
      
      {showSubmenu && (
        <div className="absolute left-full top-0 ml-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

MenuBar.displayName = 'MenuBar';

export default MenuBar;

