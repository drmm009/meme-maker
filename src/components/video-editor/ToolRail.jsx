import React, { useState } from 'react';
import {
  Type, Sticker, Smile, LayoutGrid, Image as ImageIcon, Film, Clapperboard, Music, AudioLines,
  Check, Gauge, Volume2, VolumeX, Palette, Square, RotateCw, Minimize, Crop, Maximize, Copy, Trash2,
  Scissors, PencilLine, ALargeSmall, TextAlignStart, TextAlignCenter, TextAlignEnd, SlidersHorizontal, WandSparkles, Pipette, Sparkles, ImagePlay, PaintBucket
} from 'lucide-react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { FONTS } from '../../data/stickers';
import { DEFAULT_FADE_MS } from '../../utils/audioFades';
import { DEFAULT_CHROMA_KEY } from '../../utils/chromaKey';
import { TEXT_ANIMATIONS } from '../../utils/textAnimation';

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

const ADD_TOOLS = [
  { kind: 'text', label: 'Text', Icon: Type },
  { kind: 'stickers', label: 'Stickers', Icon: Sticker },
  { kind: 'emoji', label: 'Emoji', Icon: Smile },
  { kind: 'gifs', label: 'GIFs', Icon: ImagePlay },
  { kind: 'templates', label: 'Templates', Icon: LayoutGrid },
  { kind: 'photo', label: 'Photo', Icon: ImageIcon },
  { kind: 'video', label: 'Video', Icon: Film },
  { kind: 'clips', label: 'Clips', Icon: Clapperboard },
  { kind: 'sounds', label: 'Sounds', Icon: Music },
  { kind: 'audio', label: 'Audio', Icon: AudioLines },
  { kind: 'background', label: 'Background', Icon: PaintBucket, panel: true },
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

function RailButton({ label, Icon, onClick, active, danger, dim, children }) {
  return (
    <button
      type="button"
      className={`vt-tool${active ? ' is-active' : ''}${danger ? ' is-danger' : ''}${dim ? ' is-dim' : ''}`}
      onClick={onClick}
    >
      <span className="vt-tool-icon">{children || <Icon size={22} strokeWidth={1.8} />}</span>
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

const PANELS = { volume: VolumePanel, size: SizePanel, text: TextPanel, greenscreen: GreenScreenPanel, animation: AnimationPanel, background: BackgroundPanel };

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
  if (item.type === 'video' || item.type === 'audio') {
    tools.push(
      <RailButton key="volume" label="Volume" Icon={SlidersHorizontal} active={panel === 'volume'} onClick={() => togglePanel('volume')} />,
      <RailButton key="mute" label={item.muted ? 'Unmute' : 'Mute'} Icon={item.muted ? VolumeX : Volume2} active={item.muted}
        onClick={() => update(item.id, { muted: !item.muted })} />
    );
  }
  if (item.type === 'image' || item.type === 'video') {
    tools.push(
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
  tools.push(
    <RailButton key="dup" label="Duplicate" Icon={Copy} onClick={() => store().duplicateItem(item.id)} />,
    <RailButton key="del" label="Delete" Icon={Trash2} danger onClick={() => store().removeItem(item.id)} />
  );

  return (
    <>
      <RailButton label="Done" Icon={Check} active onClick={() => store().setActiveItem(null)} />
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

  return (
    <div className="vt-rail-wrap">
      {Panel && (
        <div className="vt-panel" role="group" aria-label="Clip settings">
          <Panel item={activeItem} />
        </div>
      )}
      <nav className="vt-rail" aria-label={activeItem ? 'Clip tools' : 'Add to video'}>
        {activeItem
          ? <ClipTools item={activeItem} panel={panel} setPanel={setPanel} />
          : ADD_TOOLS.map((t) => (
            <RailButton
              key={t.kind}
              label={t.label}
              Icon={t.Icon}
              active={t.panel && panel === t.kind}
              onClick={() => (t.panel ? setPanel((p) => (p === t.kind ? null : t.kind)) : onAdd(t.kind))}
            />
          ))}
      </nav>
    </div>
  );
}
