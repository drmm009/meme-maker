// Online meme templates on top of the curated ones (src/data/templates.js): Imgflip's top 100
// (api.imgflip.com/get_memes) and memegen.link's ~200 blank templates (api.memegen.link/templates,
// open source, CORS-enabled). Both are mapped to the template shape the editors use; the same meme
// from two places is kept once (the curated one first, then Imgflip, then memegen).

export interface AutoCaption {
  id: string; text: string; x: number; y: number; fontSize: number; color: string; stroke: string; align: 'center'; fontFamily: string;
}

export interface OnlineTemplate {
  id: string;
  name: string;
  category: string;
  tag: 'free';
  tags?: string[];
  imageUrl: string;
  rawImageUrl: string;
  width?: number;
  height?: number;
  boxCount: number;
  defaultCaptions: AutoCaption[];
  trendingScore: number;
}

export interface ImgflipMeme { id: string; name: string; url: string; width?: number; height?: number; box_count?: number }
export interface MemegenTemplate { id: string; name: string; lines?: number; blank: string; keywords?: string[] }

const has = (name: string, words: string[]) => words.some((w) => name.includes(w));

// A rough category from the name (and how many text boxes it has), for the Templates filters.
export function templateCategory(name: string, index: number, boxCount = 2): string {
  const n = name.toLowerCase();
  if (has(n, ['cat', 'dog', 'drake', 'yell', 'guy', 'man', 'face', 'smile', 'crying', 'kid', 'pepe'])) return 'reaction';
  if (has(n, ['vs', 'button', 'trade', 'compare', 'choice', 'boyfriend', 'car', 'road'])) return 'comparison';
  if (boxCount >= 3 || has(n, ['brain', 'panel', 'board', 'gru'])) return 'multi-panel';
  if (index < 25 || has(n, ['classic', 'doge', 'bad luck', 'success'])) return 'classic';
  return 'trending';
}

// Starting captions spread down the picture: one at the bottom, two top and bottom, more in between.
export function autoCaptions(id: string, boxes: number): AutoCaption[] {
  const count = Math.min(Math.max(boxes || 2, 1), 4);
  return Array.from({ length: count }, (_, i) => {
    const y = count === 1 ? 0.85 : count === 2 ? (i === 0 ? 0.15 : 0.85) : 0.12 + i * (0.76 / (count - 1));
    return {
      id: `cap-auto-${id}-${i}`,
      text: i === 0 && count > 1 ? 'TOP TEXT' : i === count - 1 ? 'BOTTOM TEXT' : `TEXT ${i + 1}`,
      x: 0.5,
      y: Number(y.toFixed(2)),
      fontSize: 44,
      color: '#ffffff',
      stroke: '#000000',
      align: 'center',
      fontFamily: 'Impact, sans-serif',
    };
  });
}

export const fromImgflip = (m: ImgflipMeme, index: number): OnlineTemplate => ({
  id: `imgflip-${m.id}`,
  name: m.name,
  category: templateCategory(m.name, index, m.box_count),
  tag: 'free',
  imageUrl: m.url,
  rawImageUrl: m.url,
  width: m.width,
  height: m.height,
  boxCount: m.box_count ?? 2,
  defaultCaptions: autoCaptions(`imgflip-${m.id}`, m.box_count ?? 2),
  trendingScore: 100 - index,
});

// memegen's list is alphabetical, so its templates rank after Imgflip's popular ones.
export const fromMemegen = (t: MemegenTemplate): OnlineTemplate => ({
  id: `memegen-${t.id}`,
  name: t.name,
  category: templateCategory(t.name, Infinity, t.lines),
  tag: 'free',
  tags: (t.keywords ?? []).map((k) => k.toLowerCase()),
  imageUrl: t.blank,
  rawImageUrl: t.blank,
  boxCount: t.lines ?? 2,
  defaultCaptions: autoCaptions(`memegen-${t.id}`, t.lines ?? 2),
  trendingScore: 0,
});

// A name to tell the same meme apart from small differences ("Distracted Boyfriend" / "distracted-boyfriend").
export const templateKey = (name: string): string => name.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '');

// The lists joined in order, each meme kept once.
export function mergeTemplates<T extends { name: string }>(...lists: T[][]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const list of lists) {
    for (const t of list) {
      const key = templateKey(t.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
  }
  return out;
}
