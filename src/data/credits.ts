// What the Credits & licences window lists: the content packs, services, libraries and fonts the app
// uses, with their licences. Keep it in step with package.json and the CDN URLs in src/.

export interface Credit {
  name: string;
  what: string;
  license: string;
  url: string;
}

export interface CreditGroup {
  title: string;
  items: Credit[];
}

export const CREDIT_GROUPS: CreditGroup[] = [
  {
    title: 'Stickers, emoji and GIFs',
    items: [
      { name: 'Fluent Emoji', what: '3D stickers, by Microsoft', license: 'MIT', url: 'https://github.com/microsoft/fluentui-emoji' },
      { name: 'Emojibase', what: 'Emoji list, names and search words', license: 'MIT', url: 'https://emojibase.dev' },
      { name: 'GIPHY', what: 'GIF and animated sticker search', license: 'GIPHY API Terms', url: 'https://giphy.com' },
    ],
  },
  {
    title: 'Meme templates',
    items: [
      { name: 'memegen.link', what: 'Blank meme templates', license: 'MIT (code)', url: 'https://memegen.link' },
      { name: 'Imgflip', what: 'Top 100 meme templates', license: 'Imgflip API', url: 'https://imgflip.com/api' },
    ],
  },
  {
    title: 'Libraries',
    items: [
      { name: 'React', what: 'Interface', license: 'MIT', url: 'https://react.dev' },
      { name: 'Konva and react-konva', what: 'Image editor canvas', license: 'MIT', url: 'https://konvajs.org' },
      { name: 'ffmpeg.wasm', what: 'Video export', license: 'MIT (wrapper), GPL-2.0-or-later (core)', url: 'https://github.com/ffmpegwasm/ffmpeg.wasm' },
      { name: 'Mediabunny', what: 'Fast video export', license: 'MPL-2.0', url: 'https://mediabunny.dev' },
      { name: '@imgly/background-removal', what: 'Background remover', license: 'AGPL-3.0', url: 'https://github.com/imgly/background-removal-js' },
      { name: 'MediaPipe', what: 'Face detection', license: 'Apache-2.0', url: 'https://github.com/google-ai-edge/mediapipe' },
      { name: 'Transformers.js', what: 'Auto captions (Whisper)', license: 'Apache-2.0', url: 'https://github.com/huggingface/transformers.js' },
      { name: 'Framer Motion', what: 'Animations', license: 'MIT', url: 'https://motion.dev' },
      { name: 'Lucide', what: 'Icons', license: 'ISC', url: 'https://lucide.dev' },
      { name: 'Zustand and zundo', what: 'Editor state and undo', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
      { name: 'gifler and omggif', what: 'GIF playback and GIF export', license: 'Apache-2.0, MIT', url: 'https://github.com/deanm/omggif' },
      { name: 'd3-delaunay', what: 'Face morph', license: 'ISC', url: 'https://github.com/d3/d3-delaunay' },
      { name: 'canvas-confetti', what: 'Confetti', license: 'ISC', url: 'https://github.com/catdad/canvas-confetti' },
      { name: 'Capacitor', what: 'Android app', license: 'MIT', url: 'https://capacitorjs.com' },
    ],
  },
  {
    title: 'Fonts',
    items: [
      { name: 'Google Fonts', what: 'Impact-style caption fonts and the app’s typefaces', license: 'SIL Open Font License, Apache-2.0', url: 'https://fonts.google.com' },
    ],
  },
];

export const CREDITS_NOTE = 'Meme pictures, GIFs and sound clips belong to their creators and are used for commentary and parody.';
