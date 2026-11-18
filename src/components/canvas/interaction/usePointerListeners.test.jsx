// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import { isOverlayControl, usePointerListeners } from './usePointerListeners';

afterEach(cleanup);

// A canvas wrapper with a start card's button laid over it, as CanvasEditor's box.
function Canvas({ onDown }) {
  const wrapperRef = useRef(null);
  const editableRef = useRef(null);
  const off = useRef(false);
  usePointerListeners({
    wrapperRef, editableRef, isDragging: off, isDrawingActive: off, isViewGesture: off,
    handlePointerDown: onDown, handlePointerMove: () => {}, handlePointerEnd: () => {}, handleWheel: () => {},
  });
  return (
    <div ref={wrapperRef} data-testid="wrapper">
      <canvas data-testid="canvas" />
      <div className="ui-start-body"><button type="button" data-testid="btn"><span data-testid="label">Add a photo</span></button></div>
      <textarea ref={editableRef} data-testid="editable" />
    </div>
  );
}

const touch = (el) => {
  const e = new Event('touchstart', { bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
};

describe('usePointerListeners', () => {
  it('leaves a touch on a control over the canvas to the control, so its tap still clicks', () => {
    const onDown = vi.fn();
    const { getByTestId } = render(<Canvas onDown={onDown} />);
    const e = touch(getByTestId('label'));
    expect(e.defaultPrevented).toBe(false);
    expect(onDown).not.toHaveBeenCalled();
  });

  it('still takes a touch on the canvas itself (and blocks the page scroll)', () => {
    const onDown = vi.fn();
    const { getByTestId } = render(<Canvas onDown={onDown} />);
    const e = touch(getByTestId('canvas'));
    expect(e.defaultPrevented).toBe(true);
    expect(onDown).toHaveBeenCalledTimes(1);
  });

  it('counts buttons and inputs as controls, but not the caption text box', () => {
    const { getByTestId } = render(<Canvas onDown={() => {}} />);
    const editable = getByTestId('editable');
    expect(isOverlayControl(getByTestId('label'), editable)).toBe(true);
    expect(isOverlayControl(getByTestId('canvas'), editable)).toBe(false);
    expect(isOverlayControl(editable, editable)).toBe(false);
  });
});
