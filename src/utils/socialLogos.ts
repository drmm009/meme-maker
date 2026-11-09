// The built-in watermark logos (Instagram, Facebook, X) as SVG pictures in a colour, the same marks
// the image editor's watermark offers.
export type SocialLogo = 'instagram' | 'facebook' | 'x';

export const SOCIAL_LOGOS: { id: SocialLogo; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'x', label: 'X' },
];

// Each mark's SVG body (24-unit box), stroked or filled with `c`.
const BODIES: Record<SocialLogo, (c: string) => string> = {
  instagram: (c) => `<g fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></g>`,
  facebook: (c) => `<path fill="${c}" d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>`,
  x: (c) => `<path fill="${c}" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>`,
};

export const socialLogoSvg = (logo: SocialLogo, color = '#ffffff'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">${BODIES[logo](color)}</svg>`;

// As a picture's URL.
export const socialLogoUrl = (logo: SocialLogo, color = '#ffffff'): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(socialLogoSvg(logo, color))}`;

export const isSocialLogo = (v: unknown): v is SocialLogo => v === 'instagram' || v === 'facebook' || v === 'x';
