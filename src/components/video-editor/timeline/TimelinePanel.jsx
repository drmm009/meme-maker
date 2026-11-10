import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Plus, Film, SquarePlay, Image as ImageIcon, Type, Sticker, Music } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { DEFAULT_PX_PER_SEC, clampZoom, getRulerMarks, msToPx, pxToMs, timelineSections } from './timelineMath';
import TimelineClip from './TimelineClip';

// A scroll counts as the user's (and scrubs) only shortly after they touched the timeline;
// otherwise it is our own scroll following the playhead.
const USER_SCROLL_WINDOW_MS = 1500;

const SECTION_ICONS = { video: SquarePlay, image: ImageIcon, text: Type, sticker: Sticker, audio: Music };
// Each section's button names one of its clips: + Video, + Photo…
const SECTION_NAMES = { video: 'Video', image: 'Photo', text: 'Text', sticker: 'Sticker', audio: 'Sound' };
// Room for the widest button (+ Sticker) before the timeline's start.
const ADD_BTN_W = 104;

// A section's add button: + with its icon and name, the icon in the section's colour.
function SectionAdd({ section, onAdd, style }) {
  const Icon = SECTION_ICONS[section.id];
  return (
    <button type="button" className={`vt-sec-add vt-section--${section.id}`} style={style}
      aria-label={section.add} title={section.add}
      onClick={(e) => { e.stopPropagation(); onAdd?.(section.id); }}>
      <Plus className="vt-sec-add-plus" size={13} strokeWidth={2.8} aria-hidden="true" />
      <Icon size={15} strokeWidth={2} aria-hidden="true" />
      <span>{SECTION_NAMES[section.id]}</span>
    </button>
  );
}

// Scrolling timeline with a fixed centre playhead: the tracks move under it. Scrolling scrubs,
// playback scrolls, pinch or Ctrl+wheel zooms around the playhead. The tracks are five sections by
// clip type (timelineSections), each with its add button (+ Photo…) just before the timeline's start,
// scrolling with the clips. Empty sections (bar Videos, which shows Add a video) take no room: their
// buttons wait together in one row at the bottom, each adding one (onAdd with the section's id).
export default function TimelinePanel({ onAddVideo, onAdd }) {
  const { items, duration, activeItemId, selectedIds } = useEditorStore(
    useShallow((s) => ({ items: s.items, duration: s.duration, activeItemId: s.activeItemId, selectedIds: s.selectedIds }))
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

  const all = timelineSections(items);
  const sections = all.filter((s) => s.lines.length || s.id === 'video');
  const waiting = all.filter((s) => !sections.includes(s));
  const videos = items.filter((i) => i.type === 'video');
  const lastVideo = videos.length ? videos.reduce((a, b) => (b.endMs > a.endMs ? b : a)) : null;

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
            {sections.map((section) => {
              return (
                <div key={section.id} className={`vt-section vt-section--${section.id}`} role="group" aria-label={section.label}>
                  <SectionAdd section={section} onAdd={onAdd}
                    style={{ left: Math.max(6, pad - ADD_BTN_W - 8), width: Math.min(ADD_BTN_W, pad - 14) }} />
                  <div className="vt-section-lines">
                    {section.lines.map((line) => (
                      <div key={line[0].id} className={`vt-row vt-row--${section.id}`}>
                        {line.map((clip) => (
                          <TimelineClip
                            key={clip.id}
                            item={clip}
                            left={x(clip.startMs)}
                            width={Math.max(24, msToPx(clip.endMs - clip.startMs, pxPerSec))}
                            selected={clip.id === activeItemId}
                            picked={selectedIds.includes(clip.id)}
                            picking={selectedIds.length > 0}
                            pxPerSec={pxPerSec}
                            onSnap={setSnapMs}
                          />
                        ))}
                        {line.includes(lastVideo) && (
                          <button
                            type="button"
                            className="vt-add-after"
                            style={{ left: x(lastVideo.endMs) + 6 }}
                            onClick={(e) => { e.stopPropagation(); onAddVideo(); }}
                            aria-label="Add video"
                          >
                            <Plus size={18} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    ))}
                    {section.id === 'video' && !lastVideo && (
                      <div className="vt-row vt-row--video">
                        <button
                          type="button"
                          className="vt-empty-clip"
                          // Starts at the playhead, in the middle: kept short enough to end on screen.
                          style={{ left: pad, width: Math.min(190, pad - 16) }}
                          onClick={(e) => { e.stopPropagation(); onAddVideo(); }}
                        >
                          <Film size={16} /> Add a video
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {waiting.length > 0 && (
              <div className="vt-section vt-section--waiting">
                <div className="vt-waiting" role="group" aria-label="Add to the timeline">
                  {waiting.map((section) => <SectionAdd key={section.id} section={section} onAdd={onAdd} />)}
                </div>
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
