// Choose Canvas Layout, in the pages' iOS look (pages/iosLook.css, CustomLayoutBuilder.css). The
// dock's Creator sheet (CreatorSheet.tsx) picks the kind (`kind`), and every layout here opens in
// that kind's editor: the video editor for a video meme, the image editor for an image meme.
// Under the title, the canvas shape (Square, Portrait, Story, Wide; remembered), which every preview
// on the page takes and every layout opens with; then the Blank canvas row; then every section as
// one line of cards that slides sideways (Slider): the three Caption layouts; for an image meme,
// Meme formats (Classic, Subtitle, Poster, Breaking news) and Collages (Top & bottom, Then & now,
// Side by side, 2 × 2 + caption); and Grid layouts last, Custom Grid at their end (its rows and
// columns set in a panel under the slider), without the grids the collages already have.
// Every preview is a frame of the chosen shape laid out as the layout opens, with its words in
// place, showing cartoon animal characters drawn for the app (public/images/layouts/): a side-eyeing
// shiba on the Caption layouts, an unimpressed cat on the Meme formats, and the collages and grids
// a different animal in each panel (a capybara, a hamster, a penguin, a raccoon, then round again).
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ChevronRight, Grid3x3, ImageIcon, Minus, Play, Plus } from 'lucide-react';
import { LAYOUT_OPTIONS } from '../data/templates';
import { panelRects } from './canvas/layout/panels';
import useSlidingKey from './pages/useSlidingKey';
import type { PanelLayout } from './canvas/layout/panels';
import { safeGet, safeSet } from '../utils/storage';
import './pages/iosLook.css';
import './CustomLayoutBuilder.css';

type Template = Record<string, unknown>;
type Kind = 'image' | 'video';
type CaptionType = 'header' | 'footer' | 'both';

interface CustomLayoutBuilderProps {
  // Which editor every layout opens in: the image editor or the video editor; the Creator sheet picks it.
  kind?: Kind;
  onLayoutComplete?: (template: Template) => void;
  onSelectTemplate?: (template: Template) => void;
}

// The canvas shapes. `id` is the image editor's aspect (editor/canvasSizes), `ratio` width / height.
const CANVAS_ASPECTS = [
  { id: '1:1', label: 'Square', ratio: 1 },
  { id: '4:5', label: 'Portrait', ratio: 4 / 5 },
  { id: '9:16', label: 'Story', ratio: 9 / 16 },
  { id: '16:9', label: 'Wide', ratio: 16 / 9 },
] as const;
type Aspect = (typeof CANVAS_ASPECTS)[number];
const ASPECT_KEY = 'canvas_layout_aspect';
const aspectById = (id: unknown): Aspect => CANVAS_ASPECTS.find((a) => a.id === id) ?? CANVAS_ASPECTS[0];

// The grid layouts, in the slider's order.
const GRIDS: { id: string; slots: number; title: string; detail: string }[] = [
  { id: '2-vert', slots: 2, title: '2 Panels', detail: 'Top / Bottom' },
  { id: '2-horiz', slots: 2, title: '2 Panels', detail: 'Side by side' },
  { id: '3-stacked', slots: 3, title: '3 Panels', detail: 'Stacked' },
  { id: '3-horiz', slots: 3, title: '3 Panels', detail: 'Side by side' },
  { id: '3-hybrid', slots: 3, title: '3 Panels', detail: '1 top, 2 below' },
  { id: '4-grid', slots: 4, title: '4 Panels', detail: '2 × 2 grid' },
];

// The grids the image meme's Collages already have, with text.
const IN_COLLAGES = ['2-vert', '2-horiz', '4-grid'];

const CAPTIONS: { type: CaptionType; title: string; detail: string }[] = [
  { type: 'header', title: 'Top Caption', detail: 'Classic header' },
  { type: 'footer', title: 'Bottom Caption', detail: 'Footer bar' },
  { type: 'both', title: 'Top & Bottom', detail: 'Dual bars' },
];

// A grid's name as the editors know it (data/templates' LAYOUT_OPTIONS), e.g. "2 Panels (Top/Bottom)".
const layoutName = (id: string, fallback: string) =>
  (LAYOUT_OPTIONS as { id: string; name?: string }[]).find((l) => l.id === id)?.name || fallback;

// ---- Templates ----

// A blank canvas or a grid for the image editor. A grid is the image editor's own panels (a native
// layout), each empty (with a start card there: ImagePanelPrompts); the picture drawn here is only
// the template's thumbnail. The canvas takes the chosen shape (`aspectRatio`).
const createLayoutTemplate = (layout: PanelLayout & { name?: string }, aspect: Aspect): Template => {
  const width = 800;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const blank = layout.id === '1-panel';
  const rects = blank ? [] : panelRects(layout);
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    for (const r of rects) ctx.strokeRect(r.x * width, r.y * height, r.width * width, r.height * height);
  }
  const dataUrl = canvas.toDataURL ? canvas.toDataURL('image/png') : '';
  const base = {
    imageUrl: dataUrl,
    rawImageUrl: dataUrl,
    width,
    height,
    aspectRatio: aspect.id,
    category: 'custom',
    canvasBgColor: '#ffffff',
    defaultCaptions: [],
  };
  if (blank) {
    // A real empty canvas: the white picture is only its thumbnail, so Canvas Style's colour shows.
    // No text to start: the start card's Text pill adds some (ImageStartPrompt).
    return { ...base, id: `custom-1-panel-${Date.now()}`, name: 'Blank Canvas', layoutId: '1-panel', canvasOnly: true };
  }
  return {
    ...base,
    id: `custom-${layout.id}-${Date.now()}`,
    name: layout.name || 'Custom Layout',
    layoutId: layout.id,
    isNativeLayout: true,
    layoutDef: { id: layout.id, slots: rects.length, ...(layout.id === 'custom-grid' ? { cols: layout.cols, rows: layout.rows } : {}) },
    slotImages: rects.map(() => null),
  };
};

// A grid for the video editor: its panels (`slots`, on the editor's 800-wide canvas of the chosen
// shape) take a clip or photo each, and `layoutId` draws the divider lines.
const createVideoGridTemplate = (layout: PanelLayout & { name?: string }, aspect: Aspect): Template => {
  const width = 800;
  const height = Math.round(800 / aspect.ratio);
  return {
    id: `custom-video-${layout.id}-${Date.now()}`,
    name: layout.name || 'Custom Layout',
    type: 'video',
    category: 'custom',
    layoutId: layout.id,
    slots: panelRects(layout).map((r) => ({ x: r.x * width, y: r.y * height, width: r.width * width, height: r.height * height })),
    width,
    height,
    defaultCaptions: [],
  };
};

// A blank video or a caption layout for the video editor, the bars on as the image editor's, the
// captions in them (TOP TEXT / BOTTOM TEXT, each box hugging its words).
const createVideoTemplate = (type: CaptionType | 'none', aspect: Aspect): Template => {
  const top = type === 'header' || type === 'both';
  const bottom = type === 'footer' || type === 'both';
  const caption = (id: string, text: string, y: number) => ({ id, text, fontSize: 60, y, align: 'center', color: '#ffffff' });
  return {
    id: `custom-video-${type}-${Date.now()}`,
    name: type === 'none' ? 'Blank Canvas' : 'Caption Layout',
    type: 'video',
    category: 'custom',
    width: 1080,
    height: Math.round(1080 / aspect.ratio),
    aspectRatio: aspect.ratio,
    videoLayout: type === 'none' ? undefined : type,
    ...(type === 'none' ? {} : {
      videoHeader: { enabled: top, bgColor: '#000000', height: 120 },
      videoFooter: { enabled: bottom, bgColor: '#000000', height: 120 },
    }),
    defaultCaptions: [
      ...(top ? [caption('v-cap-top', 'TOP TEXT', 0.1)] : []),
      ...(bottom ? [caption('v-cap-bottom', 'BOTTOM TEXT', 0.9)] : []),
    ],
  };
};

// A caption layout for the image editor: a blank canvas with the header bar, the footer bar or both
// switched on, black as the video editor's, each with its caption in it (white), big enough to read
// at a glance; the bar shrinks longer text to fit (canvasLayout's fitCaptionsToBands).
const createCaptionImageTemplate = (type: CaptionType, aspect: Aspect): Template => {
  const base = createLayoutTemplate({ id: '1-panel', slots: 1 }, aspect);
  const top = type === 'header' || type === 'both';
  const bottom = type === 'footer' || type === 'both';
  const look = { x: 0.5, fontSize: 84, color: '#ffffff', stroke: 'transparent', fontFamily: 'Impact, sans-serif', align: 'center' };
  const stamp = Date.now();
  return {
    ...base,
    id: `custom-caption-${type}-${stamp}`,
    name: 'Caption Layout',
    canvasHeader: { enabled: top, bgColor: '#000000', ownColor: true, height: 170 },
    canvasFooter: { enabled: bottom, bgColor: '#000000', ownColor: true, height: 170 },
    defaultCaptions: [
      ...(top ? [{ ...look, id: `cap-header-${stamp}`, text: 'TOP TEXT', y: 0.08, isHeaderCaption: true }] : []),
      ...(bottom ? [{ ...look, id: `cap-footer-${stamp}`, text: 'BOTTOM TEXT', y: 0.92, isFooterCaption: true }] : []),
    ],
  };
};

// ---- Drawings ----

// A frame of the chosen shape, as big as fits in a square (`fill` of it), its contents drawn inside.
function Frame({ ratio, fill = 0.76, className = '', children }: { ratio: number; fill?: number; className?: string; children?: ReactNode }) {
  const w = ratio >= 1 ? fill : fill * ratio;
  const h = ratio >= 1 ? fill / ratio : fill;
  return (
    <span className={`clb-frame ${className}`} style={{ width: `${w * 100}%`, height: `${h * 100}%` }}>
      {children}
    </span>
  );
}

// The picture every preview shows, cropped to fill its spot.
const PIC = (name: string) => `./images/layouts/${name}.svg`;
const SHIBA = PIC('shiba');
const CAT = PIC('grumpy-cat');
// The panels of a collage or a grid, in turn.
const CAST = ['capybara', 'hamster', 'penguin', 'raccoon', 'shiba', 'grumpy-cat'].map(PIC);
const castAt = (i: number) => CAST[i % CAST.length];
const PREVIEW = CAT;
// The caption layouts' own picture (a beach), so that section reads apart from the rest.
const CAPTION_PREVIEW = SHIBA;
const Photo = ({ src = PREVIEW }: { src?: string }) => <img className="clb-photo" src={src} alt="" draggable={false} />;

// A small play mark over a picture, for a video meme's previews.
const PlayBadge = () => <span className="clb-play"><Play fill="currentColor" strokeWidth={0} /></span>;

// A photo icon over the picture (no background), where the caption layouts' own photo goes.
const PhotoBadge = () => <span className="clb-play clb-play--photo"><ImageIcon strokeWidth={2} /></span>;

// A panel's spot in a frame, from its rectangle (fractions of the frame).
const at = (r: { x: number; y: number; width: number; height: number }): CSSProperties =>
  ({ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%` });

// A grid's panels in a frame, each showing the picture (and a play mark for video, where it fits).
// `labels` puts a line of meme text near each panel's foot, as a collage starts.
function PanelsArt({ layout, ratio, video, labels, first = 0 }: { layout: PanelLayout; ratio: number; video: boolean; labels?: string[]; first?: number }) {
  const rects = panelRects(layout);
  return (
    <Frame ratio={ratio}>
      {rects.map((r, i) => {
        const room = Math.min(r.width * Math.min(1, ratio), r.height * Math.min(1, 1 / ratio));
        return (
          <span key={i} className="clb-panel" style={at(r)}>
            <span className="clb-panel-fill">
              <Photo src={castAt(first + i)} />
              {video && room >= 0.22 && <PlayBadge />}
              {labels?.[i] && <span className="clb-meme clb-meme--foot">{labels[i]}</span>}
            </span>
          </span>
        );
      })}
    </Frame>
  );
}

// A caption layout as it opens: black bars with white TOP TEXT / BOTTOM TEXT round the picture, a
// photo (or play) mark on it where yours goes.
function CaptionArt({ type, ratio, video }: { type: CaptionType; ratio: number; video: boolean }) {
  return (
    <Frame ratio={ratio} className="clb-frame--caption">
      {type !== 'footer' && <span className="clb-bar"><span className="clb-meme">TOP TEXT</span></span>}
      <span className="clb-picture"><Photo src={CAPTION_PREVIEW} />{video ? <PlayBadge /> : <PhotoBadge />}</span>
      {type !== 'header' && <span className="clb-bar"><span className="clb-meme">BOTTOM TEXT</span></span>}
    </Frame>
  );
}

// ---- Meme formats and collages (image memes) ----

// The classic meme look for a caption: Impact, white with a black outline.
const IMPACT = { x: 0.5, color: '#ffffff', stroke: '#000000', fontFamily: 'Impact, sans-serif', align: 'center' };

const blankImage = (aspect: Aspect) => createLayoutTemplate({ id: '1-panel', slots: 1 }, aspect);
const grid = (id: string, slots: number, aspect: Aspect) => createLayoutTemplate({ id, slots, name: layoutName(id, 'Custom Layout') }, aspect);

interface Format { id: string; title: string; detail: string; art: (ratio: number) => ReactNode; make: (aspect: Aspect) => Template }

const FORMATS: Format[] = [
  {
    id: 'classic',
    title: 'Classic',
    detail: 'Top & bottom text',
    art: (ratio) => (
      <Frame ratio={ratio}>
        <Photo />
        <span className="clb-meme clb-meme--top">YOUR TEXT</span>
        <span className="clb-meme clb-meme--bottom">GOES HERE</span>
      </Frame>
    ),
    make: (aspect) => {
      const stamp = Date.now();
      return {
        ...blankImage(aspect),
        id: `custom-classic-${stamp}`,
        name: 'Classic Meme',
        defaultCaptions: [
          { ...IMPACT, id: `cap-top-${stamp}`, text: 'TOP TEXT', y: 0.1, fontSize: 72 },
          { ...IMPACT, id: `cap-bottom-${stamp}`, text: 'BOTTOM TEXT', y: 0.9, fontSize: 72 },
        ],
      };
    },
  },
  {
    id: 'subtitle',
    title: 'Subtitle',
    detail: 'Movie caption',
    art: (ratio) => (
      <Frame ratio={ratio}>
        <Photo />
        <span className="clb-subtitle">Your text</span>
      </Frame>
    ),
    make: (aspect) => {
      const stamp = Date.now();
      return {
        ...blankImage(aspect),
        id: `custom-subtitle-${stamp}`,
        name: 'Subtitle Meme',
        defaultCaptions: [
          { id: `cap-sub-${stamp}`, text: 'Your text', x: 0.5, y: 0.9, fontSize: 40, color: '#ffffff', stroke: '#000000', fontFamily: 'Arial, sans-serif', bold: false, align: 'center' },
        ],
      };
    },
  },
  {
    id: 'poster',
    title: 'Poster',
    detail: 'Demotivational',
    art: (ratio) => (
      <Frame ratio={ratio} className="clb-frame--poster">
        <span className="clb-poster-pic"><Photo /></span>
        <span className="clb-poster-title">YOUR TEXT</span>
        <span className="clb-poster-sub">goes here</span>
      </Frame>
    ),
    make: (aspect) => {
      const stamp = Date.now();
      return {
        ...blankImage(aspect),
        id: `custom-poster-${stamp}`,
        name: 'Poster',
        canvasBgColor: '#000000',
        demotivational: { enabled: true, title: 'YOUR TEXT', subtitle: 'goes here' },
        defaultCaptions: [
          { id: `cap-title-${stamp}`, text: 'YOUR TEXT', x: 0.5, y: 0.81, fontSize: 44, color: '#ffffff', stroke: 'transparent', align: 'center', fontFamily: 'Times New Roman, serif', isDemotivationalTitle: true },
          { id: `cap-subtitle-${stamp}`, text: 'goes here', x: 0.5, y: 0.9, fontSize: 18, fontStyle: 'italic', color: '#cccccc', stroke: 'transparent', align: 'center', fontFamily: 'Georgia, serif', isDemotivationalSubtitle: true },
        ],
      };
    },
  },
  {
    id: 'news',
    title: 'Breaking news',
    detail: 'TV news bar',
    art: (ratio) => (
      <Frame ratio={ratio}>
        <Photo />
        <span className="clb-live">LIVE</span>
        <span className="clb-news">
          <span className="clb-news-tag">BREAKING NEWS</span>
          <span className="clb-news-head">Your headline here</span>
          <span className="clb-news-ticker">More at eleven</span>
        </span>
      </Frame>
    ),
    make: (aspect) => {
      const stamp = Date.now();
      return {
        ...blankImage(aspect),
        id: `custom-news-${stamp}`,
        name: 'Breaking News',
        defaultCaptions: [
          { id: `cap-news-${stamp}`, text: 'YOUR HEADLINE HERE', x: 0.5, y: 0.86, width: 0.94, fontSize: 30, isBreakingNews: true, newsChannel: 'MEME NEWS 24', newsTicker: 'DEVELOPING STORY: MORE AT ELEVEN' },
        ],
      };
    },
  },
];

const COLLAGES: Format[] = [
  {
    id: 'collage-top-bottom',
    title: 'Top & bottom',
    detail: '2 photos, text on each',
    art: (ratio) => <PanelsArt layout={{ id: '2-vert', slots: 2 }} ratio={ratio} video={false} labels={['YOUR TEXT', 'GOES HERE']} first={2} />,
    make: (aspect) => {
      const stamp = Date.now();
      return {
        ...grid('2-vert', 2, aspect),
        defaultCaptions: [
          { ...IMPACT, id: `cap-p1-${stamp}`, text: 'YOUR TEXT', y: 0.43, fontSize: 60, isPanelLabel: true },
          { ...IMPACT, id: `cap-p2-${stamp}`, text: 'GOES HERE', y: 0.93, fontSize: 60, isPanelLabel: true },
        ],
      };
    },
  },
  {
    id: 'collage-then-now',
    title: 'Then & now',
    detail: 'How it started / going',
    art: (ratio) => <PanelsArt layout={{ id: '2-vert', slots: 2 }} ratio={ratio} video={false} labels={['HOW IT STARTED', "HOW IT'S GOING"]} first={1} />,
    make: (aspect) => {
      const stamp = Date.now();
      return {
        ...grid('2-vert', 2, aspect),
        defaultCaptions: [
          { ...IMPACT, id: `cap-p1-${stamp}`, text: 'HOW IT STARTED', y: 0.43, fontSize: 48, isPanelLabel: true },
          { ...IMPACT, id: `cap-p2-${stamp}`, text: "HOW IT'S GOING", y: 0.93, fontSize: 48, isPanelLabel: true },
        ],
      };
    },
  },
  {
    id: 'collage-side-caption',
    title: 'Side by side',
    detail: '2 photos, caption under',
    art: (ratio) => (
      <Frame ratio={ratio} className="clb-frame--caption clb-frame--white">
        <span className="clb-picture clb-picture--split"><span><Photo src={SHIBA} /></span><span><Photo src={CAT} /></span></span>
        <span className="clb-bar clb-bar--white"><span className="clb-plain">Your text</span></span>
      </Frame>
    ),
    make: (aspect) => {
      const stamp = Date.now();
      return {
        ...grid('2-horiz', 2, aspect),
        canvasFooter: { enabled: true, bgColor: '#ffffff', ownColor: true, height: 150 },
        defaultCaptions: [
          { id: `cap-footer-${stamp}`, text: 'Your text', x: 0.5, y: 0.92, fontSize: 56, color: '#000000', stroke: 'transparent', fontFamily: 'Arial, sans-serif', align: 'center', isFooterCaption: true },
        ],
      };
    },
  },
  {
    id: 'collage-grid-caption',
    title: '2 × 2 + caption',
    detail: '4 photos, text on top',
    art: (ratio) => (
      <Frame ratio={ratio} className="clb-frame--caption clb-frame--white">
        <span className="clb-bar clb-bar--white"><span className="clb-plain">Your text</span></span>
        <span className="clb-picture clb-picture--quad">{[0, 1, 2, 3].map((i) => <span key={i}><Photo src={castAt(i)} /></span>)}</span>
      </Frame>
    ),
    make: (aspect) => {
      const stamp = Date.now();
      return {
        ...grid('4-grid', 4, aspect),
        canvasHeader: { enabled: true, bgColor: '#ffffff', ownColor: true, height: 150 },
        defaultCaptions: [
          { id: `cap-header-${stamp}`, text: 'Your text', x: 0.5, y: 0.08, fontSize: 56, color: '#000000', stroke: 'transparent', fontFamily: 'Arial, sans-serif', align: 'center', isHeaderCaption: true },
        ],
      };
    },
  },
];

// A section's cards in one line, sliding sideways when there are more than fit.
function Slider({ children }: { children: ReactNode[] }) {
  return (
    <div className="clb-slider" role="list">
      {children.map((child, i) => <div key={i} role="listitem" className="clb-slide">{child}</div>)}
    </div>
  );
}

// A layout card: its drawing on a tile, then its name and a short line.
function LayoutCard({ art, title, detail, onClick, pressed }: { art: ReactNode; title: string; detail: string; onClick: () => void; pressed?: boolean }) {
  return (
    <button type="button" className="clb-card" onClick={onClick} aria-pressed={pressed}>
      <span className="clb-card-pic" aria-hidden="true">{art}</span>
      <span className="clb-card-name">{title}</span>
      <span className="clb-card-detail">{detail}</span>
    </button>
  );
}

// Minus and plus around a number from 1 to 6.
function Stepper({ value, unit, onChange }: { value: number; unit: string; onChange: (value: number) => void }) {
  return (
    <span className="clb-stepper-wrap">
      <output className="clb-stepper-value">{value}</output>
      <span className="clb-stepper">
        <button type="button" aria-label={`Fewer ${unit}`} disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))}>
          <Minus size={17} aria-hidden="true" />
        </button>
        <button type="button" aria-label={`More ${unit}`} disabled={value >= 6} onClick={() => onChange(Math.min(6, value + 1))}>
          <Plus size={17} aria-hidden="true" />
        </button>
      </span>
    </span>
  );
}

// The canvas shape: a pill bar of four choices, each a small outline of its shape and its ratio
// (named for screen readers); the picked one widens to say its name, and the black key slides under
// it as on the other pages' switches (useSlidingKey), growing into place when the page opens.
function AspectPicker({ value, onChange }: { value: Aspect; onChange: (aspect: Aspect) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  useSlidingKey(trackRef, value.id, '[aria-checked="true"]');
  return (
    <div className="clb-shape">
      <div className="clb-aspects" role="radiogroup" aria-label="Canvas shape" ref={trackRef}>
        <span className="clb-aspects-key" aria-hidden="true" />
        {CANVAS_ASPECTS.map((a) => {
          const on = a.id === value.id;
          const w = a.ratio >= 1 ? 16 : 16 * a.ratio;
          const h = a.ratio >= 1 ? 16 / a.ratio : 16;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${a.label} ${a.id}`}
              className={`clb-aspect${on ? ' is-on' : ''}`}
              onClick={() => onChange(a)}
            >
              <span className="clb-aspect-shape" aria-hidden="true"><span style={{ width: w, height: h }} /></span>
              <span className="clb-aspect-ratio">{a.id}</span>
              {on && <span className="clb-aspect-name" aria-hidden="true">{a.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CustomLayoutBuilder({
  kind = 'image',
  onLayoutComplete,
  onSelectTemplate
}: CustomLayoutBuilderProps) {
  // Each time the page opens (App remounts it on every Creator pick) it starts at the top.
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [kind]);
  const [aspect, setAspect] = useState<Aspect>(() => aspectById(safeGet(ASPECT_KEY)));
  const [customOpen, setCustomOpen] = useState(false);
  const [customCols, setCustomCols] = useState(2);
  const [customRows, setCustomRows] = useState(2);
  const isVideo = kind === 'video';

  const pickAspect = (a: Aspect) => {
    setAspect(a);
    safeSet(ASPECT_KEY, a.id);
  };

  const open = (template: Template) => {
    if (onSelectTemplate) onSelectTemplate(template);
    else if (onLayoutComplete) onLayoutComplete(template);
  };

  const openBlank = () => open(isVideo ? createVideoTemplate('none', aspect) : createLayoutTemplate({ id: '1-panel', slots: 1 }, aspect));
  const openGrid = (layout: PanelLayout & { name?: string }) =>
    open(isVideo ? createVideoGridTemplate(layout, aspect) : createLayoutTemplate(layout, aspect));
  const openCaption = (type: CaptionType) => open(isVideo ? createVideoTemplate(type, aspect) : createCaptionImageTemplate(type, aspect));
  // For an image meme the collages already offer 2 stacked, 2 side by side and 2 × 2 (with their
  // text), so the grids leave those out; the video editor has no collages, so it keeps them all.
  const grids = isVideo ? GRIDS : GRIDS.filter((g) => !IN_COLLAGES.includes(g.id));
  const customLayout: PanelLayout = { id: 'custom-grid', slots: customCols * customRows, cols: customCols, rows: customRows };

  return (
    <div className="clb ios ios-page">
      <header className="clb-nav">
        <h1 className="ios-title">Canvas Layout</h1>
        <p className="ios-subtitle">{isVideo ? 'Every layout opens in the video editor' : 'Every layout opens in the image editor'}</p>
      </header>

      <AspectPicker value={aspect} onChange={pickAspect} />

      <button type="button" className="clb-start" onClick={openBlank}>
        <span className="clb-start-pic" aria-hidden="true">
          <Frame ratio={aspect.ratio} fill={0.62} className="clb-frame--blank">
            {isVideo && <Play className="clb-start-play" fill="currentColor" strokeWidth={0} />}
          </Frame>
        </span>
        <span className="clb-start-text">
          <span className="clb-start-name">Blank Canvas</span>
          <span className="clb-start-detail">{isVideo ? `An empty ${aspect.label.toLowerCase()} video` : `An empty ${aspect.label.toLowerCase()} canvas`} · {aspect.id}</span>
        </span>
        <ChevronRight className="clb-start-go" aria-hidden="true" />
      </button>

      <section className="clb-section" aria-labelledby="clb-captions">
        <h2 className="ios-section-title" id="clb-captions">Caption layouts</h2>
        <p className="ios-section-sub">{isVideo ? 'Caption bars above and below the clip' : 'Caption bars above and below the picture'}</p>
        <Slider>
          {CAPTIONS.map((c) => (
            <LayoutCard
              key={c.type}
              art={<CaptionArt type={c.type} ratio={aspect.ratio} video={isVideo} />}
              title={c.title}
              detail={c.detail}
              onClick={() => openCaption(c.type)}
            />
          ))}
        </Slider>
      </section>

      {/* Meme formats and collages are image layouts (the video editor has no poster frame or news bar). */}
      {!isVideo && (
        <>
          <section className="clb-section" aria-labelledby="clb-formats">
            <h2 className="ios-section-title" id="clb-formats">Meme formats</h2>
            <p className="ios-section-sub">Famous looks, ready for your photo</p>
            <Slider>
              {FORMATS.map((f) => (
                <LayoutCard key={f.id} art={f.art(aspect.ratio)} title={f.title} detail={f.detail} onClick={() => open(f.make(aspect))} />
              ))}
            </Slider>
          </section>

          <section className="clb-section" aria-labelledby="clb-collages">
            <h2 className="ios-section-title" id="clb-collages">Collages</h2>
            <p className="ios-section-sub">Several photos with text already in place</p>
            <Slider>
              {COLLAGES.map((f) => (
                <LayoutCard key={f.id} art={f.art(aspect.ratio)} title={f.title} detail={f.detail} onClick={() => open(f.make(aspect))} />
              ))}
            </Slider>
          </section>
        </>
      )}

      <section className="clb-section" aria-labelledby="clb-grids">
        <h2 className="ios-section-title" id="clb-grids">Grid layouts</h2>
        <p className="ios-section-sub">{isVideo ? 'Clips side by side, stacked or in a grid' : 'Photos side by side, stacked or in a grid'}</p>
        <Slider>
          {[
            ...grids.map((g, n) => (
              <LayoutCard
                key={g.id}
                art={<PanelsArt layout={g} ratio={aspect.ratio} video={isVideo} first={n} />}
                title={g.title}
                detail={g.detail}
                onClick={() => openGrid({ id: g.id, slots: g.slots, name: layoutName(g.id, `${g.title} (${g.detail})`) })}
              />
            )),
            <LayoutCard
              key="custom"
              art={<Frame ratio={aspect.ratio} className="clb-frame--custom"><Grid3x3 className="clb-mark clb-mark--big" strokeWidth={1.8} /></Frame>}
              title="Custom Grid"
              detail="Rows & columns"
              pressed={customOpen}
              onClick={() => setCustomOpen((v) => !v)}
            />,
          ]}
        </Slider>

        {customOpen && (
          <div className="clb-custom">
            <span className="clb-custom-preview" aria-hidden="true">
              <span className="clb-custom-square">
                <PanelsArt layout={customLayout} ratio={aspect.ratio} video={isVideo} />
              </span>
            </span>
            <div className="clb-form">
              <div className="clb-form-row">
                <span className="clb-form-label">Columns</span>
                <Stepper value={customCols} unit="columns" onChange={setCustomCols} />
              </div>
              <div className="clb-form-row">
                <span className="clb-form-label">Rows</span>
                <Stepper value={customRows} unit="rows" onChange={setCustomRows} />
              </div>
            </div>
            <div className="clb-custom-actions">
              <button type="button" className="ios-btn ios-btn--gray" onClick={() => setCustomOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="ios-btn ios-btn--filled"
                onClick={() => openGrid({ ...customLayout, name: `Custom ${customCols}x${customRows}` })}
              >
                Create {customCols * customRows} {customCols * customRows === 1 ? 'Panel' : 'Panels'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
