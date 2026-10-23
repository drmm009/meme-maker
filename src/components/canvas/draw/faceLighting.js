export const sampleFaceLighting = (ctx, cx, cy, radius) => {
  try {
    const r = Math.max(12, Math.round(radius * 0.75));
    const x = Math.max(0, Math.round(cx - r));
    const y = Math.max(0, Math.round(cy - r));
    const size = Math.min(r * 2, ctx.canvas.width - x, ctx.canvas.height - y);
    if (size <= 0) return { brightness: 100, warmth: 0 };

    const imgData = ctx.getImageData(x, y, size, size);
    const data = imgData.data;
    let totalR = 0, totalG = 0, totalB = 0, count = 0;

    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] > 128) {
        totalR += data[i];
        totalG += data[i + 1];
        totalB += data[i + 2];
        count++;
      }
    }

    if (count === 0) return { brightness: 100, warmth: 0 };
    const avgR = totalR / count;
    const avgG = totalG / count;
    const avgB = totalB / count;

    const lum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
    const brightness = Math.round(Math.min(135, Math.max(70, (lum / 128) * 100)));
    const redExcess = Math.max(0, avgR - avgB);
    const warmth = Math.min(35, Math.round((redExcess / 90) * 25));

    return { brightness, warmth, avgR, avgG, avgB };
  } catch  {
    return { brightness: 100, warmth: 0 };
  }
};
