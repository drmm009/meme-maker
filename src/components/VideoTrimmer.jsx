import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Scissors, Play, Pause, Check } from 'lucide-react';

/**
 * VideoTrimmer — in-browser trim selector using HTML5 video + range sliders.
 * Does NOT re-encode. Saves trimStart/trimEnd timestamps to the layer.
 *
 * Props:
 *   videoUrl    — blob URL or HTTP URL of the video
 *   trimStart   — existing trim start in seconds (default 0)
 *   trimEnd     — existing trim end in seconds (default = duration)
 *   onApply(trimStart, trimEnd) — called when user confirms trim
 *   onClose()   — called when dismissed without saving
 */
export default function VideoTrimmer({ videoUrl, trimStart = 0, trimEnd, onApply, onClose }) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(trimStart);
  const [end, setEnd] = useState(trimEnd || 0);
  const [currentTime, setCurrentTime] = useState(trimStart);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      const dur = video.duration;
      setDuration(dur);
      setEnd((prev) => (prev === 0 || prev > dur ? dur : prev));
    };

    video.addEventListener('loadedmetadata', onLoaded);
    if (video.readyState >= 1) onLoaded();

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (!video.paused && video.currentTime >= (end || video.duration)) {
        video.pause();
        video.currentTime = start;
        setIsPlaying(false);
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [start, end]);

  const handleStartChange = (val) => {
    const v = Math.min(parseFloat(val), end - 0.5);
    setStart(v);
    if (videoRef.current) {
      videoRef.current.currentTime = v;
      setCurrentTime(v);
    }
  };

  const handleEndChange = (val) => {
    const v = Math.max(parseFloat(val), start + 0.5);
    setEnd(v);
    if (videoRef.current) {
      videoRef.current.currentTime = v;
      setCurrentTime(v);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.currentTime = start;
      video.play();
      setIsPlaying(true);
    }
  };

  const fmt = (sec) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec - s) * 10);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}.${ms}`;
  };

  const trimDuration = Math.max(0, end - start).toFixed(1);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #09090b 0%, #121215 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '20px',
        padding: '20px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scissors size={18} style={{ color: '#a855f7' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Trim Video</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Video Preview */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', marginBottom: '16px', position: 'relative' }}>
          <video
            ref={videoRef}
            src={videoUrl}
            style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
            playsInline
            muted={false}
            preload="metadata"
          />
          {/* Play/Pause overlay */}
          <button
            onClick={togglePlay}
            style={{
              position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', backdropFilter: 'blur(4px)'
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        {/* Time info row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
          <span>Start: <b style={{ color: '#a855f7' }}>{fmt(start)}</b></span>
          <span>Duration: <b style={{ color: '#a78bfa' }}>{trimDuration}s</b></span>
          <span>End: <b style={{ color: '#f472b6' }}>{fmt(end)}</b></span>
        </div>

        {/* Trim timeline bar */}
        <div style={{ position: 'relative', height: '40px', marginBottom: '16px' }}>
          {/* Full bar background */}
          <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0,
            height: '6px', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)', borderRadius: '3px'
          }} />
          {/* Selected trim range */}
          <div style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            left: `${(start / duration) * 100}%`,
            width: `${((end - start) / duration) * 100}%`,
            height: '6px', borderRadius: '3px',
            background: 'linear-gradient(90deg, #a855f7, #ffffff)'
          }} />
          {/* Current time indicator */}
          <div style={{
            position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
            left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            width: '3px', height: '20px', background: '#ffffff',
            borderRadius: '2px', boxShadow: '0 0 6px rgba(255,255,255,0.8)'
          }} />
        </div>

        {/* Start slider */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>✂️ Trim Start</span>
            <span style={{ color: '#a855f7', fontWeight: 700 }}>{fmt(start)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={start}
            onChange={(e) => handleStartChange(e.target.value)}
            style={{ width: '100%', accentColor: '#a855f7' }}
          />
        </div>

        {/* End slider */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>✂️ Trim End</span>
            <span style={{ color: '#f472b6', fontWeight: 700 }}>{fmt(end)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={end}
            onChange={(e) => handleEndChange(e.target.value)}
            style={{ width: '100%', accentColor: '#f472b6' }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(start, end)}
            style={{
              flex: 2, padding: '10px', borderRadius: '10px',
              background: '#ffffff',
              border: 'none', color: '#000000', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.25)'
            }}
          >
            <Check size={16} /> Apply Trim
          </button>
        </div>
      </div>
    </div>
  );
}
