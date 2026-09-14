import { useEffect, useRef } from 'react';

/**
 * Custom hook to synchronize audio tracks on the timeline with the video editor playhead.
 * Keeps audio elements pooled and smoothly synced during playback, seeking, and scrubbing
 * without constantly resetting currentTime or spamming play() calls.
 */
export const useAudioPlaybackSync = (items, isPlaying, playhead) => {
  const audioPoolRef = useRef(new Map());

  // Manage pool of HTMLAudioElements for audio items
  useEffect(() => {
    const audioItems = items.filter(i => i.type === 'audio' && i.url);
    const activeIds = new Set(audioItems.map(i => i.id));
    const pool = audioPoolRef.current;

    // Remove deleted items
    for (const [id, entry] of pool.entries()) {
      if (!activeIds.has(id)) {
        try {
          if (entry.playPromise) {
            entry.playPromise.then(() => {
              try {
                entry.audio.pause();
                entry.audio.src = '';
              } catch (e) {}
            }).catch(() => {});
          } else {
            entry.audio.pause();
            entry.audio.src = '';
          }
        } catch (e) {}
        pool.delete(id);
      }
    }

    // Create or update audio elements
    audioItems.forEach(item => {
      let entry = pool.get(item.id);
      if (!entry) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.src = item.url;
        entry = { audio, playPromise: null, itemRef: item, hasEnded: false, playBlockedTimeout: null };
        pool.set(item.id, entry);
      } else if (entry.audio.src !== item.url && !entry.audio.src.endsWith(item.url)) {
        entry.audio.src = item.url;
        entry.hasEnded = false;
      }
      entry.itemRef = item;

      // Update volume and mute settings
      const targetMuted = item.muted || false;
      if (entry.audio.muted !== targetMuted) {
        entry.audio.muted = targetMuted;
      }
      const targetVol = item.volume !== undefined ? item.volume : 1;
      if (entry.audio.volume !== targetVol) {
        entry.audio.volume = targetVol;
      }
      const targetRate = item.playbackRate || 1;
      if (entry.audio.playbackRate !== targetRate) {
        entry.audio.playbackRate = targetRate;
      }
    });

    return () => {
      for (const entry of pool.values()) {
        try {
          if (entry.playPromise) {
            entry.playPromise.then(() => {
              try { entry.audio.pause(); } catch (e) {}
            }).catch(() => {});
          } else {
            entry.audio.pause();
          }
        } catch (e) {}
      }
    };
  }, [items]);

  // Sync playback on isPlaying or playhead change
  useEffect(() => {
    const audioItems = items.filter(i => i.type === 'audio' && i.url);
    const pool = audioPoolRef.current;

    audioItems.forEach(item => {
      const entry = pool.get(item.id);
      if (!entry || !entry.audio) return;
      const audio = entry.audio;

      const isInside = playhead >= item.startMs && playhead < item.endMs;
      const targetRate = item.playbackRate || 1;
      const trimStartSec = (item.trimStartMs || 0) / 1000;
      const mediaTimeSec = trimStartSec + (((playhead - item.startMs) / 1000) * targetRate);

      const audioDuration = audio.duration;
      const hasDuration = Number.isFinite(audioDuration) && audioDuration > 0;
      const isPastAudioEnd = hasDuration && mediaTimeSec >= (audioDuration - 0.05);

      if (isPlaying && isInside && !isPastAudioEnd) {
        entry.hasEnded = false;

        if (audio.paused) {
          // Only start playback if not already waiting on a pending play() promise
          if (!entry.playPromise && !entry.playBlockedTimeout) {
            if (Math.abs(audio.currentTime - mediaTimeSec) > 0.08) {
              try {
                audio.currentTime = Math.max(0, mediaTimeSec);
              } catch (e) {}
            }
            const p = audio.play();
            if (p && typeof p.then === 'function') {
              entry.playPromise = p;
              p.then(() => {
                entry.playPromise = null;
              }).catch((err) => {
                entry.playPromise = null;
                if (err && err.name === 'NotAllowedError') {
                  entry.playBlockedTimeout = setTimeout(() => {
                    entry.playBlockedTimeout = null;
                  }, 1000);
                }
              });
            }
          }
        } else {
          // Audio is already playing smoothly!
          // NEVER touch currentTime during normal playback unless drift is massive (> 1.0s),
          // which happens only if the user scrubbed to a different time while playback was running.
          if (Math.abs(audio.currentTime - mediaTimeSec) > 1.0) {
            try {
              audio.currentTime = Math.max(0, mediaTimeSec);
            } catch (e) {}
          }
        }
      } else {
        // Outside audio boundaries, past end of audio file, or playback paused
        if (!audio.paused) {
          if (entry.playPromise) {
            entry.playPromise.then(() => {
              try { audio.pause(); } catch (e) {}
            }).catch(() => {});
            entry.playPromise = null;
          } else {
            try {
              audio.pause();
            } catch (e) {}
          }
        }

        if (!isPlaying && isInside && !isPastAudioEnd) {
          // While paused and playhead is inside, keep audio scrubbed in sync
          if (Math.abs(audio.currentTime - mediaTimeSec) > 0.08) {
            try {
              audio.currentTime = Math.max(0, mediaTimeSec);
            } catch (e) {}
          }
        } else if (!isInside && playhead < item.startMs) {
          // Reset to trimStart if playhead rewound before the audio clip
          entry.hasEnded = false;
          if (Math.abs(audio.currentTime - trimStartSec) > 0.08) {
            try {
              audio.currentTime = trimStartSec;
            } catch (e) {}
          }
        }
      }
    });
  }, [isPlaying, playhead, items]);
};
