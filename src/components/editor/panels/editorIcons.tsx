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

// Social Card: heart icon (social media like / heart icon matching Image 2)
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
      <path d="M 12 6 C 10.8 3.8 8.8 2.5 6.2 2.5 C 3.2 2.5 1.5 5 1.5 8.5 C 1.5 14.5 10 20 12 21.5 C 14 20 22.5 14.5 22.5 8.5 C 22.5 5 20.8 2.5 17.8 2.5 C 15.2 2.5 13.2 3.8 12 6 Z" />
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

// Bubbles: chat / speech bubble icon (classic clean speech bubble)
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
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
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
