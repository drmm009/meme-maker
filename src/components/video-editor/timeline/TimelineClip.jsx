import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Music, VolumeX } from 'lucide-react';
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

// How long a press picks a clip (to select several), and how far a finger may wander meanwhile.
const PICK_PRESS_MS = 450;
const PICK_SLOP_PX = 8;

// One clip on a track. Tap selects; once selected it can be dragged and trimmed from either end.
// A long press (or Shift/Ctrl-click) picks it to select several; while picking, taps add or remove
// clips and dragging a picked clip moves them all.
export default function TimelineClip({ item, left, width, selected, picked = false, picking = false, pxPerSec, onSnap }) {
  const pressRef = useRef(null);
  const skipClickRef = useRef(false);
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

  // Long press: picks the clip unless the finger moves (scrolling the timeline) or lifts first.
  const startPress = (e) => {
    if (e.button > 0) return;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const cancel = () => {
      clearTimeout(pressRef.current);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('pointercancel', cancel);
    };
    const onMove = (ev) => { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > PICK_SLOP_PX) cancel(); };
    pressRef.current = setTimeout(() => {
      cancel();
      skipClickRef.current = true;
      navigator.vibrate?.(12);
      useEditorStore.getState().togglePicked(item.id);
    }, PICK_PRESS_MS);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', cancel);
    window.addEventListener('pointercancel', cancel);
  };

  // Dragging a picked clip moves every picked clip by the same amount.
  const startGroupDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const store = useEditorStore.getState();
    const from = Object.fromEntries(store.items.filter((i) => store.selectedIds.includes(i.id)).map((i) => [i.id, { startMs: i.startMs, endMs: i.endMs }]));
    const startX = e.clientX;
    let moved = false;
    const onMove = (ev) => {
      if (!moved && Math.abs(ev.clientX - startX) < 3) return;
      moved = true;
      useEditorStore.getState().shiftItems(from, pxToMs(ev.clientX - startX, pxPerSec));
    };
    const onUp = () => {
      if (moved) skipClickRef.current = true;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const startDrag = (e, action) => {
    if (picked && action === 'move') { if (e.button === 0) startGroupDrag(e); return; }
    if (!selected) { if (!picking) startPress(e); return; }
    if (e.button > 0) return;
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

  const hasEye = item.type !== 'audio' && (selected || item.hidden);
  return (
    <div
      className={`vt-clip vt-clip--${item.type}${selected ? ' is-selected' : ''}${picked ? ' is-picked' : ''}${item.hidden ? ' is-hidden' : ''}${hasEye ? ' has-eye' : ''}`}
      style={{ left, width, ...(thumb ? { backgroundImage: `url(${thumb})` } : {}) }}
      data-clip-id={item.id}
      onClick={(e) => {
        e.stopPropagation();
        if (skipClickRef.current) { skipClickRef.current = false; return; }
        const store = useEditorStore.getState();
        if (picking || e.shiftKey || e.ctrlKey || e.metaKey) store.togglePicked(item.id);
        else store.setActiveItem(item.id);
      }}
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
          <span className="vt-clip-label">{clipLabel(item)}</span>
        </div>
      )}
      {item.muted && (item.type === 'video' || item.type === 'audio') && (
        <span className="vt-clip-badge" aria-label="Muted"><VolumeX size={11} /></span>
      )}
      {/* Show/hide, at the clip's start: on the selected clip, and always on a hidden one so it can
          come back. Sound has nothing to show. A caption's acts on all the captions (they share a row). */}
      {hasEye && (
        <div className="vt-clip-eye-lane">
        <button
          type="button"
          className={`vt-clip-eye${item.hidden ? ' is-off' : ''}`}
          aria-label={item.autoCaption ? (item.hidden ? 'Show captions' : 'Hide captions') : (item.hidden ? 'Show clip' : 'Hide clip')}
          aria-pressed={Boolean(item.hidden)}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            const store = useEditorStore.getState();
            const clips = item.autoCaption ? store.items.filter((i) => i.autoCaption) : [item];
            clips.forEach((c) => store.updateItem(c.id, { hidden: !item.hidden }));
          }}
        >
          {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        </div>
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
