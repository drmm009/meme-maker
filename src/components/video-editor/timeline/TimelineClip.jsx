import React from 'react';
import { Music, VolumeX } from 'lucide-react';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { findSnap, pxToMs } from './timelineMath';

const MAX_MS = 100000;
const MIN_CLIP_MS = 100;

// Deterministic pseudo-waveform so an audio clip looks the same on every render.
const waveBars = (seed, count) => {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: count }, (_, i) => {
    h = (h * 1103515245 + 12345 + i) >>> 0;
    return 25 + (h % 70);
  });
};

const clipLabel = (item) => {
  if (item.type === 'text') return item.text || 'Text';
  if (item.type === 'audio') return item.name || 'Sound';
  return item.name || item.type;
};

// One clip on a track. Tap selects; once selected it can be dragged and, except audio, trimmed from either end.
export default function TimelineClip({ item, left, width, selected, pxPerSec, onSnap }) {
  const thumb = item.type === 'video' ? item.thumbnailUrl : (item.type === 'image' || item.type === 'sticker') ? item.url : null;
  const canTrim = item.type !== 'audio';

  const startDrag = (e, action) => {
    if (!selected || e.button > 0) return;
    if (action !== 'move' && !canTrim) return;
    e.stopPropagation();
    e.preventDefault();
    const store = useEditorStore.getState();
    const startX = e.clientX;
    const { startMs, endMs } = item;
    const trimStartMs = item.trimStartMs || 0;
    const points = [0, store.playhead, ...store.items.filter((i) => i.id !== item.id).flatMap((i) => [i.startMs, i.endMs])];
    const threshold = pxToMs(10, pxPerSec);

    const onMove = (ev) => {
      const delta = pxToMs(ev.clientX - startX, pxPerSec);
      let snap = null;
      let patch;
      if (action === 'move') {
        const len = endMs - startMs;
        let s = startMs + delta;
        const startSnap = findSnap(s, points, threshold);
        const endSnap = findSnap(s + len, points, threshold);
        if (startSnap !== null) { s = startSnap; snap = startSnap; } else if (endSnap !== null) { s = endSnap - len; snap = endSnap; }
        s = Math.max(0, Math.min(s, MAX_MS - len));
        patch = { startMs: s, endMs: s + len };
      } else if (action === 'trim-start') {
        let s = startMs + delta;
        const sn = findSnap(s, points, threshold);
        if (sn !== null) { s = sn; snap = sn; }
        s = Math.max(0, Math.min(s, endMs - MIN_CLIP_MS));
        patch = { startMs: s, trimStartMs: Math.max(0, trimStartMs + (s - startMs)) };
      } else {
        let end = endMs + delta;
        const sn = findSnap(end, points, threshold);
        if (sn !== null) { end = sn; snap = sn; }
        patch = { endMs: Math.min(MAX_MS, Math.max(startMs + MIN_CLIP_MS, end)) };
      }
      onSnap(snap);
      useEditorStore.getState().updateItem(item.id, patch);
    };
    const onUp = () => {
      onSnap(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const repeats = Math.max(1, Math.floor(width / 110));

  return (
    <div
      className={`vt-clip vt-clip--${item.type}${selected ? ' is-selected' : ''}${item.hidden ? ' is-hidden' : ''}`}
      style={{ left, width, ...(thumb ? { backgroundImage: `url(${thumb})` } : {}) }}
      data-clip-id={item.id}
      onClick={(e) => { e.stopPropagation(); useEditorStore.getState().setActiveItem(item.id); }}
      onPointerDown={(e) => startDrag(e, 'move')}
    >
      {item.type === 'audio' && (
        <div className="vt-clip-wave" aria-hidden="true">
          {waveBars(item.id, Math.max(8, Math.floor(width / 5))).map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
        </div>
      )}
      {(item.type === 'text' || item.type === 'audio') && (
        <div className="vt-clip-labels">
          {item.type === 'audio' && <Music size={12} strokeWidth={2.5} aria-hidden="true" />}
          {Array.from({ length: item.type === 'text' ? repeats : 1 }, (_, i) => (
            <span key={i} className="vt-clip-label">{clipLabel(item)}</span>
          ))}
        </div>
      )}
      {item.muted && (item.type === 'video' || item.type === 'audio') && (
        <span className="vt-clip-badge" aria-label="Muted"><VolumeX size={11} /></span>
      )}
      {selected && canTrim && (
        <>
          <span className="vt-clip-handle vt-clip-handle--start" onPointerDown={(e) => startDrag(e, 'trim-start')} aria-label="Trim start" />
          <span className="vt-clip-handle vt-clip-handle--end" onPointerDown={(e) => startDrag(e, 'trim-end')} aria-label="Trim end" />
        </>
      )}
    </div>
  );
}
