import { useId } from 'react';

// Custom crafted icons for editor toolstrips and toolbars

// Header & Footer bands on a portrait meme canvas (outer rectangular frame with top & bottom band bars)
export function HeaderFooterIcon({ size = 19, strokeWidth = 2.1 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      aria-hidden="true"
    >
      <rect x="4.5" y="2" width="15" height="20" rx="0.5" />
      <line x1="6.2" y1="5.2" x2="17.8" y2="5.2" strokeWidth={strokeWidth * 1.05} />
      <line x1="6.2" y1="18.8" x2="17.8" y2="18.8" strokeWidth={strokeWidth * 1.05} />
    </svg>
  );
}

// Social Card: a rounded "like" heart
export function SocialCardIcon({ size = 19, strokeWidth = 2.1 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.5C8.6 18 3 14.1 3 9a4.6 4.6 0 0 1 4.6-4.6c1.9 0 3.4.9 4.4 2.5 1-1.6 2.5-2.5 4.4-2.5A4.6 4.6 0 0 1 21 9c0 5.1-5.6 9-9 11.5Z" />
    </svg>
  );
}

// AI Caption: rounded frame with open corner and dual sparkle stars
export function AiCaptionIcon({ size = 19, strokeWidth = 2.1 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M 11 3 H 6 a 3 3 0 0 0 -3 3 v 12 a 3 3 0 0 0 3 3 h 12 a 3 3 0 0 0 3 -3 v -5" />
      <path
        d="M 17 1.5 Q 18.575 4.75 21.5 6.5 Q 18.575 8.25 17 11.5 Q 15.425 8.25 12.5 6.5 Q 15.425 4.75 17 1.5 Z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M 10 9.3 Q 10.98 11.38 12.8 12.5 Q 10.98 13.62 10 15.7 Q 9.02 13.62 7.2 12.5 Q 9.02 11.38 10 9.3 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

// Background: photo editing leaf (Snapseed style: leaf with central spine and diagonal right ribs)
export function BackgroundIcon({ size = 19, strokeWidth = 2.1 }: { size?: number; strokeWidth?: number }) {
  const rawId = useId();
  const clipId = `leaf-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M 12 2 C 7 5.5 3 10 3 15.5 C 3 19.5 7 22 12 22 C 17 22 21 19.5 21 15.5 C 21 10 17 5.5 12 2 Z" />
        </clipPath>
      </defs>
      <path d="M 12 2 C 7 5.5 3 10 3 15.5 C 3 19.5 7 22 12 22 C 17 22 21 19.5 21 15.5 C 21 10 17 5.5 12 2 Z" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <g clipPath={`url(#${clipId})`}>
        <line x1="12" y1="6.5" x2="22" y2="2.5" />
        <line x1="12" y1="10.5" x2="22" y2="6.5" />
        <line x1="12" y1="14.5" x2="22" y2="10.5" />
        <line x1="12" y1="18.5" x2="22" y2="14.5" />
      </g>
    </svg>
  );
}

// Bubbles: a rounded chat bubble with a tail and three typing dots
export function BubbleIcon({ size = 19, strokeWidth = 2.1 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 17h5a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4h1v3.5Z" />
      <circle cx="8" cy="10.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Three overlapping circles (Venn diagram / RGB color filters)
export function FiltersIcon({ size = 19, strokeWidth = 2.1 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="6" />
      <circle cx="8" cy="15" r="6" />
      <circle cx="16" cy="15" r="6" />
    </svg>
  );
}
