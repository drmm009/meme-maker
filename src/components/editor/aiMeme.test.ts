import { describe, expect, it } from 'vitest';
import { AI_CAPTION_PREFIX, AI_CAPTION_STYLES, aiCaptionStyleOf, aiCaptionedTemplate, aiMemeTemplate, aiRestart, opensOnPrompt } from './aiMeme';

const drake = { id: 'drake', name: 'Drake', imageUrl: 'drake.jpg', defaultCaptions: [{ id: 'c1', text: 'old' }] };

describe('aiMeme', () => {
  it('a generated caption makes the meme: just that caption, the page done with, the ask kept', () => {
    const meme = aiCaptionedTemplate(drake, 'hi', { prompt: 'mondays', category: 'work', ideas: ['hi', 'yo'] });
    expect(meme).toMatchObject({ editorMode: 'ai', aiPicked: true, aiPrompt: 'mondays', aiCategory: 'work', aiIdeas: ['hi', 'yo'] });
    expect(meme.defaultCaptions).toHaveLength(1);
    expect(meme.defaultCaptions[0]).toMatchObject({ text: 'hi' });
    expect(meme.defaultCaptions[0].id.startsWith(AI_CAPTION_PREFIX)).toBe(true);
    expect(opensOnPrompt(meme)).toBe(false);
  });

  it('New starts the same meme again on the page, with its idea and vibe and no caption', () => {
    const again = aiRestart(aiCaptionedTemplate(aiMemeTemplate(drake), 'hi', { prompt: 'mondays', category: 'work', ideas: ['hi'] }));
    expect(again).toMatchObject({ id: 'drake', editorMode: 'ai', aiPrompt: 'mondays', aiCategory: 'work', defaultCaptions: [] });
    expect(again).not.toHaveProperty('aiPicked');
    expect(again).not.toHaveProperty('aiIdeas');
    expect(opensOnPrompt(again)).toBe(true);
  });

  it('a caption has the style its font and colour match, or none once changed by hand', () => {
    for (const st of AI_CAPTION_STYLES) expect(aiCaptionStyleOf(st.look)).toBe(st.id);
    expect(aiCaptionStyleOf({ fontFamily: 'Impact, sans-serif', color: '#ff0000' })).toBeNull();
  });
});
