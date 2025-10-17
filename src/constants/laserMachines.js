export const LASER_MACHINES = {
  epilog: {
    id: 'epilog',
    name: 'Epilog',
    description: 'Interprète automatiquement les traits fins rouges comme vecteurs de découpe. Les traits épais ou remplis noirs sont traités en gravure raster.',
    formats: [
      { name: 'PDF', available: true },
      { name: 'AI', available: false },
      { name: 'EPS', available: false },
      { name: 'SVG', available: true }
    ],
    preferredFormat: 'PDF',
    units: 'mm',
    cutStrokeWidth: 0.01,
    cutStrokeColor: { r: 255, g: 0, b: 0 },
    engraveColor: { r: 0, g: 0, b: 0 },
    engraveMode: 'raster',
    tip: '💡 Les traits rouges fins seront automatiquement détectés comme lignes de coupe'
  },
  trotec: {
    id: 'trotec',
    name: 'Trotec',
    subtitle: 'JobControl / Ruby',
    description: 'Chaque couleur = calque avec paramètres laser spécifiques. Rouge = découpe, Bleu = gravure vectorielle, Noir = gravure raster.',
    formats: [
      { name: 'DXF', available: false },
      { name: 'PDF', available: true },
      { name: 'SVG', available: true }
    ],
    preferredFormat: 'PDF',
    units: 'mm',
    cutStrokeWidth: 0.1,
    cutStrokeColor: { r: 255, g: 0, b: 0 },
    vectorEngraveColor: { r: 0, g: 0, b: 255 },
    rasterEngraveColor: { r: 0, g: 0, b: 0 },
    tip: '💡 Système de calques couleur - personnalisez chaque calque dans JobControl'
  },
  gcc: {
    id: 'gcc',
    name: 'GCC LaserPro',
    description: 'Très similaire à Epilog. Traits fins rouges pour la découpe, noir pour la gravure. Configuration simple et efficace.',
    formats: [
      { name: 'PDF', available: true },
      { name: 'AI', available: false },
      { name: 'SVG', available: true }
    ],
    preferredFormat: 'PDF',
    units: 'mm',
    cutStrokeWidth: 0.01,
    cutStrokeColor: { r: 255, g: 0, b: 0 },
    engraveColor: { r: 0, g: 0, b: 0 },
    tip: '💡 Compatible avec la plupart des drivers GCC standards'
  },
  glowforge: {
    id: 'glowforge',
    name: 'Glowforge',
    description: 'Chaque couleur correspond à une opération distincte. L\'épaisseur du trait est ignorée, tout est géré via l\'application web.',
    formats: [
      { name: 'SVG', available: true },
      { name: 'PDF', available: true }
    ],
    preferredFormat: 'PDF',
    units: 'mm',
    cutStrokeWidth: 0.1,
    cutStrokeColor: { r: 255, g: 0, b: 0 },
    engraveColor: { r: 0, g: 0, b: 0 },
    tip: '💡 Importez dans l\'app Glowforge et ajustez les paramètres en ligne'
  },
  xtool: {
    id: 'xtool',
    name: 'xTool',
    subtitle: 'Creative Space / LightBurn',
    description: 'Très flexible, repose sur LightBurn logic. Système de calques couleur. Noir = gravure, rouge = découpe.',
    formats: [
      { name: 'SVG', available: true },
      { name: 'PDF', available: true },
      { name: 'DXF', available: false }
    ],
    preferredFormat: 'PDF',
    units: 'mm',
    cutStrokeWidth: 0.1,
    cutStrokeColor: { r: 255, g: 0, b: 0 },
    engraveColor: { r: 0, g: 0, b: 0 },
    tip: '💡 Utilisable avec Creative Space ou LightBurn selon votre préférence'
  },
  lightburn: {
    id: 'lightburn',
    name: 'LightBurn',
    description: 'Le couteau suisse du laser ! Couleur = calque (jusqu\'à 30). L\'export conserve les couleurs RVB exactes pour une séparation parfaite.',
    formats: [
      { name: 'SVG', available: true },
      { name: 'PDF', available: true },
      { name: 'DXF', available: false },
      { name: 'LBRN', available: false }
    ],
    preferredFormat: 'PDF',
    units: 'mm',
    cutStrokeWidth: 0.1,
    cutStrokeColor: { r: 255, g: 0, b: 0 },
    supportLayerColors: true,
    maxLayers: 30,
    tip: '💡 Compatible avec la plupart des machines via LightBurn'
  },
  omtech: {
    id: 'omtech',
    name: 'OMTech / K40 / Ruida',
    description: 'Compatible LightBurn et RDWorks. Système de calques couleur standard. Parfait pour les contrôleurs Ruida.',
    formats: [
      { name: 'DXF', available: false },
      { name: 'PDF', available: true },
      { name: 'SVG', available: true }
    ],
    preferredFormat: 'PDF',
    units: 'mm',
    cutStrokeWidth: 0.1,
    cutStrokeColor: { r: 255, g: 0, b: 0 },
    tip: '💡 Importez dans LightBurn ou RDWorks selon votre setup'
  },
  uls: {
    id: 'uls',
    name: 'Universal Laser Systems',
    description: 'Système professionnel, similaire à Epilog. Traits fins rouges (0,01 mm) pour la découpe précise. Remplis = gravure.',
    formats: [
      { name: 'PDF', available: true },
      { name: 'AI', available: false },
      { name: 'SVG', available: true }
    ],
    preferredFormat: 'PDF',
    units: 'mm',
    cutStrokeWidth: 0.01,
    cutStrokeColor: { r: 255, g: 0, b: 0 },
    engraveColor: { r: 0, g: 0, b: 0 },
    tip: '💡 Qualité professionnelle garantie avec les paramètres ULS'
  },
  fullspectrum: {
    id: 'fullspectrum',
    name: 'Full Spectrum Laser',
    subtitle: 'RetinaEngrave',
    description: 'Fonctionne comme une imprimante virtuelle. Traits rouges pour découpe, formes remplies pour gravure. Interface intuitive.',
    formats: [
      { name: 'SVG', available: true },
      { name: 'PDF', available: true }
    ],
    preferredFormat: 'PDF',
    units: 'mm',
    cutStrokeWidth: 0.025,
    cutStrokeColor: { r: 255, g: 0, b: 0 },
    engraveColor: { r: 0, g: 0, b: 0 },
    tip: '💡 RetinaEngrave détecte automatiquement les paramètres'
  }
};

