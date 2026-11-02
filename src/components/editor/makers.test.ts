import { describe, it, expect } from 'vitest';
import { MAKER_LINKS, makerOfLink, linkOfTemplate, makerTemplate } from './makers';
import type { Maker } from './makers';
import { editorModeOf } from './editorModes';
import { MEME_TEMPLATES } from '../../data/templates';
import viteConfig from '../../../vite.config.js?raw';

const MAKERS = Object.keys(MAKER_LINKS) as Maker[];

describe('the makers as links', () => {
  it('each link opens its maker, on a template in that maker’s mode', () => {
    for (const maker of MAKERS) {
      expect(makerOfLink(MAKER_LINKS[maker])).toBe(maker);
      const template = makerTemplate(maker, MEME_TEMPLATES);
      expect(template).toBeTruthy();
      expect(editorModeOf(template)).toBe(maker);
      expect(linkOfTemplate(template)).toBe(MAKER_LINKS[maker]);
    }
  });

  it('anything else is no maker, and the full editor has no link', () => {
    expect(makerOfLink('')).toBeNull();
    expect(makerOfLink('#/nope')).toBeNull();
    expect(linkOfTemplate(MEME_TEMPLATES[5])).toBe('');
    expect(linkOfTemplate({ editorMode: 'full' })).toBe('');
    expect(linkOfTemplate(null)).toBe('');
  });

  it('AI Meme starts on a meme an AI caption suits, with the prompt; Social Card on a card', () => {
    const ai = makerTemplate('ai', MEME_TEMPLATES, 'mondays') as Record<string, unknown> | null;
    expect(ai).toMatchObject({ aiPrompt: 'mondays' });
    expect(ai?.category).not.toBe('social');
    expect(ai?.demotivational).toBeFalsy();
    expect(String(makerTemplate('social', MEME_TEMPLATES)?.id)).toMatch(/whatsapp|tweet/);
    expect(makerTemplate('ai', [])).toBeNull();
  });

  it('the home-screen shortcuts open every maker', () => {
    for (const maker of MAKERS) expect(viteConfig).toContain(`url: './${MAKER_LINKS[maker]}'`);
  });
});
