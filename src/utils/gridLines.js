// Divider lines of a multi-panel layout, as [x1, y1, x2, y2], for a width x height canvas. The
// preview (GridOverlay) and the export (gridHelper) both draw these, so they always match.
// '1-panel', 'custom-grid' (drawn from its slots) and unknown layouts have none.
export const gridLines = (layoutId, width, height) => {
  switch (layoutId) {
    case '2-vert':
      return [[0, height / 2, width, height / 2]];
    case '3-stacked':
      return [[0, height / 3, width, height / 3], [0, 2 * height / 3, width, 2 * height / 3]];
    case '2-horiz':
      return [[width / 2, 0, width / 2, height]];
    case '3-horiz':
      return [[width / 3, 0, width / 3, height], [2 * width / 3, 0, 2 * width / 3, height]];
    case '4-grid':
      return [[0, height / 2, width, height / 2], [width / 2, 0, width / 2, height]];
    case '3-hybrid':
      return [[0, height / 2, width, height / 2], [width / 2, height / 2, width / 2, height]];
    default:
      return [];
  }
};
