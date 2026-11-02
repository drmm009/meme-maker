// The AI Meme maker (editor mode 'ai'): it opens on a prompt screen (panels/AiMemeSheet.tsx) over
// the meme, where a template, an idea and a picked AI caption make the meme it then edits.

interface AiTemplate {
  id?: string | number;
  defaultCaptions?: unknown[];
  [key: string]: unknown;
}

// A template an AI caption suits: one picture to write on, not a video, social card, demotivational
// poster or split-screen comparison.
export const suitsAiCaption = (t: { imageUrl?: unknown; type?: unknown; category?: unknown; tags?: unknown; demotivational?: unknown }) =>
  Boolean(t.imageUrl) && t.type !== 'video' && t.category !== 'social' && t.category !== 'comparison' &&
  !(Array.isArray(t.tags) && t.tags.includes('social')) && !t.demotivational;

// The AI Meme maker on a template, its prompt screen starting from `prompt` (Home's idea box).
export const aiMemeTemplate = <T extends AiTemplate>(template: T, prompt = '') => ({
  ...template,
  editorMode: 'ai' as const,
  aiPrompt: prompt,
});

// The meme a picked caption makes: the template with just that caption, across the top, and the
// prompt screen done with (`aiPicked`, which a restored draft keeps too).
export const aiCaptionedTemplate = <T extends AiTemplate>(template: T, text: string) => ({
  ...template,
  editorMode: 'ai' as const,
  aiPicked: true,
  defaultCaptions: [{ id: `cap-ai-${Date.now()}`, text, x: 0.5, y: 0.12, fontSize: 46 }],
});

// The prompt screen shows while the maker hasn't had a caption picked.
export const opensOnPrompt = (template: { editorMode?: unknown; aiPicked?: unknown } | null | undefined) =>
  template?.editorMode === 'ai' && !template.aiPicked;
