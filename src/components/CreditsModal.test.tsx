// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CreditsModal from './CreditsModal';
import { CREDIT_GROUPS } from '../data/credits';

afterEach(cleanup);

describe('CreditsModal', () => {
  it('lists every credit with its licence and a link, and closes', () => {
    const onClose = vi.fn();
    render(<CreditsModal onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Credits & licences' })).toBeTruthy();
    const items = CREDIT_GROUPS.flatMap((g) => g.items);
    expect(screen.getAllByRole('link')).toHaveLength(items.length);
    expect(screen.getByRole('link', { name: /Fluent Emoji/ }).getAttribute('href')).toBe('https://github.com/microsoft/fluentui-emoji');
    expect(screen.getByText('AGPL-3.0')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('credits the packs and services the app loads', () => {
    const names = CREDIT_GROUPS.flatMap((g) => g.items.map((i) => i.name));
    for (const n of ['Fluent Emoji', 'Emojibase', 'GIPHY', 'memegen.link', 'Imgflip', 'ffmpeg.wasm']) expect(names).toContain(n);
    expect(new Set(names).size).toBe(names.length);
  });
});
