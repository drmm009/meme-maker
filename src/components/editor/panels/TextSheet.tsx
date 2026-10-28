import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Bold, Italic, Underline, WandSparkles, MessageSquareQuote, Share2, PanelTop, PanelBottom, CaseSensitive } from 'lucide-react';
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
import CardControls from './CardControls';

const TEXT_COLORS = ['#ffffff', '#000000', '#ff5a36', '#ffd60a', '#34c759', '#0a84ff', '#bf5af2', '#ff375f'];
const BOX_COLORS = ['transparent', '#ffffff', '#000000', '#ff5a36', '#ffd60a', '#0a84ff'];

type Caption = MemeCaption & Record<string, unknown>;
const hasBox = (c: Caption) => Boolean(c.bgColor && c.bgColor !== 'none' && c.bgColor !== 'transparent');
const boxValue = (c: Caption) => (!hasBox(c) ? 'transparent' : c.bgColor === 'white' ? '#ffffff' : c.bgColor === 'black' ? '#000000' : c.bgColor);

// The Text sheet: pick a caption, edit its words, font, colour, size and style; add more text.
export default function TextSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const captions: Caption[] = useMemeEditorStore((s: { captions: Caption[] }) => s.captions);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const updateCaptionText = useMemeEditorStore((s: { updateCaptionText: (id: string, text: string) => void }) => s.updateCaptionText);
  const canvasHeader = useMemeEditorStore((s: { canvasHeader: { enabled: boolean } }) => s.canvasHeader);
  const canvasFooter = useMemeEditorStore((s: { canvasFooter: { enabled: boolean } }) => s.canvasFooter);
  const sheetFocus: string | null = useEditorUiStore((s: { sheetFocus: string | null }) => s.sheetFocus);
  const setShowAiModal = useEditorUiStore((s: { setShowAiModal: (v: boolean) => void }) => s.setShowAiModal);
  const setShowBubbleBottomSheet = useEditorUiStore((s: { setShowBubbleBottomSheet: (v: boolean) => void }) => s.setShowBubbleBottomSheet);
  const setShowStylesModal = useEditorUiStore((s: { setShowStylesModal: (v: boolean) => void }) => s.setShowStylesModal);
  const setSocialModalPlatform = useEditorUiStore((s: { setSocialModalPlatform: (v: string) => void }) => s.setSocialModalPlatform);
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

  return (
    <Sheet title="Text" onClose={onClose} action={{ label: 'Add Text', onClick: actions.handleAddCaption }}>
      <div ref={bodyRef}>
        <ChipRow ariaLabel="Captions">
          {captions.map((c) => (
            <Chip key={c.id} label={captionLabel(c)} active={c.id === id} onClick={() => setActiveLayerId(c.id)} />
          ))}
        </ChipRow>

        {!caption && <p className="ie-empty">No text yet. Tap Add Text to write one.</p>}

        {caption && kind === 'card' && <CardControls caption={caption} actions={actions} />}

        {caption && kind === 'caption' && (
          <>
            <Section>
              <textarea
                className="ui-field ui-field--accent"
                aria-label="Caption text"
                rows={2}
                value={caption.text || ''}
                onChange={(e) => updateCaptionText(caption.id, e.target.value)}
              />
            </Section>

            <Section title="Font" id="font">
              <div className="ie-font-row">
                {FONTS.map((f: { id: string; name: string; family: string }) => (
                  <Toggle key={f.id} variant="tile" label={f.name} active={(caption.fontFamily || 'Impact, sans-serif') === f.family} onClick={() => set({ fontFamily: f.family })} style={{ fontFamily: f.family }}>
                    Aa
                  </Toggle>
                ))}
              </div>
            </Section>

            <Section id="color">
              <Row label="Color">
                <SwatchRow ariaLabel="Text colour" colors={TEXT_COLORS} value={caption.color || '#ffffff'} onChange={(c) => set({ color: c, stroke: strokeOn ? getContrastStroke(c) : 'transparent' })} />
              </Row>
              <div data-section="size">
                <Row label="Size">
                  <Slider label="Text size" min={16} max={160} value={caption.fontSize || 50} onChange={(v) => live({ fontSize: v })} format={(v) => `${v}`} />
                </Row>
              </div>
              <Row label="Style">
                <Toggle label="Bold" active={caption.bold !== false} onClick={() => set({ bold: caption.bold === false })}><Bold size={18} strokeWidth={2.6} /></Toggle>
                <Toggle label="Italic" active={Boolean(caption.italic)} onClick={() => set({ italic: !caption.italic })}><Italic size={18} /></Toggle>
                <Toggle label="Underline" active={Boolean(caption.underline)} onClick={() => set({ underline: !caption.underline })}><Underline size={18} /></Toggle>
                <span className="ie-row-spacer" />
                <span className="ie-inline-label">Stroke</span>
                <Switch label="Stroke" checked={strokeOn} onChange={(on) => set({ stroke: on ? getContrastStroke(caption.color || '#ffffff') : 'transparent' })} />
              </Row>
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

            <Section title="Box">
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
                <Slider label="Text opacity" min={0.1} max={1} step={0.05} value={Number(caption.opacity ?? 1)} onChange={(v) => live({ opacity: v })} format={(v) => `${Math.round(v * 100)}%`} />
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

        <Section title="Add">
          <TileGrid>
            <Tile label="AI Captions" Icon={WandSparkles} title="AI meme captions" onClick={() => setShowAiModal(true)} />
            <Tile label="Bubble" Icon={MessageSquareQuote} title="Chat and speech bubbles" onClick={() => { actions.handleAddBubble(); setShowBubbleBottomSheet(true); }} />
            <Tile label="Social Card" Icon={Share2} title="Fake tweet, Instagram or WhatsApp card" onClick={() => { setSocialModalPlatform('tweet'); setShowStylesModal(true); }} />
            <Tile label="Top Band" Icon={PanelTop} title="White band above the meme" active={canvasHeader.enabled} onClick={actions.handleToggleCanvasHeader} />
            <Tile label="Bottom Band" Icon={PanelBottom} title="White band below the meme" active={canvasFooter.enabled} onClick={actions.handleToggleCanvasFooter} />
            {caption?.bubbleStyle ? <Tile label="Bubble Style" Icon={MessageSquareQuote} onClick={() => setShowBubbleBottomSheet(true)} /> : null}
          </TileGrid>
        </Section>

        {id && caption && <LayerActions id={id} actions={actions} />}
      </div>
    </Sheet>
  );
}
