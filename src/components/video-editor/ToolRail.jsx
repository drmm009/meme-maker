import React, { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import {
  Type, Sticker, Smile, LayoutGrid, Image as ImageIcon, Clapperboard, Music,
  Gauge, Volume1, Volume2, VolumeX, Palette, RotateCw, Crop, Copy, Trash2,
  Scissors, PencilLine, WandSparkles, Sparkles, ImagePlay, PaintBucket, Zap, Snowflake, Rewind, Repeat, ZoomIn, BringToFront, SendToBack, Mic, ArrowRightLeft, Frame, Upload, Library, Laugh, SquarePlay, Captions, Expand, Blend, FlipHorizontal2, Move, ListChecks, X, AtSign, Flag, Layers, ScanFace, CaseSensitive, Baseline, Ellipsis, Wand, Settings2, SquarePen
} from 'lucide-react';
import { Sheet } from '../ui';
import DeckBar from './DeckBar';
import { BackgroundIcon, FiltersIcon } from '../editor/panels/editorIcons';
import { useEditorStore, clipEffectBase, sourceTimeMs } from '../../store/useVideoEditorStore';
import { clipOpacity } from '../../model/videoProject';
import { clipCrop, isCropped } from '../../utils/clipCrop';
import CropPanel from './CropPanel';
import VideoFilterPanel from './VideoFilterPanel';
import { SpeedPanel, VolumePanel } from './SpeedVolumePanels';
import CaptionsPanel from './CaptionsPanel';
import { AnimationPanel, FlipPanel, MotionPanel, PlacePanel, TransitionPanel } from './ClipLookPanels';
import { GreenScreenPanel, OpacityPanel, PunchPanel } from './ClipEffectPanels';
import { cropReset, greenScreenOff, punchesClear, videoFiltersReset } from './clipSheetActions';
import FaceSwapPanel from './FaceSwapPanel';
import { TextColorPanel, TextEditPanel, TextFontPanel, TextStylePanel } from './TextLookPanel';
import { StickerDieCutAside, StickerDieCutPanel, StickerEditPanel, StickerFlipAside } from './StickerLookPanel';
import { PhotoBackgroundPanel, PhotoFiltersPanel, PhotoMorePanel } from './PhotoLookPanel';
import { photoFiltered, photoFiltersReset } from './photoFilters';
import { isPhotoFramed } from '../../utils/photoLook';
import { isGifSticker } from '../../utils/stickerLook';
import { runJob } from './clipJobs';
import { VideoBackgroundAside, VideoBackgroundPanel } from './VideoBackgroundPanel';
import { PHOTO_MOTIONS } from '../../utils/photoMotion';
import { DEFAULT_END_CARD, WATERMARK_CORNERS, endCardClip, isEndCard, renderEndCard } from '../../utils/brandCard';
import { captureFrame, renderClipEffect } from '../../utils/clipEffects';
import { FILTER_PRESETS } from '../../utils/clipFilters';
import { TRANSITIONS, previousClip } from '../../utils/clipTransitions';
import { canRecordVoice, startVoiceRecording } from '../../utils/voiceRecorder';
import { togglePlayback } from './usePlaybackLoop';
import { rotateAboutCenter } from './preview/previewMath';
import { formatClock } from './timeline/timelineMath';
import { DEFAULT_CHROMA_KEY } from '../../utils/chromaKey';
import { SOUND_EFFECTS } from '../../data/soundEffects';

// The add tools: one flat row in the bottom bar, scrolling sideways when they don't fit (new tools
// go here). A `panel` tool opens its settings sheet, a `sources` tool a small sheet of tiles for
// where to get it from (a tile that names a settings sheet opens it); the rest add straight away.
const DOCK = [
  { kind: 'videos', label: 'Video', Icon: SquarePlay, title: 'Add video', sources: [
    { kind: 'video', label: 'Upload', sub: 'From your phone', Icon: Upload },
    { kind: 'clips', label: 'Clips', sub: 'Meme video clips', Icon: Clapperboard },
  ] },
  { kind: 'image', label: 'Photo', Icon: ImageIcon, title: 'Add photo', sources: [
    { kind: 'photo', label: 'Upload', sub: 'From your phone', Icon: Upload },
    { kind: 'templates', label: 'Templates', sub: 'Meme pictures', Icon: LayoutGrid },
  ] },
  { kind: 'text', label: 'Text', Icon: Type, title: 'Add text' },
  { kind: 'addsticker', label: 'Stickers', Icon: Sticker, title: 'Add sticker', sources: [
    { kind: 'stickers', label: 'Meme', sub: 'Stickers', Icon: Laugh },
    { kind: 'emoji', label: 'Emoji', sub: 'Every emoji', Icon: Smile },
    { kind: 'gifs', label: 'GIFs', sub: 'Animated', Icon: ImagePlay },
  ] },
  { kind: 'addsound', label: 'Sounds', Icon: Music, title: 'Add sound', sources: [
    { kind: 'sfx', label: 'Top sounds', sub: 'One tap each', Icon: Zap },
    { kind: 'sounds', label: 'All sounds', sub: 'The library', Icon: Library },
    { kind: 'audio', label: 'Upload', sub: 'From your phone', Icon: Upload },
  ] },
  { kind: 'voice', label: 'Voice', Icon: Mic, title: 'Record a voiceover', panel: true },
  { kind: 'captions', label: 'Subtitles', Icon: Captions, title: 'Auto captions', panel: true },
  { kind: 'canvas', label: 'Canvas', Icon: Frame, title: 'Canvas', sources: [
    { kind: 'background', label: 'Background', sub: 'Colour', Icon: PaintBucket },
    { kind: 'watermark', label: 'Watermark', sub: 'Your name', Icon: AtSign },
    { kind: 'endcard', label: 'End card', sub: 'At the end', Icon: Flag },
  ] },
];

const BACKGROUND_SWATCHES = ['#ffffff', '#000000', '#1a1d27', '#ff5e36', '#ec4899', '#facc15', '#22c55e', '#3b82f6'];

const MIN_SPLIT_MS = 100;

const update = (id, patch) => useEditorStore.getState().updateItem(id, patch);

// Freeze the frame under the playhead (the still is cut from what's showing, effects included).
const freezeAtPlayhead = (item, playhead) => runJob('Freezing frame…', async () => {
  const url = await captureFrame(item.url, sourceTimeMs(item, Math.min(Math.max(playhead, item.startMs), item.endMs)));
  useEditorStore.getState().insertFreeze(item.id, playhead, url);
});

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
      <button type="button" className="vt-chip" onClick={onMore}><Music size={14} /> All sounds</button>
    </div>
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

// Every settings sheet: its title, the icon beside it, and what it shows (for the selected clip, or for nothing selected).
const SHEETS = {
  // A text's sheets are the image editor's text controls (TextLookPanel): all of them, or one part.
  text: { title: 'Text', Icon: PencilLine, Panel: TextEditPanel, tall: true },
  font: { title: 'Font', Icon: CaseSensitive, Panel: TextFontPanel, tall: true },
  style: { title: 'Style', Icon: Baseline, Panel: TextStylePanel, tall: true },
  color: { title: 'Colour', Icon: Palette, Panel: TextColorPanel, tall: true },
  // A sticker's, as the image editor's (StickerLookPanel); `Aside` goes beside the heading.
  sticker: { title: 'Sticker', Icon: SquarePen, Panel: StickerEditPanel, Aside: StickerFlipAside },
  diecut: { title: 'Die-cut', Icon: Sticker, Panel: StickerDieCutPanel, Aside: StickerDieCutAside },
  // A photo's, as the image editor's (PhotoLookPanel); `action` is the heading's button.
  photobg: { title: 'Background', Icon: BackgroundIcon, Panel: PhotoBackgroundPanel },
  photofilter: { title: 'Filters', Icon: FiltersIcon, Panel: PhotoFiltersPanel, action: photoFiltersReset, tall: true },
  photomore: { title: 'Photo', Icon: Ellipsis, Panel: PhotoMorePanel },
  animation: { title: 'Animate', Icon: Sparkles, Panel: AnimationPanel },
  speed: { title: 'Speed', Icon: Gauge, Panel: SpeedPanel },
  place: { title: 'Fit to canvas', Icon: Expand, Panel: PlacePanel },
  opacity: { title: 'Opacity', Icon: Blend, Panel: OpacityPanel },
  crop: { title: 'Crop', Icon: Crop, Panel: CropPanel, action: cropReset, tall: true },
  flip: { title: 'Flip', Icon: FlipHorizontal2, Panel: FlipPanel },
  motion: { title: 'Photo motion', Icon: Move, Panel: MotionPanel },
  volume: { title: 'Volume', Icon: Volume2, Panel: VolumePanel },
  greenscreen: { title: 'Green screen', Icon: WandSparkles, Panel: GreenScreenPanel, action: greenScreenOff },
  bgremove: { title: 'Background', Icon: BackgroundIcon, Panel: VideoBackgroundPanel, Aside: VideoBackgroundAside },
  punch: { title: 'Zoom punch', Icon: ZoomIn, Panel: PunchPanel, action: punchesClear },
  // `tall`: may rise over the preview (its choices don't need it in view), not just to the timeline's top.
  faceswap: { title: 'Face swap', Icon: ScanFace, Panel: FaceSwapPanel, tall: true },
  filter: { title: 'Filters', Icon: FiltersIcon, Panel: VideoFilterPanel, action: videoFiltersReset, tall: true },
  transition: { title: 'Transition', Icon: ArrowRightLeft, Panel: TransitionPanel },
  background: { title: 'Background', Icon: PaintBucket, Panel: BackgroundPanel },
  watermark: { title: 'Watermark', Icon: AtSign, Panel: WatermarkPanel },
  endcard: { title: 'End card', Icon: Flag, Panel: EndCardPanel },
  sfx: { title: 'Top sounds', Icon: Zap, Panel: SfxPanel },
  voice: { title: 'Voiceover', Icon: Mic, Panel: VoicePanel },
  captions: { title: 'Auto captions', Icon: Captions, Panel: CaptionsPanel },
  arrange: { title: 'Arrange', Icon: Layers, Panel: ArrangePanel },
  // A video's tile sheets (VIDEO_TILES).
  effects: { title: 'Effects', Icon: Wand, tiles: 'effects' },
  adjust: { title: 'Adjust', Icon: Settings2, tiles: 'adjust' },
};

// A video has too many tools for one row: the everyday ones stay on it (VIDEO_ROW), Green screen and
// Face swap among them, the rest go in two sheets of tiles, Effects and Adjust, each a button on the
// row lit while any of its tools is on. Its Mute is in the Volume sheet. Background removal is off
// the menus for now; a clip that already has it keeps a Background tile to turn it off.
const VIDEO_TILES = {
  effects: { label: 'Effects', Icon: Wand, ids: ['freeze', 'reverse', 'boomerang', 'punch', 'bgremove'] },
  adjust: { label: 'Adjust', Icon: Settings2, ids: ['crop', 'place', 'flip', 'opacity'] },
};
// Cutting and timing first (Split, Speed, Volume), then the picture (Adjust, Filters, Effects,
// Transition), the AI tools (Green screen, Face swap), then the clip itself (Duplicate, Select,
// Arrange, Delete).
const VIDEO_ROW = ['split', 'speed', 'volume', 'adjust', 'filter', 'effects', 'transition', 'greenscreen', 'faceswap', 'duplicate', 'select', 'arrange', 'delete'];

function videoRow(tools, sheet, toggle) {
  const groups = Object.entries(VIDEO_TILES).map(([id, { label, Icon, ids }]) => ({
    id, label, Icon,
    active: sheet === id || tools.some((t) => ids.includes(t.id) && t.active),
    onClick: () => toggle(id),
  }));
  return [...tools, ...groups]
    .filter((t) => VIDEO_ROW.includes(t.id))
    .sort((a, b) => VIDEO_ROW.indexOf(a.id) - VIDEO_ROW.indexOf(b.id));
}

// A sheet of a video's tools as tiles (Effects, Adjust): an on/off tool lit while on; one with
// settings opens its sheet in the tiles' place.
function ToolTiles({ tools }) {
  return (
    <div className="vt-tool-tiles">
      {tools.map(({ id, label, title, Icon, active, onClick }) => (
        <button key={id} type="button" className={`vt-tool-tile${active ? ' is-on' : ''}`} title={title || label} aria-pressed={active} onClick={onClick}>
          <span className="vt-tool-tile-icon"><Icon size={20} strokeWidth={2} aria-hidden="true" /></span>
          <span className="vt-tool-tile-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

// The Volume button's speaker shows the clip's level: crossed out when muted or silent, one wave
// when quiet, two otherwise.
const volumeIcon = (item) => {
  const level = Number.isFinite(item.volume) ? item.volume : 1;
  if (item.muted || level === 0) return VolumeX;
  return level < 0.5 ? Volume1 : Volume2;
};

// A photo's row, as a video's: Split first, then the look (Filters, Background), how it moves
// (Motion, Transition), the AI tool (Face swap), More (mirror, crop, replace, look), then the clip
// itself (Duplicate, Select, Arrange, Delete). A photo is placed and turned on the preview.
const IMAGE_ROW = ['split', 'filter', 'background', 'motion', 'transition', 'faceswap', 'more', 'duplicate', 'select', 'arrange', 'delete'];
// A sticker's, the same way: Split, its look (Edit, Die-cut), its shape and turn (Crop, Flip,
// Rotate), then the clip itself.
const STICKER_ROW = ['split', 'edit', 'diecut', 'crop', 'flip', 'rotate', 'transition', 'duplicate', 'select', 'arrange', 'delete'];
const ROWS = { image: IMAGE_ROW, sticker: STICKER_ROW };

// The selected clip's tools for the bottom bar, all in one row: what this kind of clip can do (each
// setting opens its sheet, its button lit while open or while the setting is on), then Split,
// Arrange (a sheet) and Delete; a video's laid out by videoRow.
function clipTools(item, { sheet, toggle, playhead, items }) {
  const store = useEditorStore.getState;
  const opens = (name, on = false) => ({ active: sheet === name || on, onClick: () => toggle(name) });
  const tools = [];
  if (item.type === 'text') {
    // As the image editor's text bar: Font, Style and Colour each open their part of the controls.
    tools.push(
      { id: 'edit', label: 'Edit', title: 'The words and every setting', Icon: PencilLine, ...opens('text') },
      { id: 'font', label: 'Font', title: 'Font and my saved styles', Icon: CaseSensitive, ...opens('font') },
      { id: 'style', label: 'Style', title: 'Size, bold, italic, underline, effects, alignment and spacing', Icon: Baseline, ...opens('style') },
      { id: 'color', label: 'Colour', title: 'Colour, outline, the box behind the text and opacity', icon: <span className="vt-color-dot" style={{ background: item.color || '#ffffff' }} />, ...opens('color') },
      { id: 'animate', label: 'Animate', Icon: Sparkles, ...opens('animation', Boolean(item.animation)) },
    );
  }
  if (item.type === 'sticker') {
    // As the image editor's sticker bar: Edit (size, opacity, shadow, flip) and Die-cut.
    tools.push({ id: 'edit', label: 'Edit', title: 'Size, opacity, shadow and flip', Icon: SquarePen, ...opens('sticker') });
    if (!isGifSticker(item)) tools.push({ id: 'diecut', label: 'Die-cut', title: item.dieCut ? 'Die-cut border (on)' : 'Add die-cut border', Icon: Sticker, ...opens('diecut', Boolean(item.dieCut)) });
  }
  if (item.type === 'image') {
    // As the image editor's photo bar: Face swap, Background, Filters and More (mirror, crop,
    // replace and the look).
    const more = Boolean(item.flipX || item.flipY || isCropped(clipCrop(item)) || isPhotoFramed(item) || clipOpacity(item) < 1);
    tools.push(
      { id: 'faceswap', label: 'Face swap', title: 'Face swap with AI', Icon: ScanFace, ...opens('faceswap', Boolean(item.faceSwapOf)) },
      { id: 'background', label: 'Background', title: 'Background blur and background removal', Icon: BackgroundIcon, ...opens('photobg', (item.bgBlur || 0) > 0 || Boolean(item.originalUrl)) },
      { id: 'filter', label: 'Filters', Icon: FiltersIcon, ...opens('photofilter', photoFiltered(item)) },
      { id: 'more', label: 'More', title: 'More: mirror, crop, replace, look', Icon: Ellipsis, ...opens('photomore', more) },
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
      { id: 'faceswap', label: 'Face swap', Icon: ScanFace, ...opens('faceswap', item.effect === 'faceswap') },
    );
    if (item.bgRemoval) {
      tools.push({ id: 'bgremove', label: 'Background', title: 'Background removal (on)', Icon: BackgroundIcon, active: true, ...opens('bgremove', true) });
    }
  }
  if (previousClip(items, item)) {
    const label = TRANSITIONS.find((t) => t.id === item.transitionIn?.type)?.label;
    tools.push({ id: 'transition', label: label || 'Transition', Icon: ArrowRightLeft, ...opens('transition', Boolean(item.transitionIn?.type)) });
  }
  if (item.type === 'video' || item.type === 'audio') {
    tools.push(
      { id: 'volume', label: item.muted ? 'Muted' : 'Volume', title: 'Volume and fades', Icon: volumeIcon(item),
        ...opens('volume', Boolean(item.muted || (Number.isFinite(item.volume) && item.volume !== 1) || item.fadeInMs || item.fadeOutMs)) },
    );
  }
  if (item.type === 'video') {
    const preset = FILTER_PRESETS.find((p) => p.id === (item.filter?.preset ?? null));
    const filtered = Boolean(item.filter && (item.filter.preset || item.filter.brightness || item.filter.contrast || item.filter.saturation));
    tools.push({ id: 'filter', label: filtered && preset?.id ? preset.label : 'Filters', Icon: FiltersIcon, ...opens('filter', filtered) });
  }
  if (item.type === 'video') {
    tools.push({ id: 'place', label: 'Fit', title: 'Fit, fill or stretch to the canvas', Icon: Expand, ...opens('place') });
  }
  // A photo's crop and flips are in its More.
  if (item.type === 'video' || item.type === 'sticker') {
    tools.push(
      { id: 'crop', label: 'Crop', Icon: Crop, ...opens('crop', isCropped(clipCrop(item))) },
      { id: 'flip', label: 'Flip', Icon: FlipHorizontal2, ...opens('flip', Boolean(item.flipX || item.flipY)) },
    );
  }
  if (item.type === 'image') {
    const motion = PHOTO_MOTIONS.find((m) => m.id === (item.motion || null));
    tools.push({ id: 'motion', label: item.motion ? motion.label : 'Motion', title: 'Photo motion', Icon: Move, ...opens('motion', Boolean(item.motion)) });
  }
  if (item.type === 'sticker') {
    tools.push({ id: 'rotate', label: 'Rotate', Icon: RotateCw, onClick: () => update(item.id, rotateAboutCenter(item, ((item.rotation || 0) + 90) % 360)) });
  }
  // A text's opacity is in its Colour sheet, a sticker's in its Edit, a photo's in its More.
  if (item.type === 'video') {
    const opacity = clipOpacity(item);
    tools.push({ id: 'opacity', label: opacity < 1 ? `${Math.round(opacity * 100)}%` : 'Opacity', title: 'Opacity', Icon: Blend, ...opens('opacity', opacity < 1) });
  }
  const canSplit = playhead > item.startMs + MIN_SPLIT_MS && playhead < item.endMs - MIN_SPLIT_MS;
  tools.push({ id: 'split', label: 'Split', Icon: Scissors, title: canSplit ? 'Split at the playhead' : 'Move the playhead inside the clip to split it',
    onClick: () => canSplit && store().splitItem(item.id, playhead) });
  tools.push(
    { id: 'duplicate', label: 'Duplicate', title: 'A copy, right after it', Icon: Copy, onClick: () => store().duplicateItem(item.id) },
    { id: 'select', label: 'Select', title: 'Pick several clips', Icon: ListChecks, onClick: () => store().togglePicked(item.id) },
  );
  // A sound has no layer to move.
  if (item.type !== 'audio') tools.push({ id: 'arrange', label: 'Arrange', title: 'Bring forward or send back', Icon: Layers, ...opens('arrange') });
  tools.push({ id: 'delete', label: 'Delete', Icon: Trash2, danger: true, onClick: () => store().removeItem(item.id) });
  const row = ROWS[item.type];
  if (row) tools.sort((a, b) => row.indexOf(a.id) - row.indexOf(b.id));
  return tools;
}

// Arrange: the clip's layer order, as two tiles. They keep the sheet open (tap again to move again).
// Duplicate and Select are on the toolbar.
function ArrangePanel({ item }) {
  const store = useEditorStore.getState;
  const tiles = [
    { id: 'forward', label: 'Bring forward', sub: 'One layer up', Icon: BringToFront, run: () => store().moveLayer(item.id, 1) },
    { id: 'back', label: 'Send back', sub: 'One layer down', Icon: SendToBack, run: () => store().moveLayer(item.id, -1) },
  ];
  return (
    <div className="vt-sources">
      {tiles.map(({ id, label, sub, Icon, run }) => (
        <button key={id} type="button" className="vt-source" onClick={run}>
          <span className="vt-source-icon"><Icon size={18} strokeWidth={2.2} aria-hidden="true" /></span>
          <span className="vt-source-label">{label}</span>
          <span className="vt-source-sub">{sub}</span>
        </button>
      ))}
    </div>
  );
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

// The `sources` tools' sheets (Video, Photo, Stickers, Sounds, Canvas), by tool.
// The add tools' circles take the colour their clips have on the timeline.
const DOCK_TINTS = {
  videos: 'var(--vt-clip-video)', image: 'var(--vt-clip-image)', text: 'var(--vt-clip-text)', addsticker: 'var(--vt-clip-sticker)',
  addsound: 'var(--vt-clip-audio)', voice: 'var(--vt-clip-audio)', captions: 'var(--vt-clip-text)',
};

const SOURCE_SHEETS = Object.fromEntries(DOCK.filter((t) => t.sources).map((t) => [t.kind, { title: t.title, Icon: t.Icon, sources: t.sources }]));

// A timeline section's add tool (an empty section's icon, TimelinePanel), by section.
const SECTION_TOOLS = { video: 'videos', image: 'image', text: 'text', sticker: 'addsticker', audio: 'addsound' };

// Where to get something from: compact tiles, two side by side, or three as columns.
function SourcesPanel({ sources, onPick }) {
  return (
    <div className={`vt-sources${sources.length === 3 ? ' vt-sources--3' : ''}`}>
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

// The bottom of the editor: one flat bar of tools under the timeline (DeckBar). It shows the add
// tools; a selected clip's tools take the same row after a Back (the only Back). A setting or a
// choice of where to add from opens a sheet in the bar's place that rises over the timeline (the bottom keeps its height, so
// the timeline and preview don't move).
export default function ToolRail({ onAdd, ref }) {
  const activeItem = useEditorStore((s) => s.items.find((i) => i.id === s.activeItemId));
  const items = useEditorStore((s) => s.items);
  const playhead = useEditorStore((s) => s.playhead);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  // Picked clips still on the timeline (undo may have taken some away).
  const picked = selectedIds.filter((id) => items.some((i) => i.id === id));
  // A sheet belongs to the clip it was opened for (or to "nothing selected"); selecting another closes it.
  // One opened from a tile in another sheet (Opacity from Adjust, Background from Canvas) keeps that
  // sheet as its `parent`, and closing it goes back there.
  const [sheetState, setSheetState] = useState({ id: null, name: null, parent: null });
  const ownerId = activeItem?.id ?? null;
  const sheet = sheetState.id === ownerId ? sheetState.name : null;
  const setSheet = (name) => setSheetState({ id: ownerId, name, parent: null });
  const closeSheet = () => setSheetState((s) => ({ ...s, name: s.parent, parent: null }));
  // After a tile in sheet `from` has run: if it opened a sheet of its own, closing that comes back to `from`.
  const cameFrom = (from) => setSheetState((s) => (s.name && s.name !== from ? { ...s, parent: from } : s));
  const toggle = (name, keepOpen = false) => setSheet(sheet === name && !keepOpen ? null : name);
  const spec = sheet && (SHEETS[sheet] || SOURCE_SHEETS[sheet]);

  // The bottom's height without a sheet, kept while one is open (it then floats over the timeline,
  // never higher than the timeline's top, the element before it; with the timeline closed, as high
  // as its top would be when open, the clamp in .vt-editor.is-edit .vt-timeline-wrap).
  const wrapRef = useRef(null);
  const hasClip = Boolean(activeItem) || picked.length > 0;
  const [rest, setRest] = useState(null); // { height, room }
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || spec) return undefined;
    const measure = () => {
      const openTimeline = Math.min(340, Math.max(200, window.innerHeight * 0.34));
      const timeline = Math.max(el.previousElementSibling?.offsetHeight || 0, openTimeline);
      setRest({ height: el.offsetHeight, room: el.offsetHeight + timeline });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // Measured again as the bar's row changes (an observer may not have run yet when a sheet opens
    // straight after).
  }, [spec, hasClip]);

  const runTool = (tool) => {
    if (tool.panel || tool.sources) toggle(tool.kind);
    else {
      setSheet(null);
      onAdd(tool.kind);
    }
  };
  // ref.openAdd(section): a timeline section's add tool, as if tapped in the add tools (letting go
  // of a selected clip first, so its sheet shows).
  useImperativeHandle(ref, () => ({
    openAdd(section) {
      const tool = DOCK.find((t) => t.kind === SECTION_TOOLS[section]);
      if (!tool) return;
      useEditorStore.getState().setActiveItem(null);
      if (tool.panel || tool.sources) setSheetState({ id: null, name: tool.kind });
      else onAdd(tool.kind);
    },
  }));
  // A tile in a sources sheet: a settings sheet (Top sounds, Background…) opens in its place;
  // anything else is added (or its picker opened).
  const pickSource = (kind) => {
    if (SHEETS[kind]) setSheetState({ id: ownerId, name: kind, parent: sheet });
    else {
      setSheet(null);
      onAdd(kind);
    }
  };

  // The selected clip's tools: its row, and a video's Effects and Adjust tiles.
  const allTools = activeItem ? clipTools(activeItem, { sheet, toggle, playhead, items }) : [];

  // One row at a time: the picked clips' actions, the selected clip's tools, or the add tools.
  let bar;
  if (picked.length) {
    bar = <DeckBar ariaLabel="Selected clips" items={pickedTools(picked)} />;
  } else if (activeItem) {
    const tools = activeItem.type === 'video' ? videoRow(allTools, sheet, toggle) : allTools;
    bar = <DeckBar key="clip" scrollKey={`clip:${activeItem.id}`} ariaLabel="Clip tools" items={tools} back={{ label: 'Back', title: 'Done with this clip', onClick: () => useEditorStore.getState().setActiveItem(null) }} />;
  } else {
    bar = (
      <DeckBar key="add" scrollKey="add" ariaLabel="Add tools"
        items={DOCK.map((t) => ({ id: t.kind, label: t.label, title: t.title, Icon: t.Icon, tint: DOCK_TINTS[t.kind], onClick: () => runTool(t) }))} />
    );
  }

  return (
    <div className="vt-rail-wrap" ref={wrapRef} style={spec && rest ? { height: rest.height } : undefined}>
      <div className={`vt-bottom${spec ? ' has-sheet' : ''}`} style={spec && rest ? { minHeight: rest.height, maxHeight: spec.tall ? Math.max(rest.room, Math.min(420, window.innerHeight * 0.6)) : rest.room } : undefined}>
        {/* A setting's sheet takes the bar's place; the bar comes back when it closes. */}
        {spec ? (
          <Sheet key={sheet} title={spec.title} Icon={spec.Icon} onClose={closeSheet} className="vt-sheet"
            aside={spec.Aside && activeItem ? <spec.Aside item={activeItem} /> : undefined}
            action={spec.action && activeItem ? spec.action(activeItem) : undefined}>
            {spec.tiles && activeItem
              ? <ToolTiles tools={VIDEO_TILES[spec.tiles].ids.map((id) => allTools.find((t) => t.id === id)).filter(Boolean)
                .map((t) => ({ ...t, onClick: () => { t.onClick(); cameFrom(sheet); } }))} />
              : spec.sources
              ? <SourcesPanel sources={spec.sources} onPick={pickSource} />
              : <spec.Panel item={activeItem} onMore={() => { setSheet(null); onAdd('sounds'); }} onOpen={setSheet} />}
          </Sheet>
        ) : bar}
      </div>
    </div>
  );
}
