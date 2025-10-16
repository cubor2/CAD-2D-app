import React from 'react';

const DesignSystem = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white border-2 border-drawhard-dark w-[800px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-drawhard-dark text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold uppercase tracking-extra-wide">Design System</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-drawhard-accent text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-lg font-bold uppercase tracking-extra-wide mb-4 border-b-2 border-drawhard-dark pb-2">Identité Brutalist</h3>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Angles droits</strong> : Aucune bordure arrondie (border-radius: 0)</li>
              <li>• <strong>Fonctionnel</strong> : Chaque élément a un rôle précis, pas de fioritures</li>
              <li>• <strong>Contraste fort</strong> : Noir sur blanc, lignes épaisses de 2px minimum</li>
              <li>• <strong>Pixel Perfect</strong> : Alignement sur grille de 4px (4, 8, 12, 24px)</li>
              <li>• <strong>Typographie</strong> : Inter Bold, UPPERCASE, tracking large (0.15em)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold uppercase tracking-extra-wide mb-4 border-b-2 border-drawhard-dark pb-2">Palette de Couleurs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white border-2 border-drawhard-dark"></div>
                  <div>
                    <div className="font-mono text-sm font-bold">#FFFFFF</div>
                    <div className="text-xs text-drawhard-hover">Main Background</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16" style={{backgroundColor: '#D8D3C7', border: '2px solid #2B2B2B'}}></div>
                  <div>
                    <div className="font-mono text-sm font-bold">#D8D3C7</div>
                    <div className="text-xs text-drawhard-hover">Grid/Lines</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-drawhard-dark border-2 border-drawhard-dark"></div>
                  <div>
                    <div className="font-mono text-sm font-bold">#2B2B2B</div>
                    <div className="text-xs text-drawhard-hover">Interface Dark</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-drawhard-accent border-2 border-drawhard-dark"></div>
                  <div>
                    <div className="font-mono text-sm font-bold">#E44A33</div>
                    <div className="text-xs text-drawhard-hover">Accent (Selection)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16" style={{backgroundColor: '#FF8C00', border: '2px solid #2B2B2B'}}></div>
                  <div>
                    <div className="font-mono text-sm font-bold">#FF8C00</div>
                    <div className="text-xs text-drawhard-hover">Edit Mode</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-drawhard-text border-2 border-drawhard-dark"></div>
                  <div>
                    <div className="font-mono text-sm font-bold">#1F1F1F</div>
                    <div className="text-xs text-drawhard-hover">Text Primary</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold uppercase tracking-extra-wide mb-4 border-b-2 border-drawhard-dark pb-2">Typographie</h3>
            <div className="space-y-4">
              <div className="border-2 border-drawhard-dark p-4">
                <div className="text-sm text-drawhard-hover mb-2">Titres / Labels</div>
                <div className="text-sm font-bold uppercase tracking-extra-wide">ZONE DE TRAVAIL</div>
                <div className="text-xs font-mono mt-2 text-drawhard-hover">
                  font-family: Inter<br/>
                  font-weight: 700 (Bold)<br/>
                  text-transform: uppercase<br/>
                  letter-spacing: 0.15em
                </div>
              </div>
              <div className="border-2 border-drawhard-dark p-4">
                <div className="text-sm text-drawhard-hover mb-2">Corps de texte</div>
                <div className="text-sm">Texte standard, lisible et fonctionnel</div>
                <div className="text-xs font-mono mt-2 text-drawhard-hover">
                  font-family: Inter<br/>
                  font-weight: 400 (Regular)<br/>
                  font-size: 12-14px
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold uppercase tracking-extra-wide mb-4 border-b-2 border-drawhard-dark pb-2">Espacement</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-4 bg-drawhard-dark"></div>
                <span className="font-mono text-sm">4px - Espacement minimal</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-4 bg-drawhard-dark"></div>
                <span className="font-mono text-sm">8px - Espacement compact</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 h-4 bg-drawhard-dark"></div>
                <span className="font-mono text-sm">12px - Espacement standard</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-48 h-4 bg-drawhard-dark"></div>
                <span className="font-mono text-sm">24px - Espacement large</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold uppercase tracking-extra-wide mb-4 border-b-2 border-drawhard-dark pb-2">Éléments UI</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-drawhard-hover mb-2">Bordures</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-drawhard-dark p-3 text-center text-xs">1px - Inputs</div>
                  <div className="border-2 border-drawhard-dark p-3 text-center text-xs">2px - Séparateurs</div>
                  <div className="border-4 border-drawhard-dark p-3 text-center text-xs">10px - Frame principal</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-drawhard-hover mb-2">Boutons</div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-drawhard-beige border-2 border-drawhard-dark hover:bg-drawhard-hover hover:text-white transition-colors font-bold uppercase text-xs tracking-wider">
                    Normal
                  </button>
                  <button className="px-4 py-2 bg-drawhard-accent text-white border-2 border-drawhard-dark font-bold uppercase text-xs tracking-wider">
                    Actif
                  </button>
                  <button className="px-4 py-2 bg-drawhard-hover text-white border-2 border-drawhard-dark font-bold uppercase text-xs tracking-wider">
                    Hover
                  </button>
                </div>
              </div>
              <div>
                <div className="text-sm text-drawhard-hover mb-2">Inputs</div>
                <input 
                  type="text" 
                  placeholder="Zone de saisie"
                  className="w-full bg-drawhard-beige border border-drawhard-dark px-3 py-2 text-sm text-drawhard-dark focus:outline-none focus:border-drawhard-accent"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold uppercase tracking-extra-wide mb-4 border-b-2 border-drawhard-dark pb-2">États & Interactions</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-drawhard-accent"></div>
                <span><strong>Sélectionné</strong> : #E44A33 (Rouge-orange), 2.5px</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4" style={{border: '4px solid #FF8C00'}}></div>
                <span><strong>Mode Édition</strong> : #FF8C00 (Orange vif), 4px</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-drawhard-hover"></div>
                <span><strong>Hover</strong> : #4A4A4A → Texte blanc</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4" style={{backgroundColor: '#00ff00', border: '2px solid #2B2B2B'}}></div>
                <span><strong>Flash (Groupe)</strong> : #00ff00 (Vert), 600ms</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold uppercase tracking-extra-wide mb-4 border-b-2 border-drawhard-dark pb-2">Principes de Structure</h3>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Barre haute</strong> : 48px (h-12), bordure inférieure 2px</li>
              <li>• <strong>Toolbar gauche</strong> : 56px (w-14), bordure droite 2px</li>
              <li>• <strong>Panel droite</strong> : 256px (w-64), bordure gauche 2px</li>
              <li>• <strong>Frame canvas</strong> : 10px fixe, noir #2B2B2B</li>
              <li>• <strong>Séparateurs sections</strong> : Pleine largeur, 2px, noir</li>
              <li>• <strong>Perspective lines</strong> : Blanches, 1.5px, coins supérieurs uniquement</li>
            </ul>
          </section>

          <section className="border-t-2 border-drawhard-dark pt-4">
            <p className="text-xs text-drawhard-hover italic text-center">
              LaserLair • Brutaliste CAD Editor • Designé par Damien Barré avec son pote Claude
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DesignSystem;

