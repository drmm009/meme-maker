import { describe, it, expect } from 'vitest';
import { autoCaptions, fromImgflip, fromMemegen, mergeTemplates, templateCategory, templateKey } from './memeTemplateSources';

describe('meme template sources', () => {
  it('maps Imgflip and memegen templates to the editor’s shape', () => {
    expect(fromImgflip({ id: '181913649', name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg', width: 1200, height: 1200, box_count: 2 }, 0))
      .toMatchObject({ id: 'imgflip-181913649', category: 'reaction', imageUrl: 'https://i.imgflip.com/30b1gx.jpg', boxCount: 2, trendingScore: 100 });
    const dragon = fromMemegen({ id: '3hd', name: 'Three-Headed Dragon', lines: 3, blank: 'https://api.memegen.link/images/3hd.jpg', keywords: ['King Ghidorah'] });
    expect(dragon).toMatchObject({ id: 'memegen-3hd', category: 'multi-panel', imageUrl: 'https://api.memegen.link/images/3hd.jpg', tags: ['king ghidorah'], trendingScore: 0 });
    expect(dragon.defaultCaptions.map((c) => [c.text, c.y])).toEqual([['TOP TEXT', 0.12], ['TEXT 2', 0.5], ['BOTTOM TEXT', 0.88]]);
  });

  it('places one caption at the bottom and two at top and bottom', () => {
    expect(autoCaptions('x', 1).map((c) => [c.text, c.y])).toEqual([['BOTTOM TEXT', 0.85]]);
    expect(autoCaptions('x', 2).map((c) => c.y)).toEqual([0.15, 0.85]);
    expect(autoCaptions('x', 9)).toHaveLength(4);
  });

  it('guesses a category from the name', () => {
    expect(templateCategory('Two Buttons', 40)).toBe('comparison');
    expect(templateCategory('Expanding Brain', 40, 4)).toBe('multi-panel');
    expect(templateCategory('Bad Luck Brian', 40)).toBe('classic');
    expect(templateCategory('Sweating Bullets', 40)).toBe('trending');
  });

  it('keeps each meme once, the earlier list winning', () => {
    expect(templateKey('The Distracted Boyfriend')).toBe(templateKey('distracted-boyfriend'));
    const merged = mergeTemplates([{ name: 'Distracted Boyfriend', from: 'local' }], [{ name: 'distracted boyfriend', from: 'imgflip' }, { name: 'Two Buttons', from: 'imgflip' }], [{ name: 'Two buttons', from: 'memegen' }, { name: 'Stonks', from: 'memegen' }]);
    expect(merged.map((t) => [t.name, t.from])).toEqual([['Distracted Boyfriend', 'local'], ['Two Buttons', 'imgflip'], ['Stonks', 'memegen']]);
  });
});
