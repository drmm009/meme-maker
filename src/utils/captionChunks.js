// Turns recognised words into short on-screen captions (2-4 words each), and caption groups into
// text items in one of the caption styles.

const MAX_WORDS = 4;
const MAX_CHARS = 20;
const MAX_GAP_MS = 700; // a pause this long starts a new caption
const MAX_CAPTION_MS = 2500;
const MIN_CAPTION_MS = 400;

const cleanWord = (text) => text.replace(/\s+/g, ' ').trim();

// Whisper labels non-speech ("[Music]", "(laughs)", "♪"); those aren't captions.
export const isSpeechWord = (text) => {
  const t = cleanWord(text || '');
  return t.length > 0 && !/[[\]()♪*]/.test(t);
};

// Whisper sometimes returns a whole phrase with one timestamp pair: share its time across its
// words by length so each word still gets a time.
export const splitPhrases = (words) => words.flatMap((w) => {
  const parts = cleanWord(w.text).split(' ').filter(Boolean);
  if (parts.length <= 1) return parts.length ? [{ ...w, text: parts[0] }] : [];
  const total = parts.reduce((n, p) => n + p.length, 0);
  let t = w.startMs;
  return parts.map((p) => {
    const startMs = t;
    t += ((w.endMs - w.startMs) * p.length) / total;
    return { text: p, startMs, endMs: t };
  });
});

// Words [{ text, startMs, endMs }] in time order -> captions [{ text, startMs, endMs }].
export const chunkWords = (words, { maxWords = MAX_WORDS, maxChars = MAX_CHARS } = {}) => {
  const captions = [];
  let current = null;
  const flush = () => { if (current) captions.push(current); current = null; };

  for (const w of splitPhrases(words)) {
    if (current) {
      const text = `${current.text} ${w.text}`;
      const tooLong = current.count >= maxWords || text.length > maxChars || w.endMs - current.startMs > MAX_CAPTION_MS;
      const paused = w.startMs - current.endMs > MAX_GAP_MS;
      const sentenceEnded = /[.!?]$/.test(current.text);
      if (tooLong || paused || sentenceEnded) flush();
    }
    if (!current) current = { text: w.text, startMs: w.startMs, endMs: w.endMs, count: 1 };
    else Object.assign(current, { text: `${current.text} ${w.text}`, endMs: w.endMs, count: current.count + 1 });
  }
  flush();

  // Each caption stays up until the next one (or for a minimum time) so short words don't flicker.
  return captions.map(({ text, startMs, endMs }, i) => {
    const next = captions[i + 1];
    let end = Math.max(endMs, startMs + MIN_CAPTION_MS);
    if (next) end = next.startMs - endMs <= MAX_GAP_MS ? next.startMs : Math.min(end, next.startMs);
    return { text, startMs: Math.round(startMs), endMs: Math.round(end) };
  }).filter((c) => c.endMs > c.startMs);
};

export const CAPTION_STYLES = [
  { id: 'classic', label: 'Classic meme' },
  { id: 'creator', label: 'Creator' },
  { id: 'typewriter', label: 'Typewriter' },
];

// Every key is set in every style, so switching style clears the last one's background/animation.
const STYLE_PROPS = {
  classic: { fontFamily: 'Impact, sans-serif', color: '#ffffff', stroke: '#000000', bgColor: 'none', animation: null, upper: true },
  creator: { fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif', color: '#ffe14d', stroke: '#000000', bgColor: 'none', animation: 'pop', upper: true },
  typewriter: { fontFamily: '"Courier New", monospace', color: '#ffffff', stroke: 'transparent', bgColor: 'black', animation: 'typewriter', upper: false },
};

// Style patch for a caption. The words as heard are kept in captionText; text the user has
// rewritten (anything but a case change) is left as it is.
export const captionStyle = (styleId, item) => {
  const { upper, ...props } = STYLE_PROPS[styleId] || STYLE_PROPS.classic;
  const heard = item.captionText ?? item.text;
  const edited = item.text !== undefined && item.text.toLowerCase() !== heard.toLowerCase();
  return { ...props, captionStyle: styleId, text: edited ? item.text : (upper ? heard.toUpperCase() : heard) };
};

// Caption text items for a canvas of `canvas` (preview pixels): centred, in the lower third,
// wrapped to 84% of the width.
export const captionItems = (captions, styleId, canvas) => {
  const w = canvas.width;
  const h = canvas.height;
  const fontSize = Math.round(Math.max(18, Math.min(w, h) * 0.085));
  const width = Math.round(w * 0.84);
  return captions.map((c) => ({
    type: 'text',
    name: 'Caption',
    autoCaption: true,
    captionText: c.text,
    startMs: c.startMs,
    endMs: c.endMs,
    x: Math.round((w - width) / 2),
    y: Math.round(h * 0.72),
    width,
    align: 'center',
    fontSize,
    ...captionStyle(styleId, { captionText: c.text }),
  }));
};
