// An iOS segmented control (pages/iosLook.css): tabs in one track, with a black key that slides
// under the picked one and grows into place when the control comes into view (useSlidingKey). The
// key is measured, since each segment is as wide as its words.
import { useRef } from 'react';
import useSlidingKey from './useSlidingKey';
import './iosLook.css';

export interface Segment {
  id: string;
  label: string;
  // Shown after the label, quieter (how many there are of this kind).
  count?: number;
}

interface SegmentedControlProps {
  // What the tabs choose between, for screen readers.
  label: string;
  segments: Segment[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function SegmentedControl({ label, segments, value, onChange, className = '' }: SegmentedControlProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Anything that changes a segment's width moves the key.
  const shape = segments.map((s) => `${s.label}${s.count ?? ''}`).join('|');
  useSlidingKey(trackRef, `${value}|${shape}`);

  return (
    <div className={`ios-segments ${className}`} role="tablist" aria-label={label} ref={trackRef}>
      <span className="ios-segments-key" aria-hidden="true" />
      {segments.map((s) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={value === s.id}
          className="ios-segment"
          onClick={(e) => {
            onChange(s.id);
            e.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
          }}
        >
          {s.label}
          {s.count !== undefined && <span className="ios-segment-count">{s.count}</span>}
        </button>
      ))}
    </div>
  );
}
