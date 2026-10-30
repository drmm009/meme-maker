import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Bold, Italic, Underline, MessageSquareQuote, CaseSensitive, Plus } from 'lucide-react';
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

// The Text sheet, under the Text strip (which adds text, bubbles and social cards): pick a caption,
// edit its words, font, colour, size, style, box and effects.
export default function TextSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const captions: Caption[] = useMemeEditorStore((s: { captions: Caption[] }) => s.captions);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const updateCaptionText = useMemeEditorStore((s: { updateCaptionText: (id: string, text: string) => void }) => s.updateCaptionText);
  const sheetFocus: string | null = useEditorUiStore((s: { sheetFocus: string | null }) => s.sheetFocus);
  const setShowBubbleBottomSheet = useEditorUiStore((s: { setShowBubbleBottomSheet: (v: boolean) => void }) => s.setShowBubbleBottomSheet);
  const customFonts: CustomFont[] = useEditorUiStore((s: { customFonts: CustomFont[] }) => s.customFonts);
  const setCustomFonts = useEditorUiStore((s: { setCustomFonts: (fonts: CustomFont[]) => void }) => s.setCustomFonts);
  const [fontError, setFontError] = useState('');
  const { id, kind, caption } = useSelection();
  const bodyRef = useRef<HTMLDivElement>(null);

  // Opening the sheet with no caption selected picks the first one.
  useEffect(() => {
    if (!caption && captions.length) setActiveLayerId(captions[0].id);
    // Only on open: picking a sticker afterwards closes this sheet anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jump to the section the floating toolbar asked for.
  useEffect(() => {
    if (!sheetFocus) return;
    const el = bodyRef.current?.querySelector(`[data-section="${sheetFocus}"]`);
    el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [sheetFocus, id]);

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
    <Sheet title="Text" onClose={onClose} action={{ label: 'Add Text', onClick: actions.handleAddCaption }}>
      <div ref={bodyRef}>
        <ChipRow ariaLabel="Captions">
          {captions.map((c) => (
            <Chip key={c.id} label={captionLabel(c)} active={c.id === id} onClick={() => setActiveLayerId(c.id)} />
          ))}
        </ChipRow>

        {!caption && <p className="ie-empty">{captions.length ? 'Pick a caption to edit it.' : 'No text yet. Tap Add Text to write one.'}</p>}

        {caption && kind === 'card' && <CardControls caption={caption} actions={actions} />}

        {caption && kind === 'caption' && (
          <>
            <Section rule>
              <textarea
                className="ui-field ui-field--accent"
                aria-label="Caption text"
                rows={1}
                value={caption.text || ''}
                onChange={(e) => updateCaptionText(caption.id, e.target.value)}
              />
            </Section>

            <Section title="Font" id="font">
              <div className="ie-font-row">
                {FONTS.map((f: { id: string; name: string; family: string }) => (
                  <Toggle key={f.id} variant="tile" label={f.name} active={(caption.fontFamily || 'Impact, sans-serif') === f.family} onClick={() => pickFont(f.family)} style={{ fontFamily: f.family }}>
                    Aa
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

            <Section id="color">
              <Row label="Color">
                <SwatchRow ariaLabel="Text colour" colors={TEXT_COLORS} value={caption.color || '#ffffff'} onChange={(c) => set({ color: c, stroke: strokeOn ? getContrastStroke(c) : 'transparent' })} />
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
              <div data-section="size">
                <Row label="Size">
                  <Slider label="Text size" min={16} max={160} value={caption.fontSize || 50} onChange={(v) => live({ fontSize: v })} />
                </Row>
              </div>
              <Row label="Style">
                <Toggle label="Bold" active={caption.bold !== false} onClick={() => set({ bold: caption.bold === false })}><Bold size={20} strokeWidth={3} /></Toggle>
                <Toggle label="Italic" active={Boolean(caption.italic)} onClick={() => set({ italic: !caption.italic })}><Italic size={19} /></Toggle>
                <Toggle label="Underline" active={Boolean(caption.underline)} onClick={() => set({ underline: !caption.underline })}><Underline size={19} /></Toggle>
                <span className="ie-row-spacer" />
                <span className="ie-inline-label">Stroke</span>
                <Switch label="Stroke" checked={strokeOn} onChange={(on) => set({ stroke: on ? getContrastStroke(caption.color || '#ffffff') : 'transparent' })} />
              </Row>
              {strokeOn && (
                <Row label="Outline">
                  <Slider label="Outline thickness" min={1} max={24} value={Number(caption.strokeWidth || Math.max(3, Math.round(fontSize / 7)))} onChange={(v) => live({ strokeWidth: v })} />
                </Row>
              )}
              <Row label="Align">
                <SegmentedControl
                  ariaLabel="Alignment"
                  variant="fill"
                  value={(caption.align || 'center') as 'left' | 'center' | 'right'}
                  options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]}
                  onChange={(align) => set({ align })}
                />
              </Row>
            </Section>

            <Section title="Spacing & shadow" rule>
              <Row label="Letters">
                <Slider label="Letter spacing" min={-0.05} max={0.5} step={0.01} value={Number(caption.letterSpacing || 0)} onChange={(v) => live({ letterSpacing: v })} />
              </Row>
              <Row label="Lines">
                <Slider label="Line height" min={0.8} max={2} step={0.05} value={Number(caption.lineHeight || 1.2)} onChange={(v) => live({ lineHeight: v })} />
              </Row>
              <Row label="Shadow">
                <Slider label="Shadow size" min={0} max={30} value={Number(caption.shadowSize || 0)} onChange={(v) => live({ shadowSize: v })} />
              </Row>
              {Number(caption.shadowSize) > 0 && (
                <Row label="Shadow color">
                  <SwatchRow ariaLabel="Shadow colour" colors={SHADOW_COLORS} value={(caption.shadowColor as string) || '#000000'} onChange={(c) => live({ shadowColor: c })} />
                </Row>
              )}
            </Section>

            <Section title="Box" rule>
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

            <Section title="Effects">
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
                <Chip label="Change case" Icon={CaseSensitive} onClick={actions.handleToggleTextCase} />
              </ChipRow>
            </Section>
          </>
        )}

        {caption?.bubbleStyle ? (
          <Section title="Bubble" rule>
            <TileGrid columns={2}>
              <Tile label="Bubble Style" Icon={MessageSquareQuote} onClick={() => setShowBubbleBottomSheet(true)} />
            </TileGrid>
          </Section>
        ) : null}

        {id && caption && <LayerActions id={id} actions={actions} />}
      </div>
    </Sheet>
  );
}
