// Light or dark ink for a canvas colour, so the prompt reads on any background.
export function inkFor(color: string | undefined): 'dark' | 'light' {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color?.trim() ?? '')?.[1];
  if (!hex) return 'light';
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? 'dark' : 'light';
}
