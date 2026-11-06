import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Plus, X, BookmarkPlus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Section, Row, ChipRow, Chip, Toggle, SwatchRow, Slider, SegmentedControl } from '../../ui';
import { getContrastStroke } from '../memeEditorUtils';
import { TEXT_EFFECTS } from '../constants';
import { FONTS } from '../../../data/stickers';
import type { MemeCaption } from '../../../model/memeDocument';
import { addFontFile, FONT_ACCEPT } from '../../../utils/customFonts';
import type { CustomFont } from '../../../utils/customFonts';
import { ensureFontLoaded } from '../hooks/useCustomFonts';
import { loadTextStyles, saveTextStyles, styleOf, withStyle } from '../../../utils/textStyles';
import type { SavedTextStyle } from '../../../utils/textStyles';
import { captionBgPatch } from './captionBox';
import { COLOR_TABS } from './textParts';
import type { ColorTab, TextPart } from './textParts';

export type { ColorTab, TextPart } from './textParts';

const TEXT_COLORS = ['#ffffff', '#000000', '#ff5a36', '#ffd60a', '#34c759', '#0a84ff', '#bf5af2', '#ff375f'];
const BOX_COLORS = ['transparent', '#ffffff', '#000000', '#ff5a36', '#ffd60a', '#0a84ff'];
const SHADOW_COLORS = ['#000000', '#ffffff', '#ff5a36', '#0a84ff', '#bf5af2'];
const GRADIENTS: { id: string; label: string; colors: [string, string] }[] = [
  { id: 'sunset', label: 'Sunset', colors: ['#ff5a36', '#ec4899'] },
  { id: 'gold', label: 'Gold', colors: ['#f7971e', '#ffd200'] },
  { id: 'ocean', label: 'Ocean', colors: ['#00c6ff', '#0072ff'] },
  { id: 'neon', label: 'Neon', colors: ['#39ff14', '#00f0ff'] },
  { id: 'fire', label: 'Fire', colors: ['#ff0000', '#ffcc00'] },
  { id: 'grape', label: 'Grape', colors: ['#8e2de2', '#ff6ec4'] },
];
const sameGradient = (a: unknown, b: [string, string]) => Array.isArray(a) && a[0] === b[0] && a[1] === b[1];

export type TextCaption = MemeCaption & Record<string, unknown>;
const hasBox = (c: TextCaption) => Boolean(c.bgColor && c.bgColor !== 'none' && c.bgColor !== 'transparent');
const boxValue = (c: TextCaption) => (!hasBox(c) ? 'transparent' : c.bgColor === 'white' ? '#ffffff' : c.bgColor === 'black' ? '#000000' : c.bgColor);

// Outline colours: black and white first, then the loud meme ones.
const OUTLINE_COLORS = ['#000000', '#ffffff', '#ff2a5f', '#ffe600', '#00f0ff', '#7c3aed'];
const sameColour = (a: unknown, b: string) => String(a || '').toLowerCase() === b.toLowerCase();

// The text's sections, headed by these titles (colour, outline and shadow label their own rows),
// and the part each belongs to: every part is a button on the text's floating bar, which opens the
// sheet with just its sections. The words are edited in the whole sheet only.
const SECTIONS = {
  edit: { title: undefined, part: null },
  font: { title: 'Font', part: 'font' },
  styles: { title: 'My styles', part: 'font' },
  format: { title: 'Format', part: 'style' },
  size: { title: 'Size', part: 'style' },
  effects: { title: 'Effects', part: 'style' },
  spacing: { title: 'Spacing', part: 'style' },
  color: { title: undefined, part: 'color' },
  outline: { title: undefined, part: 'color' },
  shadow: { title: undefined, part: null },
  box: { title: undefined, part: 'color' },
} as const;
type TextSection = keyof typeof SECTIONS;
const ALIGNS = [{ value: 'left', label: 'Left', Icon: AlignLeft }, { value: 'center', label: 'Center', Icon: AlignCenter }, { value: 'right', label: 'Right', Icon: AlignRight }] as const;

// The Color sheet's header tabs: text, outline or box colour.
export function ColorTabs({ value, onChange }: { value: ColorTab; onChange: (tab: ColorTab) => void }) {
  return (
    <div className="ie-color-tabs" role="tablist" aria-label="Colour of">
      {(Object.keys(COLOR_TABS) as ColorTab[]).map((t) => (
        <button key={t} type="button" role="tab" aria-selected={value === t} className={`ie-color-tab${value === t ? ' is-on' : ''}`} onClick={() => onChange(t)}>
          {COLOR_TABS[t]}
        </button>
      ))}
    </div>
  );
}

interface TextControlsProps {
  caption: TextCaption;
  // One part's sections (a floating-bar button), or all of them.
  part: TextPart | null;
  colorTab: ColorTab;
  // A finished change (one undo step) and one made while dragging a slider.
  set: (patch: Partial<TextCaption>) => void;
  live: (patch: Partial<TextCaption>) => void;
  onText: (text: string) => void;
  customFonts: CustomFont[];
  // The uploaded fonts, with one just added.
  onCustomFonts: (fonts: CustomFont[]) => void;
  sizeRange?: [number, number];
  // The box's Full width shape (the image editor's banner).
  banner?: boolean;
  autoFocusText?: boolean;
}

// A text's look, in both editors (the image editor's Text sheet, the video editor's text sheets):
// its words, font, saved styles, format, size, effects, alignment, spacing, colour, outline, shadow
// and box. The caller keeps the text and says how a change is saved.
export default function TextControls({ caption, part, colorTab, set, live, onText, customFonts, onCustomFonts, sizeRange = [16, 160], banner = true, autoFocusText = false }: TextControlsProps) {
  const [fontError, setFontError] = useState('');
  const [styles, setStyles] = useState<SavedTextStyle[]>(() => loadTextStyles());
  const keepStyles = (list: SavedTextStyle[]) => {
    setStyles(list);
    saveTextStyles(list);
  };
  const shows = (section: TextSection) =>
    (!part || SECTIONS[section].part === part) && (part !== 'color' || !(section in COLOR_TABS) || section === colorTab);
  // On its own a part's sheet is headed by its name, so its sections go without titles; only My
  // styles, under the fonts, keeps one.
  const heading = (section: TextSection) => (part && section !== 'styles' ? undefined : SECTIONS[section].title);

  const strokeOn = Boolean(caption.stroke && caption.stroke !== 'transparent');
  const fontSize = caption.fontSize || 50;
  const pickFont = (css: string) => {
    set({ fontFamily: css });
    ensureFontLoaded(css);
  };
  const uploadFont = (file: File | undefined) => {
    if (!file) return;
    setFontError('');
    addFontFile(file)
      .then((font) => {
        onCustomFonts([...customFonts.filter((f) => f.family !== font.family), font]);
        set({ fontFamily: font.css });
      })
      .catch(() => setFontError("That file isn't a font this browser can read (use .ttf, .otf, .woff or .woff2)."));
  };

  return (
    <>
      {shows('edit') && (
        <Section id="edit" rule={!part}>
          <textarea
            className="ui-field ui-field--accent"
            aria-label="Caption text"
            placeholder="Type caption text here..."
            rows={part ? 3 : 1}
            value={caption.text || ''}
            autoFocus={autoFocusText}
            onChange={(e) => onText(e.target.value)}
          />
        </Section>
      )}

      {shows('font') && (
        <Section title={heading('font')} id="font">
          <div className="ie-font-row">
            {FONTS.map((f: { id: string; name: string; family: string; sample?: string }) => (
              <Toggle key={f.id} variant="tile" label={f.name} active={(caption.fontFamily || 'Impact, sans-serif') === f.family} onClick={() => pickFont(f.family)} style={{ fontFamily: f.family }}>
                {f.id}
              </Toggle>
            ))}
            {customFonts.map((f) => (
              <Toggle key={f.family} variant="tile" label={f.family} active={caption.fontFamily === f.css} onClick={() => pickFont(f.css)} style={{ fontFamily: f.css }}>
                {f.family}
              </Toggle>
            ))}
            <label className="ui-toggle ui-toggle--tile ie-font-upload" title="Upload your own font">
              <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
              <span>Your font</span>
              <input type="file" accept={FONT_ACCEPT} aria-label="Upload your own font" hidden onChange={(e) => { uploadFont(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </div>
          {fontError && <p className="ie-empty" role="alert">{fontError}</p>}
        </Section>
      )}

      {shows('styles') && (
        <Section title={heading('styles')} id="styles">
          <div className="ie-style-row" role="group" aria-label="Saved text styles">
            {styles.map((s, i) => (
              <span key={s.id} className="ie-style-chip">
                <button
                  type="button"
                  className="ie-style-apply"
                  aria-label={`Use saved style ${i + 1}`}
                  onClick={() => set(s.style as Partial<TextCaption>)}
                  style={{
                    fontFamily: String(s.style.fontFamily || 'Impact, sans-serif'),
                    color: String(s.style.color || '#ffffff'),
                    fontWeight: s.style.bold === false ? 400 : 800,
                    fontStyle: s.style.italic ? 'italic' : 'normal',
                    WebkitTextStroke: s.style.stroke && s.style.stroke !== 'transparent' ? `1px ${String(s.style.stroke)}` : undefined,
                  }}
                >
                  Aa
                </button>
                <button type="button" className="ie-style-remove" aria-label={`Remove saved style ${i + 1}`} onClick={() => keepStyles(styles.filter((x) => x.id !== s.id))}>
                  <X size={12} />
                </button>
              </span>
            ))}
            <button type="button" className="ie-style-save" onClick={() => keepStyles(withStyle(styles, styleOf(caption as Record<string, unknown>), `style-${Date.now()}`))}>
              <BookmarkPlus size={16} aria-hidden="true" />Save this style
            </button>
          </div>
        </Section>
      )}

      {shows('format') && (
        <Section title={heading('format')} id="format" rule={!part}>
          <div className="ie-format-row" role="group" aria-label="Text format">
            <Toggle label="Bold" active={caption.bold !== false} onClick={() => set({ bold: caption.bold === false })}>
              <span className="ie-format-glyph ie-format-glyph--bold" aria-hidden="true">B</span>
            </Toggle>
            <Toggle label="Italic" active={Boolean(caption.italic)} onClick={() => set({ italic: !caption.italic })}>
              <span className="ie-format-glyph ie-format-glyph--italic" aria-hidden="true">I</span>
            </Toggle>
            <Toggle label="Underline" active={Boolean(caption.underline)} onClick={() => set({ underline: !caption.underline })}>
              <span className="ie-format-glyph ie-format-glyph--underline" aria-hidden="true">U</span>
            </Toggle>
            <span className="ie-format-gap" aria-hidden="true" />
            <div className="ie-format-align" role="radiogroup" aria-label="Alignment">
              {ALIGNS.map(({ value, label, Icon }) => {
                const on = (caption.align || 'center') === value;
                return (
                  <button key={value} type="button" role="radio" aria-checked={on} aria-label={label} title={label} className={`ui-toggle${on ? ' is-on' : ''}`} onClick={() => set({ align: value })}>
                    <Icon size={17} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {shows('size') && (
        <Section title={heading('size')} id="size">
          <Row label="Size">
            <Slider label="Text size" min={sizeRange[0]} max={sizeRange[1]} value={caption.fontSize || 50} onChange={(v) => live({ fontSize: v })} format={(v) => String(Math.round(v))} />
          </Row>
        </Section>
      )}

      {shows('effects') && (
        <Section title={heading('effects')} id="effects">
          <ChipRow ariaLabel="Text effects">
            {TEXT_EFFECTS.map((e: { id: string; title: string; curve?: number; renderLabel: () => ReactNode }) => (
              <Chip
                key={e.id}
                title={e.title}
                label={e.renderLabel()}
                active={caption.effect ? caption.effect === e.id : e.id === 'flat' && !caption.curve}
                onClick={() => set({ effect: e.id, curve: e.curve || 0 })}
              />
            ))}
          </ChipRow>
        </Section>
      )}

      {shows('spacing') && (
        <Section title={heading('spacing')} id="spacing">
          <div className="ie-adjust-grid">
            <div className="ie-adjust-item">
              <span className="ui-row-label">Letters</span>
              <Slider label="Letter spacing" min={-0.05} max={0.5} step={0.01} value={Number(caption.letterSpacing || 0)} onChange={(v) => live({ letterSpacing: v })} format={(v) => `${(v * 100).toFixed(0)}%`} />
            </div>
            <div className="ie-adjust-item">
              <span className="ui-row-label">Lines</span>
              <Slider label="Line height" min={0.8} max={2} step={0.05} value={Number(caption.lineHeight || 1.2)} onChange={(v) => live({ lineHeight: v })} format={(v) => `${Number(v).toFixed(2)}×`} />
            </div>
          </div>
        </Section>
      )}

      {shows('color') && (
        <Section title={heading('color')} id="color" rule={!part}>
          <Row label="Color">
            <div className="ie-swatch-line">
              <SwatchRow ariaLabel="Text colour" colors={TEXT_COLORS} value={caption.gradient ? '' : caption.color || '#ffffff'} onChange={(c) => set({ color: c, gradient: null, ...(strokeOn && sameColour(caption.stroke, c) ? { stroke: getContrastStroke(c) } : {}) })} />
              <span className="ie-swatch-gap" aria-hidden="true" />
              <div className="ui-swatches" role="radiogroup" aria-label="Text gradient">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={sameGradient(caption.gradient, g.colors)}
                    aria-label={`${g.label} gradient`}
                    title={g.label}
                    className={`ui-swatch${sameGradient(caption.gradient, g.colors) ? ' is-on' : ''}`}
                    style={{ background: `linear-gradient(90deg, ${g.colors[0]}, ${g.colors[1]})`, '--swatch': g.colors[1] } as CSSProperties}
                    onClick={() => set({ gradient: g.colors })}
                  />
                ))}
              </div>
            </div>
          </Row>
          <Row label="Opacity">
            <Slider label="Text opacity" min={0.1} max={1} step={0.05} value={Number(caption.opacity ?? 1)} onChange={(v) => live({ opacity: v })} format={(v) => `${Math.round(v * 100)}%`} />
          </Row>
        </Section>
      )}

      {shows('outline') && (
        <Section title={heading('outline')} id="outline">
          {/* None (the first swatch) turns the outline off; a colour turns it on. */}
          <Row label="Outline">
            <SwatchRow ariaLabel="Outline colour" colors={['transparent', ...OUTLINE_COLORS]} value={strokeOn ? String(caption.stroke) : 'transparent'} onChange={(c) => set({ stroke: c })} />
          </Row>
          {strokeOn && (
            <Row label="Width">
              <Slider label="Outline thickness" min={1} max={24} value={Number(caption.strokeWidth || Math.max(3, Math.round(fontSize / 7)))} onChange={(v) => live({ strokeWidth: v })} format={(v) => `${Math.round(v)}px`} />
            </Row>
          )}
        </Section>
      )}

      {shows('shadow') && (
        <Section title={heading('shadow')} id="shadow">
          <Row label="Shadow">
            <Slider label="Shadow size" min={0} max={30} value={Number(caption.shadowSize || 0)} onChange={(v) => live({ shadowSize: v })} format={(v) => `${Math.round(v)}px`} />
          </Row>
          {Number(caption.shadowSize) > 0 && (
            <Row label="">
              <SwatchRow ariaLabel="Shadow colour" colors={SHADOW_COLORS} value={(caption.shadowColor as string) || '#000000'} onChange={(c) => live({ shadowColor: c })} />
            </Row>
          )}
        </Section>
      )}

      {shows('box') && (
        <Section title={heading('box')} id="box" rule={!part}>
          <Row label={part ? 'Color' : 'Box'}>
            <SwatchRow
              ariaLabel="Text box colour"
              colors={BOX_COLORS}
              value={boxValue(caption)}
              onChange={(c) => {
                if (c === 'transparent') set(captionBgPatch(caption, 'none'));
                else if (c === '#ffffff') set(captionBgPatch(caption, 'white'));
                else if (c === '#000000') set(captionBgPatch(caption, 'black'));
                else set({ bgColor: c, bgStyle: banner ? caption.bgStyle || 'box' : 'box' });
              }}
            />
          </Row>
          {hasBox(caption) && banner && (
            <Row label="Shape">
              <SegmentedControl
                ariaLabel="Box shape"
                variant="fill"
                value={caption.bgStyle === 'banner' ? 'banner' : 'box'}
                options={[{ value: 'box', label: 'Box' }, { value: 'banner', label: 'Full width' }]}
                onChange={(shape) => set({ bgStyle: shape })}
              />
            </Row>
          )}
        </Section>
      )}
    </>
  );
}
