// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import EmojiSheet from './EmojiSheet';
import type { EditorActions } from './selection';

afterEach(cleanup);

describe('EmojiSheet', () => {
  it('shows Popular first, then every keyboard group, and searches all of them', async () => {
    const handleAddSticker = vi.fn();
    const onClose = vi.fn();
    render(<EmojiSheet actions={{ handleAddSticker } as unknown as EditorActions} onClose={onClose} />);
    expect(screen.getByTitle('Laugh Cry')).toBeTruthy();
    expect((await screen.findAllByText('Food')).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Search emoji'), { target: { value: 'pizza' } });
    fireEvent.click(screen.getByTitle('Pizza'));
    expect(handleAddSticker).toHaveBeenCalledWith(expect.objectContaining({ emoji: '🍕' }));
    expect(onClose).toHaveBeenCalled();
  });
});
