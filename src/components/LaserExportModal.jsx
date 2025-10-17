import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { LASER_MACHINES } from '../constants/laserMachines';

const LaserExportModal = ({ onClose, onExport, elements, workArea }) => {
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');

  const selectedMachine = selectedMachineId ? LASER_MACHINES[selectedMachineId] : null;

  const handleMachineChange = (e) => {
    const machineId = e.target.value;
    setSelectedMachineId(machineId);
    if (machineId) {
      const machine = LASER_MACHINES[machineId];
      setSelectedFormat(machine.preferredFormat);
    } else {
      setSelectedFormat('');
    }
  };

  const handleExport = () => {
    if (selectedMachine && selectedFormat) {
      onExport(selectedMachine, selectedFormat);
      onClose();
    }
  };

  const canExport = selectedMachine && selectedFormat && 
    selectedMachine.formats.find(f => f.name === selectedFormat)?.available;

  const modifications = useMemo(() => {
    if (!selectedMachine || !elements.length) return [];
    
    const mods = [];
    
    if (selectedFormat === 'PDF') {
      mods.push('Ajout d\'un fond blanc (standard découpe laser)');
    }
    
    const hasNonRedElements = elements.some(el => {
      if (el.stroke && el.stroke !== '#ff0000' && el.stroke !== 'rgb(255, 0, 0)') {
        return true;
      }
      return false;
    });
    
    if (hasNonRedElements) {
      mods.push('Couleur des traits changée en rouge pur (RGB 255,0,0)');
    }
    
    const hasNonStandardWidth = elements.some(el => {
      if (el.strokeWidth && Math.abs(el.strokeWidth - selectedMachine.cutStrokeWidth) > 0.001) {
        return true;
      }
      return false;
    });
    
    if (hasNonStandardWidth) {
      mods.push(`Épaisseur des traits ajustée à ${selectedMachine.cutStrokeWidth} mm`);
    }
    
    return mods;
  }, [selectedMachine, selectedFormat, elements]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-drawhard-beige border-2 border-drawhard-dark w-full max-w-[600px] shadow-xl">
        <div className="flex items-center justify-between p-4 border-b-2 border-drawhard-dark">
          <h2 className="text-lg font-bold uppercase tracking-extra-wide">
            Export Découpe Laser
          </h2>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Machine laser
            </label>
            <select
              value={selectedMachineId}
              onChange={handleMachineChange}
              className="w-full p-3 border-2 border-drawhard-dark bg-white font-mono text-sm focus:outline-none focus:border-drawhard-dark"
            >
              <option value="">Sélectionnez votre machine...</option>
              {Object.values(LASER_MACHINES).map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}{machine.subtitle ? ` (${machine.subtitle})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedMachine && (
            <>
              <div className="text-sm leading-relaxed opacity-80">
                {selectedMachine.description}
              </div>

              <div>
                <div className="text-sm font-semibold mb-2">Modifications effectuées à l'export</div>
                {modifications.length === 0 ? (
                  <div className="text-sm opacity-60">
                    Aucune, le fichier est déjà compatible.
                  </div>
                ) : (
                  <ul className="text-sm space-y-1">
                    {modifications.map((mod, idx) => (
                      <li key={idx} className="opacity-80">• {mod}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Format
                </label>
                <div className="flex gap-2">
                  {selectedMachine.formats.map((format) => (
                    <button
                      key={format.name}
                      onClick={() => format.available && setSelectedFormat(format.name)}
                      disabled={!format.available}
                      className={`
                        flex-1 py-2 border-2 font-mono text-sm transition-colors
                        ${selectedFormat === format.name && format.available
                          ? 'border-drawhard-dark bg-drawhard-dark text-white'
                          : format.available
                          ? 'border-drawhard-dark hover:bg-drawhard-grid hover:bg-opacity-20'
                          : 'border-drawhard-grid text-drawhard-grid opacity-40 cursor-not-allowed'
                        }
                      `}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t-2 border-drawhard-dark">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-drawhard-dark hover:bg-drawhard-grid hover:bg-opacity-20 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport}
            className={`
              px-6 py-2 border-2 font-bold transition-colors
              ${canExport
                ? 'border-drawhard-dark bg-drawhard-dark text-white hover:opacity-80'
                : 'border-drawhard-grid bg-drawhard-grid text-white opacity-40 cursor-not-allowed'
              }
            `}
          >
            Exporter
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaserExportModal;

