import React from 'react';
import { Rect, Line } from 'react-konva';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { gridLines } from '../../../utils/gridLines';

// The multi-panel layout's divider lines (the export draws the same ones). A custom grid outlines
// each of its panels instead.
const GridOverlay = ({ layoutId, width, height }) => {
  const layoutSlots = useEditorStore((state) => state.layoutSlots);

  if (!layoutId || layoutId === '1-panel') return null;

  if (layoutId === 'custom-grid') {
    return (
      <React.Fragment>
        {layoutSlots.map((slot, i) => (
          <Rect key={i} x={slot.x} y={slot.y} width={slot.width} height={slot.height} stroke="#000000" strokeWidth={4} listening={false} />
        ))}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {gridLines(layoutId, width, height).map((points, i) => (
        <Line key={i} points={points} stroke="#000000" strokeWidth={4} listening={false} />
      ))}
    </React.Fragment>
  );
};

export default GridOverlay;
