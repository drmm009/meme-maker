export function getImageArea({
  canvasH, canvasW, demotivational, headerExtH
}) {
  // Available image area (below header extension if active)
  let imageAreaX = 0;

  let imageAreaY = headerExtH;

  let imageAreaW = canvasW;

  let imageAreaH = canvasH;

  if (demotivational?.enabled) {
    const sidePad = Math.round(canvasW * 0.08);
    const topPad = Math.round(canvasH * 0.08);
    const botPad = Math.max(160, Math.round(canvasH * 0.28));
    imageAreaX = sidePad;
    imageAreaY = headerExtH + topPad;
    imageAreaW = canvasW - sidePad * 2;
    imageAreaH = canvasH - topPad - botPad;
  }

  return { imageAreaX, imageAreaY, imageAreaW, imageAreaH };
}
