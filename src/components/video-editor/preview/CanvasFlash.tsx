import { useEffect, useState } from 'react';
import { Snowflake, ZoomIn } from 'lucide-react';
import { onFlash } from './flashBus';
import type { Flash } from './flashBus';

type Shown = Flash & { key: number };

const LASTS_MS = { freeze: 1300, punch: 900 };

// A moment's feedback over the preview (see flashBus.ts), inside the stage's wrapper, which it
// punches for a zoom punch.
export default function CanvasFlash() {
  const [shown, setShown] = useState<Shown | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (flash: Flash) => {
      clearTimeout(timer);
      setShown({ ...flash, key: Date.now() });
      if (flash.kind === 'punch') {
        const wrapper = document.getElementById('stage-sink-wrapper');
        wrapper?.classList.remove('vt-punching');
        // Read layout so the animation starts again when it was already running.
        void wrapper?.offsetWidth;
        wrapper?.classList.add('vt-punching');
      }
      timer = setTimeout(() => setShown(null), LASTS_MS[flash.kind]);
    };
    const stop = onFlash(show);
    return () => {
      stop();
      clearTimeout(timer);
    };
  }, []);
  if (!shown) return null;
  return (
    <div key={shown.key} className={`vt-flash is-${shown.kind}`} aria-hidden="true">
      {shown.kind === 'freeze' && (
        <>
          <img className="vt-flash-still" src={shown.url} alt="" />
          <span className="vt-flash-light" />
        </>
      )}
      {shown.kind === 'punch' && <span className="vt-flash-ring" />}
      <span className="vt-flash-pill">
        {shown.kind === 'freeze' ? <Snowflake size={15} strokeWidth={2.4} /> : <ZoomIn size={15} strokeWidth={2.4} />}
        {shown.kind === 'freeze' ? 'Frame frozen' : 'Zoom punch'}
      </span>
    </div>
  );
}
