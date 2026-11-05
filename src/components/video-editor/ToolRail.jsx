import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Type, Sticker, Smile, LayoutGrid, Image as ImageIcon, Film, Clapperboard, Music,
  Gauge, Volume2, VolumeX, Palette, Square, RotateCw, Minimize, Crop, Maximize, Copy, Trash2,
  Scissors, PencilLine, ALargeSmall, TextAlignStart, TextAlignCenter, TextAlignEnd, SlidersHorizontal, WandSparkles, Pipette, Sparkles, ImagePlay, PaintBucket, Zap, Snowflake, Rewind, Repeat, ZoomIn, BringToFront, SendToBack, Mic, ArrowRightLeft, Frame, Plus, Upload, Library, Laugh, SquarePlay, Captions, Expand, Blend, Scan, Eraser, TypeOutline, Ban, FlipHorizontal2, FlipVertical2, Move, ListChecks, X, AtSign, Flag
} from 'lucide-react';
import { FloatingToolbar, Sheet, ToolDock, ToolStrip } from '../ui';
import { FiltersIcon } from '../editor/panels/editorIcons';
import { useEditorStore, clipEffectBase, sourceTimeMs } from '../../store/useVideoEditorStore';
import { clipOpacity } from '../../model/videoProject';
import { clipCrop, isCropped } from '../../utils/clipCrop';
import CropPanel from './CropPanel';
import { canCutOut, cutOutBackground } from '../../utils/cutOut';
import { PHOTO_MOTIONS } from '../../utils/photoMotion';
import { DEFAULT_END_CARD, WATERMARK_CORNERS, endCardClip, isEndCard, renderEndCard } from '../../utils/brandCard';
import { captureFrame, renderClipEffect } from '../../utils/clipEffects';
import { clipPunchTimes } from '../../utils/zoomPunch';
import { FILTER_PRESETS } from '../../utils/clipFilters';
import { DEFAULT_TRANSITION_MS, TRANSITIONS, previousClip } from '../../utils/clipTransitions';
import { canRecordVoice, startVoiceRecording } from '../../utils/voiceRecorder';
import { CAPTION_STYLES, captionItems, captionStyle } from '../../utils/captionChunks';
import { speechClips } from '../../utils/clipAudio';
import { togglePlayback } from './usePlaybackLoop';
import { rotateAboutCenter } from './preview/previewMath';
import { formatClock } from './timeline/timelineMath';
import { FONTS } from '../../data/stickers';
import { DEFAULT_FADE_MS } from '../../utils/audioFades';
import { DEFAULT_CHROMA_KEY } from '../../utils/chromaKey';
import { TEXT_ANIMATIONS } from '../../utils/textAnimation';
import { SOUND_EFFECTS } from '../../data/soundEffects';

// White outline on dark text, black on light text.
const getContrastStroke = (hexColor) => {
  if (!hexColor) return '#000000';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5 ? '#ffffff' : '#000000';
};

// The add tools, grouped like the image editor: a dock of sections, each section's tools in a strip
// above it. A `panel` tool opens its settings sheet, a `sources` tool a small sheet of where to get
// it from; the rest add straight away (or open a picker).
const SECTIONS = [
  { id: 'media', label: 'Media', Icon: Film, tools: [
    { kind: 'image', label: 'Image', Icon: ImageIcon, title: 'Add image', sources: [
      { kind: 'photo', label: 'Upload', sub: 'From your phone', Icon: Upload },
      { kind: 'templates', label: 'Templates', sub: 'Meme pictures', Icon: LayoutGrid },
    ] },
    { kind: 'videos', label: 'Video', Icon: SquarePlay, title: 'Add video', sources: [
      { kind: 'video', label: 'Upload', sub: 'From your phone', Icon: Upload },
      { kind: 'clips', label: 'Clips', sub: 'Meme video clips', Icon: Clapperboard },
    ] },
  ] },
  { id: 'text', label: 'Text', Icon: Type, tools: [
    { kind: 'text', label: 'Add text', Icon: Plus },
    { kind: 'captions', label: 'Captions', Icon: Captions, panel: true },
  ] },
  { id: 'stickers', label: 'Stickers', Icon: Sticker, tools: [
    { kind: 'stickers', label: 'Meme', Icon: Laugh },
    { kind: 'emoji', label: 'Emoji', Icon: Smile },
    { kind: 'gifs', label: 'GIFs', Icon: ImagePlay },
  ] },
  { id: 'audio', label: 'Audio', Icon: Music, tools: [
    { kind: 'sfx', label: 'SFX', Icon: Zap, panel: true },
    { kind: 'sounds', label: 'Sounds', Icon: Library },
    { kind: 'audio', label: 'Upload', Icon: Upload },
    { kind: 'voice', label: 'Voice', Icon: Mic, panel: true },
  ] },
  { id: 'canvas', label: 'Canvas', Icon: Frame, tools: [
    { kind: 'background', label: 'Background', Icon: PaintBucket, panel: true },
    { kind: 'watermark', label: 'Watermark', Icon: AtSign, panel: true },
    { kind: 'endcard', label: 'End card', Icon: Flag, panel: true },
  ] },
];

const BACKGROUND_SWATCHES = ['#ffffff', '#000000', '#1a1d27', '#ff5e36', '#ec4899', '#facc15', '#22c55e', '#3b82f6'];

const SPEEDS = [0.5, 1, 1.5, 2];
const TEXT_BACKGROUNDS = [
  { value: 'none', label: 'None' },
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
];
const ALIGNS = [
  { value: 'left', label: 'Left', Icon: TextAlignStart },
  { value: 'center', label: 'Centre', Icon: TextAlignCenter },
  { value: 'right', label: 'Right', Icon: TextAlignEnd },
];
const TEXT_COLORS = ['#ffffff', '#000000', '#ff5a36', '#facc15', '#22c55e', '#3b82f6', '#ec4899', '#a855f7'];
const PLACEMENTS = [
  { value: 'fit', label: 'Fit', Icon: Minimize },
  { value: 'cover', label: 'Fill', Icon: Scan },
  { value: 'stretch', label: 'Stretch', Icon: Maximize },
];
const MIN_SPLIT_MS = 100;

const update = (id, patch) => useEditorStore.getState().updateItem(id, patch);

// Runs a slow clip job (FFmpeg render, frame grab) under a busy label; one at a time, never during export.
const runJob = async (label, job) => {
  const st = useEditorStore.getState();
  if (st.busy || st.isExporting) return;
  st.setBusy(label);
  try {
    await job();
    useEditorStore.getState().setBusy(null);
  } catch (e) {
    console.warn('[clip effect]', e);
    const message = e?.message || 'That didn’t work. Try again.';
    useEditorStore.getState().setBusy(message);
    setTimeout(() => { if (useEditorStore.getState().busy === message) useEditorStore.getState().setBusy(null); }, 3500);
  }
};

// Freeze the frame under the playhead (the still is cut from what's showing, effects included).
const freezeAtPlayhead = (item, playhead) => runJob('Freezing frame…', async () => {
  const url = await captureFrame(item.url, sourceTimeMs(item, Math.min(Math.max(playhead, item.startMs), item.endMs)));
  useEditorStore.getState().insertFreeze(item.id, playhead, url);
});

// Cut out toggle: removes a picture's background (keeping the original), or puts it back.
const toggleCutOut = (item) => {
  if (item.originalUrl) {
    update(item.id, { url: item.originalUrl, originalUrl: null });
    return;
  }
  runJob('Cutting out… the first time takes a while', async () => {
    const url = await cutOutBackground(item.url);
    const latest = useEditorStore.getState().items.find((i) => i.id === item.id);
    if (!latest || latest.url !== item.url) {
      URL.revokeObjectURL(url);
      return;
    }
    update(item.id, { url, originalUrl: item.url });
  });
};

// Reverse/boomerang toggle: tapping the active effect switches it off.
const toggleClipEffect = (item, effect) => {
  if (item.effect === effect) {
    useEditorStore.getState().applyClipEffect(item.id, null);
    return;
  }
  const base = clipEffectBase(item);
  const lengthMs = (base.endMs - item.startMs) * (item.playbackRate || 1);
  runJob(effect === 'reverse' ? 'Reversing clip…' : 'Making a boomerang…', async () => {
    const rendered = await renderClipEffect(base.url, effect, { startMs: base.trimStartMs, lengthMs });
    useEditorStore.getState().applyClipEffect(item.id, effect, rendered);
  });
};

// Picture placement on the 800-wide logical stage: contain, cover, or stretch to fill.
const placeMedia = (item, aspectRatio, mode) => {
  const dims = { width: 800, height: 800 / aspectRatio };
  const w0 = item.width || 200;
  const h0 = item.height || 200;
  if (mode === 'stretch') return { x: 0, y: 0, scaleX: dims.width / w0, scaleY: dims.height / h0 };
  const wider = w0 / h0 > dims.width / dims.height;
  const s = (mode === 'fit') === wider ? dims.width / w0 : dims.height / h0;
  return { x: (dims.width - w0 * s) / 2, y: (dims.height - h0 * s) / 2, scaleX: s, scaleY: s };
};

// A row of chips, one of them picked (font, speed, align…).
function PickRow({ options, value, onPick, label }) {
  return (
    <div className="vt-chip-row" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value}
          className={`vt-chip${value === o.value ? ' is-on' : ''}`} style={o.style} onClick={() => onPick(o.value)}>
          {o.Icon && <o.Icon size={15} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FontPanel({ item }) {
  const current = (FONTS.find((f) => f.family === item.fontFamily) || FONTS[0]).family;
  return (
    <PickRow label="Font" value={current} onPick={(family) => update(item.id, { fontFamily: family })}
      options={FONTS.map((f) => ({ value: f.family, label: f.id || f.name.split(' ')[0], style: { fontFamily: f.family } }))} />
  );
}

function ColorPanel({ item }) {
  const color = (item.color || '#ffffff').toLowerCase();
  // The outline follows the colour (black on light, white on dark) unless one was picked in Style.
  const auto = !item.stroke || item.stroke === '#000000' || item.stroke === '#ffffff';
  const set = (c) => update(item.id, { color: c, stroke: item.bgColor && item.bgColor !== 'none' ? 'transparent' : auto ? getContrastStroke(c) : item.stroke });
  return (
    <div className="vt-swatch-row" role="radiogroup" aria-label="Text colour">
      {TEXT_COLORS.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c}
          className={`vt-swatch-btn${color === c ? ' is-on' : ''}`} style={{ background: c }} onClick={() => set(c)} />
      ))}
      <label className={`vt-swatch-btn vt-swatch-custom${TEXT_COLORS.includes(color) ? '' : ' is-on'}`} title="Custom colour">
        <Palette size={16} />
        <input type="color" className="vt-hidden-input" aria-label="Custom colour" value={color} onChange={(e) => set(e.target.value)} />
      </label>
    </div>
  );
}

function TextBgPanel({ item }) {
  const bg = item.bgColor && item.bgColor !== 'none' ? item.bgColor : 'none';
  const pick = (next) => {
    if (next === 'white') update(item.id, { bgColor: 'white', color: '#000000', stroke: 'transparent' });
    else if (next === 'black') update(item.id, { bgColor: 'black', color: '#ffffff', stroke: 'transparent' });
    else update(item.id, { bgColor: 'none', color: item.color === '#000000' ? '#ffffff' : item.color, stroke: '#000000' });
  };
  return <PickRow label="Text background" value={bg} onPick={pick} options={TEXT_BACKGROUNDS} />;
}

const SHADOW_OPTIONS = [
  { value: null, label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'hard', label: 'Hard' },
  { value: 'glow', label: 'Glow' },
];

// Outline (colour or none, and thickness) and shadow.
function StylePanel({ item }) {
  const boxed = Boolean(item.bgColor && item.bgColor !== 'none');
  const stroke = (item.stroke || (boxed ? 'transparent' : '#000000')).toLowerCase();
  const none = stroke === 'transparent';
  const thickness = Math.round((typeof item.outline === 'number' ? item.outline : (item.strokeWidth || Math.max(2, (item.fontSize || 32) / 25)) / (item.fontSize || 32)) * 1000) / 10;
  return (
    <div className="vt-style">
      <div className="vt-style-label">Outline</div>
      <div className="vt-swatch-row" role="radiogroup" aria-label="Outline colour">
        <button type="button" role="radio" aria-checked={none} aria-label="No outline" title="No outline"
          className={`vt-swatch-btn vt-swatch-none${none ? ' is-on' : ''}`} onClick={() => update(item.id, { stroke: 'transparent' })}>
          <Ban size={16} />
        </button>
        {TEXT_COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={stroke === c} aria-label={`Outline ${c}`}
            className={`vt-swatch-btn${stroke === c ? ' is-on' : ''}`} style={{ background: c }} onClick={() => update(item.id, { stroke: c })} />
        ))}
      </div>
      <label className={`vt-slider-row${none ? ' is-off' : ''}`}>
        <span>Thickness</span>
        <input type="range" min="1" max="12" step="0.5" value={Math.min(12, Math.max(1, thickness))} disabled={none}
          onChange={(e) => update(item.id, { outline: Number(e.target.value) / 100 })} />
        <output>{none ? '–' : thickness}</output>
      </label>
      <div className="vt-style-label">Shadow</div>
      <PickRow label="Shadow" value={item.shadow || null} onPick={(v) => update(item.id, { shadow: v })} options={SHADOW_OPTIONS} />
    </div>
  );
}

function AlignPanel({ item }) {
  return <PickRow label="Align" value={item.align || 'center'} onPick={(v) => update(item.id, { align: v })} options={ALIGNS} />;
}

function SpeedPanel({ item }) {
  const rate = item.playbackRate || 1;
  const pick = (next) => update(item.id, { playbackRate: next, endMs: item.startMs + (item.endMs - item.startMs) * (rate / next) });
  return <PickRow label="Speed" value={rate} onPick={pick} options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))} />;
}

// Where a picture sits on the canvas; a one-off placement, so nothing stays picked.
function PlacePanel({ item }) {
  const aspectRatio = useEditorStore((s) => s.canvasAspectRatio);
  return (
    <div className="vt-chip-row">
      {PLACEMENTS.map((p) => (
        <button key={p.value} type="button" className="vt-chip" onClick={() => update(item.id, placeMedia(item, aspectRatio, p.value))}>
          <p.Icon size={15} />
          {p.label}
        </button>
      ))}
    </div>
  );
}

function VolumePanel({ item }) {
  const volume = Math.round((Number.isFinite(item.volume) ? item.volume : 1) * 100);
  const fade = (key) => (
    <button
      type="button"
      className={`vt-chip${item[key] ? ' is-on' : ''}`}
      onClick={() => update(item.id, { [key]: item[key] ? 0 : DEFAULT_FADE_MS })}
    >
      {key === 'fadeInMs' ? 'Fade in' : 'Fade out'}
    </button>
  );
  return (
    <>
      <label className="vt-slider-row">
        <span>Volume</span>
        <input type="range" min="0" max="100" step="1" value={volume} onChange={(e) => update(item.id, { volume: Number(e.target.value) / 100 })} />
        <output>{volume}%</output>
      </label>
      <div className="vt-chip-row">
        {fade('fadeInMs')}{fade('fadeOutMs')}
        {item.type === 'audio' && !item.isVoiceover && (
          <button type="button" aria-pressed={Boolean(item.duck)} className={`vt-chip${item.duck ? ' is-on' : ''}`}
            title="Quieter while a voiceover or a video's sound plays" onClick={() => update(item.id, { duck: !item.duck })}>
            Lower under voice
          </button>
        )}
      </div>
    </>
  );
}

// A photo's slow zoom or pan while on screen.
function MotionPanel({ item }) {
  return (
    <PickRow label="Photo motion" value={item.motion || null} onPick={(v) => update(item.id, { motion: v })}
      options={PHOTO_MOTIONS.map((m) => ({ value: m.id, label: m.label }))} />
  );
}

// Mirror left-right and/or upside down; each chip is on while that flip is.
function FlipPanel({ item }) {
  const chip = (key, label, Icon) => (
    <button type="button" aria-pressed={Boolean(item[key])} className={`vt-chip${item[key] ? ' is-on' : ''}`} onClick={() => update(item.id, { [key]: !item[key] })}>
      <Icon size={15} /> {label}
    </button>
  );
  return <div className="vt-chip-row">{chip('flipX', 'Left–right', FlipHorizontal2)}{chip('flipY', 'Upside down', FlipVertical2)}</div>;
}

function OpacityPanel({ item }) {
  const opacity = Math.round(clipOpacity(item) * 100);
  return (
    <label className="vt-slider-row">
      <span>Opacity</span>
      <input type="range" min="0" max="100" step="1" value={opacity} onChange={(e) => update(item.id, { opacity: Number(e.target.value) / 100 })} />
      <output>{opacity}%</output>
    </label>
  );
}

function SizePanel({ item }) {
  const size = Math.round(item.fontSize || 32);
  return (
    <label className="vt-slider-row">
      <span>Size</span>
      <input type="range" min="16" max="300" step="1" value={size} onChange={(e) => update(item.id, { fontSize: Number(e.target.value) })} />
      <output>{size}</output>
    </label>
  );
}

function TextPanel({ item }) {
  return (
    <textarea
      className="vt-text-input"
      value={item.text || ''}
      rows={2}
      autoFocus
      placeholder="Type your text"
      onChange={(e) => update(item.id, { text: e.target.value })}
    />
  );
}

function GreenScreenPanel({ item }) {
  const key = item.chromaKey;
  if (!key) return null;
  const setKey = (patch) => update(item.id, { chromaKey: { ...key, ...patch } });
  const strength = Math.round(key.similarity * 100);
  const softness = Math.round(key.blend * 100);
  const detecting = key.color === 'auto';
  return (
    <>
      <label className="vt-slider-row">
        <span>Strength</span>
        <input type="range" min="5" max="50" step="1" value={strength} onChange={(e) => setKey({ similarity: Number(e.target.value) / 100 })} />
        <output>{strength}</output>
      </label>
      <label className="vt-slider-row">
        <span>Edges</span>
        <input type="range" min="0" max="30" step="1" value={softness} onChange={(e) => setKey({ blend: Number(e.target.value) / 100 })} />
        <output>{softness}</output>
      </label>
      <div className="vt-chip-row">
        <label className="vt-chip vt-swatch-chip" title="Pick the screen colour">
          <span className="vt-swatch" style={{ background: detecting ? DEFAULT_CHROMA_KEY.color : key.color }} />
          {detecting ? 'Detecting…' : 'Colour'}
          <input type="color" className="vt-hidden-input" value={detecting ? DEFAULT_CHROMA_KEY.color : key.color} onChange={(e) => setKey({ color: e.target.value })} />
        </label>
        <button type="button" className="vt-chip" onClick={() => setKey({ color: 'auto' })}><Pipette size={14} /> Re-detect</button>
        <button type="button" className="vt-chip" onClick={() => update(item.id, { chromaKey: null })}>Turn off</button>
      </div>
    </>
  );
}

function AnimationPanel({ item }) {
  const current = item.animation || null;
  return (
    <div className="vt-chip-row">
      {TEXT_ANIMATIONS.map((a) => (
        <button
          key={a.label}
          type="button"
          className={`vt-chip${current === a.id ? ' is-on' : ''}`}
          onClick={() => {
            update(item.id, { animation: a.id });
            // Show it straight away; the editor otherwise animates text only during playback.
            if (a.id) window.dispatchEvent(new CustomEvent('vt-preview-text-animation', { detail: { id: item.id } }));
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

function BackgroundPanel() {
  const color = useEditorStore((s) => s.backgroundColor || '#ffffff');
  const setColor = useEditorStore((s) => s.setBackgroundColor);
  return (
    <div className="vt-swatch-row" role="radiogroup" aria-label="Background colour">
      {BACKGROUND_SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={color.toLowerCase() === c}
          aria-label={c}
          className={`vt-swatch-btn${color.toLowerCase() === c ? ' is-on' : ''}`}
          style={{ background: c }}
          onClick={() => setColor(c)}
        />
      ))}
      <label className={`vt-swatch-btn vt-swatch-custom${BACKGROUND_SWATCHES.includes(color.toLowerCase()) ? '' : ' is-on'}`} title="Custom colour">
        <Palette size={16} />
        <input type="color" className="vt-hidden-input" value={color} onChange={(e) => setColor(e.target.value)} />
      </label>
    </div>
  );
}

// A handle shown small in a corner for the whole video (on top of everything, in the export too).
function WatermarkPanel() {
  const watermark = useEditorStore((s) => s.watermark);
  const set = (patch) => useEditorStore.getState().setWatermark({ text: '', corner: 'br', ...watermark, ...patch });
  const corner = watermark?.corner || 'br';
  return (
    <>
      <input
        className="vt-text-input"
        value={watermark?.text || ''}
        maxLength={40}
        placeholder="@yourname"
        aria-label="Watermark text"
        onChange={(e) => set({ text: e.target.value })}
      />
      <div className="vt-chip-row" role="radiogroup" aria-label="Corner">
        {WATERMARK_CORNERS.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={corner === c.id} className={`vt-chip${corner === c.id ? ' is-on' : ''}`} onClick={() => set({ corner: c.id })}>
            {c.label}
          </button>
        ))}
        {watermark?.text && <button type="button" className="vt-chip" onClick={() => useEditorStore.getState().setWatermark(null)}>Remove</button>}
      </div>
    </>
  );
}

const END_CARD_SWATCHES = ['#111111', '#ffffff', '#ff5e36', '#ec4899', '#facc15', '#22c55e', '#3b82f6'];

// A closing picture after everything else: a title, a line under it and a colour. Adding again
// redraws it (and moves it back to the end).
function EndCardPanel() {
  const current = useEditorStore((s) => s.items.find(isEndCard));
  const [card, setCard] = useState(() => current?.endCard || DEFAULT_END_CARD);
  const set = (patch) => setCard((c) => ({ ...c, ...patch }));
  const place = () => {
    const { items, canvasAspectRatio, placeEndCard } = useEditorStore.getState();
    const aspect = canvasAspectRatio || 16 / 9;
    placeEndCard(endCardClip(card, renderEndCard(card, aspect), items, aspect));
  };
  return (
    <>
      <input className="vt-text-input" value={card.title} maxLength={60} placeholder="Title" aria-label="End card title" onChange={(e) => set({ title: e.target.value })} />
      <input className="vt-text-input vt-text-input--small" value={card.subtitle} maxLength={80} placeholder="A line under it" aria-label="End card subtitle" onChange={(e) => set({ subtitle: e.target.value })} />
      <div className="vt-swatch-row" role="radiogroup" aria-label="End card colour">
        {END_CARD_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={card.color === c}
            aria-label={c}
            className={`vt-swatch-btn${card.color === c ? ' is-on' : ''}`}
            style={{ background: c }}
            onClick={() => set({ color: c })}
          />
        ))}
        <label className={`vt-swatch-btn vt-swatch-custom${END_CARD_SWATCHES.includes(card.color) ? '' : ' is-on'}`} title="Custom colour">
          <Palette size={16} />
          <input type="color" className="vt-hidden-input" value={card.color} onChange={(e) => set({ color: e.target.value })} />
        </label>
      </div>
      <div className="vt-chip-row">
        <button type="button" className="vt-chip is-on" onClick={place} disabled={!card.title.trim() && !card.subtitle.trim()}>
          {current ? 'Update end card' : 'Add end card'}
        </button>
        {current && <button type="button" className="vt-chip" onClick={() => useEditorStore.getState().removeItems([current.id])}>Remove</button>}
      </div>
    </>
  );
}

// The meme sounds people reach for most, one tap each.
const QUICK_SFX_IDS = ['vine_boom', 'bruh', 'airhorn', 'emotional_damage', 'metal_pipe', 'bonk', 'huh', 'anime_wow', 'faah', 'minecraft_oof'];
const QUICK_SFX = QUICK_SFX_IDS.map((id) => SOUND_EFFECTS.find((s) => s.id === id)).filter(Boolean);

function SfxPanel({ onMore }) {
  const [justAdded, setJustAdded] = useState(null);
  const add = (sound) => {
    useEditorStore.getState().addItem({ type: 'audio', url: sound.url, name: sound.name, durationMs: sound.durationMs || 3000, icon: sound.icon });
    try { new Audio(sound.url).play().catch(() => {}); } catch { /* preview is optional */ }
    setJustAdded(sound.id);
    setTimeout(() => setJustAdded((id) => (id === sound.id ? null : id)), 900);
  };
  return (
    <div className="vt-chip-row">
      {QUICK_SFX.map((s) => (
        <button key={s.id} type="button" className={`vt-chip${justAdded === s.id ? ' is-on' : ''}`} onClick={() => add(s)}>
          <span aria-hidden="true">{s.icon}</span>
          <span>{s.name.replace(/\s*\(.*\)$/, '')}</span>
        </button>
      ))}
      <button type="button" className="vt-chip" onClick={onMore}><Music size={14} /> More sounds</button>
    </div>
  );
}

function PunchPanel({ item }) {
  const playhead = useEditorStore((s) => s.playhead);
  const inside = playhead >= item.startMs && playhead <= item.endMs;
  const punches = item.punches || [];
  const visible = clipPunchTimes(item);
  const add = () => {
    if (inside) update(item.id, { punches: [...punches, sourceTimeMs(item, playhead)].sort((a, b) => a - b) });
  };
  // The punch whose moment is closest to the playhead (within half a second).
  const nearest = () => {
    let best = -1;
    let bestDist = 500;
    punches.forEach((s, i) => {
      const d = Math.abs(item.startMs + (s - (item.trimStartMs || 0)) / (item.playbackRate || 1) - playhead);
      if (d <= bestDist) { best = i; bestDist = d; }
    });
    return best;
  };
  return (
    <>
      <div className="vt-chip-row">
        <button type="button" className={`vt-chip${inside ? ' is-on' : ''}`} onClick={add} disabled={!inside}><ZoomIn size={14} /> Punch at playhead</button>
        <button type="button" className="vt-chip" onClick={() => { const i = nearest(); if (i >= 0) update(item.id, { punches: punches.filter((_, j) => j !== i) }); }}>Remove nearest</button>
        <button type="button" className="vt-chip" onClick={() => update(item.id, { punches: [] })}>Clear all ({visible.length})</button>
      </div>
      <p className="vt-panel-hint">Tip: press play and tap Punch on the beat.</p>
    </>
  );
}

const FILTER_SLIDERS = [
  { key: 'brightness', label: 'Bright' },
  { key: 'contrast', label: 'Contrast' },
  { key: 'saturation', label: 'Colour' },
];

function FilterPanel({ item }) {
  const filter = item.filter || {};
  const set = (patch) => update(item.id, { filter: { ...filter, ...patch } });
  return (
    <>
      <div className="vt-chip-row">
        {FILTER_PRESETS.map((p) => (
          <button key={p.label} type="button" className={`vt-chip${(filter.preset ?? null) === p.id ? ' is-on' : ''}`} onClick={() => set({ preset: p.id })}>
            {p.label}
          </button>
        ))}
      </div>
      {FILTER_SLIDERS.map(({ key, label }) => {
        const value = Math.round(filter[key] || 0);
        return (
          <label key={key} className="vt-slider-row">
            <span>{label}</span>
            <input type="range" min="-100" max="100" step="1" value={value} onChange={(e) => set({ [key]: Number(e.target.value) })} />
            <output>{value > 0 ? `+${value}` : value}</output>
          </label>
        );
      })}
    </>
  );
}

// Voiceover: recording plays the video from the playhead so you can talk over it; stopping (or the
// video ending) drops the recording on the timeline where it started.
function VoicePanel() {
  const [state, setState] = useState('idle'); // idle | starting | recording
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const startMsRef = useRef(0);

  const finish = async () => {
    const rec = recRef.current;
    if (!rec) return;
    recRef.current = null;
    const st = useEditorStore.getState();
    if (st.isPlaying) st.setIsPlaying(false);
    const { blob, type, durationMs } = await rec.stop();
    setState('idle');
    if (!blob.size || durationMs < 300) return;
    const count = useEditorStore.getState().items.filter((i) => i.isVoiceover).length;
    useEditorStore.getState().addItem({
      type: 'audio', url: URL.createObjectURL(blob), name: `Voiceover ${count + 1}`, icon: '🎙️',
      durationMs, startMs: startMsRef.current, mimeType: type, isVoiceover: true,
    });
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const start = async () => {
    setError(null);
    if (!canRecordVoice()) { setError('This browser can’t record audio.'); return; }
    setState('starting');
    try {
      recRef.current = await startVoiceRecording();
      if (!useEditorStore.getState().isPlaying) togglePlayback();
      startMsRef.current = useEditorStore.getState().playhead;
      setElapsed(0);
      setState('recording');
    } catch (e) {
      setState('idle');
      setError(e?.name === 'NotAllowedError'
        ? 'Microphone access is blocked. Allow it in your browser settings to record.'
        : 'Couldn’t start the microphone.');
    }
  };

  // Count up while recording, and stop when playback stops (paused, or the video ended).
  useEffect(() => {
    if (state !== 'recording') return undefined;
    const t0 = performance.now();
    const timer = setInterval(() => setElapsed(performance.now() - t0), 250);
    const unsub = useEditorStore.subscribe((s, p) => { if (p.isPlaying && !s.isPlaying) finishRef.current(); });
    return () => { clearInterval(timer); unsub(); };
  }, [state]);
  // Closing the panel keeps what was recorded.
  useEffect(() => () => { finishRef.current(); }, []);

  const recording = state === 'recording';
  return (
    <div className="vt-voice">
      <button
        type="button"
        className={`vt-rec-btn${recording ? ' is-recording' : ''}`}
        onClick={recording ? finish : start}
        disabled={state === 'starting'}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
      >
        <span />
      </button>
      <div className="vt-voice-text">
        <strong>{recording ? `Recording ${formatClock(elapsed)}` : 'Record a voiceover'}</strong>
        <span>{error || (recording ? 'Tap to stop. It lands where you started.' : 'The video plays from the playhead so you can talk over it.')}</span>
      </div>
    </div>
  );
}

// Auto captions: transcribe the clips' speech on this device (Whisper, English) and lay it out as
// short timed captions. Generating again replaces them; picking a style restyles them.
function CaptionsPanel() {
  const captionCount = useEditorStore((s) => s.items.filter((i) => i.autoCaption).length);
  const currentStyle = useEditorStore((s) => s.items.find((i) => i.autoCaption)?.captionStyle);
  const hasSpeech = useEditorStore((s) => speechClips(s.items).length > 0);
  const [styleId, setStyleId] = useState(currentStyle || 'classic');
  const [job, setJob] = useState(null); // { phase, progress, clip, clips } while generating
  const [message, setMessage] = useState(null);
  const runRef = useRef(0);

  const pickStyle = (id) => {
    setStyleId(id);
    if (captionCount) useEditorStore.getState().restyleAutoCaptions((item) => captionStyle(id, item));
  };

  const generate = async () => {
    const run = ++runRef.current;
    setMessage(null);
    setJob({ phase: 'listen', clip: 0, clips: 1 });
    try {
      const { generateCaptions } = await import('../../utils/autoCaptions');
      const st = useEditorStore.getState();
      const { captions } = await generateCaptions(st.items, (p) => { if (runRef.current === run) setJob(p); });
      if (runRef.current !== run) return;
      if (!captions.length) { setMessage('No speech heard. Captions work with English speech.'); return; }
      useEditorStore.getState().setAutoCaptions(captionItems(captions, styleId, useEditorStore.getState().canvasDimensions));
      setMessage(`${captions.length} captions added. Tap one to edit it.`);
    } catch (e) {
      if (runRef.current === run && e?.name !== 'TranscribeCancelledError') {
        setMessage(navigator.onLine === false ? 'You’re offline. The speech model downloads on first use.' : 'Couldn’t make captions for this video.');
        if (import.meta.env?.DEV) console.warn('[captions]', e);
      }
    } finally {
      if (runRef.current === run) setJob(null);
    }
  };

  const cancel = async () => {
    runRef.current++;
    setJob(null);
    const { cancelTranscription } = await import('../../utils/transcriber');
    cancelTranscription();
  };
  // Closing the panel stops a job in progress.
  useEffect(() => () => {
    runRef.current++;
    import('../../utils/transcriber').then((m) => m.cancelTranscription());
  }, []);

  const status = !job ? null
    : job.phase === 'download'
      ? { text: `Downloading speech model… ${Math.round((job.progress || 0) * 100)}%`, value: job.progress || 0 }
      : { text: job.clips > 1 ? `Listening to clip ${job.clip + 1} of ${job.clips}…` : 'Listening…', value: null };

  return (
    <div className="vt-captions">
      <div className="vt-chip-row">
        {CAPTION_STYLES.map((s) => (
          <button key={s.id} type="button" className={`vt-chip${styleId === s.id ? ' is-on' : ''}`} onClick={() => pickStyle(s.id)} disabled={Boolean(job)}>
            {s.label}
          </button>
        ))}
      </div>
      {status ? (
        <div className="vt-captions-job" role="status">
          <div className="vt-captions-job-text">
            <span>{status.text}</span>
            <button type="button" className="vt-chip" onClick={cancel}>Cancel</button>
          </div>
          <div className={`vt-captions-bar${status.value === null ? ' is-busy' : ''}`}>
            <span style={status.value === null ? undefined : { width: `${Math.round(status.value * 100)}%` }} />
          </div>
        </div>
      ) : (
        <div className="vt-captions-actions">
          <button type="button" className="vt-captions-go" onClick={generate} disabled={!hasSpeech}>
            <Captions size={16} strokeWidth={2.4} />
            {captionCount ? 'Regenerate' : 'Generate captions'}
          </button>
          {captionCount > 0 && (
            <button type="button" className="vt-chip" onClick={() => { useEditorStore.getState().removeAutoCaptions(); setMessage(null); }}>
              Remove
            </button>
          )}
        </div>
      )}
      <p className="vt-panel-hint">
        {message || (hasSpeech
          ? 'English speech, transcribed on your device. The first time downloads a 40 MB model.'
          : 'Add a video with speech or record a voiceover first.')}
      </p>
    </div>
  );
}

function TransitionPanel({ item }) {
  const current = item.transitionIn || {};
  const ms = current.durationMs || DEFAULT_TRANSITION_MS;
  const set = (patch) => update(item.id, { transitionIn: { durationMs: ms, ...current, ...patch } });
  return (
    <>
      <div className="vt-chip-row">
        {TRANSITIONS.map((t) => (
          <button key={t.label} type="button" className={`vt-chip${(current.type ?? null) === t.id ? ' is-on' : ''}`}
            onClick={() => (t.id ? set({ type: t.id }) : update(item.id, { transitionIn: null }))}>
            {t.label}
          </button>
        ))}
      </div>
      {current.type && (
        <label className="vt-slider-row">
          <span>Length</span>
          <input type="range" min="200" max="1200" step="50" value={ms} onChange={(e) => set({ durationMs: Number(e.target.value) })} />
          <output>{(ms / 1000).toFixed(2)}s</output>
        </label>
      )}
      <p className="vt-panel-hint">Plays where the previous clip ends and this one starts.</p>
    </>
  );
}

// Every settings sheet: its title, the icon beside it, and what it shows (for the selected clip, or for nothing selected).
const SHEETS = {
  text: { title: 'Edit text', Icon: PencilLine, Panel: TextPanel },
  font: { title: 'Font', Icon: Type, Panel: FontPanel },
  color: { title: 'Colour', Icon: Palette, Panel: ColorPanel },
  textbg: { title: 'Text background', Icon: Square, Panel: TextBgPanel },
  style: { title: 'Outline & shadow', Icon: TypeOutline, Panel: StylePanel },
  align: { title: 'Align', Icon: TextAlignCenter, Panel: AlignPanel },
  size: { title: 'Text size', Icon: ALargeSmall, Panel: SizePanel },
  animation: { title: 'Animate', Icon: Sparkles, Panel: AnimationPanel },
  speed: { title: 'Speed', Icon: Gauge, Panel: SpeedPanel },
  place: { title: 'Fit to canvas', Icon: Expand, Panel: PlacePanel },
  opacity: { title: 'Opacity', Icon: Blend, Panel: OpacityPanel },
  crop: { title: 'Crop', Icon: Crop, Panel: CropPanel },
  flip: { title: 'Flip', Icon: FlipHorizontal2, Panel: FlipPanel },
  motion: { title: 'Photo motion', Icon: Move, Panel: MotionPanel },
  volume: { title: 'Volume', Icon: SlidersHorizontal, Panel: VolumePanel },
  greenscreen: { title: 'Green screen', Icon: WandSparkles, Panel: GreenScreenPanel },
  punch: { title: 'Zoom punch', Icon: ZoomIn, Panel: PunchPanel },
  filter: { title: 'Filters', Icon: FiltersIcon, Panel: FilterPanel },
  transition: { title: 'Transition', Icon: ArrowRightLeft, Panel: TransitionPanel },
  background: { title: 'Background', Icon: PaintBucket, Panel: BackgroundPanel },
  watermark: { title: 'Watermark', Icon: AtSign, Panel: WatermarkPanel },
  endcard: { title: 'End card', Icon: Flag, Panel: EndCardPanel },
  sfx: { title: 'Sound effects', Icon: Zap, Panel: SfxPanel },
  voice: { title: 'Voiceover', Icon: Mic, Panel: VoicePanel },
  captions: { title: 'Auto captions', Icon: Captions, Panel: CaptionsPanel },
};

// The selected clip's tools for its pill: what this kind of clip can do (each setting opens its
// sheet, its button lit while open or while the setting is on), then Split, then the actions every
// clip shares as small round buttons.
function clipTools(item, { sheet, toggle, playhead, items }) {
  const store = useEditorStore.getState;
  const opens = (name, on = false) => ({ active: sheet === name || on, onClick: () => toggle(name) });
  const tools = [];
  if (item.type === 'text') {
    const font = FONTS.find((f) => f.family === item.fontFamily) || FONTS[0];
    const align = ALIGNS.find((a) => a.value === (item.align || 'center')) || ALIGNS[1];
    tools.push(
      { id: 'edit', label: 'Edit', Icon: PencilLine, ...opens('text') },
      { id: 'font', label: 'Font', icon: <span className="vt-font-sample" style={{ fontFamily: font.family }}>Aa</span>, ...opens('font') },
      { id: 'color', label: 'Colour', icon: <span className="vt-color-dot" style={{ background: item.color || '#ffffff' }} />, ...opens('color') },
      { id: 'style', label: 'Style', title: 'Outline and shadow', Icon: TypeOutline, ...opens('style', Boolean(item.shadow)) },
      { id: 'textbg', label: 'Background', Icon: Square, ...opens('textbg', Boolean(item.bgColor && item.bgColor !== 'none')) },
      { id: 'size', label: 'Size', Icon: ALargeSmall, ...opens('size') },
      { id: 'animate', label: 'Animate', Icon: Sparkles, ...opens('animation', Boolean(item.animation)) },
      { id: 'align', label: 'Align', Icon: align.Icon, ...opens('align') },
    );
  }
  if (item.type === 'video') {
    const rate = item.playbackRate || 1;
    const insideClip = playhead >= item.startMs && playhead <= item.endMs;
    tools.push(
      { id: 'speed', label: `${rate}×`, title: 'Speed', Icon: Gauge, ...opens('speed', rate !== 1) },
      { id: 'greenscreen', label: 'Green screen', Icon: WandSparkles, active: sheet === 'greenscreen' || Boolean(item.chromaKey), onClick: () => {
        if (!item.chromaKey) update(item.id, { chromaKey: { ...DEFAULT_CHROMA_KEY, color: 'auto' } });
        toggle('greenscreen', !item.chromaKey);
      } },
      { id: 'freeze', label: 'Freeze', Icon: Snowflake, title: insideClip ? 'Freeze the frame at the playhead' : 'Move the playhead onto this clip to freeze a frame',
        onClick: () => insideClip && freezeAtPlayhead(item, playhead) },
      { id: 'reverse', label: 'Reverse', Icon: Rewind, active: item.effect === 'reverse', onClick: () => toggleClipEffect(item, 'reverse') },
      { id: 'boomerang', label: 'Boomerang', Icon: Repeat, active: item.effect === 'boomerang', onClick: () => toggleClipEffect(item, 'boomerang') },
      { id: 'punch', label: 'Punch', Icon: ZoomIn, ...opens('punch', Boolean(item.punches?.length)) },
    );
  }
  if (previousClip(items, item)) {
    const label = TRANSITIONS.find((t) => t.id === item.transitionIn?.type)?.label;
    tools.push({ id: 'transition', label: label || 'Transition', Icon: ArrowRightLeft, ...opens('transition', Boolean(item.transitionIn?.type)) });
  }
  if (item.type === 'video' || item.type === 'audio') {
    tools.push(
      { id: 'volume', label: 'Volume', Icon: SlidersHorizontal, ...opens('volume') },
      { id: 'mute', label: item.muted ? 'Unmute' : 'Mute', Icon: item.muted ? VolumeX : Volume2, active: Boolean(item.muted), onClick: () => update(item.id, { muted: !item.muted }) },
    );
  }
  if (item.type === 'image' || item.type === 'video') {
    const preset = FILTER_PRESETS.find((p) => p.id === (item.filter?.preset ?? null));
    const filtered = Boolean(item.filter && (item.filter.preset || item.filter.brightness || item.filter.contrast || item.filter.saturation));
    tools.push(
      { id: 'filter', label: filtered && preset?.id ? preset.label : 'Filters', Icon: FiltersIcon, ...opens('filter', filtered) },
      { id: 'place', label: 'Fit', title: 'Fit, fill or stretch to the canvas', Icon: Expand, ...opens('place') },
    );
  }
  if (item.type === 'image' || item.type === 'video' || item.type === 'sticker') {
    tools.push(
      { id: 'crop', label: 'Crop', Icon: Crop, ...opens('crop', isCropped(clipCrop(item))) },
      { id: 'flip', label: 'Flip', Icon: FlipHorizontal2, ...opens('flip', Boolean(item.flipX || item.flipY)) },
    );
  }
  if (item.type === 'image') {
    const motion = PHOTO_MOTIONS.find((m) => m.id === (item.motion || null));
    tools.push({ id: 'motion', label: item.motion ? motion.label : 'Motion', title: 'Photo motion', Icon: Move, ...opens('motion', Boolean(item.motion)) });
  }
  if (canCutOut(item) || item.originalUrl) {
    tools.push({ id: 'cutout', label: 'Cut out', title: item.originalUrl ? 'Put the background back' : 'Remove the background', Icon: Eraser, active: Boolean(item.originalUrl), onClick: () => toggleCutOut(item) });
  }
  if (item.type === 'image' || item.type === 'sticker') {
    tools.push({ id: 'rotate', label: 'Rotate', Icon: RotateCw, onClick: () => update(item.id, rotateAboutCenter(item, ((item.rotation || 0) + 90) % 360)) });
  }
  if (item.type !== 'audio') {
    const opacity = clipOpacity(item);
    tools.push({ id: 'opacity', label: opacity < 1 ? `${Math.round(opacity * 100)}%` : 'Opacity', title: 'Opacity', Icon: Blend, ...opens('opacity', opacity < 1) });
  }
  tools.push({ id: 'select', label: 'Select', title: 'Select several clips (or long-press them on the timeline)', Icon: ListChecks, onClick: () => store().togglePicked(item.id) });
  const canSplit = playhead > item.startMs + MIN_SPLIT_MS && playhead < item.endMs - MIN_SPLIT_MS;
  tools.push({ id: 'split', label: 'Split', Icon: Scissors, title: canSplit ? 'Split at the playhead' : 'Move the playhead inside the clip to split it',
    onClick: () => canSplit && store().splitItem(item.id, playhead) });
  if (item.type !== 'audio') {
    tools.push(
      { id: 'forward', label: 'Bring forward', Icon: BringToFront, iconOnly: true, onClick: () => store().moveLayer(item.id, 1) },
      { id: 'back', label: 'Send back', Icon: SendToBack, iconOnly: true, onClick: () => store().moveLayer(item.id, -1) },
    );
  }
  tools.push(
    { id: 'duplicate', label: 'Duplicate', Icon: Copy, iconOnly: true, onClick: () => store().duplicateItem(item.id) },
    { id: 'delete', label: 'Delete', Icon: Trash2, iconOnly: true, danger: true, onClick: () => store().removeItem(item.id) },
  );
  return tools;
}

// The bar while several clips are picked: how many (tap to stop picking), Duplicate, Delete.
const pickedTools = (ids) => {
  const store = useEditorStore.getState;
  return [
    { id: 'clear', label: `${ids.length} selected`, title: 'Stop selecting', Icon: X, onClick: () => store().clearPicked() },
    { id: 'duplicate', label: 'Duplicate', Icon: Copy, onClick: () => store().duplicateItems(ids) },
    { id: 'delete', label: 'Delete', Icon: Trash2, danger: true, onClick: () => store().removeItems(ids) },
  ];
};

const DOCK = SECTIONS.map(({ id, label, Icon }) => ({ id, label, Icon }));

// The `sources` tools' sheets (Media: Add image, Add video), by tool.
const SOURCE_SHEETS = Object.fromEntries(SECTIONS.flatMap((s) => s.tools.filter((t) => t.sources).map((t) => [t.kind, { title: t.title, Icon: t.Icon, sources: t.sources }])));

// Where to get a photo or video from: two compact tiles side by side.
function SourcesPanel({ sources, onPick }) {
  return (
    <div className="vt-sources">
      {sources.map(({ kind, label, sub, Icon }) => (
        <button key={kind} type="button" className="vt-source" onClick={() => onPick(kind)}>
          <span className="vt-source-icon"><Icon size={18} strokeWidth={2.2} aria-hidden="true" /></span>
          <span className="vt-source-label">{label}</span>
          <span className="vt-source-sub">{sub}</span>
        </button>
      ))}
    </div>
  );
}

// The bottom of the editor, laid out like the image editor's: a dock of sections, a tapped
// section's tools in a strip above it (none to start; tapping the open section again puts them away;
// the preview gives up the room), and a selected clip's tools
// in a pill in the strip's place (no section lit meanwhile; any section deselects the clip). A
// setting opens a sheet in place of the strip or pill and the dock, nothing floating above it; it
// rises over the timeline (the bottom keeps its height, so the timeline and preview don't move).
export default function ToolRail({ onAdd }) {
  const activeItem = useEditorStore((s) => s.items.find((i) => i.id === s.activeItemId));
  const items = useEditorStore((s) => s.items);
  const playhead = useEditorStore((s) => s.playhead);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  // Picked clips still on the timeline (undo may have taken some away).
  const picked = selectedIds.filter((id) => items.some((i) => i.id === id));
  const [tab, setTab] = useState(null);
  // A sheet belongs to the clip it was opened for (or to "nothing selected"); selecting another closes it.
  const [sheetState, setSheetState] = useState({ id: null, name: null });
  const ownerId = activeItem?.id ?? null;
  const sheet = sheetState.id === ownerId ? sheetState.name : null;
  const setSheet = (name) => setSheetState({ id: ownerId, name });
  const toggle = (name, keepOpen = false) => setSheet(sheet === name && !keepOpen ? null : name);
  const spec = sheet && (SHEETS[sheet] || SOURCE_SHEETS[sheet]);

  // The bottom's height without a sheet, kept while one is open (it then floats over the timeline,
  // never higher than the timeline's top, the element before it).
  const wrapRef = useRef(null);
  const hasPill = Boolean(activeItem) || picked.length > 0;
  const [rest, setRest] = useState(null); // { height, room }
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || spec) return undefined;
    const measure = () => setRest({ height: el.offsetHeight, room: el.offsetHeight + (el.previousElementSibling?.offsetHeight || 0) });
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // Measured again as the strip or pill comes and goes (an observer may not have run yet when a
    // sheet opens straight after).
  }, [spec, tab, hasPill]);

  const section = SECTIONS.find((s) => s.id === tab) ?? null;
  const runTool = (kind) => {
    const tool = section.tools.find((t) => t.kind === kind);
    if (tool?.panel || tool?.sources) toggle(kind);
    else {
      setSheet(null);
      onAdd(kind);
    }
  };
  const openSection = (id) => {
    if (activeItem || picked.length) useEditorStore.getState().setActiveItem(null);
    setSheetState({ id: null, name: null });
    setTab(!activeItem && tab === id ? null : id);
  };

  return (
    <div className="vt-rail-wrap" ref={wrapRef} style={spec && rest ? { height: rest.height } : undefined}>
      <div className={`vt-bottom${spec ? ' has-sheet' : ''}`} style={spec && rest ? { minHeight: rest.height, maxHeight: rest.room } : undefined}>
        {/* While a sheet is open nothing floats above it: the strip or pill comes back when it closes. */}
        {spec ? null : picked.length ? (
          <div className="vt-pill">
            <FloatingToolbar ariaLabel="Selected clips" items={pickedTools(picked)} />
          </div>
        ) : activeItem ? (
          <div className="vt-pill">
            <FloatingToolbar ariaLabel="Clip tools" items={clipTools(activeItem, { sheet, toggle, playhead, items })} />
          </div>
        ) : section && (
          <ToolStrip
            key={section.id}
            ariaLabel={`${section.label} tools`}
            layout="stacked"
            items={section.tools.map((t) => ({ id: t.kind, label: t.label, Icon: t.Icon }))}
            active={sheet}
            onSelect={runTool}
          />
        )}
        {spec ? (
          <Sheet key={sheet} title={spec.title} Icon={spec.Icon} onClose={() => setSheet(null)} className="vt-sheet">
            {spec.sources
              ? <SourcesPanel sources={spec.sources} onPick={(kind) => { setSheet(null); onAdd(kind); }} />
              : <spec.Panel item={activeItem} onMore={() => { setSheet(null); onAdd('sounds'); }} />}
          </Sheet>
        ) : (
          <ToolDock ariaLabel="Sections" items={DOCK} active={activeItem || picked.length ? null : tab} onSelect={openSection} />
        )}
      </div>
    </div>
  );
}
