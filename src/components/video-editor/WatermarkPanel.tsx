import { useState, type ChangeEvent } from 'react';
import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, ImagePlus } from 'lucide-react';
import { Row, Slider, SwatchRow, Switch } from '../ui';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { WATERMARK_OPACITY, WATERMARK_SIZE } from '../../utils/brandCard';
import { SOCIAL_LOGOS, socialLogoSvg } from '../../utils/socialLogos';
import type { SocialLogo } from '../../utils/socialLogos';
import type { WatermarkCorner, WatermarkSettings } from '../../model/videoProject';

// Canvas > Watermark, as the image editor's: a switch beside the title; the name (with an @) and a
// logo button that opens the logos (Instagram, Facebook, X, or one uploaded); then the corner,
// colour, size and opacity. Off keeps the settings for next time.

const CORNERS: { id: WatermarkCorner; label: string; Icon: typeof ArrowUpLeft }[] = [
  { id: 'tl', label: 'Top left', Icon: ArrowUpLeft },
  { id: 'tr', label: 'Top right', Icon: ArrowUpRight },
  { id: 'bl', label: 'Bottom left', Icon: ArrowDownLeft },
  { id: 'br', label: 'Bottom right', Icon: ArrowDownRight },
];
const COLORS = ['#ffffff', '#000000', '#ff5a36', '#ffd60a'];
// An uploaded logo is kept small, as a picture in the project.
const LOGO_PX = 256;

const store = useEditorStore.getState;
const current = (): WatermarkSettings => ({ text: '', corner: 'br', ...(store().watermark as WatermarkSettings | null) });
const set = (patch: Partial<WatermarkSettings>) => store().setWatermark({ ...current(), ...patch });
const useWatermark = () => useEditorStore((s) => s.watermark) as WatermarkSettings | null;

// A built-in mark, drawn in the button's colour.
function LogoMark({ logo, size = 18 }: { logo: SocialLogo; size?: number }) {
  return <span className="vt-wm-mark" style={{ width: size, height: size }} aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: socialLogoSvg(logo, 'currentColor') }} />;
}

// An uploaded picture as a PNG data URL no bigger than LOGO_PX.
const shrinkLogo = (file: File) => new Promise<string>((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const k = Math.min(1, LOGO_PX / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * k));
    canvas.height = Math.max(1, Math.round(img.height * k));
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    resolve(canvas.toDataURL('image/png'));
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Not a picture'));
  };
  img.src = url;
});

// The heading's switch.
export function WatermarkAside() {
  const wm = useWatermark();
  const on = Boolean(wm) && wm?.enabled !== false;
  return <Switch label="Watermark" checked={on} onChange={(next) => set({ enabled: next })} />;
}

export default function WatermarkPanel() {
  const wm = useWatermark();
  const [logosOpen, setLogosOpen] = useState(false);
  if (!wm || wm.enabled === false) {
    return <p className="vt-panel-hint vt-wm-empty">Switch it on to sign your video with a name or logo.</p>;
  }
  const color = (wm.color || '#ffffff').toLowerCase();
  const pickLogo = (logo: SocialLogo) => set(wm.logo === logo ? { logo: null } : { logo });
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      set({ logo: 'custom', logoUrl: await shrinkLogo(file) });
    } catch {
      // Not a picture: nothing changes.
    }
  };
  return (
    <div className="vt-wm">
      <div className="vt-wm-identity">
        <button type="button" className={`vt-wm-logo${wm.logo ? ' is-set' : ''}${logosOpen ? ' is-open' : ''}`}
          aria-label="Logo" aria-expanded={logosOpen} title="Add a logo" onClick={() => setLogosOpen((o) => !o)}>
          {wm.logo && wm.logo !== 'custom' ? <LogoMark logo={wm.logo} />
            : wm.logo === 'custom' && wm.logoUrl ? <img src={wm.logoUrl} alt="" />
            : <ImagePlus size={18} strokeWidth={2} aria-hidden="true" />}
        </button>
        <label className="vt-wm-name">
          <span className="vt-wm-at" aria-hidden="true">@</span>
          <input
            aria-label="Watermark name"
            placeholder="yourname"
            maxLength={40}
            value={(wm.text || '').replace(/^@/, '')}
            onChange={(e) => {
              const raw = e.target.value.replace(/^@+/, '');
              set({ text: raw ? `@${raw}` : '' });
            }}
          />
        </label>
      </div>
      <div className={`vt-wm-logos${logosOpen ? ' is-open' : ''}`} aria-hidden={!logosOpen}>
        <div className="vt-wm-logos-inner">
          {SOCIAL_LOGOS.map(({ id, label }) => (
            <button key={id} type="button" className={`vt-wm-logo-pick${wm.logo === id ? ' is-on' : ''}`} aria-label={`${label} logo`}
              aria-pressed={wm.logo === id} title={label} tabIndex={logosOpen ? 0 : -1} onClick={() => pickLogo(id)}>
              <LogoMark logo={id} size={17} />
            </button>
          ))}
          <label className={`vt-wm-logo-pick vt-wm-upload${wm.logo === 'custom' ? ' is-on' : ''}`} title="Upload a logo">
            <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
            <span>Upload</span>
            <input type="file" accept="image/*" aria-label="Upload a logo" hidden tabIndex={logosOpen ? 0 : -1} onChange={upload} />
          </label>
          {wm.logo && (
            <button type="button" className="vt-wm-logo-pick vt-wm-nologo" tabIndex={logosOpen ? 0 : -1} onClick={() => set({ logo: null })}>No logo</button>
          )}
        </div>
      </div>
      <Row label="Corner">
        <div className="vt-wm-corners" role="radiogroup" aria-label="Watermark corner">
          {CORNERS.map(({ id, label, Icon }) => (
            <button key={id} type="button" role="radio" aria-checked={wm.corner === id} aria-label={label} title={label}
              className={`vt-wm-corner${wm.corner === id ? ' is-on' : ''}`} onClick={() => set({ corner: id })}>
              <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          ))}
        </div>
      </Row>
      <Row label="Colour">
        <SwatchRow ariaLabel="Watermark colour" colors={COLORS} value={color} onChange={(c) => set({ color: c })} />
      </Row>
      <div className="vt-wm-pair">
        <div className="vt-wm-pair-item">
          <span className="ui-row-label">Size</span>
          <Slider label="Watermark size" min={12} max={48} value={wm.size || WATERMARK_SIZE} onChange={(v) => set({ size: v })} format={String} />
        </div>
        <div className="vt-wm-pair-item">
          <span className="ui-row-label">Opacity</span>
          <Slider label="Watermark opacity" min={0.1} max={1} step={0.05} value={wm.opacity ?? WATERMARK_OPACITY}
            onChange={(v) => set({ opacity: v })} format={(v) => `${Math.round(v * 100)}%`} />
        </div>
      </div>
    </div>
  );
}
