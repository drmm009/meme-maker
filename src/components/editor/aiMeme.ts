// The AI Meme maker (editor mode 'ai'): it opens on its page (panels/AiMemeStudio.tsx) in the
// canvas's place, where a meme, an idea and a vibe make four AI captions; Generate puts the first on
// the meme and opens the editing page, whose strip (panels/AiStrip.tsx) switches between them and
// styles the caption.

interface AiTemplate {
  id?: string | number;
  defaultCaptions?: unknown[];
  aiPrompt?: unknown;
  aiCategory?: unknown;
  [key: string]: unknown;
}

// What the captions were asked for: the idea, the vibe (AI_MEME_CATEGORIES) and the four captions.
export interface AiAsk {
  prompt: string;
  category: string;
  ideas: string[];
}

// A template an AI caption suits: one picture to write on, not a video, social card, demotivational
// poster or split-screen comparison.
export const suitsAiCaption = (t: { imageUrl?: unknown; type?: unknown; category?: unknown; tags?: unknown; demotivational?: unknown }) =>
  Boolean(t.imageUrl) && t.type !== 'video' && t.category !== 'social' && t.category !== 'comparison' &&
  !(Array.isArray(t.tags) && t.tags.includes('social')) && !t.demotivational;

// The AI Meme maker on a template, its page starting from `prompt` (Home's idea box) and `category`.
export const aiMemeTemplate = <T extends AiTemplate>(template: T, prompt = '', category = 'all') => ({
  ...template,
  editorMode: 'ai' as const,
  aiPrompt: prompt,
  aiCategory: category,
});

// The id the AI caption gets, to find it again when another of the four is picked.
export const AI_CAPTION_PREFIX = 'cap-ai-';

// The meme a generated caption makes: the template with just that caption, across the top, the
// page done with (`aiPicked`, which a restored draft keeps too) and the ask kept for the strip.
export const aiCaptionedTemplate = <T extends AiTemplate>(template: T, text: string, ask?: AiAsk) => ({
  ...template,
  editorMode: 'ai' as const,
  aiPicked: true,
  ...(ask && { aiPrompt: ask.prompt, aiCategory: ask.category, aiIdeas: ask.ideas }),
  defaultCaptions: [{ id: `${AI_CAPTION_PREFIX}${Date.now()}`, text, x: 0.5, y: 0.12, fontSize: 46 }],
});

// New: the same meme back on the page, with its idea and vibe, its caption gone.
export const aiRestart = <T extends AiTemplate>(template: T) => {
  const { aiPicked: _picked, aiIdeas: _ideas, ...rest } = template;
  return aiMemeTemplate({ ...rest, defaultCaptions: [] }, String(template.aiPrompt || ''), String(template.aiCategory || 'all'));
};

// The page shows while the maker hasn't made its meme yet.
export const opensOnPrompt = (template: { editorMode?: unknown; aiPicked?: unknown } | null | undefined) =>
  template?.editorMode === 'ai' && !template.aiPicked;

// Looks the AI caption can take on its editing page (AiStrip's Style), each a set of caption fields
// that replaces the last look's.
export const AI_CAPTION_STYLES = [
  { id: 'classic', label: 'Classic', look: { fontFamily: 'Impact, sans-serif', color: '#ffffff', stroke: '#000000', bgColor: 'transparent', shadowSize: 0 } },
  { id: 'modern', label: 'Modern', look: { fontFamily: 'Montserrat, sans-serif', color: '#ffffff', stroke: 'transparent', bgColor: 'transparent', shadowSize: 14, shadowColor: 'rgba(0,0,0,0.85)' } },
  { id: 'label', label: 'Label', look: { fontFamily: 'Arial, sans-serif', color: '#000000', stroke: 'transparent', bgColor: '#ffffff', bgStyle: 'box', shadowSize: 0 } },
  { id: 'comic', label: 'Comic', look: { fontFamily: 'Bangers, Impact, sans-serif', color: '#ffd400', stroke: '#000000', bgColor: 'transparent', shadowSize: 0 } },
] as const;

// The style a caption has (by its font and colour), or null once those are changed by hand.
export const aiCaptionStyleOf = (cap: { fontFamily?: unknown; color?: unknown }) =>
  AI_CAPTION_STYLES.find((s) => s.look.fontFamily === cap.fontFamily && s.look.color === cap.color)?.id ?? null;
