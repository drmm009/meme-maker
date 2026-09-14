export const generateGridImage = (layoutId, width, height) => {
  if (!layoutId || layoutId === '1-panel') return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.beginPath();
  
  if (layoutId === '2-vert') {
     ctx.moveTo(0, height / 2);
     ctx.lineTo(width, height / 2);
  } else if (layoutId === '3-stacked') {
     ctx.moveTo(0, height / 3);
     ctx.lineTo(width, height / 3);
     ctx.moveTo(0, 2 * height / 3);
     ctx.lineTo(width, 2 * height / 3);
  } else if (layoutId === '2-horiz') {
     ctx.moveTo(width / 2, 0);
     ctx.lineTo(width / 2, height);
  } else if (layoutId === '3-horiz') {
     ctx.moveTo(width / 3, 0);
     ctx.lineTo(width / 3, height);
     ctx.moveTo(2 * width / 3, 0);
     ctx.lineTo(2 * width / 3, height);
  } else if (layoutId === '4-grid') {
     ctx.moveTo(0, height / 2);
     ctx.lineTo(width, height / 2);
     ctx.moveTo(width / 2, 0);
     ctx.lineTo(width / 2, height);
  } else if (layoutId === '3-hybrid') {
     ctx.moveTo(0, height / 2);
     ctx.lineTo(width, height / 2);
     ctx.moveTo(width / 2, height / 2);
     ctx.lineTo(width / 2, height);
  }
  
  ctx.stroke();
  return canvas.toDataURL('image/png');
};
