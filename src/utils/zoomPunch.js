// Zoom-punch: a quick zoom into a video clip and back, at chosen moments.
// item.punches holds those moments in source-footage ms, so splits, trims and freeze frames keep
// each punch on the same moment of the video. The preview and the FFmpeg export share these curves.

export const PUNCH = { amp: 0.25, riseMs: 80, fallMs: 320 };

// Timeline times (ms) of a clip's punches that fall inside the clip.
export const clipPunchTimes = (item) => {
  const rate = item.playbackRate || 1;
  const trim = item.trimStartMs || 0;
  return (item.punches || [])
    .map((s) => item.startMs + (s - trim) / rate)
    .filter((t) => t >= item.startMs && t <= item.endMs);
};

// Zoom factor (1 = none) at timeline time tMs: fast linear rise, eased fall.
export const punchZoom = (times, tMs) => {
  let z = 1;
  for (const p of times) {
    const d = tMs - p;
    if (d < 0 || d > PUNCH.riseMs + PUNCH.fallMs) continue;
    z += PUNCH.amp * (d < PUNCH.riseMs ? d / PUNCH.riseMs : (1 - (d - PUNCH.riseMs) / PUNCH.fallMs) ** 2);
  }
  return z;
};

// FFmpeg filters (leading comma) that zoom a w x h stream by the punch curve and crop back to w x h,
// or '' with no punches. `t` is timeline seconds (the clip's stream is already offset to its start).
export const punchFilter = (times, w, h) => {
  if (!times.length) return '';
  const r = PUNCH.riseMs / 1000;
  const f = PUNCH.fallMs / 1000;
  const terms = times.map((ms) => {
    const d = `(t-${(ms / 1000).toFixed(3)})`;
    return `${PUNCH.amp}*if(between(${d},0,${r}),${d}/${r},if(between(${d},${r},${(r + f).toFixed(3)}),pow(1-(${d}-${r})/${f},2),0))`;
  });
  const z = `(1+${terms.join('+')})`;
  return `,scale=w='${w}*${z}':h='${h}*${z}':eval=frame,crop=${w}:${h}`;
};
