import { describe, it, expect, vi, afterEach } from 'vitest';
import { historyBurst } from './historyBurst';

afterEach(() => { vi.useRealTimers(); });

describe('historyBurst', () => {
  it('saves the state from before a burst once, then again after a quiet gap', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const onChange = historyBurst(save, 500);
    onChange('before drag');
    vi.advanceTimersByTime(100);
    onChange('mid drag');
    vi.advanceTimersByTime(400);
    onChange('end of drag');
    expect(save.mock.calls).toEqual([['before drag']]);
    vi.advanceTimersByTime(500);
    onChange('before next edit');
    expect(save.mock.calls).toEqual([['before drag'], ['before next edit']]);
  });
});
