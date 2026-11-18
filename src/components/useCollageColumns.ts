// How many columns My Studio's collage has at the window's width (two on a phone, up to five on a
// wide screen), kept current as the window resizes. Saves are dealt across the columns in turn, so
// the newest sit along the top (MyGallery.jsx); the breakpoints match MyGallery.css.
import { useEffect, useState } from 'react';

export const collageColumns = (width: number): number => {
  if (width >= 1400) return 5;
  if (width >= 1000) return 4;
  if (width >= 720) return 3;
  return 2;
};

// Deals the items across `count` columns in turn: the first `count` items start each column.
export const dealColumns = <T,>(items: T[], count: number): T[][] => {
  const columns: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, i) => columns[i % count].push(item));
  return columns;
};

export default function useCollageColumns(): number {
  const [count, setCount] = useState(() => (typeof window === 'undefined' ? 2 : collageColumns(window.innerWidth)));
  useEffect(() => {
    const update = () => setCount(collageColumns(window.innerWidth));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return count;
}
