import { describe, it, expect } from 'vitest';
import { filterEmojis, filterStickers, filterTemplates } from './mediaPickers';
import type { PickerTemplate } from './mediaPickers';

describe('media pickers', () => {
  it('shows a category, or searches every category', () => {
    expect(filterEmojis('', 'faces').every((e) => e.category === 'faces')).toBe(true);
    const found = filterEmojis('laugh', 'flags');
    expect(found.map((e) => e.name)).toContain('Laugh Cry');
    expect(filterStickers('', 'memes').every((s) => s.category === 'memes')).toBe(true);
    expect(filterStickers('zzzz-nothing', 'memes')).toEqual([]);
  });

  it('templates: pictures only, by tag, most popular first', () => {
    const list: PickerTemplate[] = [
      { id: 'a', name: 'Drake', category: 'classic', trendingScore: 1 },
      { id: 'b', name: 'Cat reaction', category: 'reaction', trendingScore: 5 },
      { id: 'c', name: 'Dance', type: 'video', trendingScore: 9 },
      { id: 'd', name: 'Tweet', category: 'social', tags: ['social'], trendingScore: 3 },
    ];
    expect(filterTemplates(list, '', 'all', []).map((t) => t.id)).toEqual(['b', 'd', 'a']);
    expect(filterTemplates(list, '', 'classics', []).map((t) => t.id)).toEqual(['a']);
    expect(filterTemplates(list, '', 'favorites', ['d']).map((t) => t.id)).toEqual(['d']);
    expect(filterTemplates(list, 'CAT', 'all', []).map((t) => t.id)).toEqual(['b']);
  });
});
