import { useEffect, useLayoutEffect, useRef } from 'react';

// Listeners React can't attach for us: non-passive touch listeners on the wrapper (so a drag or
// stroke can block page scroll) and window listeners so a drag keeps going outside the canvas.
// They are attached once and call the latest handlers through refs.
export function usePointerListeners({
  wrapperRef, editableRef, isDragging, isDrawingActive,
  handlePointerDown, handlePointerMove, handlePointerEnd
}) {
  const handlePointerDownRef = useRef(null);
  const handlePointerMoveRef = useRef(null);
  const handlePointerEndRef = useRef(null);

  useLayoutEffect(() => {
    handlePointerDownRef.current = handlePointerDown;
    handlePointerMoveRef.current = handlePointerMove;
    handlePointerEndRef.current = handlePointerEnd;
  });

  // Native non-passive touch listeners: handle drag & drawing AND block page scroll
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e) => {
      if (e.cancelable && e.target !== editableRef.current) {
        e.preventDefault();
      }
      if (handlePointerDownRef.current) handlePointerDownRef.current(e);
    };

    const onTouchMove = (e) => {
      if (e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }
      if ((isDragging.current || isDrawingActive.current) && handlePointerMoveRef.current) {
        handlePointerMoveRef.current(e);
      }
    };

    const onTouchEnd = (e) => {
      if (handlePointerEndRef.current) handlePointerEndRef.current(e);
    };

    wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
    wrapper.addEventListener('touchend', onTouchEnd, { passive: false });
    wrapper.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
      wrapper.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [wrapperRef, editableRef, isDragging, isDrawingActive]);

  // Global window listeners for mouse & touch drag so continuous dragging outside canvas never freezes
  useEffect(() => {
    const onGlobalPointerMove = (e) => {
      if ((isDragging.current || isDrawingActive.current) && handlePointerMoveRef.current) {
        if (!wrapperRef.current || !wrapperRef.current.contains(e.target)) {
          handlePointerMoveRef.current(e);
        }
      }
    };
    const onGlobalPointerEnd = (e) => {
      if (isDragging.current || isDrawingActive.current) {
        if (handlePointerEndRef.current) handlePointerEndRef.current(e);
      }
    };

    window.addEventListener('mousemove', onGlobalPointerMove);
    window.addEventListener('mouseup', onGlobalPointerEnd);
    window.addEventListener('touchmove', onGlobalPointerMove, { passive: false });
    window.addEventListener('touchend', onGlobalPointerEnd);
    window.addEventListener('touchcancel', onGlobalPointerEnd);

    return () => {
      window.removeEventListener('mousemove', onGlobalPointerMove);
      window.removeEventListener('mouseup', onGlobalPointerEnd);
      window.removeEventListener('touchmove', onGlobalPointerMove);
      window.removeEventListener('touchend', onGlobalPointerEnd);
      window.removeEventListener('touchcancel', onGlobalPointerEnd);
    };
  }, [wrapperRef, isDragging, isDrawingActive]);
}
