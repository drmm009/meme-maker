import { describe, expect, it } from 'vitest';
import { captionBgPatch } from './captionBox';

describe('captionBgPatch', () => {
  it('puts black words on a white box without an outline', () => {
    expect(captionBgPatch({ color: '#ffffff' }, 'white')).toEqual({ bgColor: 'white', color: '#000000', stroke: 'transparent', bgStyle: 'box' });
  });

  it('puts white words on a black box', () => {
    expect(captionBgPatch({ color: '#ff0000' }, 'black')).toMatchObject({ bgColor: 'black', color: '#ffffff', stroke: 'transparent' });
  });

  it('takes the box off when it is picked again, turning black words white', () => {
    expect(captionBgPatch({ bgColor: 'white', bgStyle: 'box', color: '#000000' }, 'white')).toEqual({ bgColor: 'none', bgStyle: 'box', color: '#ffffff', stroke: '#000000' });
  });

  it('keeps a coloured word colour when the box goes', () => {
    expect(captionBgPatch({ bgColor: 'black', color: '#ffd60a' }, 'none')).toMatchObject({ color: '#ffd60a', stroke: '#000000' });
  });

  it('makes a centred white banner', () => {
    expect(captionBgPatch({}, 'banner')).toMatchObject({ bgColor: 'white', bgStyle: 'banner', align: 'center' });
  });
});
