import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Plus, Volume2, VolumeX, Film } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { DEFAULT_PX_PER_SEC, clampZoom, getRulerMarks, msToPx, pxToMs, timelineRows } from './timelineMath';
import TimelineClip from './TimelineClip';

// A scroll counts as the user's (and scrubs) only shortly after they touched the timeline;
// otherwise it is our own scroll following the playhead.
const USER_SCROLL_WINDOW_MS = 1500;

// Scrolling timeline with a fixed centre playhead: the tracks move under it. Scrolling scrubs,
// playback scrolls, pinch or Ctrl+wheel zooms around the playhead.
export default function TimelinePanel({ onAddVideo }) {
  const { items, duration, activeItemId } = useEditorStore(
    useShallow((s) => ({ items: s.items, duration: s.duration, activeItemId: s.activeItemId }))
  );
  const [pxPerSec, setPxPerSec] = useState(DEFAULT_PX_PER_SEC);
  const [viewW, setViewW] = useState(360);
  const [snapMs, setSnapMs] = useState(null);
  const scrollRef = useRef(null);
  const zoomRef = useRef(pxPerSec);
  const lastUserInput = useRef(0);
  zoomRef.current = pxPerSec;

  const pad = viewW / 2;
  const contentW = msToPx(duration, pxPerSec);
  const x = (ms) => pad + msToPx(ms, pxPerSec);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    // Also re-sync the scroll: it resets to 0 while the panel is folded away in preview mode.
    const measure = () => {
      setViewW(el.clientWidth || 360);
      el.scrollLeft = msToPx(useEditorStore.getState().playhead, zoomRef.current);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the scroll position on the playhead (playback, undo, zoom) without re-rendering.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const follow = (ms) => {
      const target = msToPx(ms, zoomRef.current);
      if (Math.abs(el.scrollLeft - target) > 0.5) el.scrollLeft = target;
    };
    follow(useEditorStore.getState().playhead);
    return useEditorStore.subscribe((s, prev) => { if (s.playhead !== prev.playhead) follow(s.playhead); });
  }, [pxPerSec, viewW]);

  const markUserInput = () => { lastUserInput.current = performance.now(); };

  const onScroll = () => {
    if (performance.now() - lastUserInput.current > USER_SCROLL_WINDOW_MS) return;
    const store = useEditorStore.getState();
    if (store.isPlaying) store.setIsPlaying(false);
    store.setPlayhead(pxToMs(scrollRef.current.scrollLeft, zoomRef.current));
  };

  // Ctrl/Cmd + wheel and two-finger pinch zoom. Wheel needs a non-passive listener to stop page zoom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      markUserInput();
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setPxPerSec((z) => clampZoom(z * (e.deltaY < 0 ? 1.12 : 0.89)));
    };
    let pinch = null;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e) => {
      markUserInput();
      if (e.touches.length === 2) pinch = { d: dist(e.touches), z: zoomRef.current };
    };
    const onTouchMove = (e) => {
      markUserInput();
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        setPxPerSec(clampZoom(pinch.z * (dist(e.touches) / pinch.d)));
      }
    };
    const onTouchEnd = (e) => { markUserInput(); if (e.touches.length < 2) pinch = null; };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('pointerdown', markUserInput);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('pointerdown', markUserInput);
    };
  }, []);

  const rows = timelineRows(items);
  const videos = items.filter((i) => i.type === 'video');
  const lastVideo = videos.length ? videos.reduce((a, b) => (b.endMs > a.endMs ? b : a)) : null;
  // Row buttons act on every clip in the row (the captions row holds them all).
  const toggle = (row, key) => row.forEach((clip) => useEditorStore.getState().updateItem(clip.id, { [key]: !row[0][key] }));

  return (
    <div className="vt-timeline">
      <div
        ref={scrollRef}
        className="vt-scroll"
        onScroll={onScroll}
        onClick={() => useEditorStore.getState().setActiveItem(null)}
      >
        <div className="vt-canvas" style={{ width: pad * 2 + contentW }}>
          <div className="vt-ruler">
            {getRulerMarks(duration, pxPerSec).map((m) => (
              <span key={m.ms} className={m.major ? 'vt-tick' : 'vt-dot'} style={{ left: x(m.ms) }}>
                {m.label}
              </span>
            ))}
          </div>

          <div className="vt-tracks">
            {rows.map((row) => {
              const item = row[0];
              return (
              <div key={item.autoCaption ? 'captions' : item.id} className={`vt-row vt-row--${item.type}`}>
                <div className="vt-row-head" style={{ left: pad - 10 }} onClick={(e) => e.stopPropagation()}>
                  {item.type !== 'audio' && (
                    <button
                      type="button"
                      className={`vt-head-btn${item.hidden ? ' is-off' : ''}`}
                      onClick={() => toggle(row, 'hidden')}
                      aria-label={item.autoCaption ? (item.hidden ? 'Show captions' : 'Hide captions') : (item.hidden ? 'Show clip' : 'Hide clip')}
                    >
                      {item.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                  {(item.type === 'video' || item.type === 'audio') && (
                    <button
                      type="button"
                      className={`vt-head-btn${item.muted ? ' is-off' : ''}`}
                      onClick={() => toggle(row, 'muted')}
                      aria-label={item.muted ? 'Unmute clip' : 'Mute clip'}
                    >
                      {item.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                  )}
                </div>
                {row.map((clip) => (
                  <TimelineClip
                    key={clip.id}
                    item={clip}
                    left={x(clip.startMs)}
                    width={Math.max(24, msToPx(clip.endMs - clip.startMs, pxPerSec))}
                    selected={clip.id === activeItemId}
                    pxPerSec={pxPerSec}
                    onSnap={setSnapMs}
                  />
                ))}
                {item === lastVideo && (
                  <button
                    type="button"
                    className="vt-add-after"
                    style={{ left: x(item.endMs) + 6 }}
                    onClick={(e) => { e.stopPropagation(); onAddVideo(); }}
                    aria-label="Add video"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                )}
              </div>
              );
            })}

            {!lastVideo && (
              <div className="vt-row vt-row--video">
                <button
                  type="button"
                  className="vt-empty-clip"
                  style={{ left: pad }}
                  onClick={(e) => { e.stopPropagation(); onAddVideo(); }}
                >
                  <Film size={16} /> Add a video
                </button>
              </div>
            )}
          </div>

          {snapMs !== null && <div className="vt-snap-line" style={{ left: x(snapMs) }} />}
        </div>
      </div>
      <div className="vt-playhead" aria-hidden="true"><span className="vt-playhead-knob" /></div>
    </div>
  );
}
