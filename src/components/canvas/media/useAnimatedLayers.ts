import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { animatedSpecs, createAnimatedSource } from './animatedSources';
import type { AnimatedSource } from './animatedSources';

// Redraws a second while something moves (the meme is a full canvas redraw each time).
const PREVIEW_FPS = 30;

// What the animated export uses, hung on the canvas element as `canvas.animation` while any layer
// moves (like canvas.exportCleanCanvas).
export interface CanvasAnimation {
  loopsMs: number[];
  // Stop the on-screen playing (the export drives the frames), and start it again.
  pause: () => void;
  resume: () => void;
  // Show every moving layer as it is `tMs` in.
  seek: (tMs: number) => Promise<void>;
}

type AnimatedCanvas = HTMLCanvasElement & { animation?: CanvasAnimation };

interface Options {
  canvasRef: RefObject<AnimatedCanvas | null>;
  imageCacheRef: RefObject<Record<string, unknown>>;
  imageLayers: { url?: string; trimStart?: number; trimEnd?: number }[];
  stickers: { url?: string; imageUrl?: string }[];
  // Redraws the meme from the current state.
  redraw: () => void;
  // Drawing paints straight onto the canvas, so the layers hold still meanwhile.
  frozen: boolean;
}

// Keeps GIF and video layers moving on the canvas: loads a source for each (animatedSources), puts
// its canvas in the image cache in place of the still picture, and redraws while they play.
export function useAnimatedLayers({ canvasRef, imageCacheRef, imageLayers, stickers, redraw, frozen }: Options): void {
  // url -> its source, or null while it loads.
  const sources = useRef(new Map<string, AnimatedSource | null>());
  const unmounted = useRef(false);
  const paused = useRef(false);
  const frozenRef = useRef(frozen);
  const redrawRef = useRef(redraw);
  frozenRef.current = frozen;
  redrawRef.current = redraw;
  const specs = animatedSpecs(imageLayers, stickers);
  // Data urls are long: a layer's url is told apart by its start and length.
  const key = specs.map((s) => `${s.url.slice(0, 64)}:${s.url.length}:${s.trimStart ?? ''}:${s.trimEnd ?? ''}`).join('|');

  // Load sources for new moving layers and drop the ones whose layers are gone.
  useEffect(() => {
    const wanted = new Map(specs.map((s) => [s.url, s]));
    const cache = imageCacheRef.current;
    for (const [url, source] of sources.current) {
      if (wanted.has(url)) continue;
      source?.destroy();
      sources.current.delete(url);
      if (cache && source && cache[url] === source.canvas) delete cache[url];
    }
    for (const spec of wanted.values()) {
      if (sources.current.has(spec.url)) continue;
      sources.current.set(spec.url, null);
      createAnimatedSource(spec).then((source) => {
        // Still wanted (and still loading) once it has loaded?
        if (unmounted.current || !sources.current.has(spec.url) || sources.current.get(spec.url) !== null) {
          source?.destroy();
          return;
        }
        if (!source) return;
        sources.current.set(spec.url, source);
        if (paused.current) source.pause();
        if (cache) cache[spec.url] = source.canvas;
        redrawRef.current();
      }).catch(() => {});
    }
    // `key` stands for specs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, imageCacheRef]);

  // Play: redraw with every source's current frame, and offer the export its controls.
  useEffect(() => {
    if (!specs.length) return undefined;
    let raf = 0;
    let last = 0;
    const started = performance.now();
    const live = () => [...sources.current.values()].filter((s): s is AnimatedSource => Boolean(s));
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (paused.current || frozenRef.current || now - last < 1000 / PREVIEW_FPS) return;
      last = now;
      const playing = live();
      if (!playing.length) return;
      playing.forEach((s) => s.show(now - started));
      redrawRef.current();
    };
    raf = requestAnimationFrame(tick);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.animation = {
        get loopsMs() { return live().map((s) => s.loopMs); },
        pause: () => {
          paused.current = true;
          live().forEach((s) => s.pause());
        },
        resume: () => {
          paused.current = false;
          live().forEach((s) => s.resume());
        },
        seek: async (tMs) => {
          await Promise.all(live().map((s) => s.seek(tMs)));
        },
      };
    }
    return () => {
      cancelAnimationFrame(raf);
      if (canvas) delete canvas.animation;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, canvasRef]);

  // Let go of every source when the editor closes.
  useEffect(() => {
    unmounted.current = false;
    const all = sources.current;
    return () => {
      unmounted.current = true;
      for (const source of all.values()) source?.destroy();
      all.clear();
    };
  }, []);
}
