import { describe, it, expect } from 'vitest';
import { appHeightFix, screenHeight } from './standaloneViewport';

describe('standaloneViewport', () => {
  it('uses the long side upright and the short side sideways', () => {
    expect(screenHeight(390, 844, false)).toBe(844);
    expect(screenHeight(390, 844, true)).toBe(390);
  });

  it('forces the screen height only when an iOS home-screen app reports less', () => {
    // iPhone 15 home-screen app: viewport short by the 59px status bar.
    expect(appHeightFix({ standalone: true, innerWidth: 393, innerHeight: 793, screenW: 393, screenH: 852 })).toBe(852);
    expect(appHeightFix({ standalone: true, innerWidth: 393, innerHeight: 852, screenW: 393, screenH: 852 })).toBeNull();
    expect(appHeightFix({ standalone: false, innerWidth: 393, innerHeight: 700, screenW: 393, screenH: 852 })).toBeNull();
  });
});
