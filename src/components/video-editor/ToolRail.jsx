import React, { useEffect, useRef, useState } from 'react';
import {
  Type, Sticker, Smile, LayoutGrid, Image as ImageIcon, Film, Clapperboard, Music,
  Check, Gauge, Volume2, VolumeX, Palette, Square, RotateCw, Minimize, Crop, Maximize, Copy, Trash2,
  Scissors, PencilLine, ALargeSmall, TextAlignStart, TextAlignCenter, TextAlignEnd, SlidersHorizontal, WandSparkles, Pipette, Sparkles, ImagePlay, PaintBucket, Zap, Snowflake, Rewind, Repeat, ZoomIn, BringToFront, SendToBack, Blend, Mic, ArrowRightLeft, Frame, Plus, Upload, Library, Laugh, SquarePlay, Captions
} from 'lucide-react';
import { useEditorStore, clipEffectBase, sourceTimeMs } from '../../store/useVideoEditorStore';
import { captureFrame, renderClipEffect } from '../../utils/clipEffects';
import { clipPunchTimes } from '../../utils/zoomPunch';
import { FILTER_PRESETS } from '../../utils/clipFilters';
import { DEFAULT_TRANSITION_MS, TRANSITIONS, previousClip } from '../../utils/clipTransitions';
import { canRecordVoice, startVoiceRecording } from '../../utils/voiceRecorder';
import { CAPTION_STYLES, captionItems, captionStyle } from '../../utils/captionChunks';
import { speechClips } from '../../utils/clipAudio';
import { togglePlayback } from './usePlaybackLoop';
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

// The add tools, grouped like the image editor: a dock of sections, each section's tools as chips.
const SECTIONS = [
  { id: 'media', label: 'Media', Icon: Film, tools: [
    { kind: 'photo', label: 'Photo', Icon: ImageIcon },
    { kind: 'video', label: 'Video', Icon: SquarePlay },
    { kind: 'clips', label: 'Clips', Icon: Clapperboard },
    { kind: 'templates', label: 'Templates', Icon: LayoutGrid },
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
  ] },
];

const BACKGROUND_SWATCHES = ['#ffffff', '#000000', '#1a1d27', '#ff5e36', '#ec4899', '#facc15', '#22c55e', '#3b82f6'];

const SPEEDS = [0.5, 1, 1.5, 2];
const TEXT_BACKGROUNDS = ['none', 'white', 'black'];
const ALIGNS = [
  { value: 'left', Icon: TextAlignStart },
  { value: 'center', Icon: TextAlignCenter },
  { value: 'right', Icon: TextAlignEnd },
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

function RailButton({ label, Icon, onClick, active, danger, dim, done, children }) {
  return (
    <button
      type="button"
      className={`vt-tool${active ? ' is-active' : ''}${danger ? ' is-danger' : ''}${dim ? ' is-dim' : ''}${done ? ' is-done' : ''}`}
      onClick={onClick}
    >
      <span className="vt-tool-icon">{children || <Icon size={19} strokeWidth={1.9} />}</span>
      <span className="vt-tool-label">{label}</span>
    </button>
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
      <div className="vt-chip-row">{fade('fadeInMs')}{fade('fadeOutMs')}</div>
    </>
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

const PANELS = { volume: VolumePanel, size: SizePanel, text: TextPanel, greenscreen: GreenScreenPanel, animation: AnimationPanel, background: BackgroundPanel, sfx: SfxPanel, punch: PunchPanel, filter: FilterPanel, voice: VoicePanel, transition: TransitionPanel, captions: CaptionsPanel };

function ClipTools({ item, panel, setPanel }) {
  const aspectRatio = useEditorStore((s) => s.canvasAspectRatio);
  const playhead = useEditorStore((s) => s.playhead);
  const store = useEditorStore.getState;
  const togglePanel = (name) => setPanel((p) => (p === name ? null : name));
  const canSplit = playhead > item.startMs + MIN_SPLIT_MS && playhead < item.endMs - MIN_SPLIT_MS;
  const tools = [];

  tools.push(
    <RailButton key="split" label="Split" Icon={Scissors} dim={!canSplit} onClick={() => canSplit && store().splitItem(item.id, playhead)} />
  );
  if (item.type === 'text') {
    const font = FONTS.find((f) => f.family === item.fontFamily) || FONTS[0];
    const bg = item.bgColor && item.bgColor !== 'none' ? item.bgColor : 'none';
    const align = ALIGNS.find((a) => a.value === (item.align || 'center')) || ALIGNS[1];
    tools.push(
      <RailButton key="edit" label="Edit" Icon={PencilLine} active={panel === 'text'} onClick={() => togglePanel('text')} />,
      <RailButton key="font" label={font.id || font.name.split(' ')[0]} Icon={Type} onClick={() => {
        const idx = Math.max(0, FONTS.findIndex((f) => f.family === (item.fontFamily || font.family)));
        update(item.id, { fontFamily: FONTS[(idx + 1) % FONTS.length].family });
      }}>
        <span className="vt-tool-font" style={{ fontFamily: font.family }}>Aa</span>
      </RailButton>,
      <RailButton key="animate" label="Animate" Icon={Sparkles} active={panel === 'animation' || Boolean(item.animation)} onClick={() => togglePanel('animation')} />,
      <RailButton key="size" label="Size" Icon={ALargeSmall} active={panel === 'size'} onClick={() => togglePanel('size')} />,
      <label key="color" className="vt-tool">
        <span className="vt-tool-icon"><Palette size={22} strokeWidth={1.8} style={{ color: item.color || '#fff' }} /></span>
        <span className="vt-tool-label">Colour</span>
        <input type="color" className="vt-hidden-input" value={item.color || '#ffffff'}
          onChange={(e) => update(item.id, { color: e.target.value, stroke: getContrastStroke(e.target.value) })} />
      </label>,
      <RailButton key="bg" label="Background" Icon={Square} active={bg !== 'none'} onClick={() => {
        const next = TEXT_BACKGROUNDS[(TEXT_BACKGROUNDS.indexOf(bg) + 1) % TEXT_BACKGROUNDS.length];
        if (next === 'white') update(item.id, { bgColor: 'white', color: '#000000', stroke: 'transparent' });
        else if (next === 'black') update(item.id, { bgColor: 'black', color: '#ffffff', stroke: 'transparent' });
        else update(item.id, { bgColor: 'none', color: item.color === '#000000' ? '#ffffff' : item.color, stroke: '#000000' });
      }} />,
      <RailButton key="align" label="Align" Icon={align.Icon} onClick={() => {
        const next = ALIGNS[(ALIGNS.indexOf(align) + 1) % ALIGNS.length];
        update(item.id, { align: next.value });
      }} />
    );
  }
  if (item.type === 'video') {
    const rate = item.playbackRate || 1;
    tools.push(
      <RailButton key="greenscreen" label="Green screen" Icon={WandSparkles} active={Boolean(item.chromaKey)} onClick={() => {
        if (!item.chromaKey) {
          update(item.id, { chromaKey: { ...DEFAULT_CHROMA_KEY, color: 'auto' } });
          setPanel('greenscreen');
        } else {
          togglePanel('greenscreen');
        }
      }} />,
      <RailButton key="speed" label={`${rate}×`} Icon={Gauge} onClick={() => {
        const next = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length];
        update(item.id, { playbackRate: next, endMs: item.startMs + (item.endMs - item.startMs) * (rate / next) });
      }} />
    );
  }
  if (previousClip(store().items, item)) {
    const label = TRANSITIONS.find((t) => t.id === item.transitionIn?.type)?.label;
    tools.push(
      <RailButton key="transition" label={label || 'Transition'} Icon={ArrowRightLeft} active={panel === 'transition' || Boolean(item.transitionIn?.type)} onClick={() => togglePanel('transition')} />
    );
  }
  if (item.type === 'video') {
    const insideClip = playhead >= item.startMs && playhead <= item.endMs;
    tools.push(
      <RailButton key="freeze" label="Freeze" Icon={Snowflake} dim={!insideClip} onClick={() => insideClip && freezeAtPlayhead(item, playhead)} />,
      <RailButton key="reverse" label="Reverse" Icon={Rewind} active={item.effect === 'reverse'} onClick={() => toggleClipEffect(item, 'reverse')} />,
      <RailButton key="boomerang" label="Boomerang" Icon={Repeat} active={item.effect === 'boomerang'} onClick={() => toggleClipEffect(item, 'boomerang')} />,
      <RailButton key="punch" label="Punch" Icon={ZoomIn} active={panel === 'punch' || Boolean(item.punches?.length)} onClick={() => togglePanel('punch')} />
    );
  }
  if (item.type === 'video' || item.type === 'audio') {
    tools.push(
      <RailButton key="volume" label="Volume" Icon={SlidersHorizontal} active={panel === 'volume'} onClick={() => togglePanel('volume')} />,
      <RailButton key="mute" label={item.muted ? 'Unmute' : 'Mute'} Icon={item.muted ? VolumeX : Volume2} active={item.muted}
        onClick={() => update(item.id, { muted: !item.muted })} />
    );
  }
  if (item.type === 'image' || item.type === 'video') {
    const preset = FILTER_PRESETS.find((p) => p.id === (item.filter?.preset ?? null));
    const filtered = Boolean(item.filter && (item.filter.preset || item.filter.brightness || item.filter.contrast || item.filter.saturation));
    tools.push(
      <RailButton key="filter" label={filtered && preset?.id ? preset.label : 'Filters'} Icon={Blend} active={panel === 'filter' || filtered} onClick={() => togglePanel('filter')} />,
      <RailButton key="fit" label="Fit" Icon={Minimize} onClick={() => update(item.id, placeMedia(item, aspectRatio, 'fit'))} />,
      <RailButton key="cover" label="Fill" Icon={Crop} onClick={() => update(item.id, placeMedia(item, aspectRatio, 'cover'))} />,
      <RailButton key="stretch" label="Stretch" Icon={Maximize} onClick={() => update(item.id, placeMedia(item, aspectRatio, 'stretch'))} />
    );
  }
  if (item.type === 'image' || item.type === 'sticker') {
    tools.push(
      <RailButton key="rotate" label="Rotate" Icon={RotateCw} onClick={() => update(item.id, { rotation: ((item.rotation || 0) + 90) % 360 })} />
    );
  }
  if (item.type !== 'audio') {
    tools.push(
      <RailButton key="forward" label="Forward" Icon={BringToFront} onClick={() => store().moveLayer(item.id, 1)} />,
      <RailButton key="back" label="Back" Icon={SendToBack} onClick={() => store().moveLayer(item.id, -1)} />
    );
  }
  tools.push(
    <RailButton key="dup" label="Duplicate" Icon={Copy} onClick={() => store().duplicateItem(item.id)} />,
    <RailButton key="del" label="Delete" Icon={Trash2} danger onClick={() => store().removeItem(item.id)} />
  );

  return (
    <>
      <RailButton label="Done" Icon={Check} done onClick={() => store().setActiveItem(null)} />
      <span className="vt-rail-divider" aria-hidden="true" />
      {tools}
    </>
  );
}

// Bottom tool rail: add tools, or the selected clip's tools (with an optional slider/text panel above).
export default function ToolRail({ onAdd }) {
  const activeItem = useEditorStore((s) => s.items.find((i) => i.id === s.activeItemId));
  const [panelState, setPanelState] = useState({ id: null, name: null });
  // A panel belongs to the clip it was opened for (or to "nothing selected"); selecting another closes it.
  const ownerId = activeItem?.id ?? null;
  const panel = panelState.id === ownerId ? panelState.name : null;
  const setPanel = (fn) => setPanelState((prev) => {
    const current = prev.id === ownerId ? prev.name : null;
    return { id: ownerId, name: typeof fn === 'function' ? fn(current) : fn };
  });
  const Panel = panel && PANELS[panel];
  const [sectionId, setSectionId] = useState('media');
  const section = SECTIONS.find((sec) => sec.id === sectionId) || SECTIONS[0];

  // Picking a section from the dock closes any panel and, if a clip is selected, deselects it.
  const openSection = (id) => {
    setSectionId(id);
    setPanelState({ id: null, name: null });
    if (activeItem) useEditorStore.getState().setActiveItem(null);
  };

  return (
    <div className="vt-rail-wrap">
      {Panel && (
        <div className="vt-panel" role="group" aria-label="Clip settings">
          <Panel item={activeItem} onMore={() => { setPanel(null); onAdd('sounds'); }} />
        </div>
      )}
      <div className="vt-rail" role="toolbar" aria-label={activeItem ? 'Clip tools' : `${section.label} tools`}>
        {activeItem
          ? <ClipTools item={activeItem} panel={panel} setPanel={setPanel} />
          : section.tools.map((t) => (
            <RailButton
              key={t.kind}
              label={t.label}
              Icon={t.Icon}
              active={t.panel && panel === t.kind}
              onClick={() => (t.panel ? setPanel((p) => (p === t.kind ? null : t.kind)) : onAdd(t.kind))}
            />
          ))}
      </div>
      <nav className="vt-dock" aria-label="Sections">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            className={`vt-dock-tab${!activeItem && sec.id === section.id ? ' is-active' : ''}`}
            aria-pressed={!activeItem && sec.id === section.id}
            onClick={() => openSection(sec.id)}
          >
            <sec.Icon size={20} strokeWidth={1.8} />
            <span>{sec.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
