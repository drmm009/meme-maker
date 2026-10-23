import { describe, it, expect } from 'vitest';
import { wrapText, getCurveSagitta } from './text';
import { getBreakingNewsHeight } from './chyron';
import { parseLikesCount } from './socialCards/shared';
import { parseTweetMetrics, TWEET_TREND_PRESETS } from './socialCards/tweet';

// A fake 2D context where every character is 10px wide.
const ctx = { measureText: (s) => ({ width: s.length * 10 }) };

describe('wrapText', () => {
  it('returns no lines for empty text', () => {
    expect(wrapText(ctx, '', 100)).toEqual([]);
  });

  it('keeps text that fits on one line', () => {
    expect(wrapText(ctx, 'NOBODY:', 100)).toEqual(['NOBODY:']);
  });

  it('wraps on spaces at the max width', () => {
    // 10 chars per 100px line
    expect(wrapText(ctx, 'WHEN YOU FINALLY FIX THE BUG', 100)).toEqual(['WHEN YOU', 'FINALLY', 'FIX THE', 'BUG']);
  });

  it('respects explicit newlines', () => {
    expect(wrapText(ctx, 'TOP\nBOTTOM', 200)).toEqual(['TOP', 'BOTTOM']);
  });

  it('force-breaks a word longer than the line', () => {
    expect(wrapText(ctx, 'AAAAAAAAAAAAAAA', 50)).toEqual(['AAAAA', 'AAAAA', 'AAAAA']);
  });
});

describe('getCurveSagitta', () => {
  it('is 0 for flat text', () => {
    expect(getCurveSagitta(300, 0)).toBe(0);
    expect(getCurveSagitta(300, 0.5)).toBe(0);
  });

  it('grows with the curve and is symmetric for arch/smile', () => {
    const small = getCurveSagitta(300, 20);
    const big = getCurveSagitta(300, 80);
    expect(big).toBeGreaterThan(small);
    expect(getCurveSagitta(300, -40)).toBeCloseTo(getCurveSagitta(300, 40));
  });

  it('clamps curves beyond ±100', () => {
    expect(getCurveSagitta(300, 500)).toBeCloseTo(getCurveSagitta(300, 100));
  });
});

describe('getBreakingNewsHeight', () => {
  it('has a minimum height and grows with font size', () => {
    expect(getBreakingNewsHeight({})).toBe(26 + 52 + 22);
    expect(getBreakingNewsHeight({ fontSize: 60 })).toBe(26 + 90 + 22);
  });
});

describe('parseLikesCount', () => {
  it('pulls the number out of common like phrasings', () => {
    expect(parseLikesCount('12.4K')).toBe('12.4K');
    expect(parseLikesCount('Liked by mom and 1,204 others')).toBe('1,204');
    expect(parseLikesCount('8,321 likes')).toBe('8,321');
    expect(parseLikesCount('')).toBe('');
    expect(parseLikesCount(null)).toBe('');
  });
});

describe('parseTweetMetrics', () => {
  it('uses the trend preset when one is given', () => {
    const rank = Object.keys(TWEET_TREND_PRESETS)[0];
    expect(parseTweetMetrics('anything', rank)).toEqual(TWEET_TREND_PRESETS[rank].metrics);
  });

  it('reads four numbers from a metrics string', () => {
    expect(parseTweetMetrics('💬 1.1K 🔁 2.2K ❤️ 3.3K 📊 4.4M')).toEqual({ replies: '1.1K', retweets: '2.2K', likes: '3.3K', views: '4.4M' });
  });

  it('fills missing object fields with defaults', () => {
    expect(parseTweetMetrics({ likes: '9' })).toEqual({ replies: '14.2K', retweets: '62.8K', likes: '9', views: '18.2M' });
  });

  it('falls back to defaults for empty input', () => {
    expect(parseTweetMetrics('')).toEqual({ replies: '14.2K', retweets: '62.8K', likes: '420.5K', views: '18.2M' });
  });
});
