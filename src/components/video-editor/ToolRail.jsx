import React from 'react';
import {
  Type, Sticker, Smile, LayoutGrid, Image as ImageIcon, Film, Clapperboard, Music, AudioLines,
  Check, Gauge, Volume2, VolumeX, Palette, Square, RotateCw, Minimize, Crop, Maximize, Copy, Trash2
} from 'lucide-react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { FONTS } from '../../data/stickers';

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
  { kind: 'templates', label: 'Templates', Icon: LayoutGrid },
  { kind: 'photo', label: 'Photo', Icon: ImageIcon },
  { kind: 'video', label: 'Video', Icon: Film },
  { kind: 'clips', label: 'Clips', Icon: Clapperboard },
  { kind: 'sounds', label: 'Sounds', Icon: Music },
  { kind: 'audio', label: 'Audio', Icon: AudioLines },
];

const SPEEDS = [0.5, 1, 1.5, 2];
const TEXT_BACKGROUNDS = ['none', 'white', 'black'];

const update = (id, patch) => useEditorStore.getState().updateItem(id, patch);

// Image placement relative to the canvas: contain, cover, or stretch to fill.
const placeImage = (item, dims, mode) => {
  const w0 = item.width || 200;
  const h0 = item.height || 200;
  if (mode === 'stretch') return { x: 0, y: 0, scaleX: dims.width / w0, scaleY: dims.height / h0 };
  const wider = w0 / h0 > dims.width / dims.height;
  const s = (mode === 'fit') === wider ? dims.width / w0 : dims.height / h0;
  return { x: (dims.width - w0 * s) / 2, y: (dims.height - h0 * s) / 2, scaleX: s, scaleY: s };
};

function RailButton({ label, Icon, onClick, active, danger, children }) {
  return (
    <button type="button" className={`vt-tool${active ? ' is-active' : ''}${danger ? ' is-danger' : ''}`} onClick={onClick}>
      <span className="vt-tool-icon">{children || <Icon size={22} strokeWidth={1.8} />}</span>
      <span className="vt-tool-label">{label}</span>
    </button>
  );
}

function ClipTools({ item }) {
  const dims = useEditorStore((s) => s.canvasDimensions);
  const store = useEditorStore.getState;
  const tools = [];

  if (item.type === 'video') {
    const rate = item.playbackRate || 1;
    tools.push(
      <RailButton key="speed" label={`${rate}×`} Icon={Gauge} onClick={() => {
        const next = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length];
        update(item.id, { playbackRate: next, endMs: item.startMs + (item.endMs - item.startMs) * (rate / next) });
      }} />
    );
  }
  if (item.type === 'video' || item.type === 'audio') {
    tools.push(
      <RailButton key="mute" label={item.muted ? 'Unmute' : 'Mute'} Icon={item.muted ? VolumeX : Volume2} active={item.muted}
        onClick={() => update(item.id, { muted: !item.muted })} />
    );
  }
  if (item.type === 'text') {
    const font = FONTS.find((f) => f.family === item.fontFamily) || FONTS[0];
    const bg = item.bgColor && item.bgColor !== 'none' ? item.bgColor : 'none';
    tools.push(
      <RailButton key="font" label={font.id || font.name.split(' ')[0]} Icon={Type} onClick={() => {
        const idx = Math.max(0, FONTS.findIndex((f) => f.family === (item.fontFamily || font.family)));
        update(item.id, { fontFamily: FONTS[(idx + 1) % FONTS.length].family });
      }}>
        <span className="vt-tool-font" style={{ fontFamily: font.family }}>Aa</span>
      </RailButton>,
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
      }} />
    );
  }
  if (item.type === 'image') {
    tools.push(
      <RailButton key="fit" label="Fit" Icon={Minimize} onClick={() => update(item.id, placeImage(item, dims, 'fit'))} />,
      <RailButton key="cover" label="Fill" Icon={Crop} onClick={() => update(item.id, placeImage(item, dims, 'cover'))} />,
      <RailButton key="stretch" label="Stretch" Icon={Maximize} onClick={() => update(item.id, placeImage(item, dims, 'stretch'))} />
    );
  }
  if (item.type === 'image' || item.type === 'sticker') {
    tools.push(
      <RailButton key="rotate" label="Rotate" Icon={RotateCw} onClick={() => update(item.id, { rotation: ((item.rotation || 0) + 90) % 360 })} />
    );
  }
  tools.push(
    <RailButton key="dup" label="Duplicate" Icon={Copy} onClick={() => {
      store().addItem({ ...item, x: (item.x || 0) + 20, y: (item.y || 0) + 20 });
    }} />,
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

// Bottom tool rail: add tools, or the selected clip's tools.
export default function ToolRail({ onAdd }) {
  const activeItem = useEditorStore((s) => s.items.find((i) => i.id === s.activeItemId));
  return (
    <nav className="vt-rail" aria-label={activeItem ? 'Clip tools' : 'Add to video'}>
      {activeItem
        ? <ClipTools item={activeItem} />
        : ADD_TOOLS.map((t) => <RailButton key={t.kind} label={t.label} Icon={t.Icon} onClick={() => onAdd(t.kind)} />)}
    </nav>
  );
}
