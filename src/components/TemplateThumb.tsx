// A template's picture on the pages (Home, Explore). For a video template whose thumbnail file
// can't be had (the meme site no longer serves them), it shows a frame from half a second into the
// video itself, loaded only once the card is near the screen. The video editor's Clips sheet does
// the same for its own cards (video-editor/ClipsSheet.tsx).
import { useEffect, useRef, useState } from 'react';

interface TemplateThumbProps {
  src?: string;
  // Tried once if `src` fails (an image template's second address).
  fallbackSrc?: string;
  // A video template's file: its frame stands in when no picture loads.
  videoUrl?: string;
  alt?: string;
  className?: string;
}

export default function TemplateThumb({ src, fallbackSrc, videoUrl, alt = '', className }: TemplateThumbProps) {
  const [stage, setStage] = useState<'src' | 'fallback' | 'video'>(src ? 'src' : fallbackSrc ? 'fallback' : 'video');
  const [near, setNear] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const showVideo = stage === 'video' && Boolean(videoUrl);

  useEffect(() => {
    if (!showVideo || near) return undefined;
    const el = videoRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setNear(true);
        io.disconnect();
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [showVideo, near]);

  if (showVideo) {
    return (
      <video
        ref={videoRef}
        className={className}
        src={near ? `${videoUrl}#t=0.5` : undefined}
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    );
  }
  return (
    <img
      src={stage === 'fallback' ? fallbackSrc : src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setStage((s) => (s === 'src' && fallbackSrc ? 'fallback' : 'video'))}
    />
  );
}
