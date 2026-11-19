import { describe, it, expect } from 'vitest';
import { sameColor } from './sameColor';

describe('sameColor', () => {
  it('matches a colour however it is written', () => {
    expect(sameColor('#fff', '#FFFFFF')).toBe(true);
    expect(sameColor('white', 'rgb(255, 255, 255)')).toBe(true);
    expect(sameColor('#000000ff', 'black')).toBe(true);
    expect(sameColor('rgba(255,90,54,1)', '#ff5a36')).toBe(true);
  });

  it('tells different colours, and unreadable ones, apart', () => {
    expect(sameColor('#ffffff', '#000000')).toBe(false);
    expect(sameColor('rgba(255,255,255,0.5)', '#ffffff')).toBe(false);
    expect(sameColor({}, {})).toBe(false);
    expect(sameColor('cornsilk', 'Cornsilk')).toBe(true);
    expect(sameColor('cornsilk', 'white')).toBe(false);
  });
});
