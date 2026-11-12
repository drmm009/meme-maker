// Dev-only harness: snapshot the computed styles of the editor's bottom panels (dock, strips,
// layer toolbar, every sheet) so a CSS refactor can be checked for unintended changes.
const PROPS = [
  'display', 'position', 'box-sizing', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'background-color', 'background-image', 'color', 'opacity', 'box-shadow', 'outline-style', 'outline-color',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'text-align',
  'white-space', 'text-overflow', 'overflow-x', 'overflow-y',
  'flex-direction', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-wrap', 'align-items', 'justify-content',
  'gap', 'row-gap', 'column-gap', 'grid-template-columns', 'grid-template-rows', 'order',
  'transform', 'filter', 'backdrop-filter', 'cursor', 'visibility', 'z-index', 'top', 'left', 'right', 'bottom',
  'fill', 'stroke', 'stroke-width', 'object-fit', 'aspect-ratio', 'scrollbar-width', 'appearance',
];
const PSEUDO = ['::before', '::after', '::placeholder'];
const PSEUDO_PROPS = ['content', 'display', 'width', 'height', 'background-color', 'background-image', 'color', 'border-top-left-radius', 'transform', 'box-shadow', 'opacity', 'top', 'left'];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function keyOf(el, root) {
  const parts = [];
  for (let n = el; n && n !== root.parentElement; n = n.parentElement) {
    const i = n.parentElement ? [...n.parentElement.children].indexOf(n) : 0;
    parts.unshift(`${n.tagName.toLowerCase()}${n.classList.length ? '.' + [...n.classList].filter((c) => !c.startsWith('lucide')).sort().join('.') : ''}:${i}`);
  }
  return parts.join('>');
}

function grab(root) {
  const out = {};
  const els = [root, ...root.querySelectorAll('*')];
  for (const el of els) {
    const cs = getComputedStyle(el);
    const k = keyOf(el, root);
    out[k] = PROPS.map((p) => cs.getPropertyValue(p)).join('|');
    for (const ps of PSEUDO) {
      const pc = getComputedStyle(el, ps);
      const content = pc.getPropertyValue('content');
      if (ps !== '::placeholder' && (content === 'none' || content === 'normal')) continue;
      if (ps === '::placeholder' && !(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) continue;
      out[k + ps] = PSEUDO_PROPS.map((p) => pc.getPropertyValue(p)).join('|');
    }
  }
  return out;
}

function grabAll() {
  const roots = [...document.querySelectorAll('.ie-panels, .ui-sheet, [role="dialog"]')].filter((r) => !r.parentElement.closest('.ie-panels, .ui-sheet, [role="dialog"]'));
  const out = {};
  roots.forEach((r, i) => Object.assign(out, Object.fromEntries(Object.entries(grab(r)).map(([k, v]) => [`R${i}/${k}`, v]))));
  return out;
}

// The editor's two zustand stores, from the context providers above the panels.
async function stores() {
  const el = document.querySelector('.ie-panels');
  const fk = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  let ui = null, doc = null;
  for (let f = el[fk]; f; f = f.return) {
    const v = f.memoizedProps && f.memoizedProps.value;
    if (v && typeof v.getState === 'function') {
      const s = v.getState();
      if (!ui && 'openSheet' in s) ui = v;
      if (!doc && 'captions' in s) doc = v;
    }
  }
  return { ui, doc };
}

const SHEETS = ['text', 'media', 'draw', 'canvasColor', 'size', 'watermark', 'bands', 'aiCaption', 'filters', 'background', 'layers', 'export', 'library', 'mediaLink',
  'templates', 'stickers', 'emoji', 'bubble', 'socialCard'];
const TABS = ['text', 'media', 'fx', 'draw', 'canvas'];

// Every style rule of the page's CSS files, with its file, selector (states stripped so a :hover
// rule counts where its element is) and whether it uses !important.
function allRules() {
  const out = [];
  const walk = (rules, file, media) => {
    for (const r of rules) {
      if (r.cssRules && !r.selectorText) walk(r.cssRules, file, r.conditionText || media);
      else if (r.selectorText) {
        const loose = r.selectorText
          .replace(/::?(before|after|placeholder|-webkit-[a-z-]+|-moz-[a-z-]+)/g, '')
          .replace(/:(hover|focus|focus-visible|focus-within|active|disabled|checked|visited)/g, '')
          .replace(/:not\(\s*\)/g, '');
        out.push({ file, sel: r.selectorText, loose, media, imp: /!important/.test(r.cssText), n: 0, views: new Set() });
      }
    }
  };
  for (const s of document.querySelectorAll('style[data-vite-dev-id]')) {
    const file = s.getAttribute('data-vite-dev-id').replace(/.*\/src\//, 'src/');
    if (s.sheet) walk(s.sheet.cssRules, file, null);
  }
  return out;
}

function tally(rules, view) {
  const roots = [...document.querySelectorAll('.ie-panels, .ui-sheet, [role="dialog"]')];
  for (const r of rules) {
    let n = 0;
    for (const root of roots) {
      try { n += root.querySelectorAll(r.loose).length + (root.matches(r.loose) ? 1 : 0); } catch { /* selector the browser can't test */ }
    }
    if (n) { r.n += n; r.views.add(view); }
  }
}

// Which rules reach the editor's panels across the same views as snapshot().
export async function analyse() {
  const rules = allRules();
  await snapshot((view) => tally(rules, view));
  return rules.map((r) => ({ ...r, views: [...r.views] }));
}

// One pass over the full editor: each dock tab's strip, each sheet, then a caption's Font/Style/Color.
export async function snapshot(onView = null) {
  const take = (view) => (onView ? (onView(view), {}) : grabAll());
  const { ui, doc } = await stores();
  const snap = {};
  ui.getState().closeSheet();
  doc.setState({ activeLayerId: null });
  await wait(300);
  for (const t of TABS) {
    ui.getState().showDockTab(t);
    await wait(350);
    snap[`tab:${t}`] = take(`tab:${t}`);
  }
  for (const s of SHEETS) {
    try {
      ui.getState().openSheet(s);
      await wait(700);
      snap[`sheet:${s}`] = take(`sheet:${s}`);
    } catch (e) { snap[`sheet:${s}`] = { error: String(e) }; }
    ui.getState().closeSheet();
    await wait(250);
  }
  // A caption selected: its toolbar and the sheets it opens.
  const cap = doc.getState().captions[0];
  if (cap) {
    doc.setState({ activeLayerId: cap.id });
    await wait(400);
    snap['layer:toolbar'] = take('layer:toolbar');
    for (const part of ['font', 'style', 'color']) {
      ui.getState().openSheet('text', part, true);
      await wait(600);
      snap[`layer:${part}`] = take(`layer:${part}`);
      ui.getState().closeSheet();
      await wait(250);
    }
    doc.setState({ activeLayerId: null });
  }
  // Drawing tools' settings.
  for (const tool of ['brush', 'shape', 'censor']) {
    ui.getState().pickDrawTool(tool);
    await wait(600);
    snap[`draw:${tool}`] = take(`draw:${tool}`);
    ui.getState().leaveDock();
    await wait(250);
  }
  // A sticker and a photo layer, each selected with the sheets its toolbar opens.
  const before = { stickers: doc.getState().stickers, imageLayers: doc.getState().imageLayers };
  doc.setState({ stickers: [...before.stickers, { id: 'snap-st', emoji: '😀', x: 0.5, y: 0.5, scale: 2.5, rotation: 0, zIndex: 50 }], activeLayerId: 'snap-st' });
  await wait(400);
  snap['sticker:toolbar'] = take('sticker:toolbar');
  for (const [s, f] of [['media', 'edit'], ['diecut', null]]) {
    ui.getState().openSheet(s, f, true);
    await wait(600);
    snap[`sticker:${s}`] = take(`sticker:${s}`);
    ui.getState().closeSheet();
    await wait(250);
  }
  doc.setState({ stickers: before.stickers, imageLayers: [...before.imageLayers, { id: 'snap-img', url: './images/drake-pointing.jpg', x: 0.5, y: 0.5, scale: 1 }], activeLayerId: 'snap-img' });
  await wait(500);
  snap['image:toolbar'] = take('image:toolbar');
  for (const s of ['media', 'background', 'filters']) {
    ui.getState().openSheet(s, null, true);
    await wait(600);
    snap[`image:${s}`] = take(`image:${s}`);
    ui.getState().closeSheet();
    await wait(250);
  }
  doc.setState({ imageLayers: before.imageLayers, activeLayerId: null });
  ui.getState().closeSheet();
  return snap;
}

const DB = 'css-snap';
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('s');
    r.onsuccess = () => res(r.result);
    r.onerror = rej;
  });
}
export async function save(name, data) {
  const d = await db();
  await new Promise((res, rej) => { const tx = d.transaction('s', 'readwrite'); tx.objectStore('s').put(data, name); tx.oncomplete = res; tx.onerror = rej; });
  d.close();
}
export async function load(name) {
  const d = await db();
  const v = await new Promise((res, rej) => { const r = d.transaction('s').objectStore('s').get(name); r.onsuccess = () => res(r.result); r.onerror = rej; });
  d.close();
  return v;
}

// Differences between two snapshots, ignoring keys listed as noisy (they differ between two
// identical runs, e.g. thumbnails still loading).
export function diff(a, b, noise = new Set()) {
  const out = [];
  for (const view of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[view] || {}, y = b[view] || {};
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (noise.has(`${view}#${k}`)) continue;
      if (x[k] === y[k]) continue;
      const props = k.includes('::') ? PSEUDO_PROPS : PROPS;
      const xs = (x[k] || '').split('|'), ys = (y[k] || '').split('|');
      const changed = x[k] && y[k] ? props.map((p, i) => xs[i] !== ys[i] ? `${p}: ${xs[i]} -> ${ys[i]}` : null).filter(Boolean) : [x[k] ? 'removed' : 'added'];
      out.push({ view, k, changed });
    }
  }
  return out;
}
export function noiseOf(a, b) {
  return new Set(diff(a, b).map((d) => `${d.view}#${d.k}`));
}
