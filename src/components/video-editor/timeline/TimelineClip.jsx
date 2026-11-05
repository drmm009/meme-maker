import React, { useEffect, useState } from 'react';
import { Music, VolumeX } from 'lucide-react';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { findSnap, pxToMs } from './timelineMath';
import { filmstripTiles, loadFilmstrip } from '../../../utils/filmstrip';
import { clipPunchTimes } from '../../../utils/zoomPunch';
import { loadPeaks, waveBarsFor } from '../../../utils/waveform';

// Inner height of a video clip (56px row minus borders); filmstrip tiles are this tall.
const VIDEO_TILE_H = 52;

// Frames sampled along a video, or null while they load (the clip shows its thumbnail meanwhile).
function useFilmstrip(url, enabled) {
  const [strip, setStrip] = useState(null);
  useEffect(() => {
    if (!enabled || !url) return undefined;
    let alive = true;
    loadFilmstrip(url).then((s) => { if (alive) setStrip(s); }).catch(() => {});
    return () => { alive = false; };
  }, [url, enabled]);
  return strip;
}

// A sound's loudness peaks, or null while it decodes (or if it can't be).
function useWaveform(url, enabled) {
  const [peaks, setPeaks] = useState(null);
  useEffect(() => {
    if (!enabled || !url) return undefined;
    let alive = true;
    loadPeaks(url).then((p) => { if (alive) setPeaks(p); }).catch(() => {});
    return () => { alive = false; };
  }, [url, enabled]);
  return peaks;
}

const MAX_MS = 100000;
const MIN_CLIP_MS = 100;
// The waveform sits 6px inside the clip on each side; one bar per 4px.
const WAVE_INSET = 6;
const WAVE_BAR_PX = 4;

const clipLabel = (item) => {
  if (item.type === 'text') return item.text || 'Text';
  if (item.type === 'audio') return item.name || 'Sound';
  return item.name || item.type;
};

// One clip on a track. Tap selects; once selected it can be dragged and trimmed from either end.
export default function TimelineClip({ item, left, width, selected, pxPerSec, onSnap }) {
  const strip = useFilmstrip(item.url, item.type === 'video');
  const peaks = useWaveform(item.url, item.type === 'audio');
  const waveWidth = Math.max(0, width - 2 * WAVE_INSET);
  // The sound under the clip; flat while it decodes.
  const bars = item.type !== 'audio' ? []
    : peaks ? waveBarsFor(peaks, { width: waveWidth, pxPerSec, trimStartMs: item.trimStartMs || 0, rate: item.playbackRate || 1, barPx: WAVE_BAR_PX })
    : Array.from({ length: Math.max(1, Math.floor(waveWidth / WAVE_BAR_PX)) }, () => 6);
  const thumb = item.type === 'video'
    ? (strip ? null : item.thumbnailUrl)
    : (item.type === 'image' || item.type === 'sticker') ? item.url : null;
  const tiles = strip
    ? filmstripTiles({ width, tileWidth: VIDEO_TILE_H * strip.aspect, trimStartMs: item.trimStartMs || 0, rate: item.playbackRate || 1, pxPerSec, frameTimes: strip.times })
    : [];

  const startDrag = (e, action) => {
    if (!selected || e.button > 0) return;
    e.stopPropagation();
    e.preventDefault();
    const store = useEditorStore.getState();
    const startX = e.clientX;
    const { startMs, endMs } = item;
    const trimStartMs = item.trimStartMs || 0;
    const points = [0, store.playhead, ...store.items.filter((i) => i.id !== item.id).flatMap((i) => [i.startMs, i.endMs])];
    const threshold = pxToMs(10, pxPerSec);
    // Media can't be trimmed past the start of its footage, and a sound can't run past the end of its file.
    const rate = item.playbackRate || 1;
    const isMedia = item.type === 'video' || item.type === 'audio';
    const earliestStart = isMedia ? startMs - trimStartMs / rate : 0;
    const latestEnd = item.type === 'audio' && item.sourceDurationMs
      ? startMs + (item.sourceDurationMs - trimStartMs) / rate
      : MAX_MS;

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
        s = Math.max(0, earliestStart, Math.min(s, endMs - MIN_CLIP_MS));
        patch = isMedia
          ? { startMs: s, trimStartMs: Math.max(0, trimStartMs + (s - startMs) * rate) }
          : { startMs: s };
      } else {
        let end = endMs + delta;
        const sn = findSnap(end, points, threshold);
        if (sn !== null) { end = sn; snap = sn; }
        patch = { endMs: Math.min(MAX_MS, latestEnd, Math.max(startMs + MIN_CLIP_MS, end)) };
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
      {tiles.length > 0 && (
        <div className="vt-filmstrip" aria-hidden="true">
          {tiles.map((t) => (
            <span key={t.left} style={{ left: t.left, width: t.width, backgroundImage: `url(${strip.srcs[t.frame]})` }} />
          ))}
        </div>
      )}
      {item.transitionIn?.type && <span className="vt-transition-mark" aria-hidden="true" />}
      {item.type === 'video' && clipPunchTimes(item).map((t) => (
        <span key={t} className="vt-punch-mark" style={{ left: ((t - item.startMs) / 1000) * pxPerSec }} aria-hidden="true" />
      ))}
      {item.type === 'audio' && (
        <div className={`vt-clip-wave${peaks ? ' is-loaded' : ''}`} aria-hidden="true">
          {bars.map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
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
      {selected && (
        <>
          <span className="vt-clip-handle vt-clip-handle--start" onPointerDown={(e) => startDrag(e, 'trim-start')} aria-label="Trim start" />
          <span className="vt-clip-handle vt-clip-handle--end" onPointerDown={(e) => startDrag(e, 'trim-end')} aria-label="Trim end" />
        </>
      )}
    </div>
  );
}
