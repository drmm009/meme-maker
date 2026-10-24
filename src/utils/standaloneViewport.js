// iOS home-screen apps with the black-translucent status bar draw from the top of the screen but
// report a viewport shorter by the status bar's height, so position: fixed; inset: 0 stops short
// and leaves an empty band at the bottom. There, --app-height is the real screen height, which
// full-screen layouts use; everywhere else it stays unset.

const isIosStandalone = () => typeof navigator !== 'undefined' && navigator.standalone === true;

// The height a full-screen app really has: the screen's long side upright, its short side sideways.
export const screenHeight = (screenW, screenH, landscape) =>
  landscape ? Math.min(screenW, screenH) : Math.max(screenW, screenH);

// The height to force, or null when the reported viewport already covers the screen.
export const appHeightFix = ({ standalone, innerWidth, innerHeight, screenW, screenH }) => {
  if (!standalone) return null;
  const full = screenHeight(screenW, screenH, innerWidth > innerHeight);
  return innerHeight < full - 1 ? full : null;
};

export function watchStandaloneViewport() {
  if (typeof window === 'undefined' || !isIosStandalone()) return;
  const apply = () => {
    const h = appHeightFix({
      standalone: true,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      screenW: window.screen.width,
      screenH: window.screen.height,
    });
    if (h) document.documentElement.style.setProperty('--app-height', `${h}px`);
    else document.documentElement.style.removeProperty('--app-height');
  };
  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', () => setTimeout(apply, 300));
}
