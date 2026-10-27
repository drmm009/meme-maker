// The hidden <video> element a preview video clip draws from, kept in step with the editor store.
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { clipGain } from '../../../utils/audioFades';
import { applyMotion } from './nodeMotion';
import { isOnScreen, videoSyncPlan, videoTimeSec } from './previewMath';

// Creates the element for `item`, follows the playhead (play, pause, seek, speed, volume, mute,
// visibility and per-frame motion of the Konva node in imageRef) and returns a cleanup function.
// onMetadata(width, height) fires once its size is known; drawEffects(video) re-processes the
// current frame for green screen / filters before a redraw.
export function attachPreviewVideo({ item, itemRef, imageRef, trRef, setImage, onMetadata, drawEffects }) {
  const vid = document.createElement('video');
  const isBlob = item.url.startsWith('blob:');
  // The #id makes each clip's URL unique, so unmuting one of several clips sharing a file doesn't stall.
  vid.src = isBlob ? item.url : (item.url.includes('#') ? `${item.url}&id=${item.id}` : `${item.url}#id=${item.id}`);
  if (!isBlob) {
    vid.crossOrigin = 'anonymous'; // Prevent canvas tainting for remote URLs
  }
  vid.loop = false;
  vid.muted = true;
  vid.playsInline = true;
  vid.autoplay = true;
  vid.preservesPitch = false; // Prevents severe audio-resampling lag when playbackRate != 1

  // Trick browser anti-throttling by making it slightly visible and fixed off-screen
  vid.style.position = 'fixed';
  vid.style.top = '0';
  vid.style.left = '0';
  vid.style.opacity = '0.01'; // Not 0!
  vid.style.pointerEvents = 'none';
  vid.style.width = '10px'; // Not 1px!
  vid.style.height = '10px';
  vid.style.zIndex = '-9999';
  const sink = document.getElementById('video-sink');
  (sink || document.body).appendChild(vid);

  const redraw = () => imageRef.current?.getLayer()?.batchDraw();
  const frameCallbacks = 'requestVideoFrameCallback' in vid;

  vid.currentTime = 0.001;
  // A play() still starting; seeking or pausing meanwhile would abort it.
  let playPromise = null;
  const play = () => {
    playPromise = vid.play();
    playPromise?.then(() => { playPromise = null; }).catch(() => { playPromise = null; });
  };

  // Force mobile decode pipeline
  playPromise = vid.play();
  playPromise?.then(() => {
    playPromise = null;
    if (!useEditorStore.getState().isPlaying) vid.pause();
    redraw();
  }).catch(() => {
    playPromise = null;
  });

  setImage(vid);

  // Redraw once per decoded frame (e.g. 30fps) rather than on a 60fps animation loop.
  let rvfcId;
  if (frameCallbacks) {
    const updateFrame = () => {
      if (imageRef.current && imageRef.current.visible()) {
        drawEffects(vid);
        redraw();
      }
      rvfcId = vid.requestVideoFrameCallback(updateFrame);
    };
    rvfcId = vid.requestVideoFrameCallback(updateFrame);
  }

  const unsub = useEditorStore.subscribe((state) => {
    const latest = state.items.find((i) => i.id === itemRef.current.id) || itemRef.current;
    const target = videoTimeSec(latest, state.playhead);

    // Paused and already on the right frame: nothing to do.
    if (!state.isPlaying && Math.abs(vid.currentTime - target) < 0.05) return;

    const rate = latest.playbackRate || 1;
    if (vid.playbackRate !== rate) vid.playbackRate = rate;
    // Heard while editing, unless muted or hidden.
    const muted = Boolean(latest.muted || latest.hidden);
    if (vid.muted !== muted) vid.muted = muted;
    const gain = clipGain(latest, state.playhead);
    if (Math.abs(vid.volume - gain) > 0.01) vid.volume = gain;

    const visible = isOnScreen(latest, state.playhead);
    const node = imageRef.current;
    if (node && node.visible() !== visible) {
      node.visible(visible);
      if (trRef.current) trRef.current.visible(visible);
      node.getLayer()?.batchDraw();
    }
    if (node && applyMotion(node, latest, state)) node.getLayer()?.batchDraw();

    const plan = videoSyncPlan({
      playing: state.isPlaying, visible, paused: vid.paused, pending: Boolean(playPromise),
      drift: Math.abs(vid.currentTime - target), frameCallbacks
    });
    if (plan.pause) vid.pause();
    if (plan.seek) vid.currentTime = target;
    if (plan.play) play();
    // Without frame callbacks: redraw on each playback tick, and once a scrub's seek has a frame.
    if (plan.redraw && node) {
      const draw = () => {
        drawEffects(vid);
        node.getLayer()?.batchDraw();
      };
      if (state.isPlaying) draw();
      else vid.addEventListener('seeked', draw, { once: true });
    }
  });

  vid.onloadedmetadata = () => onMetadata(vid.videoWidth, vid.videoHeight);
  // Ensure the first frame (and each scrub's frame) draws.
  vid.onloadeddata = redraw;
  vid.onseeked = redraw;

  return () => {
    unsub();
    if (rvfcId && 'cancelVideoFrameCallback' in vid) {
      vid.cancelVideoFrameCallback(rvfcId);
    }
    vid.pause();
    vid.removeAttribute('src');
    vid.load();
    if (vid.parentNode) {
      vid.parentNode.removeChild(vid);
    }
  };
}
