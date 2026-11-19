// Whether two CSS colours are the same colour, however each is written: #fff, #FFFFFF, #ffffffff,
// rgb(255, 255, 255), rgba(255,255,255,1) and white all match, as do two identical names. Anything
// else it can't read (a gradient object) never matches. Used so text is never outlined in its own colour.

const NAMED: Record<string, string> = {
  white: '#ffffffff', black: '#000000ff', red: '#ff0000ff', green: '#008000ff', blue: '#0000ffff',
  yellow: '#ffff00ff', orange: '#ffa500ff', purple: '#800080ff', pink: '#ffc0cbff', gray: '#808080ff',
  grey: '#808080ff', transparent: '#00000000',
};

const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

// A colour as #rrggbbaa, or null if it can't be read.
export function normalizeColor(color: unknown): string | null {
  if (typeof color !== 'string') return null;
  const c = color.trim().toLowerCase();
  if (NAMED[c]) return NAMED[c];
  const hex = c.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    const h = hex[1];
    if (h.length === 3 || h.length === 4) {
      const full = h.split('').map((d) => d + d).join('');
      return `#${full.length === 6 ? `${full}ff` : full}`;
    }
    if (h.length === 6) return `#${h}ff`;
    if (h.length === 8) return `#${h}`;
    return null;
  }
  const rgb = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (rgb) {
    const a = rgb[4] === undefined ? 1 : Number(rgb[4]);
    return `#${hex2(Number(rgb[1]))}${hex2(Number(rgb[2]))}${hex2(Number(rgb[3]))}${hex2(a * 255)}`;
  }
  return null;
}

export function sameColor(a: unknown, b: unknown): boolean {
  if (typeof a === 'string' && typeof b === 'string' && a.trim() && a.trim().toLowerCase() === b.trim().toLowerCase()) return true;
  const x = normalizeColor(a);
  return x !== null && x === normalizeColor(b);
}
