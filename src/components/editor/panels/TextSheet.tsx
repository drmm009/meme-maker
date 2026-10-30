import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Bold, Italic, Underline, MessageSquareQuote, CaseSensitive, Plus, X, BookmarkPlus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Sheet, Section, Row, ChipRow, Chip, Toggle, SwatchRow, Slider, Switch, TileGrid, Tile, SegmentedControl } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { getContrastStroke } from '../memeEditorUtils';
import { TEXT_EFFECTS } from '../constants';
import { FONTS } from '../../../data/stickers';
import { useSelection, captionLabel } from './selection';
import type { EditorActions } from './selection';
import type { MemeCaption } from '../../../model/memeDocument';
import LayerActions from './LayerActions';
import { addFontFile, FONT_ACCEPT } from '../../../utils/customFonts';
import type { CustomFont } from '../../../utils/customFonts';
import { ensureFontLoaded, redrawCanvas } from '../hooks/useCustomFonts';
import CardControls from './CardControls';
import { loadTextStyles, saveTextStyles, styleOf, withStyle } from '../../../utils/textStyles';
import type { SavedTextStyle } from '../../../utils/textStyles';

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

type Caption = MemeCaption & Record<string, unknown>;
const hasBox = (c: Caption) => Boolean(c.bgColor && c.bgColor !== 'none' && c.bgColor !== 'transparent');
const boxValue = (c: Caption) => (!hasBox(c) ? 'transparent' : c.bgColor === 'white' ? '#ffffff' : c.bgColor === 'black' ? '#000000' : c.bgColor);

// Outline colours: black and white first, then the loud meme ones.
const OUTLINE_COLORS = ['#000000', '#ffffff', '#ff2a5f', '#ffe600', '#00f0ff', '#7c3aed'];
const sameColour = (a: unknown, b: string) => String(a || '').toLowerCase() === b.toLowerCase();

// The caption's sections, headed by these titles, and the sheet each belongs to: every sheet is a
// button on the caption's floating bar (LayerToolbar), which opens this sheet with just its sections.
// The words are edited in the whole sheet only (the Text strip's Edit).
const SECTIONS = {
  edit: { title: undefined, part: null },
  font: { title: 'Font', part: 'font' },
  styles: { title: 'My styles', part: 'font' },
  format: { title: 'Format', part: 'style' },
  size: { title: 'Size', part: 'style' },
  effects: { title: 'Effects', part: 'style' },
  align: { title: 'Alignment', part: 'align' },
  spacing: { title: 'Spacing', part: 'align' },
  color: { title: 'Color', part: 'color' },
  outline: { title: 'Outline', part: 'color' },
  shadow: { title: 'Shadow', part: 'color' },
  box: { title: 'Box', part: 'box' },
} as const;
type TextSection = keyof typeof SECTIONS;
const TEXT_PARTS = { font: 'Font', style: 'Style', align: 'Align', color: 'Color', box: 'Box' } as const;
type TextPart = keyof typeof TEXT_PARTS;

// The Text sheet, under the Text strip (which adds text, bubbles and social cards): pick a caption,
// edit its words, font, format, size, effects, alignment, spacing, colour, outline, shadow and box. Opened from
// a floating-bar button it shows only that button's sections.
export default function TextSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const captions: Caption[] = useMemeEditorStore((s: { captions: Caption[] }) => s.captions);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const updateCaptionText = useMemeEditorStore((s: { updateCaptionText: (id: string, text: string) => void }) => s.updateCaptionText);
  const sheetFocus: string | null = useEditorUiStore((s: { sheetFocus: string | null }) => s.sheetFocus);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const customFonts: CustomFont[] = useEditorUiStore((s: { customFonts: CustomFont[] }) => s.customFonts);
  const setCustomFonts = useEditorUiStore((s: { setCustomFonts: (fonts: CustomFont[]) => void }) => s.setCustomFonts);
  const [fontError, setFontError] = useState('');
  const [styles, setStyles] = useState<SavedTextStyle[]>(() => loadTextStyles());
  const keepStyles = (list: SavedTextStyle[]) => {
    setStyles(list);
    saveTextStyles(list);
  };
  const { id, kind, caption } = useSelection();
  const part = kind === 'caption' && sheetFocus && sheetFocus in TEXT_PARTS ? (sheetFocus as TextPart) : null;
  const shows = (section: TextSection) => !part || SECTIONS[section].part === part;
  // Style on its own is three plain rows (format, size, effects) with no headings.
  const heading = (section: TextSection) => (part === 'style' ? undefined : SECTIONS[section].title);

  // Opening the sheet with no caption selected picks the first one.
  useEffect(() => {
    if (!caption && captions.length) setActiveLayerId(captions[0].id);
    // Only on open: picking a sticker afterwards closes this sheet anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<Caption>) => actions.updateActiveCaptionProps(patch);
  const live = (patch: Partial<Caption>) => id && patchLayer('captions', id, patch);
  const strokeOn = Boolean(caption?.stroke && caption.stroke !== 'transparent');
  const fontSize = caption?.fontSize || 50;
  const pickFont = (css: string) => {
    set({ fontFamily: css });
    ensureFontLoaded(css);
  };
  const uploadFont = (file: File | undefined) => {
    if (!file) return;
    setFontError('');
    addFontFile(file)
      .then((font) => {
        setCustomFonts([...customFonts.filter((f) => f.family !== font.family), font]);
        set({ fontFamily: font.css });
        redrawCanvas();
      })
      .catch(() => setFontError("That file isn't a font this browser can read (use .ttf, .otf, .woff or .woff2)."));
  };

  return (
    <Sheet title={part ? TEXT_PARTS[part] : 'Text'} hideTitle onClose={onClose}>
      {!part && (
        <ChipRow ariaLabel="Captions">
          {captions.map((c) => (
            <Chip key={c.id} label={captionLabel(c)} active={c.id === id} onClick={() => setActiveLayerId(c.id)} />
          ))}
        </ChipRow>
      )}

      {!caption && <p className="ie-empty">{captions.length ? 'Pick a caption to edit it.' : 'No text yet. Tap Add Text above to write one.'}</p>}

      {caption && kind === 'card' && <CardControls caption={caption} actions={actions} />}

      {caption && kind === 'caption' && (
        <>
          {shows('edit') && (
            <Section id="edit" rule={!part}>
              <textarea
                className="ui-field ui-field--accent"
                aria-label="Caption text"
                rows={part ? 3 : 1}
                value={caption.text || ''}
                onChange={(e) => updateCaptionText(caption.id, e.target.value)}
              />
            </Section>
          )}

          {shows('font') && (
            <Section title={heading('font')} id="font">
              <div className="ie-font-row">
                {FONTS.map((f: { id: string; name: string; family: string; sample?: string }) => (
                  <Toggle key={f.id} variant="tile" label={f.name} active={(caption.fontFamily || 'Impact, sans-serif') === f.family} onClick={() => pickFont(f.family)} style={{ fontFamily: f.family }}>
                    {f.sample || 'Aa'}
                  </Toggle>
                ))}
                {customFonts.map((f) => (
                  <Toggle key={f.family} variant="tile" label={f.family} active={caption.fontFamily === f.css} onClick={() => pickFont(f.css)} style={{ fontFamily: f.css }}>
                    Aa
                  </Toggle>
                ))}
                <label className="ui-toggle ui-toggle--tile ie-font-upload" title="Upload your own font">
                  <Plus size={18} />
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
                      onClick={() => set(s.style as Partial<Caption>)}
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
                <button type="button" className="ui-btn" onClick={() => keepStyles(withStyle(styles, styleOf(caption as Record<string, unknown>), `style-${Date.now()}`))}>
                  <BookmarkPlus size={16} />Save this style
                </button>
              </div>
            </Section>
          )}

          {shows('format') && (
            <Section title={heading('format')} id="format" rule={!part}>
              <div className="ie-format-row" role="group" aria-label="Text format">
                <Toggle label="Bold" active={caption.bold !== false} onClick={() => set({ bold: caption.bold === false })}><Bold size={19} strokeWidth={3} /></Toggle>
                <Toggle label="Italic" active={Boolean(caption.italic)} onClick={() => set({ italic: !caption.italic })}><Italic size={19} /></Toggle>
                <Toggle label="Underline" active={Boolean(caption.underline)} onClick={() => set({ underline: !caption.underline })}><Underline size={19} /></Toggle>
                <button type="button" className="ui-toggle" aria-label="Change case" title="Change case" onClick={actions.handleToggleTextCase}>
                  <CaseSensitive size={21} />
                </button>
              </div>
            </Section>
          )}

          {shows('size') && (
            <Section title={heading('size')} id="size">
              <div className="ie-size-row">
                <span className="ie-size-a ie-size-a--small" aria-hidden="true">A</span>
                <Slider label="Text size" min={16} max={160} value={caption.fontSize || 50} onChange={(v) => live({ fontSize: v })} />
                <span className="ie-size-a" aria-hidden="true">A</span>
              </div>
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

          {shows('align') && (
            <Section title={heading('align')} id="align" rule={!part}>
              <SegmentedControl
                ariaLabel="Alignment"
                variant="fill"
                value={(caption.align || 'center') as 'left' | 'center' | 'right'}
                options={[{ value: 'left', label: 'Left', Icon: AlignLeft }, { value: 'center', label: 'Center', Icon: AlignCenter }, { value: 'right', label: 'Right', Icon: AlignRight }]}
                onChange={(align) => set({ align })}
              />
            </Section>
          )}

          {shows('spacing') && (
            <Section title={heading('spacing')} id="spacing">
              <Row label="Letters">
                <Slider label="Letter spacing" min={-0.05} max={0.5} step={0.01} value={Number(caption.letterSpacing || 0)} onChange={(v) => live({ letterSpacing: v })} />
              </Row>
              <Row label="Lines">
                <Slider label="Line height" min={0.8} max={2} step={0.05} value={Number(caption.lineHeight || 1.2)} onChange={(v) => live({ lineHeight: v })} />
              </Row>
            </Section>
          )}

          {shows('color') && (
            <Section title={heading('color')} id="color" rule={!part}>
              <Row label="Text">
                <SwatchRow ariaLabel="Text colour" colors={TEXT_COLORS} value={caption.color || '#ffffff'} onChange={(c) => set({ color: c, ...(strokeOn && sameColour(caption.stroke, c) ? { stroke: getContrastStroke(c) } : {}) })} />
              </Row>
              <Row label="Gradient">
                <div className="ui-swatches" role="radiogroup" aria-label="Text gradient">
                  <button type="button" role="radio" aria-checked={!caption.gradient} aria-label="No gradient" title="No gradient" className={`ui-swatch ui-swatch--none${!caption.gradient ? ' is-on' : ''}`} onClick={() => set({ gradient: null })} />
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
              </Row>
            </Section>
          )}

          {shows('outline') && (
            <Section title={heading('outline')} id="outline">
              <Row label="On" end>
                <Switch label="Stroke" checked={strokeOn} onChange={(on) => set({ stroke: on ? getContrastStroke(caption.color || '#ffffff') : 'transparent' })} />
              </Row>
              {strokeOn && (
                <>
                  <Row label="Thickness">
                    <Slider label="Outline thickness" min={1} max={24} value={Number(caption.strokeWidth || Math.max(3, Math.round(fontSize / 7)))} onChange={(v) => live({ strokeWidth: v })} />
                  </Row>
                  <Row label="Color">
                    <SwatchRow ariaLabel="Outline colour" colors={OUTLINE_COLORS} value={caption.stroke || '#000000'} onChange={(c) => set({ stroke: c })} />
                  </Row>
                </>
              )}
            </Section>
          )}

          {shows('shadow') && (
            <Section title={heading('shadow')} id="shadow">
              <Row label="Size">
                <Slider label="Shadow size" min={0} max={30} value={Number(caption.shadowSize || 0)} onChange={(v) => live({ shadowSize: v })} />
              </Row>
              {Number(caption.shadowSize) > 0 && (
                <Row label="Color">
                  <SwatchRow ariaLabel="Shadow colour" colors={SHADOW_COLORS} value={(caption.shadowColor as string) || '#000000'} onChange={(c) => live({ shadowColor: c })} />
                </Row>
              )}
            </Section>
          )}

          {shows('box') && (
            <Section title={heading('box')} id="box" rule={!part}>
              <Row label="Fill">
                <SwatchRow
                  ariaLabel="Text box colour"
                  colors={BOX_COLORS}
                  value={boxValue(caption)}
                  onChange={(c) => {
                    if (c === 'transparent') actions.handleSetCaptionBg('none');
                    else if (c === '#ffffff') actions.handleSetCaptionBg('white');
                    else if (c === '#000000') actions.handleSetCaptionBg('black');
                    else set({ bgColor: c, bgStyle: caption.bgStyle || 'box' });
                  }}
                />
              </Row>
              {hasBox(caption) && (
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
              <Row label="Opacity">
                <Slider label="Text opacity" min={0.1} max={1} step={0.05} value={Number(caption.opacity ?? 1)} onChange={(v) => live({ opacity: v })} />
              </Row>
            </Section>
          )}
        </>
      )}

      {!part && caption?.bubbleStyle ? (
        <Section title="Bubble" rule>
          <TileGrid columns={2}>
            <Tile label="Bubble Style" Icon={MessageSquareQuote} onClick={() => openSheet('bubble')} />
          </TileGrid>
        </Section>
      ) : null}

      {!part && id && caption && <LayerActions id={id} actions={actions} />}
    </Sheet>
  );
}
