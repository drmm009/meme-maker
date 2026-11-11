// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { useCaretIndex } from './useCaretIndex';

// A controlled text box, as the image editor's caption box, showing where the cursor is.
function Box({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('HELLO');
  const index = useCaretIndex(ref, active);
  return (
    <>
      <textarea aria-label="text" ref={ref} value={text} onChange={(e) => setText(e.target.value)} />
      <output>{index === null ? 'none' : index}</output>
    </>
  );
}

afterEach(cleanup);

const settle = () => act(() => new Promise((r) => setTimeout(r, 5)));

describe('useCaretIndex', () => {
  it('follows the cursor while the box is focused, and lets go on blur', async () => {
    render(<Box />);
    const box = screen.getByLabelText('text') as HTMLTextAreaElement;
    expect(screen.getByRole('status').textContent).toBe('none');
    act(() => box.focus());
    box.setSelectionRange(2, 2);
    fireEvent.select(box);
    await settle();
    expect(screen.getByRole('status').textContent).toBe('2');
    act(() => box.blur());
    await settle();
    expect(screen.getByRole('status').textContent).toBe('none');
  });

  // (jsdom doesn't reproduce the browser's lost letter, which reading inside the box's input event
  // caused; this keeps typing covered.)
  it('keeps a letter typed into a controlled box', async () => {
    render(<Box />);
    const box = screen.getByLabelText('text') as HTMLTextAreaElement;
    act(() => box.focus());
    fireEvent.input(box, { target: { value: 'HELLO!' } });
    await settle();
    expect(box.value).toBe('HELLO!');
  });

  it('shows nothing while inactive', async () => {
    render(<Box active={false} />);
    act(() => (screen.getByLabelText('text') as HTMLTextAreaElement).focus());
    await settle();
    expect(screen.getByRole('status').textContent).toBe('none');
  });
});
