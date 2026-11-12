import { useState, type ChangeEvent } from 'react';
import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, AtSign, ImagePlus } from 'lucide-react';
import { Sheet, Row, Slider, Switch, SwatchRow } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { SOCIAL_LOGOS, socialLogoSvg, socialLogoUrl, isSocialLogo, type SocialLogo } from '../../../utils/socialLogos';
import type { EditorActions } from './selection';

const CORNERS: { id: string; label: string; Icon: typeof ArrowUpLeft; matches: (p?: string) => boolean }[] = [
  { id: 'top-left', label: 'Top left', Icon: ArrowUpLeft, matches: (p) => p === 'top-left' || p === 'tl' },
  { id: 'top-right', label: 'Top right', Icon: ArrowUpRight, matches: (p) => p === 'top-right' || p === 'tr' },
  { id: 'bottom-left', label: 'Bottom left', Icon: ArrowDownLeft, matches: (p) => p === 'bottom-left' || p === 'bl' },
  { id: 'bottom-right', label: 'Bottom right', Icon: ArrowDownRight, matches: (p) => !p || p === 'bottom-right' || p === 'br' },
];

const COLORS = ['#ffffff', '#000000', '#ff5a36', '#ffd60a'];

// A built-in mark, drawn in the button's colour.
function LogoMark({ logo, size = 18 }: { logo: SocialLogo; size?: number }) {
  return (
    <span
      className="vt-wm-mark"
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: socialLogoSvg(logo, 'currentColor') }}
    />
  );
}

// Canvas > Watermark: the name (with an @) and an optional logo (Instagram, Facebook or X, or an
// uploaded picture), then its corner, colour, size and opacity. The switch sits in the header beside
// the title; the settings show while it's on. Matches the video editor's watermark sheet UI.
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
    if (watermark.logoType && isSocialLogo(watermark.logoType)) {
      updateWatermark('imageUrl', socialLogoUrl(watermark.logoType, c));
    }
  };

  const clearLogo = () => {
    updateWatermark('logoType', null);
    updateWatermark('imageUrl', null);
  };

  const pickLogo = (id: SocialLogo) => {
    if (watermark.logoType === id) {
      clearLogo();
    } else {
      updateWatermark('logoType', id);
      updateWatermark('imageUrl', socialLogoUrl(id, currentColor));
    }
  };

  const upload = (e: ChangeEvent<HTMLInputElement>) => {
    updateWatermark('logoType', 'custom');
    actions.handleWatermarkImageUpload(e);
  };

  return (
    <Sheet
      Icon={AtSign}
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
      {!isEnabled && (
        <p className="vt-panel-hint vt-wm-empty">Switch it on to sign your meme with a name or logo.</p>
      )}
      {isEnabled && (
        <div className="vt-wm">
          <div className="vt-wm-identity">
            <button
              type="button"
              className={`vt-wm-logo${watermark.imageUrl ? ' is-set' : ''}${logoMenuOpen ? ' is-open' : ''}`}
              aria-label="Logo"
              aria-expanded={logoMenuOpen}
              title="Add a logo"
              onClick={() => setLogoMenuOpen((o) => !o)}
            >
              {watermark.logoType && isSocialLogo(watermark.logoType) ? (
                <LogoMark logo={watermark.logoType} />
              ) : watermark.imageUrl ? (
                <img src={watermark.imageUrl} alt="" />
              ) : (
                <ImagePlus size={18} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
            <label className="vt-wm-name">
              <span className="vt-wm-at" aria-hidden="true">@</span>
              <input
                aria-label="Watermark name"
                placeholder="username"
                maxLength={40}
                value={(watermark.text || '').replace(/^@/, '')}
                onChange={(e) => {
                  const raw = e.target.value.replace(/^@+/, '');
                  updateWatermark('text', raw ? `@${raw}` : '');
                }}
              />
            </label>
          </div>
          <div className={`vt-wm-logos${logoMenuOpen ? ' is-open' : ''}`} aria-hidden={!logoMenuOpen}>
            <div className="vt-wm-logos-inner">
              {SOCIAL_LOGOS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`vt-wm-logo-pick${watermark.logoType === id ? ' is-on' : ''}`}
                  aria-label={`${label} logo`}
                  aria-pressed={watermark.logoType === id}
                  title={label}
                  tabIndex={logoMenuOpen ? 0 : -1}
                  onClick={() => pickLogo(id)}
                >
                  <LogoMark logo={id} size={17} />
                </button>
              ))}
              <label
                className={`vt-wm-logo-pick vt-wm-upload${watermark.logoType === 'custom' ? ' is-on' : ''}`}
                title="Upload a logo"
              >
                <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload a logo"
                  hidden
                  tabIndex={logoMenuOpen ? 0 : -1}
                  onChange={upload}
                />
              </label>
              {watermark.imageUrl && (
                <button
                  type="button"
                  className="vt-wm-logo-pick vt-wm-nologo"
                  tabIndex={logoMenuOpen ? 0 : -1}
                  onClick={clearLogo}
                >
                  No logo
                </button>
              )}
            </div>
          </div>
          <Row label="Corner">
            <div className="vt-wm-corners" role="radiogroup" aria-label="Watermark position">
              {CORNERS.map(({ id, label, Icon, matches }) => {
                const on = matches(currentPos);
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={label}
                    title={label}
                    className={`vt-wm-corner${on ? ' is-on' : ''}`}
                    onClick={() => updateWatermark('position', id)}
                  >
                    <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </Row>
          <Row label="Colour">
            <SwatchRow ariaLabel="Watermark colour" colors={COLORS} value={currentColor} onChange={onSelectColor} />
          </Row>
          <div className="vt-wm-pair">
            <div className="vt-wm-pair-item">
              <span className="ui-row-label">Size</span>
              <Slider
                label="Watermark size"
                min={12}
                max={48}
                value={currentSize}
                onChange={(v) => updateWatermark('size', v)}
                format={String}
              />
            </div>
            <div className="vt-wm-pair-item">
              <span className="ui-row-label">Opacity</span>
              <Slider
                label="Watermark opacity"
                min={0.1}
                max={1}
                step={0.05}
                value={currentOpacity}
                onChange={(v) => updateWatermark('opacity', v)}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
