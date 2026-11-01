import { useState } from 'react';
import { ImagePlus, ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight } from 'lucide-react';
import { Sheet, Section, Row, Slider, Switch, SwatchRow } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

const SPOTS = [
  { value: 'top-left', label: 'Top left', Icon: ArrowUpLeft },
  { value: 'top-right', label: 'Top right', Icon: ArrowUpRight },
  { value: 'bottom-left', label: 'Bottom left', Icon: ArrowDownLeft },
  { value: 'bottom-right', label: 'Bottom right', Icon: ArrowDownRight },
];

const COLORS = ['#ffffff', '#000000', '#ff5a36', '#ffd60a'];

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function getSocialSvg(type: 'instagram' | 'facebook' | 'x', color = '#ffffff') {
  const enc = encodeURIComponent(color);
  if (type === 'instagram') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="${enc}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`;
  }
  if (type === 'facebook') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="${enc}"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`;
  }
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="${enc}"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
}

// Canvas > Watermark: the name and an optional logo (Instagram, Facebook or X drawn in the watermark
// colour, or an uploaded picture), then its corner, colour, size and opacity. The switch sits in the
// header beside the title; the settings show while it's on.
export default function WatermarkSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const watermark = useEditorUiStore((s: { watermark: Record<string, any> }) => s.watermark);
  const updateWatermark = useEditorUiStore((s: { updateWatermark: (key: string, value: unknown) => void }) => s.updateWatermark);
  const isEnabled = Boolean(watermark?.enabled);
  const currentPos = watermark.position || 'bottom-right';
  const currentColor = (watermark.color || '#ffffff').toLowerCase();
  const currentSize = watermark.size || 24;
  const currentOpacity = watermark.opacity ?? 0.5;

  const [logoMenuOpen, setLogoMenuOpen] = useState(false);

  const onSelectColor = (c: string) => {
    updateWatermark('color', c);
    if (watermark.logoType === 'instagram' || watermark.logoType === 'facebook' || watermark.logoType === 'x') {
      updateWatermark('imageUrl', getSocialSvg(watermark.logoType, c));
    }
  };

  return (
    <Sheet
      className="ie-watermark-sheet ie-tool-sheet"
      title="Watermark"
      onClose={onClose}
      aside={(
        <Switch
          label="Watermark"
          checked={isEnabled}
          onChange={(on) => {
            updateWatermark('enabled', on);
            if (!on) setLogoMenuOpen(false);
          }}
        />
      )}
    >
      {!isEnabled && <p className="ie-empty">Switch it on to sign your meme with a name or logo.</p>}
      {isEnabled && (
        <>
              {/* Row 1: Identity Block (Logo Button + Text Box + Inbuilt Logos Tray) */}
              <div className="ie-wm-identity-block">
                <div className="ie-wm-row-identity">
                  <button
                    type="button"
                    className={`ie-wm-logo-circle${watermark.imageUrl ? ' is-active' : ''}${logoMenuOpen ? ' is-open' : ''}`}
                    aria-label="Watermark logo options"
                    title="Choose logo (Instagram, Facebook, X, or Upload)"
                    onClick={() => setLogoMenuOpen((prev) => !prev)}
                  >
                    {watermark.logoType === 'instagram' ? (
                      <InstagramIcon size={18} />
                    ) : watermark.logoType === 'facebook' ? (
                      <FacebookIcon size={18} />
                    ) : watermark.logoType === 'x' ? (
                      <XIcon size={16} />
                    ) : watermark.imageUrl ? (
                      <img src={watermark.imageUrl} alt="Watermark logo" className="ie-wm-logo-circle-img" />
                    ) : (
                      <ImagePlus size={18} strokeWidth={2} />
                    )}
                  </button>

                  {/* Text Box with round edges & transparent background */}
                  <div className="ie-wm-input-inner ie-wm-input-pill">
                    <span className="ie-wm-at" aria-hidden="true">@</span>
                    <input
                      className="ie-wm-input-field"
                      aria-label="Watermark name"
                      placeholder="username"
                      value={(watermark.text || '').replace(/^@/, '')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/^@+/, '');
                        updateWatermark('text', raw ? `@${raw}` : '');
                      }}
                    />
                  </div>
                </div>

                {/* Inbuilt Logos & Upload Tray (Smooth Zero-Jerk Collapse) */}
                <div
                  className={`ie-wm-logo-tray${logoMenuOpen ? ' is-open' : ''}`}
                  aria-hidden={!logoMenuOpen}
                >
                  <div className="ie-wm-logo-tray-inner">
                    {/* Instagram */}
                    <button
                      type="button"
                      className={`ie-wm-tray-btn ie-wm-tray-icon-btn${watermark.logoType === 'instagram' ? ' is-selected' : ''}`}
                      title="Instagram"
                      aria-label="Instagram logo"
                      tabIndex={logoMenuOpen ? 0 : -1}
                      onClick={() => {
                        if (watermark.logoType === 'instagram') {
                          updateWatermark('logoType', null);
                          updateWatermark('imageUrl', null);
                        } else {
                          updateWatermark('logoType', 'instagram');
                          updateWatermark('imageUrl', getSocialSvg('instagram', watermark.color || '#ffffff'));
                        }
                      }}
                    >
                      <InstagramIcon size={17} />
                    </button>

                    {/* Facebook */}
                    <button
                      type="button"
                      className={`ie-wm-tray-btn ie-wm-tray-icon-btn${watermark.logoType === 'facebook' ? ' is-selected' : ''}`}
                      title="Facebook"
                      aria-label="Facebook logo"
                      tabIndex={logoMenuOpen ? 0 : -1}
                      onClick={() => {
                        if (watermark.logoType === 'facebook') {
                          updateWatermark('logoType', null);
                          updateWatermark('imageUrl', null);
                        } else {
                          updateWatermark('logoType', 'facebook');
                          updateWatermark('imageUrl', getSocialSvg('facebook', watermark.color || '#ffffff'));
                        }
                      }}
                    >
                      <FacebookIcon size={17} />
                    </button>

                    {/* X */}
                    <button
                      type="button"
                      className={`ie-wm-tray-btn ie-wm-tray-icon-btn${watermark.logoType === 'x' ? ' is-selected' : ''}`}
                      title="X (Twitter)"
                      aria-label="X logo"
                      tabIndex={logoMenuOpen ? 0 : -1}
                      onClick={() => {
                        if (watermark.logoType === 'x') {
                          updateWatermark('logoType', null);
                          updateWatermark('imageUrl', null);
                        } else {
                          updateWatermark('logoType', 'x');
                          updateWatermark('imageUrl', getSocialSvg('x', watermark.color || '#ffffff'));
                        }
                      }}
                    >
                      <XIcon size={15} />
                    </button>

                    {/* Upload */}
                    <label
                      className={`ie-wm-tray-btn${watermark.logoType === 'custom' ? ' is-selected' : ''}`}
                      title="Upload custom logo image"
                      aria-label="Upload custom image"
                      tabIndex={logoMenuOpen ? 0 : -1}
                    >
                      <ImagePlus size={15} strokeWidth={2} />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        aria-label="Upload logo watermark"
                        hidden
                        onChange={(e) => {
                          updateWatermark('logoType', 'custom');
                          actions.handleWatermarkImageUpload(e);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

          <Section>
            <Row label="Corner">
              <div className="ie-wm-corners" role="radiogroup" aria-label="Watermark position">
                {SPOTS.map((s) => {
                  const on = currentPos === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={s.label}
                      title={s.label}
                      className={`ie-wm-corner-btn${on ? ' is-on' : ''}`}
                      onClick={() => updateWatermark('position', s.value)}
                    >
                      <s.Icon size={16} strokeWidth={2.2} />
                    </button>
                  );
                })}
              </div>
            </Row>
            <Row label="Color">
              <SwatchRow ariaLabel="Watermark colour" colors={COLORS} value={currentColor} onChange={onSelectColor} />
            </Row>
            {/* Size and opacity share one line, each labelled above its slider. */}
            <div className="ie-wm-pair">
              <div className="ie-wm-pair-item">
                <span className="ui-row-label">Size</span>
                <Slider label="Watermark size" min={12} max={48} value={currentSize} onChange={(v) => updateWatermark('size', v)} format={String} />
              </div>
              <div className="ie-wm-pair-item">
                <span className="ui-row-label">Opacity</span>
                <Slider label="Watermark opacity" min={0.1} max={1} step={0.05} value={currentOpacity} onChange={(v) => updateWatermark('opacity', v)} format={(v) => `${Math.round(v * 100)}%`} />
              </div>
            </div>
          </Section>
        </>
      )}
    </Sheet>
  );
}
