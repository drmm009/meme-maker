import { isColorDark } from '../../../utils/captionLayout';

// The lines `text` is drawn in at `maxWidth`: explicit line breaks, then words moved down when a
// line is full (the space at a break dropped, runs of spaces kept as one) and a word longer than
// a line broken across lines. Each line keeps where its characters came from in `text` (`map[i]`
// is the index of its i-th character; `start`/`end` the first character and just past the last),
// so a cursor in `text` can be found on the drawn lines (caretInLines).
export const wrapTextLines = (ctx, text, maxWidth) => {
  if (!text) return [];
  const lines = [];
  const fits = (str) => ctx.measureText(str).width <= maxWidth;
  const range = (from, length) => Array.from({ length }, (_, i) => from + i);
  let base = 0;

  for (const eLine of text.split('\n')) {
    let cur = null;
    let pos = base;
    for (const w of eLine.split(' ')) {
      let word = w;
      let at = pos;
      pos += w.length + 1;

      // Force break word if it's longer than maxWidth
      while (ctx.measureText(word).width > maxWidth && word.length > 0) {
        let splitIndex = 1;
        while (splitIndex <= word.length && fits(word.substring(0, splitIndex))) {
          splitIndex++;
        }
        splitIndex--;
        if (splitIndex === 0) splitIndex = 1;

        if (cur) {
          lines.push(cur);
          cur = null;
        }
        lines.push({ text: word.substring(0, splitIndex), start: at, end: at + splitIndex, map: range(at, splitIndex) });
        word = word.substring(splitIndex);
        at += splitIndex;
      }

      if (word === '') continue;

      if (cur && fits(cur.text + ' ' + word)) {
        // The space before the word (the last of a run of them) joins it to the line.
        cur = { text: cur.text + ' ' + word, start: cur.start, end: at + word.length, map: [...cur.map, at - 1, ...range(at, word.length)] };
      } else if (!cur && fits(word)) {
        cur = { text: word, start: at, end: at + word.length, map: range(at, word.length) };
      } else {
        lines.push(cur || { text: '', start: at, end: at, map: [] });
        cur = { text: word, start: at, end: at + word.length, map: range(at, word.length) };
      }
    }
    if (cur) lines.push(cur);
    base += eLine.length + 1;
  }

  if (lines.length === 0) return [{ text: '', start: 0, end: 0, map: [] }];
  return lines;
};

export const wrapText = (ctx, text, maxWidth) => wrapTextLines(ctx, text, maxWidth).map((line) => line.text);

export const drawRoundRect = (ctx, x, y, width, height, radius) => {
  if (width <= 0 || height <= 0) return;
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  ctx.fill();
};

export const getCurveSagitta = (width, curve) => {
  if (!curve || Math.abs(curve) < 1) return 0;
  const clamped = Math.max(-100, Math.min(100, Math.abs(curve)));
  const spanRad = (clamped / 100) * (Math.PI * 0.72);
  const R = Math.max(10, width / spanRad);
  return R * (1 - Math.cos(spanRad / 2));
};

export const drawTextLineWithEffect = (ctx, line, textAnchorX, ly, fontSize, shouldStroke, strokeColor, strokeWidth, textColor, effect) => {
  ctx.save();
  const eff = effect || 'flat';

  if (eff === 'shadow') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.max(2, Math.round(fontSize * 0.08));
    ctx.shadowOffsetX = Math.max(3, Math.round(fontSize * 0.07));
    ctx.shadowOffsetY = Math.max(3, Math.round(fontSize * 0.07));
  } else if (eff === 'glow') {
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = Math.max(12, Math.round(fontSize * 0.35));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  } else if (eff === 'glitch') {
    const gOff = Math.max(2, Math.round(fontSize * 0.05));
    ctx.fillStyle = '#ff0055';
    ctx.fillText(line, textAnchorX - gOff, ly);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(line, textAnchorX + gOff, ly);
  } else if (eff === '3d') {
    const depth = Math.max(3, Math.min(6, Math.round(fontSize * 0.07)));
    const isLightText = !isColorDark(textColor);
    for (let s = depth; s >= 1; s--) {
      ctx.fillStyle = s === depth ? '#000000' : (isLightText ? '#ea580c' : '#0284c7');
      ctx.fillText(line, textAnchorX + s * 1.5, ly + s * 1.5);
    }
  }

  if (eff === 'hollow') {
    const hollowStrokeColor = strokeColor && strokeColor !== 'transparent'
      ? strokeColor
      : (textColor && textColor !== 'transparent' ? textColor : '#ffffff');
    ctx.strokeStyle = hollowStrokeColor;
    ctx.lineWidth = strokeWidth || Math.max(3, Math.round(fontSize * 0.07));
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    ctx.strokeText(line, textAnchorX, ly);
  } else {
    if (shouldStroke) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth || Math.max(3, fontSize / 7);
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.setLineDash([]);
      ctx.strokeText(line, textAnchorX, ly);
    }
    ctx.fillStyle = textColor;
    ctx.fillText(line, textAnchorX, ly);

    if (eff === 'glow') {
      ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.12));
      ctx.fillText(line, textAnchorX, ly);
    }
  }

  ctx.restore();
};

export const drawCurvedText = (ctx, line, curve, baseLy, textAnchorX, fontSize, shouldStroke, strokeColor, strokeWidth, textColor, effect) => {
  if (!line) return;
  const chars = Array.from(line);
  if (chars.length === 0) return;
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const totalW = widths.reduce((sum, w) => sum + w, 0);
  if (totalW <= 0) return;

  const clampedCurve = Math.max(-100, Math.min(100, curve));
  const curveSign = clampedCurve >= 0 ? 1 : -1;
  const absCurve = Math.abs(clampedCurve);
  const spanRad = (absCurve / 100) * (Math.PI * 0.72);
  const R = Math.max(10, totalW / spanRad);
  const sagitta = R * (1 - Math.cos(spanRad / 2));

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (shouldStroke) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth || Math.max(3, fontSize / 7);
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;
    ctx.setLineDash([]);
  }
  ctx.fillStyle = textColor;

  const eff = effect || 'flat';

  chars.forEach((ch, idx) => {
    let currentDist = 0;
    for (let j = 0; j < idx; j++) currentDist += widths[j];
    currentDist += widths[idx] / 2;
    const t = (currentDist / totalW) - 0.5;
    const phi = t * spanRad;
    const charX = textAnchorX + R * Math.sin(phi);
    const charY = baseLy + curveSign * (R * (1 - Math.cos(phi)) - sagitta / 2);
    const charRot = curveSign * phi;

    ctx.save();
    ctx.translate(charX, charY);
    ctx.rotate(charRot);

    if (eff === 'shadow') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = Math.max(2, Math.round(fontSize * 0.08));
      ctx.shadowOffsetX = Math.max(3, Math.round(fontSize * 0.07));
      ctx.shadowOffsetY = Math.max(3, Math.round(fontSize * 0.07));
    } else if (eff === 'glow') {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = Math.max(12, Math.round(fontSize * 0.35));
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else if (eff === 'glitch') {
      const gOff = Math.max(2, Math.round(fontSize * 0.05));
      ctx.fillStyle = '#ff0055';
      ctx.fillText(ch, -gOff, 0);
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(ch, gOff, 0);
    } else if (eff === '3d') {
      const depth = Math.max(3, Math.min(6, Math.round(fontSize * 0.07)));
      const isLightText = !isColorDark(textColor);
      for (let s = depth; s >= 1; s--) {
        ctx.fillStyle = s === depth ? '#000000' : (isLightText ? '#ea580c' : '#0284c7');
        ctx.fillText(ch, s * 1.5, s * 1.5);
      }
    }

    if (eff === 'hollow') {
      const hollowStrokeColor = strokeColor && strokeColor !== 'transparent'
        ? strokeColor
        : (textColor && textColor !== 'transparent' ? textColor : '#ffffff');
      ctx.strokeStyle = hollowStrokeColor;
      ctx.lineWidth = strokeWidth || Math.max(3, Math.round(fontSize * 0.07));
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      ctx.strokeText(ch, 0, 0);
    } else {
      if (shouldStroke) {
        ctx.strokeText(ch, 0, 0);
      }
      ctx.fillStyle = textColor;
      ctx.fillText(ch, 0, 0);

      if (eff === 'glow') {
        ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.12));
        ctx.fillText(ch, 0, 0);
      }
    }

    ctx.restore();
  });
  ctx.restore();
};
