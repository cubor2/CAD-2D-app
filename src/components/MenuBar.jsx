import React, { useState, useRef, useEffect } from 'react';

const MenuBar = React.memo(({ 
  onNew, 
  onOpen, 
  onSave, 
  onSaveAs, 
  onExport,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onGroup,
  onUngroup,
  hasSelection,
  hasMultipleSelection,
  onOpenDesignSystem
}) => {
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
    <div className="h-12 bg-drawhard-beige border-b-2 border-drawhard-dark flex items-center text-sm relative uppercase font-bold tracking-extra-wide" ref={menuRef}>
      <div className="relative h-full">
        <button
          onClick={() => toggleMenu('file')}
          className="h-full px-3 hover:bg-drawhard-hover hover:text-white transition-colors"
        >
          Fichier
        </button>
        
        {openMenu === 'file' && (
          <div className="absolute top-full left-0 w-64 bg-drawhard-beige border-2 border-drawhard-dark shadow-lg z-50 normal-case font-normal tracking-normal">
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
            <div className="h-px bg-drawhard-grid my-1" />
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
            <div className="h-px bg-drawhard-grid my-1" />
            <SubMenuItem
              label="Exporter en..."
              items={[
                { label: 'SVG', onClick: () => handleMenuAction(() => onExport('svg')) },
                { label: 'PNG', onClick: () => handleMenuAction(() => onExport('png')) },
                { label: 'DXF', onClick: () => handleMenuAction(() => onExport('dxf')) },
              ]}
            />
            <div className="h-px bg-drawhard-grid my-1" />
            <MenuItem 
              label="Fermer" 
              shortcut=""
              onClick={() => handleMenuAction(() => {})}
            />
          </div>
        )}
      </div>

      <div className="relative h-full">
        <button
          onClick={() => toggleMenu('edit')}
          className="h-full px-3 hover:bg-drawhard-hover hover:text-white transition-colors"
        >
          Édition
        </button>
        
        {openMenu === 'edit' && (
          <div className="absolute top-full left-0 w-64 bg-drawhard-beige border-2 border-drawhard-dark shadow-lg z-50 normal-case font-normal tracking-normal">
            <MenuItem 
              label="Annuler" 
              shortcut="Ctrl + Z"
              onClick={() => handleMenuAction(onUndo)}
            />
            <MenuItem 
              label="Rétablir" 
              shortcut="Ctrl + Shift + Z"
              onClick={() => handleMenuAction(onRedo)}
            />
            <div className="h-px bg-drawhard-grid my-1" />
            <MenuItem 
              label="Couper" 
              shortcut="Ctrl + X"
              onClick={() => handleMenuAction(onCut)}
              disabled={!hasSelection}
            />
            <MenuItem 
              label="Copier" 
              shortcut="Ctrl + C"
              onClick={() => handleMenuAction(onCopy)}
              disabled={!hasSelection}
            />
            <MenuItem 
              label="Coller" 
              shortcut="Ctrl + V"
              onClick={() => handleMenuAction(onPaste)}
            />
            <div className="h-px bg-drawhard-grid my-1" />
            <MenuItem 
              label="Supprimer" 
              shortcut="Delete"
              onClick={() => handleMenuAction(onDelete)}
              disabled={!hasSelection}
            />
          </div>
        )}
      </div>

      <div className="relative h-full">
        <button
          onClick={() => toggleMenu('object')}
          className="h-full px-3 hover:bg-drawhard-hover hover:text-white transition-colors"
        >
          Objet
        </button>
        
        {openMenu === 'object' && (
          <div className="absolute top-full left-0 w-64 bg-drawhard-beige border-2 border-drawhard-dark shadow-lg z-50 normal-case font-normal tracking-normal">
            <MenuItem 
              label="Grouper" 
              shortcut="Ctrl + G"
              onClick={() => handleMenuAction(onGroup)}
              disabled={!hasMultipleSelection}
            />
            <MenuItem 
              label="Dégrouper" 
              shortcut="Ctrl + Shift + G"
              onClick={() => handleMenuAction(onUngroup)}
              disabled={!hasSelection}
            />
          </div>
        )}
      </div>

      <div className="relative h-full">
        <button
          onClick={() => toggleMenu('select')}
          className="h-full px-3 hover:bg-drawhard-hover hover:text-white transition-colors"
        >
          Sélection
        </button>
      </div>

      <div className="relative h-full">
        <button
          onClick={() => toggleMenu('view')}
          className="h-full px-3 hover:bg-drawhard-hover hover:text-white transition-colors"
        >
          Affichage
        </button>
      </div>

      <div className="relative h-full ml-auto">
        <button
          onClick={() => {
            setOpenMenu(null);
            onOpenDesignSystem();
          }}
          className="h-full px-3 hover:bg-drawhard-accent hover:text-white transition-colors"
        >
          Design System
        </button>
      </div>

      <div className="relative h-full">
        <button
          onClick={() => toggleMenu('help')}
          className="h-full px-3 hover:bg-drawhard-hover hover:text-white transition-colors"
        >
          Aide
        </button>
      </div>
    </div>
  );
});

const MenuItem = ({ label, shortcut, onClick, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    className={`w-full px-4 py-2 flex justify-between items-center text-left transition-colors ${
      disabled 
        ? 'text-drawhard-grid cursor-not-allowed' 
        : 'hover:bg-drawhard-hover hover:text-white'
    }`}
    disabled={disabled}
  >
    <span>{label}</span>
    {shortcut && <span className="text-drawhard-hover text-xs ml-8">{shortcut}</span>}
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
        className="w-full px-4 py-2 hover:bg-drawhard-hover hover:text-white flex justify-between items-center text-left transition-colors"
      >
        <span>{label}</span>
        <span className="text-drawhard-hover">▸</span>
      </button>
      
      {showSubmenu && (
        <div className="absolute left-full top-0 w-48 bg-drawhard-beige border-2 border-drawhard-dark shadow-lg">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className="w-full px-4 py-2 hover:bg-drawhard-hover hover:text-white text-left transition-colors"
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

