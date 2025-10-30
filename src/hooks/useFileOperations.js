import { useCallback } from 'react';
import { importSVG } from '../utils/svgImporter';
import { exportForLaser } from '../utils/laserExporter';
import packageJson from '../../package.json';

/**
 * Hook personnalisé pour gérer toutes les opérations de fichiers
 * (Nouveau, Ouvrir, Sauvegarder, Import/Export)
 * 
 * Extrait de CADEditor.jsx pour améliorer la maintenabilité
 */
export const useFileOperations = ({
  elements,
  guides,
  workArea,
  currentFileName,
  hasUnsavedChanges,
  updateElements,
  setSelectedIds,
  clearSelection,
  setCurrentFileName,
  setHasUnsavedChanges,
  setGuides,
  setWorkArea,
  getNextId,
  syncNextId,
  setShowLaserExportModal
}) => {
  
  /**
   * Créer un nouveau projet
   */
  const handleNew = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment créer un nouveau projet ?');
      if (!confirm) return;
    }
    updateElements([]);
    syncNextId([]);
    setSelectedIds([]);
    clearSelection();
    setCurrentFileName('Sans titre');
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, updateElements, syncNextId, setSelectedIds, clearSelection, setCurrentFileName, setHasUnsavedChanges]);

  /**
   * Ouvrir un projet existant (.json)
   */
  const handleOpen = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          const loadedElements = data.elements || [];
          updateElements(loadedElements);
          syncNextId(loadedElements);
          setGuides(data.guides || []);
          if (data.workArea) {
            setWorkArea(data.workArea);
          }
          setCurrentFileName(file.name.replace('.json', ''));
          setHasUnsavedChanges(false);
        } catch (error) {
          alert('Erreur lors du chargement du fichier : ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [updateElements, syncNextId, setGuides, setWorkArea, setCurrentFileName, setHasUnsavedChanges]);

  /**
   * Importer un fichier SVG
   */
  const handleImportSVG = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.svg';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const svgString = event.target.result;
        const result = importSVG(svgString, getNextId, workArea.width, workArea.height);
        
        if (result.success) {
          const newElements = [...elements, ...result.elements];
          updateElements(newElements);
          syncNextId(newElements);
          setHasUnsavedChanges(true);
          alert(`Import réussi ! ${result.elements.length} élément(s) importé(s).`);
        } else {
          alert(`Erreur lors de l'import SVG : ${result.error}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [elements, getNextId, syncNextId, updateElements, workArea, setHasUnsavedChanges]);

  /**
   * Sauvegarder le projet actuel
   */
  const handleSave = useCallback(() => {
    const data = {
      elements,
      guides,
      workArea,
      version: packageJson.version
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
  }, [elements, guides, workArea, currentFileName, setHasUnsavedChanges]);

  /**
   * Sauvegarder sous un nouveau nom
   */
  const handleSaveAs = useCallback(() => {
    const newName = prompt('Entrez le nom du fichier :', currentFileName);
    if (!newName) return;
    
    setCurrentFileName(newName);
    
    const data = {
      elements,
      guides,
      workArea,
      version: packageJson.version
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHasUnsavedChanges(false);
  }, [elements, guides, workArea, currentFileName, setCurrentFileName, setHasUnsavedChanges]);

  /**
   * Ouvrir la modal d'export laser
   */
  const handleLaserExport = useCallback(() => {
    if (elements.length === 0) {
      alert('Aucun élément à exporter !');
      return;
    }
    setShowLaserExportModal(true);
  }, [elements, setShowLaserExportModal]);

  /**
   * Confirmer l'export laser avec machine et format sélectionnés
   */
  const handleLaserExportConfirm = useCallback((machine, format) => {
    try {
      const result = exportForLaser(elements, machine, format, currentFileName, workArea);
      if (result.success) {
        alert(`✅ Export réussi !\n\nFichier: ${result.fileName}\nMachine: ${machine.name}\nFormat: ${format}\nÉléments: ${result.elementsCount}\nZone de travail: ${result.workAreaWidth.toFixed(1)} × ${result.workAreaHeight.toFixed(1)} mm`);
      }
    } catch (error) {
      alert(`❌ Erreur lors de l'export :\n${error.message}`);
    }
  }, [elements, currentFileName, workArea]);

  /**
   * Exporter vers différents formats (SVG, PNG, DXF)
   */
  const handleExport = useCallback((format) => {
    if (elements.length === 0) {
      alert('Aucun élément à exporter !');
      return;
    }
    
    const width = workArea.width;
    const height = workArea.height;
    const offsetX = width / 2;
    const offsetY = height / 2;
    
    if (format === 'svg') {
      let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
      svgContent += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}mm" height="${height}mm">\n`;
      svgContent += `  <!-- Export CAD 2D Editor -->\n`;
      svgContent += `  <!-- Zone de travail: ${width} × ${height} mm -->\n`;
      svgContent += `  <!-- 1 unité = 1mm -->\n\n`;
      
      svgContent += `  <!-- Rectangle de référence de la zone de travail -->\n`;
      svgContent += `  <rect x="0" y="0" width="${width}" height="${height}" stroke="#0000ff" stroke-width="0.01" fill="none" opacity="0.3" />\n\n`;
      
      elements.forEach(el => {
        if (el.type === 'line') {
          svgContent += `  <line x1="${el.x1 + offsetX}" y1="${el.y1 + offsetY}" x2="${el.x2 + offsetX}" y2="${el.y2 + offsetY}" stroke="black" stroke-width="0.3" fill="none" />\n`;
        } else if (el.type === 'rectangle') {
          svgContent += `  <rect x="${el.x + offsetX}" y="${el.y + offsetY}" width="${el.width}" height="${el.height}" stroke="black" stroke-width="0.3" fill="none" />\n`;
        } else if (el.type === 'circle') {
          const rx = el.radiusX || el.radius;
          const ry = el.radiusY || el.radius;
          if (rx === ry) {
            svgContent += `  <circle cx="${el.cx + offsetX}" cy="${el.cy + offsetY}" r="${rx}" stroke="black" stroke-width="0.3" fill="none" />\n`;
          } else {
            svgContent += `  <ellipse cx="${el.cx + offsetX}" cy="${el.cy + offsetY}" rx="${rx}" ry="${ry}" stroke="black" stroke-width="0.3" fill="none" />\n`;
          }
        } else if (el.type === 'arc') {
          const rx = el.radiusX || el.radius;
          const ry = el.radiusY || el.radius;
          const startX = el.cx + rx * Math.cos(el.startAngle);
          const startY = el.cy + ry * Math.sin(el.startAngle);
          const endX = el.cx + rx * Math.cos(el.endAngle);
          const endY = el.cy + ry * Math.sin(el.endAngle);
          
          let angleDiff = el.endAngle - el.startAngle;
          while (angleDiff < 0) angleDiff += 2 * Math.PI;
          while (angleDiff > 2 * Math.PI) angleDiff -= 2 * Math.PI;
          
          const largeArc = angleDiff > Math.PI ? 1 : 0;
          const sweepFlag = 1;
          
          svgContent += `  <path d="M ${startX + offsetX} ${startY + offsetY} A ${rx} ${ry} 0 ${largeArc} ${sweepFlag} ${endX + offsetX} ${endY + offsetY}" stroke="black" stroke-width="0.3" fill="none" />\n`;
        } else if (el.type === 'curve') {
          if (el.cpx !== undefined && el.cpy !== undefined) {
            svgContent += `  <path d="M ${el.x1 + offsetX} ${el.y1 + offsetY} Q ${el.cpx + offsetX} ${el.cpy + offsetY} ${el.x2 + offsetX} ${el.y2 + offsetY}" stroke="black" stroke-width="0.3" fill="none" />\n`;
          } else {
            svgContent += `  <line x1="${el.x1 + offsetX}" y1="${el.y1 + offsetY}" x2="${el.x2 + offsetX}" y2="${el.y2 + offsetY}" stroke="black" stroke-width="0.3" fill="none" />\n`;
          }
        } else if (el.type === 'text') {
          const escapedText = el.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          svgContent += `  <text x="${el.x + offsetX}" y="${el.y + offsetY}" font-family="${el.fontFamily}" font-size="${el.fontSize}" font-weight="${el.fontWeight}" font-style="${el.fontStyle}" fill="black">${escapedText}</text>\n`;
        }
      });
      
      svgContent += '</svg>';
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentFileName}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      const scale = 3.7795275591;
      const canvasWidth = Math.ceil(width * scale);
      const canvasHeight = Math.ceil(height * scale);
      
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasWidth;
      exportCanvas.height = canvasHeight;
      const ctx = exportCanvas.getContext('2d');
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      ctx.save();
      ctx.translate(offsetX * scale, offsetY * scale);
      ctx.scale(scale, scale);
      
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 0.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      elements.forEach(el => {
        if (el.type === 'text') {
          ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
          ctx.fillStyle = 'black';
          ctx.textBaseline = 'bottom';
          ctx.fillText(el.text, el.x, el.y);
        } else {
          ctx.beginPath();
          if (el.type === 'line') {
            ctx.moveTo(el.x1, el.y1);
            ctx.lineTo(el.x2, el.y2);
            ctx.stroke();
          } else if (el.type === 'rectangle') {
            ctx.rect(el.x, el.y, el.width, el.height);
            ctx.stroke();
          } else if (el.type === 'circle') {
            const rx = el.radiusX || el.radius;
            const ry = el.radiusY || el.radius;
            if (rx === ry) {
              ctx.arc(el.cx, el.cy, rx, 0, Math.PI * 2);
            } else {
              ctx.ellipse(el.cx, el.cy, rx, ry, 0, 0, Math.PI * 2);
            }
            ctx.stroke();
          } else if (el.type === 'arc') {
            const rx = el.radiusX || el.radius;
            const ry = el.radiusY || el.radius;
            if (rx === ry) {
              ctx.arc(el.cx, el.cy, rx, el.startAngle, el.endAngle);
            } else {
              ctx.ellipse(el.cx, el.cy, rx, ry, 0, el.startAngle, el.endAngle);
            }
            ctx.stroke();
          }
        }
      });
      
      ctx.restore();
      
      exportCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentFileName}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } else if (format === 'dxf') {
      alert('L\'export DXF sera bientôt implémenté !');
    }
  }, [elements, currentFileName, workArea]);

  return {
    handleNew,
    handleOpen,
    handleImportSVG,
    handleSave,
    handleSaveAs,
    handleLaserExport,
    handleLaserExportConfirm,
    handleExport
  };
};

