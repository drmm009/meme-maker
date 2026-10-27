import { describe, it, expect } from 'vitest';
import { createRecordingContext, callsNamed, rotationOf, textsDrawn } from './recordingContext';

describe('recording context', () => {
  it('records calls with the canvas position they land on', () => {
    const ctx = createRecordingContext();
    ctx.translate(100, 50);
    ctx.fillRect(10, 20, 5, 5);
    expect(callsNamed(ctx, 'fillRect')[0].at).toEqual({ x: 110, y: 70 });
  });

  it('tracks rotation and scale', () => {
    const ctx = createRecordingContext();
    ctx.translate(100, 100);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('A', 10, 0);
    const [call] = callsNamed(ctx, 'fillText');
    expect(call.at.x).toBeCloseTo(100);
    expect(call.at.y).toBeCloseTo(110);
    expect(rotationOf(call)).toBe(90);
  });

  it('restores state and transform', () => {
    const ctx = createRecordingContext();
    ctx.fillStyle = '#ff0000';
    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.translate(5, 5);
    ctx.restore();
    ctx.fillText('B', 0, 0);
    expect(textsDrawn(ctx)[0]).toMatchObject({ color: '#ff0000', at: { x: 0, y: 0 } });
  });

  it('measures text from the font size', () => {
    const ctx = createRecordingContext();
    ctx.font = 'bold 50px Impact';
    expect(ctx.measureText('ABCD').width).toBe(120);
  });

  it('records any other canvas method', () => {
    const ctx = createRecordingContext();
    ctx.roundRect(1, 2, 3, 4, 5);
    expect(callsNamed(ctx, 'roundRect')[0].args).toEqual([1, 2, 3, 4, 5]);
  });
});
