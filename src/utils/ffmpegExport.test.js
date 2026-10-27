// @vitest-environment jsdom
// The export drives a fake FFmpeg here: these tests pin the exact command and files it builds
// for typical projects, so a change to how the command is assembled shows up as a diff.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ff = vi.hoisted(() => ({ writes: [], execs: [], audioFiles: new Set(), texts: [] }));

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: class {
    constructor() { this.loaded = false; this.listeners = []; }
    async load() { this.loaded = true; }
    on(_, fn) { this.listeners.push(fn); }
    off(_, fn) { this.listeners = this.listeners.filter((l) => l !== fn); }
    async writeFile(name, data) {
      ff.writes.push({ name, bytes: data.byteLength, text: name.endsWith('.txt') ? new TextDecoder().decode(data) : undefined });
    }
    async exec(args) {
      ff.execs.push(args);
      // The audio probe: "-i file -map 0:a ..." succeeds only for files that have sound.
      if (args.includes('0:a') && args[0] === '-i') return ff.audioFiles.has(args[1]) ? 0 : 1;
      return 0;
    }
    async readFile() { return new Uint8Array([1, 2, 3]); }
    async deleteFile() {}
    terminate() {}
  }
}));
vi.mock('@ffmpeg/util', () => ({
  fetchFile: async (url) => (url.includes('missing') ? new Uint8Array(0) : new Uint8Array([1, 2])),
  toBlobURL: async (url) => url,
}));
vi.mock('./gridHelper', () => ({
  generateGridImage: (id) => (id && id !== '1-panel' ? 'data:image/png;base64,AA==' : null),
}));
// Text is drawn with Konva; record what each still was asked to show instead.
vi.mock('konva', () => {
  class Node {
    constructor(attrs = {}) { this.attrs = { ...attrs }; this.children = []; }
    add(c) { this.children.push(c); }
    setAttrs(a) { Object.assign(this.attrs, a); }
    clipFunc(f) { this.attrs.clip = f ? 'clipped' : null; }
    draw() {}
  }
  class Text extends Node {
    width() { return this.attrs.width ?? 300; }
    height() { return 60; }
    x() { return this.attrs.x; }
    y() { return this.attrs.y; }
    scaleX() { return 1; }
    scaleY() { return 1; }
    rotation() { return this.attrs.rotation || 0; }
  }
  class Stage extends Node {
    toDataURL() {
      const group = this.children[0].children[0];
      const text = group.children.find((c) => c instanceof Text);
      ff.texts.push({ text: text.attrs.text, fontSize: text.attrs.fontSize, opacity: group.attrs.opacity, scale: group.attrs.scaleX, clip: group.attrs.clip ?? null, hasBox: group.children.length > 1 });
      return 'data:image/png;base64,AA==';
    }
    destroy() {}
  }
  return { default: { Stage, Layer: Node, Group: Node, Text, Rect: Node } };
});

import { exportVideoFFmpeg } from './ffmpegExport';

beforeEach(() => {
  ff.writes = [];
  ff.execs = [];
  ff.texts = [];
  ff.audioFiles = new Set();
  globalThis.fetch = async () => ({ arrayBuffer: async () => new Uint8Array([9]).buffer });
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

// Run an export and return the final FFmpeg command, split for readable snapshots.
const run = async (items, { durationMs = 5000, aspect = 16 / 9, layoutId = null, ...opts } = {}) => {
  const result = await exportVideoFFmpeg(items, durationMs, aspect, { width: 800, height: 800 / aspect }, layoutId, () => {}, { download: false, ...opts });
  const command = ff.execs[ff.execs.length - 1];
  const fc = command.indexOf('-filter_complex');
  return {
    result,
    inputs: command.slice(0, fc === -1 ? command.indexOf('-map') : fc),
    filters: fc === -1 ? [] : command[fc + 1].split(';'),
    output: command.slice(fc === -1 ? command.indexOf('-map') : fc + 2),
    files: ff.writes.map((w) => w.name),
    texts: ff.texts,
  };
};

describe('exportVideoFFmpeg command', () => {
  it('mp4: two videos with a transition, a photo, a GIF sticker, text and two sounds', async () => {
    ff.audioFiles.add('input_2.mp4');
    const out = await run([
      { id: 'v1', type: 'video', url: 'blob:v1', startMs: 0, endMs: 3000, trimStartMs: 500, x: 0, y: 0, width: 800, height: 450, volume: 0.8, fadeInMs: 300, fadeOutMs: 300, filter: { preset: 'bw' }, punches: [1500] },
      { id: 'v2', type: 'video', url: 'blob:v2', startMs: 3000, endMs: 5000, x: 0, y: 0, width: 800, height: 450, playbackRate: 1.5, transitionIn: { type: 'fade', durationMs: 500 }, chromaKey: { color: '#00ff00', similarity: 0.3, blend: 0.1 } },
      { id: 'p1', type: 'image', url: 'https://x.test/photo.png', startMs: 1000, endMs: 4000, x: 100, y: 50, width: 200, height: 150, scaleX: 1.2, scaleY: 1.2, filter: { preset: 'vintage', brightness: 20 } },
      { id: 'g1', type: 'sticker', url: 'https://media.giphy.test/a.gif', isGif: true, startMs: 0, endMs: 5000, x: 600, y: 20, width: 120, height: 120 },
      { id: 't1', type: 'text', text: 'WHEN IT WORKS', startMs: 0, endMs: 5000, x: 100, y: 300, fontSize: 40, bgColor: 'black' },
      { id: 'a1', type: 'audio', url: 'blob:a1', mimeType: 'audio/webm', startMs: 1000, endMs: 2000, trimStartMs: 200, volume: 0.5 },
      { id: 'a2', type: 'audio', url: './sounds/bruh.mp3', startMs: 0, endMs: 800, playbackRate: 2 },
      { id: 'h1', type: 'image', url: 'blob:hidden', hidden: true },
    ], { backgroundColor: '#1a1d27' });
    expect(out.result.fileName).toMatch(/^meme-studio-\d+\.mp4$/);
    expect({ inputs: out.inputs, filters: out.filters, output: out.output, files: out.files, texts: out.texts }).toMatchSnapshot();
  });

  it('gif: animated text and a grid layout, sounds left out', async () => {
    const out = await run([
      { id: 'i1', type: 'image', url: 'blob:top', startMs: 0, endMs: 2000, x: 0, y: 0, width: 400, height: 400 },
      { id: 't1', type: 'text', text: 'POP', animation: 'pop', startMs: 0, endMs: 2000, x: 50, y: 50, fontSize: 48 },
      { id: 't2', type: 'text', text: 'SHAKE', animation: 'shake', startMs: 500, endMs: 1500, x: 50, y: 300, fontSize: 32 },
      { id: 't3', type: 'text', text: 'TYPE', animation: 'typewriter', startMs: 0, endMs: 1000, x: 50, y: 200 },
      { id: 'a1', type: 'audio', url: 'blob:a1', startMs: 0, endMs: 2000 },
    ], { durationMs: 2000, aspect: 1, layoutId: '2-vert', format: 'gif' });
    expect(out.result.fileName).toMatch(/\.gif$/);
    expect(out.result.blob.type).toBe('image/gif');
    expect({ inputs: out.inputs, filters: out.filters, output: out.output, files: out.files, texts: out.texts }).toMatchSnapshot();
  });

  it('1080p portrait with auto captions as one image sequence', async () => {
    const caption = (id, text, startMs, endMs) => ({ id, type: 'text', autoCaption: true, text, startMs, endMs, x: 50, y: 900, fontSize: 36, animation: 'pop' });
    const out = await run([
      { id: 'v1', type: 'video', url: 'blob:v1', startMs: 0, endMs: 4000, x: 0, y: 0, width: 450, height: 800, muted: true },
      caption('c1', 'SO I TOLD', 200, 900),
      caption('c2', 'MY BOSS', 1000, 1600),
      caption('c3', 'NO', 2500, 3000),
    ], { durationMs: 4000, aspect: 9 / 16, resolution: 1080 });
    const list = ff.writes.find((w) => w.name === 'captions.txt').text;
    expect({ inputs: out.inputs, filters: out.filters, output: out.output, files: out.files, captionsList: list }).toMatchSnapshot();
  });

  it('an empty project is just the background colour and silence', async () => {
    const out = await run([], { durationMs: 1000, backgroundColor: 'not-a-colour' });
    expect({ inputs: out.inputs, filters: out.filters, output: out.output }).toMatchSnapshot();
  });

  it('skips media that fails to load, silent videos and muted sounds', async () => {
    const out = await run([
      { id: 'v1', type: 'video', url: 'blob:silent', startMs: 0, endMs: 2000, x: 0, y: 0, width: 800, height: 450 },
      { id: 'p1', type: 'image', url: 'https://x.test/missing.png', startMs: 0, endMs: 2000 },
      { id: 'a1', type: 'audio', url: 'https://x.test/song.wav?v=2', startMs: 0, endMs: 2000, muted: true },
      { id: 'a2', type: 'audio', url: 'https://x.test/missing.mp3', startMs: 0, endMs: 2000 },
    ], { durationMs: 2000 });
    expect({ inputs: out.inputs, filters: out.filters, output: out.output, files: out.files }).toMatchSnapshot();
  });

  it('layers follow the preview\'s draw order, with z overriding type', async () => {
    const out = await run([
      { id: 't1', type: 'text', text: 'UNDER', startMs: 0, endMs: 1000, x: 0, y: 0, z: -1 },
      { id: 's1', type: 'sticker', url: 'blob:s1', startMs: 0, endMs: 1000, x: 10, y: 10, width: 50, height: 50 },
      { id: 'v1', type: 'video', url: 'blob:v1', startMs: 0, endMs: 1000, x: 0, y: 0, width: 800, height: 450 },
    ], { durationMs: 1000 });
    expect(out.files).toEqual(['text_2.png', 'input_3.mp4', 'input_4.png']);
  });
});
