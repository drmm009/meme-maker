import { describe, it, expect } from 'vitest';
import { audioExtension, clipSpan, createExportGraph, ffmpegColor, outputSize, textStills, visualSize } from './exportGraph';

const graphFor = (opts = {}) => createExportGraph({ width: 1280, height: 720, durationMs: 4000, backgroundColor: '#ffffff', ...opts });
const filtersOf = (command) => {
  const i = command.indexOf('-filter_complex');
  return i === -1 ? [] : command[i + 1].split(';');
};
const after = (command, flag) => command[command.indexOf(flag) + 1];

describe('output size and helpers', () => {
  it('sizes 720p and 1080p by the long side, keeping the aspect and even pixels', () => {
    expect(outputSize(16 / 9, 720)).toEqual({ width: 1280, height: 720 });
    expect(outputSize(9 / 16, 1080)).toEqual({ width: 1080, height: 1920 });
    expect(outputSize(1, 720)).toEqual({ width: 1280, height: 1280 });
    expect(outputSize(4 / 3, 720)).toEqual({ width: 1280, height: 960 });
    expect(outputSize(NaN, 720)).toEqual({ width: 1280, height: 720 }); // falls back to 16:9
  });

  it('converts colours, defaulting to white', () => {
    expect(ffmpegColor('#1a1d27')).toBe('0x1A1D27');
    expect(ffmpegColor('red')).toBe('white');
  });

  it('times clips in seconds, at least 0.05s long, open clips running to the end', () => {
    expect(clipSpan({ startMs: 1500, endMs: 2500 }, 4000)).toEqual({ start: 1.5, end: 2.5 });
    expect(clipSpan({ startMs: 1000 }, 4000)).toEqual({ start: 1, end: 4 });
    expect(clipSpan({ startMs: 2000, endMs: 2000 }, 4000)).toEqual({ start: 2, end: 2.05 });
  });

  it('scales preview sizes to the output in even pixels', () => {
    expect(visualSize({ width: 200, height: 101, scaleX: 1.5 }, 1.6)).toEqual({ w: 480, h: 162 });
  });

  it('names sound files from their recorded type or URL', () => {
    expect(audioExtension({ mimeType: 'audio/webm;codecs=opus', url: 'blob:x' })).toBe('webm');
    expect(audioExtension({ url: 'https://x.test/a.WAV?v=1' })).toBe('wav');
    expect(audioExtension({ url: 'blob:x' })).toBe('mp3');
  });
});

describe('createExportGraph', () => {
  it('starts from the background colour and silence, for the project length', () => {
    const { command } = graphFor({ backgroundColor: '#000000' }).finish();
    expect(command.slice(0, 8)).toEqual(['-f', 'lavfi', '-i', 'color=c=0x000000:s=1280x720:d=4', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo:d=4']);
    expect(command).not.toContain('-filter_complex');
    expect(after(command, '-map')).toBe('0:v');
    expect(command.slice(-3)).toEqual(['-t', '4', 'output.mp4']);
  });

  it('stacks each clip on the layer below and hands out input numbers in order', () => {
    const g = graphFor();
    expect(g.nextIndex).toBe(2);
    g.addVisual({ type: 'image', url: 'a', x: 0, y: 0, width: 800, height: 450, startMs: 0, endMs: 2000 }, { fileName: 'input_2.png', kind: 'still', ratio: 1.6, items: [] });
    g.addStill('text_3.png', '0:0', 'between(t,0.000,4.000)');
    expect(g.nextIndex).toBe(4);
    const { command } = g.finish();
    const filters = filtersOf(command);
    expect(filters[1]).toBe("[0:v][vis2]overlay=0:0:enable='between(t,0,2)':eof_action=pass:shortest=0[bg1]");
    expect(filters[2]).toBe("[bg1][3:v]overlay=0:0:enable='between(t,0.000,4.000)':eof_action=pass:shortest=0[bg2]");
    expect(after(command, '-map')).toBe('[bg2]');
  });

  it('loops stills, plays GIFs on repeat, and trims and offsets videos', () => {
    const g = graphFor();
    g.addVisual({ type: 'sticker', url: 's' }, { fileName: 'input_2.png', kind: 'still', ratio: 1, items: [] });
    g.addVisual({ type: 'sticker', url: 'g', startMs: 1000 }, { fileName: 'input_3.gif', kind: 'gif', ratio: 1, items: [] });
    g.addVisual({ type: 'video', url: 'v', startMs: 2000, endMs: 4000, trimStartMs: 750 }, { fileName: 'input_4.mp4', kind: 'video', ratio: 1, items: [] });
    const { command } = g.finish();
    expect(command.slice(8, 20)).toEqual(['-loop', '1', '-i', 'input_2.png', '-ignore_loop', '0', '-i', 'input_3.gif', '-ss', '0.75', '-i', 'input_4.mp4']);
    const filters = filtersOf(command);
    expect(filters[0]).toMatch(/^\[2:v\]setpts=\(PTS-STARTPTS\)\/1,scale=/); // looped still: no time offset
    expect(filters[2]).toMatch(/^\[3:v\]setpts=\(PTS-STARTPTS\)\/1\+1\/TB,/);
    expect(filters[4]).toMatch(/^\[4:v\]setpts=\(PTS-STARTPTS\)\/1\+2\/TB,/);
  });

  it('turns rotated clips like the preview: about their corner, placed by their centre', () => {
    const g = graphFor();
    // 100 x 50 at (100, 50), a quarter turn: the preview puts its centre at (75, 100).
    g.addVisual({ type: 'sticker', url: 's', x: 100, y: 50, width: 100, height: 50, rotation: 90, startMs: 0, endMs: 1000 }, { fileName: 'input_2.png', kind: 'still', ratio: 1, items: [] });
    const [chain, place] = filtersOf(g.finish().command);
    expect(chain).toBe('[2:v]setpts=(PTS-STARTPTS)/1,scale=100:50,format=rgba,rotate=1.570796:ow=50:oh=100:c=none[vis2]');
    expect(place).toMatch(/^\[0:v\]\[vis2\]overlay=50:50:/);
  });

  it('leaves unturned clips (0 or a full turn) as they are', () => {
    for (const rotation of [0, 360]) {
      const g = graphFor();
      g.addVisual({ type: 'image', url: 'p', x: 10, y: 20, width: 100, height: 50, rotation }, { fileName: 'input_2.png', kind: 'still', ratio: 1, items: [] });
      const [chain, place] = filtersOf(g.finish().command);
      expect(chain).not.toContain('rotate');
      expect(place).toMatch(/overlay=10:20:/);
    }
  });

  it('mixes a video\'s sound only when it has one, isn\'t muted and isn\'t a GIF export', () => {
    const video = { type: 'video', url: 'v', startMs: 1000, endMs: 3000, playbackRate: 2, volume: 0.5 };
    const withSound = graphFor();
    withSound.addVisual(video, { fileName: 'input_2.mp4', kind: 'video', hasAudio: true, ratio: 1, items: [] });
    const filters = filtersOf(withSound.finish().command);
    // 2s on the timeline at 2x speed uses 4s of footage.
    expect(filters[0]).toBe('[2:a]atrim=0:4,asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=44100,atempo=2,adelay=1000|1000,volume=0.5[aud2]');
    expect(filters.at(-1)).toBe('[1:a][aud2]amix=inputs=2:duration=first:dropout_transition=0,volume=2[final_audio]');

    for (const [item, hasAudio, gifOut] of [[video, false, false], [{ ...video, muted: true }, true, false], [video, true, true]]) {
      const g = graphFor({ gifOut });
      g.addVisual(item, { fileName: 'input_2.mp4', kind: 'video', hasAudio, ratio: 1, items: [] });
      expect(filtersOf(g.finish().command).some((f) => f.includes('[aud2]'))).toBe(false);
    }
  });

  it('mixes sounds at their place on the timeline, with speed only within 0.5x-2x', () => {
    const g = graphFor();
    g.addAudio({ startMs: 500, endMs: 1500, trimStartMs: 200, playbackRate: 1.5 }, 'audio_2.mp3');
    g.addAudio({ startMs: 0, endMs: 1000, playbackRate: 4 }, 'audio_3.mp3');
    g.addAudio({ startMs: 0, endMs: 1000, muted: true }, 'audio_4.mp3');
    const { command } = g.finish();
    expect(command.slice(8)).toEqual(expect.arrayContaining(['-ss', '0.2', '-i', 'audio_2.mp3', '-i', 'audio_3.mp3', '-i', 'audio_4.mp3']));
    const filters = filtersOf(command);
    expect(filters[0]).toBe('[2:a]atrim=0:1,asetpts=PTS-STARTPTS,atempo=1.5,aformat=channel_layouts=stereo:sample_rates=44100,adelay=500|500,volume=1[aud2]');
    expect(filters[1]).not.toContain('atempo'); // 4x is out of range
    expect(filters[2]).toBe('[1:a][aud2][aud3]amix=inputs=3:duration=first:dropout_transition=0,volume=3[final_audio]');
    expect(g.nextIndex).toBe(5); // the muted sound still took an input
    expect(command.slice(command.indexOf('-map'), command.indexOf('-map') + 4)).toEqual(['-map', '0:v', '-map', '[final_audio]']);
  });

  it('with an encoded picture, copies it and builds only the soundtrack', () => {
    const g = graphFor({ encodedVideo: 'picture.mp4' });
    g.addVideoSoundtrack({ type: 'video', url: 'v', startMs: 1000, endMs: 3000, trimStartMs: 500 }, 'input_2.mp4');
    const { command } = g.finish();
    expect(command.slice(0, 8)).toEqual(['-i', 'picture.mp4', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo:d=4', '-ss', '0.5']);
    expect(filtersOf(command)[0]).toBe('[2:a]atrim=0:2,asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=44100,adelay=1000|1000,volume=1[aud2]');
    expect(command.slice(command.indexOf('-map'))).toEqual(['-map', '0:v', '-map', '[final_audio]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', '4', '-movflags', '+faststart', 'output.mp4']);
  });

  it('with an encoded picture and no sound, adds silence', () => {
    const { command } = graphFor({ encodedVideo: 'picture.mp4' }).finish();
    expect(command).not.toContain('-filter_complex');
    expect(command.slice(command.indexOf('-map'), command.indexOf('-map') + 4)).toEqual(['-map', '0:v', '-map', '1:a']);
  });

  it('adds the caption track as one concat input at 30fps', () => {
    const g = graphFor();
    g.addCaptionTrack('captions.txt');
    const { command } = g.finish();
    expect(command).toEqual(expect.arrayContaining(['-f', 'concat', '-safe', '0', '-i', 'captions.txt']));
    expect(filtersOf(command)).toEqual(['[2:v]fps=30,format=rgba[cap2]', '[0:v][cap2]overlay=0:0:eof_action=pass:shortest=0[bg1]']);
  });

  it('writes a looping, silent GIF through a palette', () => {
    const g = graphFor({ gifOut: true });
    g.addStill('grid_2.png');
    const { command, outputFileName } = g.finish();
    expect(outputFileName).toBe('output.gif');
    // The palette pass reads the top layer and ends in [gifout].
    const filters = filtersOf(command);
    expect(filters.some((f) => f.startsWith('[bg1]') && !f.includes('overlay'))).toBe(true);
    expect(filters.at(-1)).toMatch(/\[gifout\]$/);
    expect(command.slice(-7)).toEqual(['-map', '[gifout]', '-loop', '0', '-t', '4', 'output.gif']);
    expect(command).not.toContain('-c:a');
  });

  it('encodes 720p fast and 1080p at better quality', () => {
    expect(graphFor().finish({ resolution: 720 }).command).toEqual(expect.arrayContaining(['-preset', 'ultrafast']));
    const hd = graphFor().finish({ resolution: 1080 }).command;
    expect(hd).toEqual(expect.arrayContaining(['-preset', 'veryfast', '-crf', '21']));
  });
});

describe('textStills', () => {
  it('shows still text once, for its whole clip', () => {
    const stills = textStills({ startMs: 1000, endMs: 3000, text: 'HI' }, 4000, 1.6);
    expect(stills).toHaveLength(1);
    expect(stills[0]).toMatchObject({ position: '0:0', enable: 'between(t,1.000,3.000)' });
  });

  it('hands pop-in steps over exactly, the last running to the clip end', () => {
    const stills = textStills({ startMs: 0, endMs: 2000, text: 'POP', animation: 'pop' }, 4000, 1);
    expect(stills.length).toBeGreaterThan(2);
    expect(stills[0].enable).toMatch(/^gte\(t,0\.000\)\*lt\(t,0\.\d{3}\)$/);
    expect(stills.at(-1).enable).toMatch(/^between\(t,0\.\d{3},2\.000\)$/);
    // Each step starts where the previous one ended.
    for (let i = 1; i < stills.length; i++) {
      const prevEnd = stills[i - 1].enable.match(/lt\(t,([\d.]+)\)/)[1];
      expect(stills[i].enable).toContain(`(t,${prevEnd}`);
    }
  });

  it('moves shaking text with overlay expressions', () => {
    const [still] = textStills({ startMs: 500, endMs: 1500, text: 'S', animation: 'shake', fontSize: 50 }, 4000, 1);
    expect(still.position).toMatch(/^x='[\d.]+\*sin\(2\*PI\*[\d.]+\*\(t-0\.500\)\)':y='/);
  });
});
