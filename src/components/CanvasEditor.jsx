import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { getFilterCss, drawImageFiltered } from '../data/photoFilters';
import { isColorDark } from '../utils/captionLayout';

const wrapText = (ctx, text, maxWidth) => {
  if (!text) return [];
  const explicitLines = text.split('\n');
  const lines = [];

  for (const eLine of explicitLines) {
    let currentLine = '';
    const words = eLine.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      
      // Force break word if it's longer than maxWidth
      while (ctx.measureText(word).width > maxWidth && word.length > 0) {
        let splitIndex = 1;
        while (splitIndex <= word.length && ctx.measureText(word.substring(0, splitIndex)).width <= maxWidth) {
          splitIndex++;
        }
        splitIndex--;
        if (splitIndex === 0) splitIndex = 1; 
        
        const part = word.substring(0, splitIndex);
        if (currentLine !== '') {
          lines.push(currentLine);
          currentLine = '';
        }
        lines.push(part);
        word = word.substring(splitIndex);
      }
      
      if (word === '') continue;

      const testLine = currentLine === '' ? word : currentLine + ' ' + word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine !== '') {
      lines.push(currentLine);
    }
  }
  
  if (lines.length === 0) return [''];
  return lines;
};

const drawRoundRect = (ctx, x, y, width, height, radius) => {
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

const drawSpeechBubble = (ctx, x, y, width, height, style, fillColor = '#ffffff', strokeColor = '#000000', strokeWidth = 3) => {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const r = Math.min(18, width * 0.15, height * 0.25);
  const tailW = Math.min(22, width * 0.2);
  const tailH = Math.min(20, height * 0.35);

  ctx.beginPath();
  if (style === 'speech-left') {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r + tailW * 1.6, y + height);
    ctx.lineTo(x + r - 8, y + height + tailH);
    ctx.lineTo(x + r + 6, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'speech-right') {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + width - r - 6, y + height);
    ctx.lineTo(x + width - r + 8, y + height + tailH);
    ctx.lineTo(x + width - r - tailW * 1.6, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'thought') {
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + width * 0.25, y + height + 7, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + width * 0.18, y + height + 16, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (style === 'shout') {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;
    const pts = 14;
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const angle = (i * Math.PI) / pts;
      const dist = i % 2 === 0 ? 1.12 : 0.88;
      const px = cx + Math.cos(angle) * rx * dist;
      const py = cy + Math.sin(angle) * ry * dist;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'imessage-send') {
    ctx.fillStyle = fillColor || '#007aff';
    const r = Math.min(20, width * 0.25, height * 0.35);
    const tw = Math.max(14, Math.min(24, height * 0.25));
    const th = Math.max(20, Math.min(32, height * 0.38));
    const tb = Math.max(20, Math.min(32, height * 0.38));

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - th);
    // Beak flare to signature iPhone outgoing tail tip
    ctx.bezierCurveTo(x + width, y + height - th * 0.35, x + width + tw * 0.3, y + height + 3, x + width + tw, y + height + 3);
    // Underside curve from tail tip back into flat bottom edge
    ctx.bezierCurveTo(x + width + tw * 0.2, y + height + 3, x + width - tb * 0.3, y + height, x + width - tb, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
      ctx.stroke();
    }
  } else if (style === 'imessage-receive') {
    const isDark = isColorDark(fillColor);
    ctx.fillStyle = fillColor || (isDark ? '#262628' : '#e9e9eb');
    const r = Math.min(20, width * 0.25, height * 0.35);
    const tw = Math.max(14, Math.min(24, height * 0.25));
    const th = Math.max(20, Math.min(32, height * 0.38));
    const tb = Math.max(20, Math.min(32, height * 0.38));

    ctx.beginPath();
    ctx.moveTo(x + tb, y + height);
    // Underside curve to signature iPhone incoming tail tip
    ctx.bezierCurveTo(x + tb * 0.3, y + height, x - tw * 0.2, y + height + 3, x - tw, y + height + 3);
    // Inward flare back into left edge
    ctx.bezierCurveTo(x - tw * 0.3, y + height + 3, x, y + height - th * 0.35, x, y + height - th);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + tb, y + height);
    ctx.closePath();
    ctx.fill();
    if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
      ctx.stroke();
    }
  } else if (style === 'whatsapp-send') {
    ctx.fillStyle = fillColor || '#005c4b';
    const r = Math.min(10, width * 0.15, height * 0.25);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - 12);
    ctx.lineTo(x + width + 7, y + height);
    ctx.lineTo(x + width - 10, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
      ctx.stroke();
    }
  } else if (style === 'whatsapp-receive') {
    const isDark = isColorDark(fillColor);
    ctx.fillStyle = fillColor || (isDark ? '#202c33' : '#ffffff');
    const r = Math.min(10, width * 0.15, height * 0.25);
    ctx.beginPath();
    ctx.moveTo(x + 10, y + height);
    ctx.lineTo(x - 7, y + height);
    ctx.lineTo(x, y + height - 12);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + 10, y + height);
    ctx.closePath();
    ctx.fill();
    if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
      ctx.stroke();
    }
  } else {
    drawRoundRect(ctx, x, y, width, height, r);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
};

const getCurveSagitta = (width, curve) => {
  if (!curve || Math.abs(curve) < 1) return 0;
  const clamped = Math.max(-100, Math.min(100, Math.abs(curve)));
  const spanRad = (clamped / 100) * (Math.PI * 0.72);
  const R = Math.max(10, width / spanRad);
  return R * (1 - Math.cos(spanRad / 2));
};

const drawTextLineWithEffect = (ctx, line, textAnchorX, ly, fontSize, shouldStroke, strokeColor, strokeWidth, textColor, effect) => {
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

const drawCurvedText = (ctx, line, curve, baseLy, textAnchorX, fontSize, shouldStroke, strokeColor, strokeWidth, textColor, effect) => {
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

const getBreakingNewsHeight = (cap) => {
  const topH = 26;
  const midH = Math.max(52, (cap.fontSize || 26) * 1.5);
  const botH = 22;
  return topH + midH + botH;
};

const drawBreakingNewsChyron = (ctx, barW, cap) => {
  ctx.save();
  const headline = cap.text || 'BREAKING NEWS HEADLINE';
  const channel = cap.newsChannel || 'MEME NEWS 24';
  const ticker = cap.newsTicker || 'DEVELOPING STORY: MORE DETAILS TO FOLLOW';

  const topH = 26;
  const midH = Math.max(52, (cap.fontSize || 26) * 1.5);
  const botH = 22;
  const totalH = topH + midH + botH;

  const startX = - barW / 2;
  const startY = - totalH / 2;

  // 1. Top strap: Red LIVE tag + Slate channel banner
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(startX, startY, 130, topH);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('● BREAKING', startX + 65, startY + topH / 2);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(startX + 130, startY, barW - 130, topH);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(channel.toUpperCase(), startX + barW - 14, startY + topH / 2);

  // 2. Middle banner: Headline on navy black
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(startX, startY + topH, barW, midH);
  ctx.fillStyle = '#facc15'; // Yellow accent bar
  ctx.fillRect(startX, startY + topH, 6, midH);

  ctx.fillStyle = cap.color || '#facc15';
  ctx.font = `900 ${cap.fontSize || 26}px "Arial Black", Impact, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(headline.toUpperCase(), startX + 16, startY + topH + midH / 2, barW - 32);

  // 3. Bottom ticker
  ctx.fillStyle = '#eab308';
  ctx.fillRect(startX, startY + topH + midH, barW, botH);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`LIVE  ▶  ${ticker.toUpperCase()}`, startX + 14, startY + topH + midH + botH / 2, barW - 28);

  ctx.restore();
};

// Path2D vector paths for tweet card icons matching the live preview modal
const createPath2D = (d) => (typeof window !== 'undefined' && window.Path2D) ? new window.Path2D(d) : (typeof Path2D !== 'undefined' ? new Path2D(d) : null);

const twitterStarBadgePath = createPath2D("M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z");
const twitterCheckPath = createPath2D("M10.53 16.28l-3.53-3.53 1.41-1.41 2.12 2.12 5.66-5.66 1.41 1.41-7.07 7.07z");
const tweetXLogoPath = createPath2D("M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z");
const tweetCommentPath = createPath2D("M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z");
const tweetRepeatPath = createPath2D("M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3");
const tweetHeartPath = createPath2D("M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z");
const tweetBookmarkPath = createPath2D("M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z");
const tweetSharePath = createPath2D("M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98");

// Instagram & iOS WhatsApp vector paths
const instagramSendPath = createPath2D("M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z");
const iosChevronPath = createPath2D("M15 18l-6-6 6-6");
const iosPhonePath = createPath2D("M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z");

export const socialCardImageCache = new Map();
const MAX_SOCIAL_IMAGE_CACHE = 50;

export const setSocialCardImage = (key, img) => {
  if (socialCardImageCache.size >= MAX_SOCIAL_IMAGE_CACHE) {
    const oldestKey = socialCardImageCache.keys().next().value;
    if (oldestKey) {
      const oldImg = socialCardImageCache.get(oldestKey);
      if (oldImg) {
        oldImg.onload = null;
        oldImg.onerror = null;
        oldImg.src = '';
      }
      socialCardImageCache.delete(oldestKey);
    }
  }
  socialCardImageCache.set(key, img);
};

export const parseLikesCount = (likesText) => {
  if (!likesText || typeof likesText !== 'string') return '';
  const trimmed = likesText.trim();
  if (/^[\d,.]+[kKmMbB]?$/.test(trimmed)) {
    return trimmed;
  }
  const matchAnd = trimmed.match(/and\s+([\d,.]+[kKmMbB]?)\s+others/i);
  if (matchAnd) return matchAnd[1];
  const matchOthers = trimmed.match(/by\s+([\d,.]+[kKmMbB]?)\s+others/i);
  if (matchOthers) return matchOthers[1];
  const matchLikes = trimmed.match(/([\d,.]+[kKmMbB]?)\s+likes/i);
  if (matchLikes) return matchLikes[1];
  return trimmed;
};

export const TWEET_TREND_PRESETS = {
  viral: {
    label: '#1 Trending',
    topic: 'Trending in World',
    metrics: { replies: '14.2K', retweets: '62.8K', likes: '420.5K', views: '18.2M' },
    text: '💬 14.2K    🔁 62.8K    ❤️ 420.5K    📊 18.2M'
  },
  tech: {
    label: 'Technology',
    topic: 'Technology · Trending',
    metrics: { replies: '3.4K', retweets: '12.1K', likes: '88.5K', views: '4.2M' },
    text: '💬 3.4K    🔁 12.1K    ❤️ 88.5K    📊 4.2M'
  },
  meme: {
    label: 'Memes',
    topic: 'Memes · Trending',
    metrics: { replies: '8.9K', retweets: '44.2K', likes: '210.8K', views: '9.7M' },
    text: '💬 8.9K    🔁 44.2K    ❤️ 210.8K    📊 9.7M'
  },
  casual: {
    label: 'Casual',
    topic: null,
    metrics: { replies: '142', retweets: '890', likes: '4.6K', views: '72K' },
    text: '💬 142    🔁 890    ❤️ 4.6K    📊 72K'
  }
};

export const parseTweetMetrics = (metricsStr, trendRank) => {
  if (trendRank && TWEET_TREND_PRESETS[trendRank]) {
    return TWEET_TREND_PRESETS[trendRank].metrics;
  }
  if (!metricsStr) {
    return { replies: '14.2K', retweets: '62.8K', likes: '420.5K', views: '18.2M' };
  }
  if (typeof metricsStr === 'object') {
    return {
      replies: metricsStr.replies || '14.2K',
      retweets: metricsStr.retweets || '62.8K',
      likes: metricsStr.likes || '420.5K',
      views: metricsStr.views || '18.2M'
    };
  }
  if (metricsStr.includes('84.1K') || metricsStr.includes('Ratioed')) {
    return { replies: '84.1K', retweets: '412', likes: '1.2K', views: '6.4M' };
  }
  if (metricsStr.includes('142') || metricsStr.includes('Casual')) {
    return { replies: '142', retweets: '890', likes: '4.6K', views: '72K' };
  }
  if (metricsStr.includes('8.9K') || metricsStr.includes('Memes')) {
    return { replies: '8.9K', retweets: '44.2K', likes: '210.8K', views: '9.7M' };
  }
  if (metricsStr.includes('3.4K') || metricsStr.includes('Technology')) {
    return { replies: '3.4K', retweets: '12.1K', likes: '88.5K', views: '4.2M' };
  }
  const matches = metricsStr.match(/[0-9]+(\.[0-9]+)?[KkMmBb]?/g);
  if (matches && matches.length >= 4) {
    return { replies: matches[0], retweets: matches[1], likes: matches[2], views: matches[3] };
  }
  return { replies: '14.2K', retweets: '62.8K', likes: '420.5K', views: '18.2M' };
};

const drawTweetVectorStrokeIcon = (ctx, path, x, y, size, strokeColor) => {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(path);
  ctx.restore();
};

const drawTweetVerifiedBadge = (ctx, x, y, size) => {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.fillStyle = '#1d9bf0';
  ctx.fill(twitterStarBadgePath);
  ctx.fillStyle = '#ffffff';
  ctx.fill(twitterCheckPath);
  ctx.restore();
};

const drawTweetXLogo = (ctx, x, y, size, color) => {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fill(tweetXLogoPath);
  ctx.restore();
};

const getTweetCardHeight = (ctx, cap, cardW) => {
  const scale = Math.max(0.4, Math.min(3.5, cardW / 480));
  const pad = Math.round(18 * scale);
  const avatarSize = Math.round(40 * scale);
  const bodyFontSize = Math.round(Math.max(12, (cap.fontSize || 18) * scale));
  const timeFontSize = Math.round(13 * scale);
  const metricsFontSize = Math.round(13 * scale);
  const iconSize = Math.round(15 * scale);

  ctx.save();
  ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const wrappedLines = wrapText(ctx, cap.text || '', cardW - pad * 2);
  ctx.restore();

  const bodyH = wrappedLines.length * (bodyFontSize * 1.35);
  const headerH = Math.max(avatarSize, Math.round(44 * scale));
  const timeH = Math.round(16 * scale);
  const dividerGap = Math.round(16 * scale);
  const metricsH = Math.max(iconSize, metricsFontSize);

  const trendTopic = cap.tweetTopic !== undefined
    ? cap.tweetTopic
    : (cap.tweetTrendRank ? TWEET_TREND_PRESETS[cap.tweetTrendRank]?.topic : (cap.tweetTrendRank === 'casual' ? null : TWEET_TREND_PRESETS.viral.topic));
  const trendH = trendTopic ? Math.round(18 * scale) : 0;

  const totalH = Math.round(pad + trendH + headerH + Math.round(10 * scale) + bodyH + Math.round(12 * scale) + timeH + dividerGap + metricsH + pad);
  return totalH;
};

const drawTweetCard = (ctx, cardW, cap) => {
  ctx.save();
  const scale = Math.max(0.4, Math.min(3.5, cardW / 480));
  const pad = Math.round(18 * scale);
  const avatarR = Math.round(20 * scale);
  const nameFontSize = Math.round(16 * scale);
  const handleFontSize = Math.round(14 * scale);
  const bodyFontSize = Math.round(Math.max(12, (cap.fontSize || 18) * scale));
  const timeFontSize = Math.round(13 * scale);
  const metricsFontSize = Math.round(13 * scale);
  const iconSize = Math.round(15 * scale);
  const badgeSize = Math.round(16 * scale);
  const xLogoSize = Math.round(17 * scale);
  const cornerRadius = Math.round(16 * scale);

  const theme = cap.tweetTheme || 'dark';
  const isDark = theme !== 'light' && theme !== 'white';
  const cardBg = theme === 'dim' ? '#15202b' : (isDark ? '#000000' : '#ffffff');
  const textColor = isDark ? '#ffffff' : '#0f1419';
  const mutedColor = isDark ? '#71767b' : '#536471';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

  const name = cap.tweetName || 'Elon Musk';
  const handle = cap.tweetHandle || '@elonmusk';
  const text = cap.text || "thinking about deleting the database and moving to the woods";
  const time = cap.tweetTime || '10:42 PM · Oct 8, 2026';
  const isVerified = cap.tweetVerified !== false;
  const parsedMetrics = parseTweetMetrics(cap.tweetMetrics, cap.tweetTrendRank);

  const trendTopic = cap.tweetTopic !== undefined
    ? cap.tweetTopic
    : (cap.tweetTrendRank ? TWEET_TREND_PRESETS[cap.tweetTrendRank]?.topic : (cap.tweetTrendRank === 'casual' ? null : TWEET_TREND_PRESETS.viral.topic));
  const trendH = trendTopic ? Math.round(18 * scale) : 0;

  ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const wrappedLines = wrapText(ctx, text, cardW - pad * 2);

  const cardH = getTweetCardHeight(ctx, cap, cardW);
  const startX = - cardW / 2;
  const startY = - cardH / 2;

  // Background card with rounded corners
  ctx.fillStyle = cardBg;
  drawRoundRect(ctx, startX, startY, cardW, cardH, cornerRadius);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top Trending Topic Tag (if trending)
  let headerStartY = startY + pad;
  if (trendTopic) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = mutedColor;
    ctx.font = `bold ${Math.round(11 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(`🔥 ${trendTopic}`, startX + pad, startY + pad);
    headerStartY += trendH;
  }

  // Avatar circle
  const avX = startX + pad + avatarR;
  const avY = headerStartY + avatarR;
  ctx.beginPath();
  ctx.arc(avX, avY, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#0ea5e9' : '#38bdf8';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(16 * scale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.charAt(0).toUpperCase() || 'U', avX, avY);

  // Name & Handle
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = textColor;
  ctx.font = `bold ${nameFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  const nameX = startX + pad + (avatarR * 2) + Math.round(10 * scale);
  const nameY = headerStartY + Math.round(2 * scale);
  ctx.fillText(name, nameX, nameY);

  const nameWidth = ctx.measureText(name).width;
  if (isVerified) {
    const badgeX = nameX + nameWidth + Math.round(4 * scale);
    const badgeY = nameY + Math.round((nameFontSize - badgeSize) / 2);
    drawTweetVerifiedBadge(ctx, badgeX, badgeY, badgeSize);
  }

  // Handle
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = mutedColor;
  ctx.font = `normal ${handleFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillText(handle, nameX, nameY + nameFontSize + Math.round(4 * scale));

  // 𝕏 Logo top-right
  const xLogoX = startX + cardW - pad - xLogoSize;
  const xLogoY = headerStartY + Math.round(2 * scale);
  drawTweetXLogo(ctx, xLogoX, xLogoY, xLogoSize, isDark ? '#ffffff' : '#0f1419');

  // Body text
  let curY = headerStartY + Math.max(avatarR * 2, Math.round(44 * scale)) + Math.round(10 * scale);
  ctx.fillStyle = textColor;
  ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (const line of wrappedLines) {
    ctx.fillText(line, startX + pad, curY);
    curY += (bodyFontSize * 1.35);
  }

  // Timestamp & Views (above divider, matching modal exactly)
  curY += Math.round(10 * scale);
  ctx.fillStyle = mutedColor;
  ctx.font = `normal ${timeFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const timeStr = `${time}  ·  `;
  ctx.fillText(timeStr, startX + pad, curY);
  const timeW = ctx.measureText(timeStr).width;

  ctx.font = `bold ${timeFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = isDark ? '#e7e9ea' : '#0f1419';
  ctx.fillText(`${parsedMetrics.views} Views`, startX + pad + timeW, curY);

  // Divider line
  curY += timeFontSize + Math.round(10 * scale);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX + pad, curY);
  ctx.lineTo(startX + cardW - pad, curY);
  ctx.stroke();

  // Metrics engagement row (vector icons + counts, matching modal exactly)
  curY += Math.round(10 * scale);
  const availW = cardW - pad * 2;
  const colW = availW / 5;
  ctx.font = `normal ${metricsFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = mutedColor;
  ctx.textBaseline = 'middle';
  const iconCenterOffset = iconSize / 2;

  // 1. Comment icon + replies
  drawTweetVectorStrokeIcon(ctx, tweetCommentPath, startX + pad, curY, iconSize, mutedColor);
  ctx.fillText(parsedMetrics.replies, startX + pad + iconSize + Math.round(5 * scale), curY + iconCenterOffset);

  // 2. Retweet icon + retweets
  drawTweetVectorStrokeIcon(ctx, tweetRepeatPath, startX + pad + colW, curY, iconSize, mutedColor);
  ctx.fillText(parsedMetrics.retweets, startX + pad + colW + iconSize + Math.round(5 * scale), curY + iconCenterOffset);

  // 3. Like icon + likes
  drawTweetVectorStrokeIcon(ctx, tweetHeartPath, startX + pad + colW * 2, curY, iconSize, mutedColor);
  ctx.fillText(parsedMetrics.likes, startX + pad + colW * 2 + iconSize + Math.round(5 * scale), curY + iconCenterOffset);

  // 4. Bookmark icon
  drawTweetVectorStrokeIcon(ctx, tweetBookmarkPath, startX + pad + colW * 3.3, curY, iconSize, mutedColor);

  // 5. Share icon
  drawTweetVectorStrokeIcon(ctx, tweetSharePath, startX + cardW - pad - iconSize, curY, iconSize, mutedColor);

  ctx.restore();
};

export const getInstagramCardHeight = (ctx, cap, cardW) => {
  const scale = Math.max(0.4, Math.min(3.5, cardW / 480));
  const pad = Math.round(14 * scale);
  const avatarSize = Math.round(40 * scale);
  const bodyFontSize = Math.round(Math.max(12, (cap.fontSize || 15) * scale));
  const timeFontSize = Math.round(11.5 * scale);
  const iconSize = Math.round(20 * scale);

  const headerH = Math.max(avatarSize, Math.round(44 * scale));
  const postImageH = Math.round(cardW * 0.72);

  ctx.save();
  ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const wrappedLines = wrapText(ctx, `${cap.igUsername || 'inc42.media'} ${cap.text || ''}`, cardW - pad * 2);
  ctx.restore();

  const actionsH = iconSize + Math.round(12 * scale);
  const captionH = Math.max(1, wrappedLines.length) * Math.round(bodyFontSize * 1.36);

  // Optional top comment
  const hasTopComment = Boolean(cap.igTopCommentUser && cap.igTopCommentText);
  const topCommentH = hasTopComment ? (Math.round(12 * scale) + Math.round(4 * scale)) : 0;

  const timeH = timeFontSize + Math.round(5 * scale);

  // Pad + Header + Gap + Post Image + Actions Row + Caption + (Optional Top Comment) + Timestamp + Pad
  const totalH = Math.round(pad + headerH + Math.round(10 * scale) + postImageH + actionsH + captionH + topCommentH + timeH + pad);
  return totalH;
};

export const drawInstagramCard = (ctx, cardW, cap) => {
  ctx.save();
  const scale = Math.max(0.4, Math.min(3.5, cardW / 480));
  const pad = Math.round(14 * scale);
  const avatarR = Math.round(19 * scale);
  const nameFontSize = Math.round(14 * scale);
  const subtitleFontSize = Math.round(11 * scale);
  const bodyFontSize = Math.round(Math.max(12, (cap.fontSize || 15) * scale));
  const metricsFontSize = Math.round(13 * scale);
  const timeFontSize = Math.round(11.5 * scale);
  const iconSize = Math.round(20 * scale);
  const cornerRadius = Math.round(16 * scale);

  const theme = cap.igTheme || 'dark';
  const isDark = theme !== 'light' && theme !== 'white';
  const cardBg = isDark ? '#000000' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const mutedColor = isDark ? '#a8a8a8' : '#737373';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';

  const username = cap.igUsername || 'inc42.media';
  const subtitle = cap.igSubtitle !== undefined ? cap.igSubtitle : 'Suggested for you';
  const text = cap.text || 'Remember Tanmay Bhat from the AIB...';
  const isVerified = cap.igVerified !== false;
  const hasStoryRing = cap.igHasStoryRing !== false;
  const showFollow = cap.igShowFollow !== false;
  const followText = cap.igFollowText || 'Follow';
  const isLiked = Boolean(cap.igLiked);

  // Modern action bar counts (matches latest Instagram UI from user reference)
  const likesCount = cap.igLikesCount || parseLikesCount(cap.igLikesText) || '1,583';
  const commentsCount = cap.igCommentsCount || '15';
  const repostsCount = cap.igRepostsCount || '15';
  const sharesCount = cap.igSharesCount || '295';
  const time = cap.igTime || '28 September';
  const postImageSrc = cap.igPostImage || cap.postImage || null;

  ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const wrappedLines = wrapText(ctx, `${username} ${text}`, cardW - pad * 2);

  const cardH = getInstagramCardHeight(ctx, cap, cardW);
  const startX = - cardW / 2;
  const startY = - cardH / 2;

  // Background card with rounded corners
  ctx.fillStyle = cardBg;
  drawRoundRect(ctx, startX, startY, cardW, cardH, cornerRadius);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Avatar with Story Ring
  const avCenterX = startX + pad + avatarR;
  const avCenterY = startY + pad + avatarR;
  if (hasStoryRing) {
    const ringGrad = ctx.createLinearGradient(
      avCenterX - avatarR - 3 * scale,
      avCenterY - avatarR - 3 * scale,
      avCenterX + avatarR + 3 * scale,
      avCenterY + avatarR + 3 * scale
    );
    ringGrad.addColorStop(0, '#f09433');
    ringGrad.addColorStop(0.3, '#e6683c');
    ringGrad.addColorStop(0.6, '#dc2743');
    ringGrad.addColorStop(0.85, '#cc2366');
    ringGrad.addColorStop(1, '#bc1888');

    ctx.beginPath();
    ctx.arc(avCenterX, avCenterY, avatarR + Math.round(2.8 * scale), 0, Math.PI * 2);
    ctx.fillStyle = ringGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(avCenterX, avCenterY, avatarR + Math.round(1.5 * scale), 0, Math.PI * 2);
    ctx.fillStyle = cardBg;
    ctx.fill();
  }

  // Inner avatar circle
  ctx.beginPath();
  ctx.arc(avCenterX, avCenterY, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#b91c1c' : '#ef4444';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(14 * scale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(username.charAt(0).toUpperCase() || 'I', avCenterX, avCenterY);

  // Username & Subtitle
  const nameX = startX + pad + (avatarR * 2) + Math.round(10 * scale);
  const nameY = startY + pad + (subtitle ? Math.round(2 * scale) : Math.round(8 * scale));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = textColor;
  ctx.font = `bold ${nameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(username, nameX, nameY);

  const nameW = ctx.measureText(username).width;
  if (isVerified) {
    const badgeSize = Math.round(13.5 * scale);
    const badgeX = nameX + nameW + Math.round(4 * scale);
    const badgeY = nameY + Math.round((nameFontSize - badgeSize) / 2);
    drawTweetVerifiedBadge(ctx, badgeX, badgeY, badgeSize);
  }

  // Subtitle (e.g. Suggested for you)
  if (subtitle) {
    ctx.font = `normal ${subtitleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = mutedColor;
    ctx.fillText(subtitle, nameX, nameY + nameFontSize + Math.round(3 * scale));
  }

  // Top Right: Follow button & Menu (···)
  const menuIconW = Math.round(16 * scale);
  const menuX = startX + cardW - pad - menuIconW;
  const headerCenterY = startY + pad + avatarR;

  // Draw 3 dots
  ctx.fillStyle = textColor;
  const dotR = Math.max(1.2, 1.6 * scale);
  const dotSpacing = 4.5 * scale;
  const dotsStartX = menuX + (menuIconW - dotSpacing * 2) / 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(dotsStartX + i * dotSpacing, headerCenterY, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Follow pill button
  if (showFollow) {
    ctx.font = `bold ${Math.round(12 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const followTextW = ctx.measureText(followText).width;
    const btnPadX = Math.round(13 * scale);
    const btnW = followTextW + btnPadX * 2;
    const btnH = Math.round(28 * scale);
    const btnX = menuX - btnW - Math.round(8 * scale);
    const btnY = headerCenterY - btnH / 2;
    const btnRadius = Math.round(8 * scale);

    ctx.save();
    ctx.fillStyle = isDark ? '#262626' : '#efefef';
    drawRoundRect(ctx, btnX, btnY, btnW, btnH, btnRadius);
    ctx.fillStyle = isDark ? '#ffffff' : '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(followText, btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();
  }

  // ─── Post Image Section (Square Feed Photo) ───
  const headerH = Math.max(avatarR * 2, Math.round(44 * scale));
  const postImageY = startY + pad + headerH + Math.round(10 * scale);
  const postImageH = Math.round(cardW * 0.72);

  if (postImageSrc) {
    let cached = socialCardImageCache.get(postImageSrc);
    if (!cached) {
      cached = new Image();
      if (!postImageSrc.startsWith('data:') && !postImageSrc.startsWith('blob:')) {
        cached.crossOrigin = 'anonymous';
      }
      cached.onload = () => {
        if (typeof window !== 'undefined' && window.__memeCanvasForceRender) {
          window.__memeCanvasForceRender();
        }
      };
      cached.src = postImageSrc;
      setSocialCardImage(postImageSrc, cached);
    }

    if (cached.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(startX, postImageY, cardW, postImageH);
      ctx.clip();

      const natW = cached.naturalWidth || cached.width || 600;
      const natH = cached.naturalHeight || cached.height || 600;
      const imgAspect = natW / natH;
      const targetAspect = cardW / postImageH;
      let sx = 0, sy = 0, sw = natW, sh = natH;
      if (imgAspect > targetAspect) {
        sw = natH * targetAspect;
        sx = (natW - sw) / 2;
      } else {
        sh = natW / targetAspect;
        sy = (natH - sh) / 2;
      }
      try {
        ctx.drawImage(cached, sx, sy, sw, sh, startX, postImageY, cardW, postImageH);
      } catch (err) {
        // Fallback
      }
      ctx.restore();
    } else {
      ctx.save();
      const grad = ctx.createLinearGradient(startX, postImageY, startX + cardW, postImageY + postImageH);
      grad.addColorStop(0, isDark ? '#18181b' : '#f4f4f5');
      grad.addColorStop(1, isDark ? '#27272a' : '#e4e4e7');
      ctx.fillStyle = grad;
      ctx.fillRect(startX, postImageY, cardW, postImageH);
      ctx.fillStyle = mutedColor;
      ctx.font = `bold ${Math.round(13 * scale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📷 Photo Post', startX + cardW / 2, postImageY + postImageH / 2);
      ctx.restore();
    }
  } else {
    ctx.save();
    const grad = ctx.createLinearGradient(startX, postImageY, startX + cardW, postImageY + postImageH);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#311042');
    ctx.fillStyle = grad;
    ctx.fillRect(startX, postImageY, cardW, postImageH);
    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold ${Math.round(13 * scale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📷 Photo Post', startX + cardW / 2, postImageY + postImageH / 2);
    ctx.restore();
  }

  // ─── Modern Action Icons Row with Inline Counts ───
  let curY = postImageY + postImageH + Math.round(11 * scale);
  const iconCenterY = curY + iconSize / 2;

  ctx.font = `600 ${metricsFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  let curX = startX + pad;
  const inlineGap = Math.round(5.5 * scale);
  const groupGap = Math.round(12 * scale);

  // 1. Like icon + count
  if (isLiked) {
    ctx.save();
    ctx.translate(curX, curY);
    const iconS = iconSize / 24;
    ctx.scale(iconS, iconS);
    ctx.fillStyle = '#ff3040';
    ctx.fill(tweetHeartPath);
    ctx.restore();
  } else {
    drawTweetVectorStrokeIcon(ctx, tweetHeartPath, curX, curY, iconSize, textColor);
  }
  curX += iconSize + inlineGap;
  ctx.fillStyle = textColor;
  ctx.fillText(likesCount, curX, iconCenterY);
  curX += ctx.measureText(likesCount).width + groupGap;

  // 2. Comment icon + count
  drawTweetVectorStrokeIcon(ctx, tweetCommentPath, curX, curY, iconSize, textColor);
  curX += iconSize + inlineGap;
  ctx.fillStyle = textColor;
  ctx.fillText(commentsCount, curX, iconCenterY);
  curX += ctx.measureText(commentsCount).width + groupGap;

  // 3. Repost icon + count
  drawTweetVectorStrokeIcon(ctx, tweetRepeatPath, curX, curY, iconSize, textColor);
  curX += iconSize + inlineGap;
  ctx.fillStyle = textColor;
  ctx.fillText(repostsCount, curX, iconCenterY);
  curX += ctx.measureText(repostsCount).width + groupGap;

  // 4. Share icon + count
  drawTweetVectorStrokeIcon(ctx, instagramSendPath, curX, curY, iconSize, textColor);
  curX += iconSize + inlineGap;
  ctx.fillStyle = textColor;
  ctx.fillText(sharesCount, curX, iconCenterY);

  // 5. Bookmark icon on far right
  drawTweetVectorStrokeIcon(ctx, tweetBookmarkPath, startX + cardW - pad - iconSize, curY, iconSize, textColor);

  curY += iconSize + Math.round(10 * scale);

  // ─── Caption (Directly Below Actions with bold username) ───
  ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  for (let idx = 0; idx < wrappedLines.length; idx++) {
    const line = wrappedLines[idx];
    if (idx === 0) {
      ctx.font = `bold ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(username, startX + pad, curY);
      const userW = ctx.measureText(username).width;
      ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const restOfFirstLine = line.slice(username.length);
      ctx.fillText(restOfFirstLine, startX + pad + userW, curY);
    } else {
      ctx.fillText(line, startX + pad, curY);
    }
    curY += Math.round(bodyFontSize * 1.36);
  }

  // ─── Top / Pinned Comment (Optional) ───
  if (cap.igTopCommentUser && cap.igTopCommentText) {
    curY += Math.round(2 * scale);
    ctx.font = `bold ${Math.round(12 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.fillText(cap.igTopCommentUser, startX + pad, curY);
    const topUserW = ctx.measureText(cap.igTopCommentUser).width;
    ctx.font = `normal ${Math.round(12 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(` ${cap.igTopCommentText}`, startX + pad + topUserW, curY);
    curY += Math.round(12 * scale) + Math.round(2 * scale);
  }

  // ─── Date / Timestamp Row ───
  curY += Math.round(2 * scale);
  const displayTime = time || '28 September';
  const showTranslation = cap.igShowTranslation === true;
  const timeText = showTranslation ? `${displayTime} · See translation` : displayTime;
  ctx.font = `normal ${timeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = mutedColor;
  ctx.fillText(timeText, startX + pad, curY);

  ctx.restore();
};

// WhatsApp Doodle Wallpaper Offscreen Canvas Pattern Cache
let waDoodlePatternCache = null;
let waDoodlePatternTheme = null;

function getWhatsAppDoodlePattern(ctx, isDark = true) {
  const themeKey = isDark ? 'dark' : 'light';
  if (waDoodlePatternCache && waDoodlePatternTheme === themeKey) {
    return waDoodlePatternCache;
  }
  const tileW = 200;
  const tileH = 200;
  const offscreen = document.createElement('canvas');
  offscreen.width = tileW;
  offscreen.height = tileH;
  const oCtx = offscreen.getContext('2d');
  if (!oCtx) return null;

  oCtx.clearRect(0, 0, tileW, tileH);
  const strokeColor = isDark ? 'rgba(255, 255, 255, 0.042)' : 'rgba(0, 0, 0, 0.042)';
  const fillColor = strokeColor;
  oCtx.strokeStyle = strokeColor;
  oCtx.fillStyle = fillColor;
  oCtx.lineWidth = 1.3;
  oCtx.lineCap = 'round';
  oCtx.lineJoin = 'round';

  // 1. Speech bubble
  oCtx.beginPath();
  oCtx.strokeRect(18, 16, 22, 16);
  oCtx.moveTo(22, 32);
  oCtx.lineTo(18, 38);
  oCtx.lineTo(28, 32);
  oCtx.stroke();

  // 2. Coffee Cup
  oCtx.beginPath();
  oCtx.strokeRect(110, 22, 18, 13);
  oCtx.moveTo(128, 25);
  oCtx.arc(128, 29, 4, -Math.PI / 2, Math.PI / 2);
  oCtx.stroke();

  // 3. Heart
  oCtx.beginPath();
  oCtx.arc(165, 35, 4, Math.PI, 0, false);
  oCtx.arc(173, 35, 4, Math.PI, 0, false);
  oCtx.lineTo(169, 44);
  oCtx.closePath();
  oCtx.stroke();

  // 4. Clock
  oCtx.beginPath();
  oCtx.arc(50, 75, 9, 0, Math.PI * 2);
  oCtx.stroke();
  oCtx.beginPath();
  oCtx.moveTo(50, 75);
  oCtx.lineTo(50, 70);
  oCtx.moveTo(50, 75);
  oCtx.lineTo(54, 75);
  oCtx.stroke();

  // 5. Music Note
  oCtx.beginPath();
  oCtx.arc(140, 78, 3.5, 0, Math.PI * 2);
  oCtx.fill();
  oCtx.moveTo(143.5, 78);
  oCtx.lineTo(143.5, 65);
  oCtx.lineTo(154, 63);
  oCtx.lineTo(154, 75);
  oCtx.stroke();
  oCtx.beginPath();
  oCtx.arc(150.5, 75, 3.5, 0, Math.PI * 2);
  oCtx.fill();

  // 6. Smiley Face
  oCtx.beginPath();
  oCtx.arc(26, 125, 9, 0, Math.PI * 2);
  oCtx.stroke();
  oCtx.beginPath();
  oCtx.arc(23, 123, 1, 0, Math.PI * 2);
  oCtx.arc(29, 123, 1, 0, Math.PI * 2);
  oCtx.fill();
  oCtx.beginPath();
  oCtx.arc(26, 126, 4, 0.2 * Math.PI, 0.8 * Math.PI);
  oCtx.stroke();

  // 7. Camera
  oCtx.beginPath();
  oCtx.strokeRect(95, 120, 20, 13);
  oCtx.arc(105, 127, 3.5, 0, Math.PI * 2);
  oCtx.fillRect(99, 117, 4, 3);
  oCtx.stroke();

  // 8. Handset curve
  oCtx.beginPath();
  oCtx.arc(168, 125, 7, 0.4 * Math.PI, 1.4 * Math.PI);
  oCtx.stroke();

  // 9. Star
  oCtx.beginPath();
  oCtx.moveTo(60, 160);
  oCtx.lineTo(62, 165);
  oCtx.lineTo(67, 165);
  oCtx.lineTo(63, 169);
  oCtx.lineTo(65, 174);
  oCtx.lineTo(60, 171);
  oCtx.lineTo(55, 174);
  oCtx.lineTo(57, 169);
  oCtx.lineTo(53, 165);
  oCtx.lineTo(58, 165);
  oCtx.closePath();
  oCtx.stroke();

  // 10. Checkmark
  oCtx.beginPath();
  oCtx.moveTo(125, 168);
  oCtx.lineTo(128, 172);
  oCtx.lineTo(135, 164);
  oCtx.moveTo(130, 168);
  oCtx.lineTo(133, 172);
  oCtx.lineTo(140, 164);
  oCtx.stroke();

  const pattern = ctx.createPattern(offscreen, 'repeat');
  waDoodlePatternCache = pattern;
  waDoodlePatternTheme = themeKey;
  return pattern;
}

function drawCanvasCameraIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.3, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const w = Math.round(size);
  const h = Math.round(size * 0.72);
  const left = cx - w / 2;
  const top = cy - h / 2 + Math.round(size * 0.07);
  const r = Math.round(size * 0.16);

  const bumpW = Math.round(w * 0.36);
  const bumpH = Math.round(size * 0.14);
  const bumpLeft = cx - bumpW / 2;

  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(bumpLeft, top);
  ctx.lineTo(bumpLeft + Math.round(size * 0.04), top - bumpH);
  ctx.lineTo(bumpLeft + bumpW - Math.round(size * 0.04), top - bumpH);
  ctx.lineTo(bumpLeft + bumpW, top);
  ctx.lineTo(left + w - r, top);
  ctx.arcTo(left + w, top, left + w, top + r, r);
  ctx.lineTo(left + w, top + h - r);
  ctx.arcTo(left + w, top + h, left + w - r, top + h, r);
  ctx.lineTo(left + r, top + h);
  ctx.arcTo(left, top + h, left, top + h - r, r);
  ctx.lineTo(left, top + r);
  ctx.arcTo(left, top, left + r, top, r);
  ctx.closePath();
  ctx.stroke();

  // Central circular lens
  const lensR = Math.round(size * 0.22);
  ctx.beginPath();
  ctx.arc(cx, top + h / 2 + Math.round(size * 0.02), lensR, 0, Math.PI * 2);
  ctx.stroke();

  // Small reflection dot
  ctx.beginPath();
  ctx.arc(cx + Math.round(lensR * 0.45), top + h / 2 - Math.round(lensR * 0.35), Math.max(1, Math.round(size * 0.045)), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCanvasMicIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, size * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const headW = Math.round(size * 0.36);
  const headH = Math.round(size * 0.52);
  const headR = headW / 2;
  const headTop = cy - Math.round(size * 0.34);

  // Mic capsule head (filled)
  ctx.beginPath();
  ctx.arc(cx, headTop + headR, headR, Math.PI, 0, false);
  ctx.lineTo(cx + headR, headTop + headH - headR);
  ctx.arc(cx, headTop + headH - headR, headR, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();

  // U-shaped cradle below capsule
  const cradleR = Math.round(size * 0.30);
  const cradleCenterY = headTop + Math.round(headH * 0.52);
  ctx.beginPath();
  ctx.arc(cx, cradleCenterY, cradleR, 0, Math.PI, false);
  ctx.stroke();

  // Stem
  const stemTop = cradleCenterY + cradleR;
  const stemBottom = stemTop + Math.round(size * 0.16);
  ctx.beginPath();
  ctx.moveTo(cx, stemTop);
  ctx.lineTo(cx, stemBottom);
  ctx.stroke();

  // Base line
  const baseW = Math.round(size * 0.34);
  ctx.beginPath();
  ctx.moveTo(cx - baseW / 2, stemBottom);
  ctx.lineTo(cx + baseW / 2, stemBottom);
  ctx.stroke();

  ctx.restore();
}

function drawCanvasPaperclipIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.2, size * 0.09);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);

  const w = size * 0.32;
  const h = size * 0.62;
  const r = w / 2;

  ctx.beginPath();
  ctx.moveTo(-w * 0.3, h * 0.2);
  ctx.lineTo(-w * 0.3, -h * 0.2);
  ctx.arcTo(-w * 0.3, -h * 0.4, 0, -h * 0.4, r * 0.7);
  ctx.arcTo(w * 0.4, -h * 0.4, w * 0.4, -h * 0.2, r * 0.7);
  ctx.lineTo(w * 0.4, h * 0.25);
  ctx.arcTo(w * 0.4, h * 0.48, 0, h * 0.48, r);
  ctx.arcTo(-w * 0.55, h * 0.48, -w * 0.55, h * 0.25, r);
  ctx.lineTo(-w * 0.55, -h * 0.3);
  ctx.stroke();

  ctx.restore();
}

export const getWhatsAppCardMetrics = (ctx, cap, cardW) => {
  const mCtx = ctx || (typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null);
  const canvasH = mCtx?.canvas?.height || 1080;
  const maxAllowedH = Math.round(canvasH * 0.88);

  const messages = (cap?.waMessages && Array.isArray(cap.waMessages) && cap.waMessages.length > 0)
    ? cap.waMessages
    : [{
        id: 'm1',
        text: cap?.text || '',
        direction: cap?.waDirection || 'received',
        time: cap?.waTime || '11:42 PM',
        ticks: cap?.waTicks || 'blue'
      }];

  const showHeader = cap?.waShowHeader !== false;
  const showDate = cap?.waShowDate !== false;
  const showFooter = cap?.waShowFooter !== false;

  const measure = (s) => {
    const pad = Math.round(14 * s);
    const headerH = showHeader ? Math.round(56 * s) : 0;
    const datePillH = showDate ? Math.round(36 * s) : 0;
    const footerH = showFooter ? Math.round(50 * s) : 0;
    // Guaranteed breathing room so the last message bubble is 100% visible before the footer input bar
    const bottomSpacing = Math.round(18 * s);
    const bodyFontSize = Math.round(Math.max(11, (cap?.fontSize || 14) * s));
    const timeFontSize = Math.round(9.5 * s);
    const bubbleMaxW = (cardW - pad * 2) * 0.82;

    if (mCtx) {
      mCtx.save();
      mCtx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    }

    let totalBubblesH = 0;
    const bubbleLayouts = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const wrappedLines = mCtx ? wrapText(mCtx, msg.text || '', bubbleMaxW - Math.round(24 * s)) : [msg.text || ''];
      let maxLineW = 0;
      if (mCtx) {
        for (const line of wrappedLines) {
          const lw = mCtx.measureText(line).width;
          if (lw > maxLineW) maxLineW = lw;
        }
      }
      const timeStr = msg.time || '11:42 PM';
      const timeMetricsW = mCtx ? mCtx.measureText(`${timeStr}  ✓✓`).width : (timeFontSize * 6);
      const bubbleW = Math.max(Math.round(82 * s), Math.min(bubbleMaxW, Math.max(maxLineW, timeMetricsW) + Math.round(24 * s)));
      const textH = Math.max(1, wrappedLines.length) * Math.round(bodyFontSize * 1.36);
      const bubbleH = textH + Math.round(14 * s) + timeFontSize;
      const isConsecutive = (i > 0 && messages[i - 1].direction === msg.direction);
      const gap = isConsecutive ? Math.round(3 * s) : Math.round(8 * s);

      totalBubblesH += gap + bubbleH;
      bubbleLayouts.push({
        msg,
        wrappedLines,
        bubbleW,
        bubbleH,
        gap,
        isConsecutive,
        isSent: msg.direction === 'sent',
        timeStr,
        textH
      });
    }

    if (mCtx) {
      mCtx.restore();
    }

    const totalH = Math.round(headerH + datePillH + totalBubblesH + bottomSpacing + footerH);
    return {
      scale: s,
      pad,
      headerH,
      datePillH,
      footerH,
      bottomSpacing,
      bodyFontSize,
      timeFontSize,
      bubbleMaxW,
      totalBubblesH,
      bubbleLayouts,
      totalH,
      messages
    };
  };

  let baseScale = Math.max(0.4, Math.min(1.40, cardW / 560));
  let layout = measure(baseScale);

  if (layout.totalH > maxAllowedH) {
    const fitFactor = (maxAllowedH - 12) / layout.totalH;
    const fittedScale = Math.max(0.36, baseScale * fitFactor);
    layout = measure(fittedScale);
  }

  return layout;
};

export const getWhatsAppCardScale = (ctx, cap, cardW) => {
  return getWhatsAppCardMetrics(ctx, cap, cardW).scale;
};

export const getWhatsAppCardHeight = (ctx, cap, cardW) => {
  return getWhatsAppCardMetrics(ctx, cap, cardW).totalH;
};

export const drawWhatsAppCard = (ctx, cardW, cap) => {
  ctx.save();
  const metrics = getWhatsAppCardMetrics(ctx, cap, cardW);
  const {
    scale,
    pad,
    headerH,
    datePillH,
    footerH,
    bottomSpacing,
    bodyFontSize,
    timeFontSize,
    bubbleLayouts,
    totalH,
    messages
  } = metrics;

  const nameFontSize = Math.round(15 * scale);
  const statusFontSize = Math.round(11 * scale);
  const cornerRadius = Math.round(16 * scale);
  const showHeader = cap.waShowHeader !== false;
  const showFooter = cap.waShowFooter !== false;
  const showDate = cap.waShowDate !== false;
  const showDoodles = cap.waShowDoodles !== false;

  const theme = cap.waTheme || 'dark';
  const isDark = theme !== 'light' && theme !== 'white';

  const cardBg = isDark ? '#0b141a' : '#efeae2';
  const headerBg = isDark ? '#121b22' : '#f0f2f5';
  const headerText = isDark ? '#ffffff' : '#111b21';
  const headerMuted = isDark ? '#8696a0' : '#667781';

  const contactName = cap.waContactName || '+91 81210 03003';
  const status = cap.waStatus || 'last seen yesterday at 6:43 PM';
  const datePillText = cap.waDatePill || 'Yesterday';

  const cardH = totalH;
  const startX = - cardW / 2;
  const startY = - cardH / 2;

  // 1. Clip entire card region with rounded corners
  ctx.save();
  drawRoundRect(ctx, startX, startY, cardW, cardH, cornerRadius);
  ctx.clip();

  // 2. Base background color
  ctx.fillStyle = cardBg;
  ctx.fillRect(startX, startY, cardW, cardH);

  // 3. Authentic WhatsApp Doodle Wallpaper Pattern
  if (showDoodles) {
    const doodlePattern = getWhatsAppDoodlePattern(ctx, isDark);
    if (doodlePattern) {
      ctx.fillStyle = doodlePattern;
      ctx.fillRect(startX, startY, cardW, cardH);
    }
  }

  let contentStartY = startY;

  // 4. Modern Authentic Header Bar (matching reference image)
  if (showHeader) {
    ctx.fillStyle = headerBg;
    ctx.fillRect(startX, startY, cardW, headerH);

    // Hairline bottom divider
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY + headerH);
    ctx.lineTo(startX + cardW, startY + headerH);
    ctx.stroke();

    // Clean back chevron < (thin white, matching reference image)
    const chevronSize = Math.round(18 * scale);
    const chevronX = startX + Math.round(12 * scale);
    const chevronY = startY + (headerH - chevronSize) / 2;
    drawTweetVectorStrokeIcon(ctx, iosChevronPath, chevronX, chevronY, chevronSize, isDark ? '#ffffff' : '#111b21');

    // Contact Avatar
    const avR = Math.round(19 * scale);
    const avX = chevronX + chevronSize + Math.round(8 * scale) + avR;
    const avY = startY + headerH / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX, avY, avR, 0, Math.PI * 2);
    ctx.fillStyle = cap.waAvatarBg || (isDark ? '#202c33' : '#e9edef');
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Initial or Avatar text
    ctx.fillStyle = isDark ? '#ffffff' : '#111b21';
    ctx.font = `bold ${Math.round(14 * scale)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initChar = (contactName.replace(/^\+91\s*/, '') || 'W').charAt(0).toUpperCase();
    ctx.fillText(initChar, avX, avY);
    ctx.restore();

    // Contact Name & Status
    const nameX = avX + avR + Math.round(10 * scale);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = headerText;
    ctx.font = `600 ${nameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(contactName, nameX, startY + Math.round(12 * scale));

    ctx.font = `normal ${statusFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = status === 'online' ? '#25d366' : headerMuted;
    ctx.fillText(status, nameX, startY + Math.round(31 * scale));

    // Clean Phone Call outline icon on the right (matching reference image)
    const callIconSize = Math.round(20 * scale);
    const callX = startX + cardW - pad - callIconSize;
    const callY = startY + (headerH - callIconSize) / 2;
    drawTweetVectorStrokeIcon(ctx, iosPhonePath, callX, callY, callIconSize, isDark ? '#ffffff' : '#111b21');

    contentStartY += headerH;
  }

  // 5. Centered Date Pill ("Yesterday" / "Today")
  if (showDate) {
    ctx.save();
    ctx.font = `500 ${Math.round(11 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const dateTextW = ctx.measureText(datePillText).width;
    const datePillW = Math.round(dateTextW + 24 * scale);
    const pillH = Math.round(22 * scale);
    const datePillX = startX + (cardW - datePillW) / 2;
    const datePillY = contentStartY + (datePillH - pillH) / 2;

    ctx.fillStyle = isDark ? '#182229' : 'rgba(255, 255, 255, 0.92)';
    drawRoundRect(ctx, datePillX, datePillY, datePillW, pillH, Math.round(7 * scale));
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isDark ? '#8696a0' : '#54656f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(datePillText, datePillX + datePillW / 2, datePillY + pillH / 2);
    ctx.restore();
    contentStartY += datePillH;
  }

  // 6. Multi-Message Conversation Stream with Authentic WhatsApp Speech Tails
  let curY = contentStartY;

  for (let idx = 0; idx < bubbleLayouts.length; idx++) {
    const layout = bubbleLayouts[idx];
    const { msg, wrappedLines, bubbleW, bubbleH, gap, isConsecutive, isSent, timeStr } = layout;
    const hasTail = !isConsecutive;

    const bubbleBg = isSent
      ? (isDark ? '#005c4b' : '#d9fdd3')
      : (isDark ? '#202c33' : '#ffffff');
    const bubbleTextColor = isDark ? '#e9edef' : '#111b21';
    const timeColor = isDark ? '#8696a0' : '#667781';

    curY += gap;

    const tailOffset = hasTail ? Math.round(6 * scale) : 0;
    const bubbleX = isSent
      ? (startX + cardW - pad - bubbleW - tailOffset)
      : (startX + pad + tailOffset);
    const bubbleY = curY;

    // Draw Authentic Speech Bubble with sharp top tail
    const r = Math.round(8 * scale);
    const tailW = Math.round(7 * scale);
    const tailH = Math.round(11 * scale);

    ctx.save();
    ctx.fillStyle = bubbleBg;
    ctx.beginPath();

    if (isSent) {
      // Sent Bubble: rounded tl, bl, br. Top-right tail if hasTail
      ctx.moveTo(bubbleX + r, bubbleY);
      if (hasTail) {
        ctx.lineTo(bubbleX + bubbleW, bubbleY);
        ctx.lineTo(bubbleX + bubbleW + tailW, bubbleY);
        ctx.quadraticCurveTo(bubbleX + bubbleW + Math.round(1 * scale), bubbleY + Math.round(4 * scale), bubbleX + bubbleW, bubbleY + tailH);
      } else {
        ctx.lineTo(bubbleX + bubbleW - r, bubbleY);
        ctx.arcTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r, r);
      }
      ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r);
      ctx.arcTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH, r);
      ctx.lineTo(bubbleX + r, bubbleY + bubbleH);
      ctx.arcTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r, r);
      ctx.lineTo(bubbleX, bubbleY + r);
      ctx.arcTo(bubbleX, bubbleY, bubbleX + r, bubbleY, r);
    } else {
      // Received Bubble: rounded tr, br, bl. Top-left tail if hasTail
      if (hasTail) {
        ctx.moveTo(bubbleX - tailW, bubbleY);
        ctx.lineTo(bubbleX + bubbleW - r, bubbleY);
      } else {
        ctx.moveTo(bubbleX + r, bubbleY);
        ctx.lineTo(bubbleX + bubbleW - r, bubbleY);
      }
      ctx.arcTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r, r);
      ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r);
      ctx.arcTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH, r);
      ctx.lineTo(bubbleX + r, bubbleY + bubbleH);
      ctx.arcTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r, r);
      if (hasTail) {
        ctx.lineTo(bubbleX, bubbleY + tailH);
        ctx.quadraticCurveTo(bubbleX - Math.round(1 * scale), bubbleY + Math.round(4 * scale), bubbleX - tailW, bubbleY);
      } else {
        ctx.lineTo(bubbleX, bubbleY + r);
        ctx.arcTo(bubbleX, bubbleY, bubbleX + r, bubbleY, r);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Message text inside bubble
    let textY = bubbleY + Math.round(7 * scale);
    ctx.fillStyle = bubbleTextColor;
    ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (const line of wrappedLines) {
      ctx.fillText(line, bubbleX + Math.round(10 * scale), textY);
      textY += Math.round(bodyFontSize * 1.36);
    }

    // Timestamp & read receipts
    const timeY = bubbleY + bubbleH - timeFontSize - Math.round(4 * scale);
    const timeEndX = bubbleX + bubbleW - Math.round(8 * scale);
    ctx.font = `normal ${timeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    if (isSent) {
      const ticks = msg.ticks || 'blue';
      const tickColor = ticks === 'blue' ? '#53bdeb' : '#8696a0';
      ctx.fillStyle = tickColor;
      ctx.font = `bold ${Math.round(11 * scale)}px sans-serif`;
      const tickStr = ticks === 'single' ? '✓' : '✓✓';
      ctx.fillText(tickStr, timeEndX, timeY - Math.round(1 * scale));
      const tickW = ctx.measureText(tickStr).width;

      ctx.fillStyle = timeColor;
      ctx.font = `normal ${timeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(timeStr, timeEndX - tickW - Math.round(3 * scale), timeY);
    } else {
      ctx.fillStyle = timeColor;
      ctx.fillText(timeStr, timeEndX, timeY);
    }

    curY += bubbleH;
  }

  // 7. Modern Bottom Chat Input Bar (never overlaps messages - guaranteed bottomSpacing)
  if (showFooter) {
    const footerY = curY + bottomSpacing;

    // Footer bar background
    ctx.fillStyle = isDark ? '#0b141a' : '#f0f2f5';
    ctx.fillRect(startX, footerY, cardW, footerH);

    // Hairline top border
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, footerY);
    ctx.lineTo(startX + cardW, footerY);
    ctx.stroke();

    const iconColor = isDark ? '#8696a0' : '#54656f';

    // Plus icon on left
    ctx.fillStyle = iconColor;
    ctx.font = `300 ${Math.round(22 * scale)}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const plusCenterX = startX + pad + Math.round(6 * scale);
    ctx.fillText('+', plusCenterX, footerY + footerH / 2);

    // Microphone button on far right
    const micR = Math.round(16 * scale);
    const micCenterX = startX + cardW - pad - micR;
    const micCenterY = footerY + footerH / 2;
    ctx.beginPath();
    ctx.arc(micCenterX, micCenterY, micR, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#202c33' : '#00a884';
    ctx.fill();
    drawCanvasMicIcon(ctx, micCenterX, micCenterY, Math.round(15 * scale), '#ffffff');

    // Camera icon to the left of the mic button
    const camSize = Math.round(18 * scale);
    const camCenterX = micCenterX - micR - Math.round(14 * scale) - camSize / 2;
    const camCenterY = footerY + footerH / 2;
    drawCanvasCameraIcon(ctx, camCenterX, camCenterY, camSize, iconColor);

    // Rounded input capsule (between Plus and Camera)
    const capX = plusCenterX + Math.round(16 * scale);
    const capEndX = camCenterX - camSize / 2 - Math.round(12 * scale);
    const capW = Math.max(Math.round(60 * scale), capEndX - capX);
    const capH = Math.round(34 * scale);
    const capY = footerY + (footerH - capH) / 2;
    const capR = Math.round(17 * scale);
    ctx.fillStyle = isDark ? '#202c33' : '#ffffff';
    drawRoundRect(ctx, capX, capY, capW, capH, capR);

    // "Message" placeholder text inside capsule
    ctx.fillStyle = isDark ? '#8696a0' : '#8696a0';
    ctx.font = `normal ${Math.round(13 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Message', capX + Math.round(14 * scale), capY + capH / 2);

    // Paperclip icon on right of capsule
    const clipCenterX = capX + capW - Math.round(16 * scale);
    const clipCenterY = capY + capH / 2;
    drawCanvasPaperclipIcon(ctx, clipCenterX, clipCenterY, Math.round(14 * scale), '#8696a0');
  }

  ctx.restore(); // Restore clip
  ctx.restore(); // Restore save
};

const dieCutSilhouetteCache = new Map();

function getOrCreateDieCutSilhouette(imgSource, color, width, height) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const srcKey = imgSource.src || imgSource.currentSrc || (imgSource.toDataURL ? 'canvas' : 'img');
  const key = `${srcKey}_${color}_${w}_${h}`;
  if (dieCutSilhouetteCache.has(key)) {
    return dieCutSilhouetteCache.get(key);
  }
  const silCanvas = document.createElement('canvas');
  silCanvas.width = w;
  silCanvas.height = h;
  const sCtx = silCanvas.getContext('2d');
  sCtx.drawImage(imgSource, 0, 0, w, h);
  sCtx.globalCompositeOperation = 'source-in';
  sCtx.fillStyle = color;
  sCtx.fillRect(0, 0, w, h);

  if (dieCutSilhouetteCache.size > 80) {
    const firstKey = dieCutSilhouetteCache.keys().next().value;
    const oldCanvas = dieCutSilhouetteCache.get(firstKey);
    if (oldCanvas) {
      oldCanvas.width = 0;
      oldCanvas.height = 0;
    }
    dieCutSilhouetteCache.delete(firstKey);
  }
  dieCutSilhouetteCache.set(key, silCanvas);
  return silCanvas;
}

function renderDieCutImage(ctx, img, drawW, drawH, borderColor = '#ffffff', borderWidth = 6) {
  const sil = getOrCreateDieCutSilhouette(img, borderColor, drawW, drawH);
  const R = Math.max(2, borderWidth);
  const steps = Math.min(24, Math.max(12, Math.round(R * 3)));

  // 1. Soft realistic vinyl sticker drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.drawImage(sil, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // 2. Multi-angle radial dilation stamp for solid, crisp, opaque vinyl border
  ctx.save();
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const ox = Math.cos(angle) * R;
    const oy = Math.sin(angle) * R;
    ctx.drawImage(sil, -drawW / 2 + ox, -drawH / 2 + oy, drawW, drawH);
  }
  if (R > 3) {
    const midR = R * 0.55;
    const midSteps = Math.min(16, Math.max(8, Math.round(steps * 0.6)));
    for (let i = 0; i < midSteps; i++) {
      const angle = (i * 2 * Math.PI) / midSteps;
      const ox = Math.cos(angle) * midR;
      const oy = Math.sin(angle) * midR;
      ctx.drawImage(sil, -drawW / 2 + ox, -drawH / 2 + oy, drawW, drawH);
    }
  }
  ctx.restore();

  // 3. Draw the original graphic on top
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
}

function renderDieCutEmoji(ctx, emoji, fontSize, borderColor = '#ffffff', borderWidth = 6) {
  const pad = Math.ceil(fontSize * 0.4);
  const fullW = Math.ceil(fontSize * 1.5 + pad * 2);
  const fullH = Math.ceil(fontSize * 1.5 + pad * 2);

  const offCanvas = document.createElement('canvas');
  offCanvas.width = fullW;
  offCanvas.height = fullH;
  const oCtx = offCanvas.getContext('2d');
  oCtx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  oCtx.textAlign = 'center';
  oCtx.textBaseline = 'middle';
  oCtx.fillText(emoji, fullW / 2, fullH / 2);

  const sil = getOrCreateDieCutSilhouette(offCanvas, borderColor, fullW, fullH);
  const R = Math.max(2, borderWidth);
  const steps = Math.min(24, Math.max(12, Math.round(R * 3)));
  const cx = -fullW / 2;
  const cy = -fullH / 2;

  // 1. Soft shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.drawImage(sil, cx, cy);
  ctx.restore();

  // 2. Radial stamp
  ctx.save();
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const ox = Math.cos(angle) * R;
    const oy = Math.sin(angle) * R;
    ctx.drawImage(sil, cx + ox, cy + oy);
  }
  if (R > 3) {
    const midR = R * 0.55;
    for (let i = 0; i < 8; i++) {
      const angle = (i * 2 * Math.PI) / 8;
      const ox = Math.cos(angle) * midR;
      const oy = Math.sin(angle) * midR;
      ctx.drawImage(sil, cx + ox, cy + oy);
    }
  }
  ctx.restore();

  // 3. Draw emoji on top
  ctx.drawImage(offCanvas, cx, cy);
}

const CanvasEditor = React.forwardRef(function CanvasEditor(
  {
    template,
    imageUrl,
    captions = [],
    stickers = [],
    imageLayers = [],
    aspectRatio = 'original',
    imageFit = 'cover',
    filters = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0 },
    activeLayerId,
    onSelectLayer,
    onDeleteLayer,
    onUpdateCaptionBounds,
    onUpdateStickerBounds,
    onUpdateImageLayerBounds,
    onUpdateCaptionText,
    isNativeLayout,
    layoutDef,
    slotImages,
    slotTransforms,
    onUpdateSlotTransform,
    _isVideoPlaying = true,
    watermark,
    canvasBgColor = '#ffffff',
    drawings = [],
    onAddDrawing,
    isDrawingMode = false,
    drawTool = 'brush',
    brushColor = '#ff2a5f',
    brushSize = 10,
    canvasHeader,
    _onUpdateCanvasHeader,
    canvasFooter,
    _onUpdateCanvasFooter,
    demotivational,
    canvasFlipX = false
  },
  ref
) {
  
  const [liveBgColor, setLiveBgColor] = useState(canvasBgColor);
  useEffect(() => {
    setLiveBgColor(canvasBgColor);
  }, [canvasBgColor]);
  
  useEffect(() => {
    const handler = (e) => {
      setLiveBgColor(e.detail);
    };
    window.addEventListener('liveCanvasBgColor', handler);
    return () => window.removeEventListener('liveCanvasBgColor', handler);
  }, []);

  const internalRef = useRef(null);
  const canvasRef = ref || internalRef;
  const activeIsNativeLayout = isNativeLayout;
  const activeLayoutDef = layoutDef;

  const isDrawingActive = useRef(false);
  const currentStroke = useRef(null);
  const lastDrawPoint = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.resetVideoTimestamps = () => {
        Object.values(imageCacheRef.current).forEach((media) => {
          if (media && media.tagName === 'VIDEO') {
            const trimStart = media._trimStart || 0;
            media.currentTime = trimStart;
            media.play().catch(() => {});
          }
        });
      };
      canvasRef.current.getVideoElements = () => {
        return Object.values(imageCacheRef.current).filter((media) => media && media.tagName === 'VIDEO');
      };
    }
  }, [canvasRef]);

  const wrapperRef = useRef(null);
  const editableRef = useRef(null);
  const imageCacheRef = useRef({});
  const loadingMediaRef = useRef({});
  const [canvasScale, setCanvasScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ w: 800, h: 800 });

  const isDragging = useRef(false);
  const snappingLines = useRef({ horizontal: null, vertical: null });
  const hasDragged = useRef(false);
  const dragTarget = useRef(null);
  const dragStartCoords = useRef({ x: 0, y: 0 });
  const initialLayerPos = useRef({ x: 0.5, y: 0.5 });
  const initialPinchDist = useRef(null);
  const initialSlotScale = useRef(null);
  // Double-tap detection: track last tap time and layer id
  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [editingCaptionText, setEditingCaptionText] = useState('');

  useEffect(() => {
    if (editingCaptionId && activeLayerId !== editingCaptionId) {
      setEditingCaptionId(null);
    }
  }, [editingCaptionId, activeLayerId]);
  const lastTapRef = useRef({ id: null, time: 0 });


  const imgSrc = template?.canvasOnly ? null : (template?.rawImageUrl || imageUrl || template?.imageUrl);
  let canvasW = 1080;
  let canvasH = 1080;
  let rawW = 1080;
  let rawH = 1080;

  if (aspectRatio === '16:9') {
    rawW = 1920;
    rawH = 1080;
  } else if (aspectRatio === '9:16') {
    rawW = 1080;
    rawH = 1920;
  } else if (aspectRatio === '4:5') {
    rawW = 1080;
    rawH = 1350;
  } else if (aspectRatio === 'original') {
    rawW = template?.width || naturalSize.w || 1080;
    rawH = template?.height || naturalSize.h || 1080;
  }
  
  // Normalize canvas internal resolution to max dimension 1080
  // This keeps font sizes consistent relative to the canvas across all aspect ratios
  // and prevents performance issues from huge original image resolutions
  
  const maxDim = Math.max(rawW, rawH);
  if (maxDim > 0) {
    canvasW = Math.round((rawW / maxDim) * 1080);
    canvasH = Math.round((rawH / maxDim) * 1080);
  }

  // Header Canvas Extension calculations
  const isHeaderEnabled = !!canvasHeader?.enabled;
  const headerCap = captions.find(c => c.isHeaderCaption);
  let headerExtH = 0;
  if (isHeaderEnabled) {
    if (headerCap) {
      const hFontSize = headerCap.fontSize || 50;
      const hFontFamily = headerCap.fontFamily || 'Montserrat, sans-serif';
      let linesCount = 1;
      if (typeof document !== 'undefined') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.font = `bold ${hFontSize}px ${hFontFamily}`;
          const wrapped = wrapText(tempCtx, headerCap.text || '', (headerCap.width || 0.92) * canvasW);
          linesCount = Math.max(1, wrapped.length);
        }
      }
      const hLineHeight = hFontSize * 1.35;
      const hPadY = Math.max(22, Math.round(hFontSize * 0.6));
      headerExtH = Math.max(110, Math.round(linesCount * hLineHeight + hPadY * 2));
    } else {
      headerExtH = canvasHeader?.height || 140;
    }
  }

  // Footer Canvas Extension calculations
  const isFooterEnabled = !!canvasFooter?.enabled;
  const footerCap = captions.find(c => c.isFooterCaption);
  let footerExtH = 0;
  if (isFooterEnabled) {
    if (footerCap) {
      const fFontSize = footerCap.fontSize || 50;
      const fFontFamily = footerCap.fontFamily || 'Montserrat, sans-serif';
      let linesCount = 1;
      if (typeof document !== 'undefined') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.font = `bold ${fFontSize}px ${fFontFamily}`;
          const wrapped = wrapText(tempCtx, footerCap.text || '', (footerCap.width || 0.92) * canvasW);
          linesCount = Math.max(1, wrapped.length);
        }
      }
      const fLineHeight = fFontSize * 1.35;
      const fPadY = Math.max(22, Math.round(fFontSize * 0.6));
      footerExtH = Math.max(110, Math.round(linesCount * fLineHeight + fPadY * 2));
    } else {
      footerExtH = canvasFooter?.height || 140;
    }
  }

  const totalCanvasH = canvasH + headerExtH + footerExtH;

  // Layer Center Y position in canvas pixels (anchors meme image layers to the image area below header)
  const getCaptionCenterY = (cap, customCanvas = null) => {
    if (!cap) return 0;
    const activeCanvas = customCanvas || canvasRef.current;
    if (cap.isHeaderCaption) {
      if (cap.hasCustomPos) {
        return (cap.y ?? 0) * (activeCanvas?.height || totalCanvasH);
      }
      return headerExtH / 2;
    }
    if (cap.isFooterCaption) {
      if (cap.hasCustomPos) {
        return (cap.y ?? 0) * (activeCanvas?.height || totalCanvasH);
      }
      return headerExtH + canvasH + (footerExtH / 2);
    }
    const currentH = activeCanvas?.height || canvasH;
    const rawY = headerExtH + (cap.y ?? 0.5) * canvasH;
    if (cap.isWhatsAppCard && activeCanvas) {
      const cardW = Math.max(180, (cap.width || 0.82) * (activeCanvas.width || canvasW));
      const ctx = activeCanvas.getContext ? activeCanvas.getContext('2d') : null;
      const cardH = getWhatsAppCardHeight(ctx, cap, cardW);
      const minMargin = 16;
      if (cardH <= currentH - minMargin * 2) {
        const minY = cardH / 2 + minMargin;
        const maxY = currentH - cardH / 2 - minMargin;
        return Math.max(minY, Math.min(maxY, rawY));
      }
    }
    return rawY;
  };

  const getStickerCenterY = (stk) => {
    return headerExtH + ((stk?.y) || 0) * canvasH;
  };

  const getImageLayerCenterY = (img) => {
    return headerExtH + ((img?.y) || 0) * canvasH;
  };
  
  const activeFilters = filters || { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0 };

  const activeCaption = captions.find((c) => c.id === activeLayerId);

  // Compute exact scale ratio synchronously so font scale is accurate
  const updateScaleSync = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width > 0 && canvasW > 0) {
        setCanvasScale(rect.width / canvasW);
      }
    }
  };

  useLayoutEffect(() => {
    updateScaleSync();
  }, [canvasW, imgSrc, totalCanvasH]);

  useEffect(() => {
    updateScaleSync();
    window.addEventListener('resize', updateScaleSync);
    const ro = typeof ResizeObserver !== 'undefined' && canvasRef.current
      ? new ResizeObserver(() => updateScaleSync())
      : null;
    if (ro && canvasRef.current) {
      ro.observe(canvasRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateScaleSync);
      if (ro) ro.disconnect();
    };
  }, [canvasW, imgSrc]);

  // Focus textarea ONLY when explicitly called (not on selection change, never on Social Cards)
  const focusTextarea = () => {
    if (activeCaption?.isTweetCard || activeCaption?.isInstagramCard || activeCaption?.isWhatsAppCard) return;
    if (editableRef.current) {
      try {
        editableRef.current.focus();
        const len = editableRef.current.value.length;
        editableRef.current.setSelectionRange(len, len);
      } catch {
        // Focus fallback
      }
    }
  };

  const handlePointerDownRef = useRef(null);
  const handlePointerMoveRef = useRef(null);
  const handlePointerUpRef = useRef(null);
  const handlePointerEndRef = useRef(null);

  // rAF batching for high-DPI drag, resize, and rotate operations (prevents event flooding)
  const dragRafRef = useRef(null);
  const pendingDragRef = useRef(null);

  const flushDragBatch = () => {
    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    if (pendingDragRef.current) {
      const fn = pendingDragRef.current;
      pendingDragRef.current = null;
      fn();
    }
  };

  const scheduleDragBatch = (fn) => {
    pendingDragRef.current = fn;
    if (!dragRafRef.current) {
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (pendingDragRef.current) {
          const u = pendingDragRef.current;
          pendingDragRef.current = null;
          u();
        }
      });
    }
  };
  
  useLayoutEffect(() => {
    handlePointerDownRef.current = handlePointerDown;
    handlePointerMoveRef.current = handlePointerMove;
    handlePointerEndRef.current = handlePointerEnd;
    handlePointerUpRef.current = handlePointerUp;
  });

  // Native non-passive touch listeners: handle drag & drawing AND block page scroll
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e) => {
      if (e.cancelable && e.target !== editableRef.current) {
        e.preventDefault();
      }
      if (handlePointerDownRef.current) handlePointerDownRef.current(e);
    };

    const onTouchMove = (e) => {
      if (e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }
      if ((isDragging.current || isDrawingActive.current) && handlePointerMoveRef.current) {
        handlePointerMoveRef.current(e);
      }
    };

    const onTouchEnd = (e) => {
      if (handlePointerEndRef.current) handlePointerEndRef.current(e);
    };

    wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
    wrapper.addEventListener('touchend', onTouchEnd, { passive: false });
    wrapper.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
      wrapper.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Global window listeners for mouse & touch drag so continuous dragging outside canvas never freezes
  useEffect(() => {
    const onGlobalPointerMove = (e) => {
      if ((isDragging.current || isDrawingActive.current) && handlePointerMoveRef.current) {
        if (!wrapperRef.current || !wrapperRef.current.contains(e.target)) {
          handlePointerMoveRef.current(e);
        }
      }
    };
    const onGlobalPointerEnd = (e) => {
      if (isDragging.current || isDrawingActive.current) {
        if (handlePointerEndRef.current) {
          handlePointerEndRef.current(e);
        } else if (handlePointerUpRef.current) {
          handlePointerUpRef.current();
        }
      }
    };

    window.addEventListener('mousemove', onGlobalPointerMove);
    window.addEventListener('mouseup', onGlobalPointerEnd);
    window.addEventListener('touchmove', onGlobalPointerMove, { passive: false });
    window.addEventListener('touchend', onGlobalPointerEnd);
    window.addEventListener('touchcancel', onGlobalPointerEnd);

    return () => {
      window.removeEventListener('mousemove', onGlobalPointerMove);
      window.removeEventListener('mouseup', onGlobalPointerEnd);
      window.removeEventListener('touchmove', onGlobalPointerMove);
      window.removeEventListener('touchend', onGlobalPointerEnd);
      window.removeEventListener('touchcancel', onGlobalPointerEnd);
    };
  }, []);

  const baseImgRef = useRef(null);
  const compCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Methods for Face Morphing Studio
    canvas.sampleFaceLighting = (normX, normY, normRadius = 0.14) => {
      const cx = normX * canvasW;
      const cy = headerExtH + normY * canvasH;
      const r = normRadius * canvasW;
      return sampleFaceLighting(ctx, cx, cy, r);
    };

    canvas.extractFacePatch = (normX, normY, normRadius = 0.14, outputSize = 400) => {
      const cx = normX * canvasW;
      const cy = headerExtH + normY * canvasH;
      const r = normRadius * canvasW;
      const side = Math.max(80, r * 2.3);
      const sx = Math.max(0, Math.min(canvasW - side, cx - side / 2));
      const sy = Math.max(0, Math.min(totalCanvasH - side, cy - side / 2));
      const sw = Math.min(side, canvasW - sx);
      const sh = Math.min(side, totalCanvasH - sy);

      const patchCanvas = document.createElement('canvas');
      patchCanvas.width = outputSize;
      patchCanvas.height = outputSize;
      const pCtx = patchCanvas.getContext('2d');
      pCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, outputSize, outputSize);
      return {
        canvas: patchCanvas,
        dataUrl: patchCanvas.toDataURL('image/png'),
      };
    };

    canvas.getBaseImageElement = () => {
      return baseImgRef.current;
    };

    canvas.bakeLayerIntoBase = (layerId) => {
      const layer = (imageLayers || []).find((l) => l.id === layerId);
      if (!layer) return null;

      const baseImg = baseImgRef.current;
      const bW = baseImg ? (baseImg.naturalWidth || baseImg.width || 800) : canvasW;
      const bH = baseImg ? (baseImg.naturalHeight || baseImg.height || 800) : canvasH;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = bW;
      offCanvas.height = bH;
      const oCtx = offCanvas.getContext('2d');

      if (baseImg) {
        oCtx.drawImage(baseImg, 0, 0, bW, bH);
      } else {
        oCtx.fillStyle = '#ffffff';
        oCtx.fillRect(0, 0, bW, bH);
      }

      const cached = imageCacheRef.current[layer.url];
      if (cached) {
        const lX = (layer.x !== undefined ? layer.x : 0.5) * bW;
        const lY = (layer.y !== undefined ? layer.y : 0.38) * bH;
        const lScale = layer.scale || 1.0;
        const maxDim = 320;
        const cW = cached.naturalWidth || cached.width || 200;
        const cH = cached.naturalHeight || cached.height || 200;
        const fitScale = Math.min(maxDim / cW, maxDim / cH);
        const w = (layer.boxWidth || layer.width || (cW * fitScale * lScale)) * (bW / canvasW);
        const h = (layer.boxHeight || layer.height || (cH * fitScale * lScale)) * (bH / canvasH);

        const imgAspect = cW / cH;
        const boxAspect = w / h;
        let drawW = w;
        let drawH = h;
        if (boxAspect > imgAspect) {
          drawH = h;
          drawW = h * imgAspect;
        } else {
          drawW = w;
          drawH = w / imgAspect;
        }

        oCtx.save();
        oCtx.translate(lX, lY);
        if (layer.rotation) oCtx.rotate((layer.rotation * Math.PI) / 180);
        if (layer.flipX) oCtx.scale(-1, 1);
        if (layer.opacity !== undefined) oCtx.globalAlpha = layer.opacity;

        oCtx.beginPath();
        if (layer.isFaceMorph) {
          oCtx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
        } else {
          oCtx.rect(-w / 2, -h / 2, w, h);
        }
        oCtx.clip();
        oCtx.drawImage(cached, -drawW / 2, -drawH / 2, drawW, drawH);
        oCtx.restore();
      }

      return offCanvas.toDataURL('image/png');
    };

    canvas.exportCleanImage = (format = 'image/png', quality = 0.92) => {
      renderCanvas(baseImgRef.current, true);
      const res = canvas.toDataURL(format, quality);
      renderCanvas(baseImgRef.current, false);
      return res;
    };

    const renderCanvas = (img, skipHandles = false) => {
      if (typeof window !== 'undefined') {
        window.__memeCanvasForceRender = () => {
          renderCanvas(baseImgRef.current, false);
        };
      }
      if (canvas.width !== canvasW) canvas.width = canvasW;
      if (canvas.height !== totalCanvasH) canvas.height = totalCanvasH;

      const filterScope = activeFilters?.filterScope || 'all';
      const filterCss = getFilterCss(activeFilters);
      const applyGlobalFilter = filterScope === 'all' && filterCss !== 'none';
      const bgFilterCss = applyGlobalFilter ? 'none' : (filterScope === 'background' ? filterCss : 'none');

      let targetCtx = ctx;
      let compCanvas = null;

      if (applyGlobalFilter) {
        if (!compCanvasRef.current) {
          compCanvasRef.current = document.createElement('canvas');
        }
        compCanvas = compCanvasRef.current;
        if (compCanvas.width !== canvasW) compCanvas.width = canvasW;
        if (compCanvas.height !== totalCanvasH) compCanvas.height = totalCanvasH;
        targetCtx = compCanvas.getContext('2d');
      }

      targetCtx.clearRect(0, 0, canvas.width, canvas.height);
      targetCtx.fillStyle = demotivational?.enabled ? '#000000' : liveBgColor;
      targetCtx.fillRect(0, 0, canvas.width, canvas.height);

      let activeHandleDrawer = null;

      // Modern UI Handle Drawer Helpers (Matches User Reference Image: Coral Outline, White Badges, Top-Left ✕, Bottom-Right ⤢, Side Capsules)
      const THEME_CORAL = '#f06853';
      const THEME_GLOW = 'rgba(240, 104, 83, 0.45)';
      const THEME_BADGE_BG = '#ffffff';

      // 1. Selection Box Outline (Smooth rounded rectangle with soft coral glow)
      const drawSelectionBox = (uiCtx, bx, by, bw, bh, radius = 10) => {
        uiCtx.save();
        uiCtx.shadowColor = THEME_GLOW;
        uiCtx.shadowBlur = 8;
        uiCtx.shadowOffsetY = 0;
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 2.4;
        uiCtx.beginPath();
        if (uiCtx.roundRect) {
          uiCtx.roundRect(bx, by, bw, bh, radius);
        } else {
          uiCtx.rect(bx, by, bw, bh);
        }
        uiCtx.stroke();
        uiCtx.restore();
      };

      // 2. Delete Handle (Top-Left corner handle: crisp white circular badge, coral border & coral ✕ icon, increased size)
      const drawDeleteHandle = (uiCtx, hx, hy) => {
        uiCtx.save();
        uiCtx.shadowColor = 'rgba(0, 0, 0, 0.28)';
        uiCtx.shadowBlur = 6;
        uiCtx.shadowOffsetY = 1.5;

        // Button background circle (increased to radius 18)
        uiCtx.beginPath();
        uiCtx.arc(hx, hy, 18, 0, Math.PI * 2);
        uiCtx.fillStyle = THEME_BADGE_BG;
        uiCtx.fill();

        // Coral border
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 2.4;
        uiCtx.stroke();

        // Coral ✕ inside (scaled up to match radius 18)
        uiCtx.shadowColor = 'transparent';
        uiCtx.beginPath();
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 2.4;
        uiCtx.lineCap = 'round';
        const cr = 5.5;
        uiCtx.moveTo(hx - cr, hy - cr);
        uiCtx.lineTo(hx + cr, hy + cr);
        uiCtx.moveTo(hx + cr, hy - cr);
        uiCtx.lineTo(hx - cr, hy + cr);
        uiCtx.stroke();
        uiCtx.restore();
      };

      // 3. Resize Handle (Bottom-Right corner handle: crisp white circular badge, coral border & diagonal double-arrows ⤢, increased size)
      const drawResizeHandle = (uiCtx, hx, hy) => {
        uiCtx.save();
        uiCtx.shadowColor = 'rgba(0, 0, 0, 0.28)';
        uiCtx.shadowBlur = 6;
        uiCtx.shadowOffsetY = 1.5;

        // Button background circle (increased to radius 18)
        uiCtx.beginPath();
        uiCtx.arc(hx, hy, 18, 0, Math.PI * 2);
        uiCtx.fillStyle = THEME_BADGE_BG;
        uiCtx.fill();

        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 2.4;
        uiCtx.stroke();

        // Diagonal double-arrow icon inside (scaled up for radius 18)
        uiCtx.shadowColor = 'transparent';
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 2.4;
        uiCtx.lineCap = 'round';
        uiCtx.lineJoin = 'round';

        // Inside-out diagonal connecting stem (from inside/top-left to outside/bottom-right)
        uiCtx.beginPath();
        uiCtx.moveTo(hx - 5.5, hy - 5.5);
        uiCtx.lineTo(hx + 5.5, hy + 5.5);
        uiCtx.stroke();

        // Inward arrowhead ↖ (pointing inside toward box center)
        uiCtx.beginPath();
        uiCtx.moveTo(hx - 1.5, hy - 5.5);
        uiCtx.lineTo(hx - 5.5, hy - 5.5);
        uiCtx.lineTo(hx - 5.5, hy - 1.5);
        uiCtx.stroke();

        // Outward arrowhead ↘ (pointing outside away from box)
        uiCtx.beginPath();
        uiCtx.moveTo(hx + 1.5, hy + 5.5);
        uiCtx.lineTo(hx + 5.5, hy + 5.5);
        uiCtx.lineTo(hx + 5.5, hy + 1.5);
        uiCtx.stroke();

        uiCtx.restore();
      };

      // 4. Corner Knob (fallback if ever needed)
      const drawRoundHandle = (uiCtx, hx, hy) => {
        drawResizeHandle(uiCtx, hx, hy);
      };

      // 5. Side Stretch Handle (Crisp white rounded capsule for width stretching)
      const drawSideHandle = (uiCtx, hx, hy, isVertical = true) => {
        uiCtx.save();
        uiCtx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        uiCtx.shadowBlur = 5;
        uiCtx.shadowOffsetY = 1;

        uiCtx.beginPath();
        if (isVertical) {
          if (uiCtx.roundRect) {
            uiCtx.roundRect(hx - 4, hy - 13, 8, 26, 4);
          } else {
            uiCtx.rect(hx - 4, hy - 13, 8, 26);
          }
        } else {
          if (uiCtx.roundRect) {
            uiCtx.roundRect(hx - 13, hy - 4, 26, 8, 4);
          } else {
            uiCtx.rect(hx - 13, hy - 4, 26, 8);
          }
        }
        uiCtx.fillStyle = THEME_BADGE_BG;
        uiCtx.fill();
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 2;
        uiCtx.stroke();
        uiCtx.restore();
      };

      // 6. Rotation Handle (Clean vertical stem + crisp white rotation knob with circular arrow)
      const drawRotateHandle = (uiCtx, startX, startY, knobX, knobY) => {
        uiCtx.save();
        // Rotation stem
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 1.8;
        uiCtx.beginPath();
        uiCtx.moveTo(startX, startY);
        uiCtx.lineTo(knobX, knobY);
        uiCtx.stroke();

        // Rotation knob
        uiCtx.shadowColor = 'rgba(0, 0, 0, 0.28)';
        uiCtx.shadowBlur = 6;
        uiCtx.shadowOffsetY = 1.5;
        uiCtx.beginPath();
        uiCtx.arc(knobX, knobY, 15, 0, Math.PI * 2);
        uiCtx.fillStyle = THEME_BADGE_BG;
        uiCtx.fill();
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 2.2;
        uiCtx.stroke();

        // Circular rotate icon inside knob
        uiCtx.shadowColor = 'transparent';
        uiCtx.strokeStyle = THEME_CORAL;
        uiCtx.lineWidth = 2;
        uiCtx.lineCap = 'round';
        uiCtx.beginPath();
        uiCtx.arc(knobX, knobY, 6.5, -Math.PI * 0.7, Math.PI * 0.8);
        uiCtx.stroke();

        // Arrowhead
        uiCtx.fillStyle = THEME_CORAL;
        uiCtx.beginPath();
        uiCtx.moveTo(knobX + 4.5, knobY + 4.5);
        uiCtx.lineTo(knobX + 8, knobY);
        uiCtx.lineTo(knobX + 4, knobY - 3);
        uiCtx.fill();
        uiCtx.restore();
      };

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

      // Draw Base Image or Native Layout Slots
      if (activeIsNativeLayout && activeLayoutDef) {
        const totalSlots = activeLayoutDef.slots;
        const isVert = activeLayoutDef.id === '2-vert' || activeLayoutDef.id === '3-stacked';
        const isHoriz = activeLayoutDef.id === '2-horiz' || activeLayoutDef.id === '3-horiz';
        const isGrid = activeLayoutDef.id === '4-grid';
        const isHybrid = activeLayoutDef.id === '3-hybrid';

        for (let idx = 0; idx < totalSlots; idx++) {
          let x = 0, y = 0, slotW = imageAreaW, slotH = imageAreaH;

          if (isVert) {
            slotH = imageAreaH / totalSlots;
            y = idx * slotH;
          } else if (isHoriz) {
            slotW = imageAreaW / totalSlots;
            x = idx * slotW;
          } else if (isGrid) {
            slotW = imageAreaW / 2;
            slotH = imageAreaH / 2;
            x = (idx % 2) * slotW;
            y = Math.floor(idx / 2) * slotH;
          } else if (isHybrid) {
            if (idx === 0) {
              slotW = imageAreaW;
              slotH = imageAreaH / 2;
              x = 0;
              y = 0;
            } else {
              slotW = imageAreaW / 2;
              slotH = imageAreaH / 2;
              x = (idx - 1) * slotW;
              y = imageAreaH / 2;
            }
          }

          const src = slotImages[idx];
          if (src) {
            const cached = imageCacheRef.current[src];
            if (cached) {
              const tx = slotTransforms[idx] || { offsetX: 0, offsetY: 0, scale: 1.5 };
              const scale = Math.min(slotW / cached.width, slotH / cached.height) * (tx.scale || 1.0);
              const nw = cached.width * scale;
              const nh = cached.height * scale;
              const nx = x + (slotW - nw) / 2 + (tx.offsetX * slotW);
              const ny = imageAreaY + y + (slotH - nh) / 2 + (tx.offsetY * slotH);

              targetCtx.save();
              targetCtx.beginPath();
              targetCtx.rect(x, imageAreaY + y, slotW, slotH);
              targetCtx.clip();
              if (canvasFlipX) {
                targetCtx.translate(x + slotW / 2, 0);
                targetCtx.scale(-1, 1);
                targetCtx.translate(-(x + slotW / 2), 0);
              }
              try {
                drawImageFiltered(targetCtx, cached, bgFilterCss, nx, ny, nw, nh);
              } catch (err) {
                console.warn('Failed to draw slot image:', err);
              }
              targetCtx.restore();
            } else {
              // Load image and re-render
              const newImg = new Image();
              if (src && !src.startsWith('blob:') && !src.startsWith('data:')) newImg.crossOrigin = 'anonymous';
              newImg.onload = () => {
                imageCacheRef.current[src] = newImg;
                if (baseImgRef.current || activeIsNativeLayout) renderCanvas(baseImgRef.current);
              };
              newImg.src = src;
              
              targetCtx.fillStyle = liveBgColor;
              targetCtx.fillRect(x, imageAreaY + y, slotW, slotH);
            }
          } else {
            targetCtx.fillStyle = liveBgColor;
            targetCtx.fillRect(x, imageAreaY + y, slotW, slotH);
          }

          if (activeLayoutDef.id !== '1-panel' && totalSlots > 1) {
            targetCtx.strokeStyle = '#000000';
            targetCtx.lineWidth = 2;
            targetCtx.strokeRect(x, imageAreaY + y, slotW, slotH);
          }
        }
      } else if (img && !isNativeLayout) {
        let drawW = imageAreaW;
        let drawH = imageAreaH;
        let offsetX = 0;
        let offsetY = imageAreaY;

        if (imageFit === 'stretch') {
          drawW = imageAreaW;
          drawH = imageAreaH;
          offsetX = imageAreaX;
          offsetY = imageAreaY;
        } else if (imageFit === 'contain') {
          const imgRatio = img.width / img.height;
          const canvasRatio = imageAreaW / imageAreaH;

          if (imgRatio > canvasRatio) {
            drawW = imageAreaW;
            drawH = imageAreaW / imgRatio;
            offsetX = imageAreaX;
            offsetY = imageAreaY + (imageAreaH - drawH) / 2;
          } else {
            drawH = imageAreaH;
            drawW = imageAreaH * imgRatio;
            offsetY = imageAreaY;
            offsetX = imageAreaX + (imageAreaW - drawW) / 2;
          }
        } else {
          const imgRatio = img.width / img.height;
          const canvasRatio = imageAreaW / imageAreaH;

          if (imgRatio > canvasRatio) {
            drawH = imageAreaH;
            drawW = imageAreaH * imgRatio;
            offsetX = imageAreaX + (imageAreaW - drawW) / 2;
            offsetY = imageAreaY;
          } else {
            drawW = imageAreaW;
            drawH = imageAreaW / imgRatio;
            offsetY = imageAreaY + (imageAreaH - drawH) / 2;
            offsetX = imageAreaX;
          }
        }
        targetCtx.save();
        if (canvasFlipX) {
          targetCtx.translate(imageAreaX + imageAreaW / 2, 0);
          targetCtx.scale(-1, 1);
          targetCtx.translate(-(imageAreaX + imageAreaW / 2), 0);
        }
        if (demotivational?.enabled) {
          targetCtx.beginPath();
          targetCtx.rect(imageAreaX, imageAreaY, imageAreaW, imageAreaH);
          targetCtx.clip();
        }
        drawImageFiltered(targetCtx, img, bgFilterCss, offsetX, offsetY, drawW, drawH);
        targetCtx.restore();

        if (demotivational?.enabled) {
          targetCtx.save();
          targetCtx.strokeStyle = '#ffffff';
          targetCtx.lineWidth = 2;
          targetCtx.strokeRect(imageAreaX - 5, imageAreaY - 5, imageAreaW + 10, imageAreaH + 10);
          targetCtx.restore();
        }
      }

      // Draw Header Extension (Banner extending above canvas)
      if (isHeaderEnabled && headerExtH > 0) {
        targetCtx.save();
        // 1. Solid background for header extension (matches canvas background color)
        const extBg = liveBgColor || canvasBgColor || canvasHeader?.bgColor || '#ffffff';
        targetCtx.fillStyle = extBg;
        targetCtx.fillRect(0, 0, canvasW, headerExtH);

        // 2. Crisp boundary divider line between header extension and meme image
        const isDark = isColorDark(extBg);
        targetCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
        targetCtx.lineWidth = 1;
        targetCtx.beginPath();
        targetCtx.moveTo(0, headerExtH);
        targetCtx.lineTo(canvasW, headerExtH);
        targetCtx.stroke();
        targetCtx.restore();
      }

      // Draw Footer Extension (Banner extending below canvas)
      if (isFooterEnabled && footerExtH > 0) {
        targetCtx.save();
        const footerY = headerExtH + canvasH;
        // 1. Solid background for footer extension (matches canvas background color)
        const extBg = liveBgColor || canvasBgColor || canvasFooter?.bgColor || '#ffffff';
        targetCtx.fillStyle = extBg;
        targetCtx.fillRect(0, footerY, canvasW, footerExtH);

        // 2. Crisp boundary divider line between meme image and footer extension
        const isDark = isColorDark(extBg);
        targetCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
        targetCtx.lineWidth = 1;
        targetCtx.beginPath();
        targetCtx.moveTo(0, footerY);
        targetCtx.lineTo(canvasW, footerY);
        targetCtx.stroke();
        targetCtx.restore();
      }

      // Reset filter for text/stickers/image-layers overlay (safe on all browsers)
      try { targetCtx.filter = 'none'; } catch(e) {}

      // Render Custom Image Overlay Layers
            const allLayers = [
        ...(imageLayers || []).map(l => ({ ...l, _type: 'imageLayer', zIndex: l.zIndex || 0 })),
        ...(stickers || []).map(l => ({ ...l, _type: 'sticker', zIndex: l.zIndex || 0 })),
        ...(captions || []).map(l => ({ ...l, _type: 'caption', zIndex: l.zIndex || 0 }))
      ];
      allLayers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      allLayers.forEach((layer) => {
        if (layer.hidden) return;
        if (layer._type === 'imageLayer') {
          const imgLayer = layer;
        const cx = imgLayer.x * canvas.width;
        const cy = getImageLayerCenterY(imgLayer);
        const cached = imageCacheRef.current[imgLayer.url];

        if (cached) {
          const baseW = cached.width || 200;
          const baseH = cached.height || 200;
          let drawSource = cached;

          if (imgLayer.filters || imgLayer.filter) {
            const filterObj = imgLayer.filters || imgLayer.filter;
            const filterCss = getFilterCss(filterObj);
            if (filterCss !== 'none') {
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = baseW;
              tempCanvas.height = baseH;
              const tempCtx = tempCanvas.getContext('2d');
              // iOS-safe: uses pixel-level fallback on iOS Safari
              drawImageFiltered(tempCtx, cached, filterCss, 0, 0, baseW, baseH);
              drawSource = tempCanvas;
            }
          }

          targetCtx.save();
          targetCtx.translate(cx, cy);
          if (imgLayer.rotation) {
            targetCtx.rotate((imgLayer.rotation * Math.PI) / 180);
          }
          if (imgLayer.flipX) {
            targetCtx.scale(-1, 1);
          }
          if (imgLayer.opacity !== undefined) {
            targetCtx.globalAlpha = imgLayer.opacity;
          }
          
          const scale = imgLayer.scale || 1.0;
          const maxDim = 320;
          const fitScale = Math.min(maxDim / baseW, maxDim / baseH);
          const crop = imgLayer.crop || { x: 0, y: 0, width: 1, height: 1 };
          const naturalFullW = baseW * fitScale * scale;
          const naturalFullH = baseH * fitScale * scale;
          const w = imgLayer.boxWidth || imgLayer.width || Math.round(naturalFullW * (crop.width || 1));
          const h = imgLayer.boxHeight || imgLayer.height || Math.round(naturalFullH * (crop.height || 1));

          const mode = imgLayer.fitMode || 'fit';
          
          if (mode === 'crop') {
            const sx = Math.max(0, Math.min(baseW - 1, (crop.x || 0) * baseW));
            const sy = Math.max(0, Math.min(baseH - 1, (crop.y || 0) * baseH));
            const sw = Math.max(1, Math.min(baseW - sx, (crop.width || 1) * baseW));
            const sh = Math.max(1, Math.min(baseH - sy, (crop.height || 1) * baseH));

            targetCtx.save();
            targetCtx.beginPath();
            if (imgLayer.isFaceMorph) {
              targetCtx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
            } else {
              targetCtx.rect(-w / 2, -h / 2, w, h);
            }
            targetCtx.clip();
            targetCtx.drawImage(drawSource, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
            targetCtx.restore();
          } else if (mode === 'stretch') {
            const sx = Math.max(0, Math.min(baseW - 1, (crop.x || 0) * baseW));
            const sy = Math.max(0, Math.min(baseH - 1, (crop.y || 0) * baseH));
            const sw = Math.max(1, Math.min(baseW - sx, (crop.width || 1) * baseW));
            const sh = Math.max(1, Math.min(baseH - sy, (crop.height || 1) * baseH));
            targetCtx.drawImage(drawSource, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
          } else { // fit
            const hasCrop = (crop.width && crop.width < 1) || (crop.height && crop.height < 1) || (crop.x || 0) > 0 || (crop.y || 0) > 0;
            const sx = hasCrop ? Math.max(0, Math.min(baseW - 1, (crop.x || 0) * baseW)) : 0;
            const sy = hasCrop ? Math.max(0, Math.min(baseH - 1, (crop.y || 0) * baseH)) : 0;
            const sw = hasCrop ? Math.max(1, Math.min(baseW - sx, (crop.width || 1) * baseW)) : baseW;
            const sh = hasCrop ? Math.max(1, Math.min(baseH - sy, (crop.height || 1) * baseH)) : baseH;

            const imgAspect = sw / sh;
            const boxAspect = w / h;
            let drawW = w;
            let drawH = h;
            
            if (boxAspect > imgAspect) {
              drawH = h;
              drawW = h * imgAspect;
            } else {
              drawW = w;
              drawH = w / imgAspect;
            }
            
            targetCtx.save();
            targetCtx.beginPath();
            if (imgLayer.isFaceMorph) {
              targetCtx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
            } else {
              targetCtx.rect(-w / 2, -h / 2, w, h);
            }
            targetCtx.clip();
            targetCtx.drawImage(drawSource, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
            targetCtx.restore();
          }

          if (imgLayer.id === activeLayerId && !isDrawingMode) {
            const hw = w / 2 + 6;
            const hh = h / 2 + 6;
            const rot = imgLayer.rotation || 0;

            activeHandleDrawer = (uiCtx) => {
              uiCtx.save();
              uiCtx.translate(cx, cy);
              if (rot) {
                uiCtx.rotate((rot * Math.PI) / 180);
              }
              if (imgLayer.locked) {
                uiCtx.strokeStyle = '#f59e0b';
                uiCtx.lineWidth = 2.5;
                uiCtx.setLineDash([4, 4]);
                uiCtx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
                uiCtx.setLineDash([]);
                uiCtx.fillStyle = '#f59e0b';
                uiCtx.font = 'bold 12px sans-serif';
                uiCtx.textAlign = 'center';
                uiCtx.fillText('🔒 LOCKED', 0, -hh - 14);
                uiCtx.restore();
                return;
              }

              if (imgLayer.isFaceMorph) {
                // Sleek, glowing face reticle (matching coral theme)
                uiCtx.strokeStyle = THEME_CORAL;
                uiCtx.lineWidth = 2.4;
                uiCtx.setLineDash([5, 5]);
                uiCtx.beginPath();
                uiCtx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
                uiCtx.stroke();
                uiCtx.setLineDash([]);

                // Rotation handle stem & circle
                drawRotateHandle(uiCtx, 0, -hh, 0, -hh - 28);

                // Round size handles (Bottom Right corner)
                drawResizeHandle(uiCtx, hw * 0.72, hh * 0.72);

                // Delete handle (Top Left)
                drawDeleteHandle(uiCtx, -hw * 0.72, -hh * 0.72);

                // Floating badge
                uiCtx.save();
                uiCtx.fillStyle = THEME_BADGE_BG;
                uiCtx.strokeStyle = THEME_CORAL;
                uiCtx.lineWidth = 1.5;
                const badgeText = `🎭 ${imgLayer.faceName || 'Face Morph'} (${Math.round((imgLayer.opacity !== undefined ? imgLayer.opacity : 1) * 100)}%)`;
                uiCtx.font = 'bold 12px sans-serif';
                const textW = uiCtx.measureText(badgeText).width;
                uiCtx.beginPath();
                uiCtx.roundRect(-textW / 2 - 8, hh + 12, textW + 16, 24, 12);
                uiCtx.fill();
                uiCtx.stroke();
                uiCtx.fillStyle = THEME_CORAL;
                uiCtx.textAlign = 'center';
                uiCtx.textBaseline = 'middle';
                uiCtx.fillText(badgeText, 0, hh + 24);
                uiCtx.restore();

                uiCtx.restore();
                return;
              }

              const isCropping = imgLayer.fitMode === 'crop';

              // Reference Image Style: Coral Glow Rounded Box with Side Handles
              drawSelectionBox(uiCtx, -hw, -hh, w + 12, h + 12, 10);

              if (isCropping) {
                // Subtle rule-of-thirds grid in crop mode
                uiCtx.save();
                uiCtx.strokeStyle = 'rgba(240, 104, 83, 0.35)';
                uiCtx.lineWidth = 1;
                uiCtx.setLineDash([3, 3]);
                uiCtx.beginPath();
                uiCtx.moveTo(-hw + (w + 12) / 3, -hh);
                uiCtx.lineTo(-hw + (w + 12) / 3, hh);
                uiCtx.moveTo(-hw + (w + 12) * 2 / 3, -hh);
                uiCtx.lineTo(-hw + (w + 12) * 2 / 3, hh);
                uiCtx.moveTo(-hw, -hh + (h + 12) / 3);
                uiCtx.lineTo(hw, -hh + (h + 12) / 3);
                uiCtx.moveTo(-hw, -hh + (h + 12) * 2 / 3);
                uiCtx.lineTo(hw, -hh + (h + 12) * 2 / 3);
                uiCtx.stroke();
                uiCtx.restore();
              } else {
                // Rotation handle
                drawRotateHandle(uiCtx, 0, -hh, 0, -hh - 28);

                // Corner handles:
                // Top-Left IS the Delete Handle!
                drawDeleteHandle(uiCtx, -hw, -hh);
                // Bottom-Right IS the Resize Handle!
                drawResizeHandle(uiCtx, hw, hh);
              }

              // 4 Middle-of-side handles (used for freeform cropping in crop mode, or stretching)
              drawSideHandle(uiCtx, 0, -hh, false);  // Top middle
              drawSideHandle(uiCtx, 0, hh, false);   // Bottom middle
              drawSideHandle(uiCtx, -hw, 0, true);   // Left middle
              drawSideHandle(uiCtx, hw, 0, true);    // Right middle
              uiCtx.restore();
            };
          }

          targetCtx.restore();
        } else {
          const newImg = new Image();
          if (imgLayer.url && !imgLayer.url.startsWith('blob:') && !imgLayer.url.startsWith('data:')) newImg.crossOrigin = 'anonymous';
          newImg.onload = () => {
            imageCacheRef.current[imgLayer.url] = newImg;
            renderCanvas(baseImgRef.current);
          };
          newImg.src = imgLayer.url;
        }
              } else if (layer._type === 'sticker') {
          const stk = layer;
        
        const sx = stk.x * canvas.width;
        const sy = getStickerCenterY(stk);
        targetCtx.save();
        targetCtx.translate(sx, sy);
        if (stk.rotation) targetCtx.rotate(stk.rotation * Math.PI / 180);
        if (stk.flipX) targetCtx.scale(-1, 1);
        
        const stkSize = (stk.scale || 1.0) * 52;
        targetCtx.font = `${stkSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';

        if (stk.id === activeLayerId && !isDrawingMode) {
          const rot = stk.rotation || 0;
          activeHandleDrawer = (uiCtx) => {
            uiCtx.save();
            uiCtx.translate(sx, sy);
            if (rot) uiCtx.rotate(rot * Math.PI / 180);
            if (stk.locked) {
              uiCtx.strokeStyle = '#f59e0b';
              uiCtx.lineWidth = 2.5;
              uiCtx.setLineDash([4, 4]);
              uiCtx.strokeRect(-stkSize / 2 - 6, -stkSize / 2 - 6, stkSize + 12, stkSize + 12);
              uiCtx.setLineDash([]);
              uiCtx.fillStyle = '#f59e0b';
              uiCtx.font = 'bold 12px sans-serif';
              uiCtx.textAlign = 'center';
              uiCtx.fillText('🔒 LOCKED', 0, -stkSize / 2 - 14);
              uiCtx.restore();
              return;
            }
            const hs = stkSize / 2 + 6;

            // Reference Image Style: Coral Glow Rounded Box with Top-Left Delete, Bottom-Right Resize & Side Handles
            drawSelectionBox(uiCtx, -hs, -hs, stkSize + 12, stkSize + 12, 10);

            // Side Handles: Left & Right Capsules
            drawSideHandle(uiCtx, -hs, 0, true);
            drawSideHandle(uiCtx, hs, 0, true);

            // Top Rotation Stem & Handle
            drawRotateHandle(uiCtx, 0, -hs, 0, -hs - 28);

            // Corner Handles:
            // Top-Left IS the Delete Handle!
            drawDeleteHandle(uiCtx, -hs, -hs);
            // Bottom-Right IS the Resize Handle!
            drawResizeHandle(uiCtx, hs, hs);

            uiCtx.restore();
          };
        }

        if (stk.url || stk.imageUrl) {
          const imgUrl = stk.url || stk.imageUrl;
          const cached = imageCacheRef.current[imgUrl];
          if (cached && (cached.complete && (cached.naturalWidth || cached.width))) {
            const aspect = (cached.naturalWidth || cached.width) / ((cached.naturalHeight || cached.height) || 1);
            const drawW = aspect >= 1 ? stkSize : stkSize * aspect;
            const drawH = aspect >= 1 ? stkSize / aspect : stkSize;
            if (stk.dieCut) {
              renderDieCutImage(targetCtx, cached, drawW, drawH, stk.dieCutColor || '#ffffff', stk.dieCutWidth || 6);
            } else {
              targetCtx.drawImage(cached, -drawW / 2, -drawH / 2, drawW, drawH);
            }
          } else {
            if (!loadingMediaRef.current[imgUrl]) {
              loadingMediaRef.current[imgUrl] = true;
              const newImg = new Image();
              if (imgUrl && !imgUrl.startsWith('blob:') && !imgUrl.startsWith('data:')) newImg.crossOrigin = 'anonymous';
              newImg.onload = () => {
                imageCacheRef.current[imgUrl] = newImg;
                renderCanvas(baseImgRef.current);
              };
              newImg.src = imgUrl;
            }
          }
        } else if (stk.emoji) {
          if (stk.dieCut) {
            renderDieCutEmoji(targetCtx, stk.emoji, stkSize, stk.dieCutColor || '#ffffff', stk.dieCutWidth || 6);
          } else {
            targetCtx.fillText(stk.emoji, 0, 0);
          }
        }
        targetCtx.restore();
              } else if (layer._type === 'caption') {
          const cap = layer;
        let cx = (cap.x ?? 0.5) * canvas.width;
        let cy = getCaptionCenterY(cap, canvas);
        if (cap.isWhatsAppCard) {
          const cardW = Math.max(180, (cap.width || 0.82) * canvas.width);
          const halfW = cardW / 2;
          const minPadX = 14;
          if (cardW <= canvas.width - minPadX * 2) {
            cx = Math.max(halfW + minPadX, Math.min(canvas.width - halfW - minPadX, cx));
          }
        }
        
        targetCtx.save();
        targetCtx.translate(cx, cy);
        if (cap.rotation) targetCtx.rotate(cap.rotation * Math.PI / 180);

        // Text opacity support (0.0 to 1.0)
        let opacity = 1;
        if (cap.opacity !== undefined && cap.opacity !== null) {
          const num = Number(cap.opacity);
          if (!isNaN(num)) {
            opacity = num > 1 ? num / 100 : num;
            opacity = Math.max(0, Math.min(1, opacity));
          }
        }
        targetCtx.globalAlpha = opacity;

        // Text blur support (px)
        if (cap.blur && Number(cap.blur) > 0) {
          targetCtx.filter = `blur(${Number(cap.blur)}px)`;
        } else {
          targetCtx.filter = 'none';
        }

        const fontSize = cap.fontSize || 50;
        const fontFamily = cap.fontFamily || 'Impact, sans-serif';
        targetCtx.font = `bold ${fontSize}px ${fontFamily}`;
        const align = cap.align || 'center';
        targetCtx.textAlign = align;
        targetCtx.textBaseline = 'middle';

        const renderMaxWidth = (cap.width || 0.9) * canvas.width;
        
        const displayString = cap.text || '';
        
        // Use the SAME global wrapText for rendering and hit-testing
        const lines = wrapText(targetCtx, displayString, renderMaxWidth);
        
        let maxLineWidth = 0;
        for (const line of lines) {
          maxLineWidth = Math.max(maxLineWidth, targetCtx.measureText(line).width);
        }
        // Draw Meme Text Background if enabled (white, black, or custom)
        const isBubble = !!cap.bubbleStyle;
        const hasBg = (cap.bgColor && cap.bgColor !== 'transparent' && cap.bgColor !== 'none') || isBubble;

        // The visual bounding box is sized to match the actual text
        const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(16, fontSize * 0.25));
        const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(10, fontSize * 0.16));
        let boxWidth = (cap.hasCustomWidth && cap.width)
          ? Math.max(maxLineWidth + padX * 2, cap.width * canvas.width)
          : (maxLineWidth + padX * 2);
        boxWidth = Math.min(canvas.width - 16, boxWidth);
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        let boxHeight = totalHeight + padY * 2;
        if (cap.curve && Math.abs(cap.curve) > 0) {
          boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
        }
        const startY = - ((lines.length - 1) * lineHeight) / 2;

        if (cap.isBreakingNews) {
          boxWidth = Math.max(300, (cap.width || 0.94) * canvas.width);
          boxHeight = getBreakingNewsHeight(cap);
          drawBreakingNewsChyron(targetCtx, boxWidth, cap);
        } else if (cap.isTweetCard) {
          boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
          boxHeight = getTweetCardHeight(targetCtx, cap, boxWidth);
          drawTweetCard(targetCtx, boxWidth, cap);
        } else if (cap.isInstagramCard) {
          boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
          boxHeight = getInstagramCardHeight(targetCtx, cap, boxWidth);
          drawInstagramCard(targetCtx, boxWidth, cap);
        } else if (cap.isWhatsAppCard) {
          boxWidth = Math.max(180, (cap.width || 0.84) * canvas.width);
          boxHeight = getWhatsAppCardHeight(targetCtx, cap, boxWidth);
          drawWhatsAppCard(targetCtx, boxWidth, cap);
        } else {
          let bgFillColor = '#ffffff';
          if (isBubble) {
            const boxStartX = - boxWidth / 2;
            const boxStartY = - boxHeight / 2;
            const bubbleFill = cap.bgColor === 'black' ? '#000000' : (cap.bgColor || '#ffffff');
            const bubbleBorder = cap.stroke && cap.stroke !== 'transparent' ? cap.stroke : (bubbleFill === '#000000' ? '#ffffff' : '#000000');
            const bubbleStrokeWidth = cap.strokeWidth || 3;
            drawSpeechBubble(targetCtx, boxStartX, boxStartY, boxWidth, boxHeight, cap.bubbleStyle, bubbleFill, bubbleBorder, bubbleStrokeWidth);
          } else if (hasBg) {
            targetCtx.save();
            bgFillColor = cap.bgColor === 'white' ? '#ffffff' : (cap.bgColor === 'black' ? '#000000' : cap.bgColor);
            targetCtx.fillStyle = bgFillColor;

            if (cap.bgStyle === 'banner') {
              // Full-width edge-to-edge banner across the canvas
              const bannerPadY = Math.max(14, fontSize * 0.28);
              const bannerH = totalHeight + bannerPadY * 2;
              const bannerY = startY - lineHeight / 2 - bannerPadY;
              const bannerX = -cx;
              const bannerW = canvas.width;
              targetCtx.fillRect(bannerX, bannerY, bannerW, bannerH);
            } else {
              // Box style: clean padded rounded rectangle enclosing the text
              const boxStartX = - boxWidth / 2;
              const boxStartY = - boxHeight / 2;
              const r = Math.min(8, fontSize * 0.15);
              drawRoundRect(targetCtx, boxStartX, boxStartY, boxWidth, boxHeight, r);
            }
            targetCtx.restore();
          }

          // Determine text color with smart contrast for White / Black BG and Bubbles
          let textColor = cap.color || '#ffffff';
          if (isBubble) {
            if (cap.bubbleStyle === 'imessage-send' || cap.bubbleStyle === 'whatsapp-send') {
              textColor = '#ffffff';
            } else if (cap.bubbleStyle === 'imessage-receive') {
              textColor = isColorDark(cap.bgColor) ? '#ffffff' : '#000000';
            } else if (cap.bubbleStyle === 'whatsapp-receive') {
              textColor = isColorDark(cap.bgColor) ? '#ffffff' : '#111b21';
            } else {
              const bubbleFill = cap.bgColor === 'black' ? '#000000' : (cap.bgColor || '#ffffff');
              textColor = isColorDark(bubbleFill) ? '#ffffff' : '#000000';
            }
          } else if (cap.bgColor === 'white' && (textColor.toLowerCase() === '#ffffff' || textColor.toLowerCase() === '#fff' || textColor === 'white')) {
            textColor = '#000000';
          } else if (cap.bgColor === 'black' && (textColor.toLowerCase() === '#000000' || textColor.toLowerCase() === '#000' || textColor === 'black')) {
            textColor = '#ffffff';
          }

          const shouldStroke = cap.stroke && cap.stroke !== 'transparent' && (!hasBg || (cap.stroke !== cap.bgColor && cap.stroke !== bgFillColor));
          const textAnchorX = align === 'left' ? (-boxWidth / 2 + padX) : (align === 'right' ? (boxWidth / 2 - padX) : 0);

          lines.forEach((line, index) => {
            const ly = startY + index * lineHeight;

            if (cap.curve && Math.abs(cap.curve) > 0) {
              drawCurvedText(
                targetCtx,
                line,
                cap.curve,
                ly,
                textAnchorX,
                fontSize,
                shouldStroke,
                cap.stroke,
                cap.strokeWidth || Math.max(3, fontSize / 7),
                textColor,
                cap.effect
              );
            } else {
              drawTextLineWithEffect(
                targetCtx,
                line,
                textAnchorX,
                ly,
                fontSize,
                shouldStroke,
                cap.stroke,
                cap.strokeWidth || Math.max(3, fontSize / 7),
                textColor,
                cap.effect
              );
            }
          });
        }

        if (cap.id === activeLayerId && !isDrawingMode) {
          const rot = cap.rotation || 0;
          activeHandleDrawer = (uiCtx) => {
            uiCtx.save();
            uiCtx.translate(cx, cy);
            if (rot) uiCtx.rotate((rot * Math.PI) / 180);
            uiCtx.globalAlpha = 1.0;
            const boxX = - boxWidth / 2;
            const boxY = - boxHeight / 2;

            if (cap.locked) {
              uiCtx.strokeStyle = '#f59e0b';
              uiCtx.lineWidth = 2.5;
              uiCtx.setLineDash([4, 4]);
              uiCtx.strokeRect(boxX, boxY, boxWidth, boxHeight);
              uiCtx.setLineDash([]);
              uiCtx.fillStyle = '#f59e0b';
              uiCtx.font = 'bold 12px sans-serif';
              uiCtx.textAlign = 'center';
              uiCtx.fillText('🔒 LOCKED', 0, boxY - 14);
              uiCtx.restore();
              return;
            }

            // Reference Image Style: Coral Glow Rounded Box with Top-Left Delete, Bottom-Right Resize & Side Handles
            drawSelectionBox(uiCtx, boxX, boxY, boxWidth, boxHeight, 10);

            // Side Handles: Left & Right Capsules
            drawSideHandle(uiCtx, boxX, 0, true); // Middle Left
            drawSideHandle(uiCtx, boxX + boxWidth, 0, true); // Middle Right

            // Corner Handles:
            // Top-Left IS the Delete Handle!
            drawDeleteHandle(uiCtx, boxX, boxY);
            // Bottom-Right IS the Resize / Scale Handle (with diagonal arrows ⤢)
            drawResizeHandle(uiCtx, boxX + boxWidth, boxY + boxHeight);
            // (Note: Top-Right duplicate button omitted per user request; Top-Right & Bottom-Left remain clean rounded corners)

            // Top Rotation Stem & Handle
            drawRotateHandle(uiCtx, 0, boxY, 0, boxY - 28);

            // Live Dimension / Size pill feedback during drag
            if (isDragging.current && dragTarget.current?.id === cap.id && dragTarget.current?.type?.startsWith('resize_caption_')) {
              uiCtx.save();
              const isWidthResize = dragTarget.current.type === 'resize_caption_l' || dragTarget.current.type === 'resize_caption_r';
              const label = isWidthResize
                ? `Width: ${Math.round(boxWidth)}px`
                : `Font: ${Math.round(cap.fontSize || 50)}px`;
              uiCtx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              const tw = uiCtx.measureText(label).width;
              const pw = tw + 18;
              const ph = 24;
              const py = boxY + boxHeight + 16;
              
              uiCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
              uiCtx.shadowBlur = 6;
              uiCtx.shadowOffsetY = 2;
              uiCtx.fillStyle = THEME_BADGE_BG;
              uiCtx.beginPath();
              if (uiCtx.roundRect) {
                uiCtx.roundRect(-pw / 2, py, pw, ph, 12);
              } else {
                uiCtx.rect(-pw / 2, py, pw, ph);
              }
              uiCtx.fill();

              uiCtx.strokeStyle = THEME_CORAL;
              uiCtx.lineWidth = 1.5;
              uiCtx.stroke();

              uiCtx.fillStyle = THEME_CORAL;
              uiCtx.textAlign = 'center';
              uiCtx.textBaseline = 'middle';
              uiCtx.fillText(label, 0, py + ph / 2);
              uiCtx.restore();
            } else if (isDragging.current && dragTarget.current?.id === cap.id && dragTarget.current?.type === 'rotate_caption') {
              uiCtx.save();
              const label = `${Math.round(((rot % 360) + 360) % 360)}°`;
              uiCtx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              const tw = uiCtx.measureText(label).width;
              const pw = tw + 18;
              const ph = 24;
              const py = boxY - 54;
              
              uiCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
              uiCtx.shadowBlur = 6;
              uiCtx.shadowOffsetY = 2;
              uiCtx.fillStyle = THEME_BADGE_BG;
              uiCtx.beginPath();
              if (uiCtx.roundRect) {
                uiCtx.roundRect(-pw / 2, py, pw, ph, 12);
              } else {
                uiCtx.rect(-pw / 2, py, pw, ph);
              }
              uiCtx.fill();

              uiCtx.strokeStyle = THEME_CORAL;
              uiCtx.lineWidth = 1.5;
              uiCtx.stroke();

              uiCtx.fillStyle = THEME_CORAL;
              uiCtx.textAlign = 'center';
              uiCtx.textBaseline = 'middle';
              uiCtx.fillText(label, 0, py + ph / 2);
              uiCtx.restore();
            }
            uiCtx.restore();
          };
        }

        targetCtx.restore();
        }
      });

      // --- RENDER FREEHAND DRAWINGS ---
      const drawBrushStroke = (stroke) => {
        if (!stroke || !stroke.points || stroke.points.length === 0) return;
        targetCtx.save();
        targetCtx.strokeStyle = stroke.color || '#a855f7';
        targetCtx.lineWidth = stroke.size || 8;
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';

        const strokeMode = stroke.mode || (stroke.type === 'highlighter' ? 'highlighter' : (stroke.type === 'glow' ? 'glow' : (stroke.type === 'eraser' ? 'eraser' : 'pen')));
        if (strokeMode === 'highlighter') {
          targetCtx.globalAlpha = 0.45;
        } else if (strokeMode === 'glow') {
          targetCtx.shadowColor = stroke.color || '#00f0ff';
          targetCtx.shadowBlur = Math.max(8, (stroke.size || 8) * 1.5);
        }

        targetCtx.beginPath();
        if (stroke.points.length === 1) {
          targetCtx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 8) / 2, 0, Math.PI * 2);
          targetCtx.fillStyle = stroke.color || '#a855f7';
          targetCtx.fill();
        } else {
          targetCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            targetCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          targetCtx.stroke();
        }
        targetCtx.restore();
      };

      (drawings || []).forEach((d) => {
        drawBrushStroke(d);
      });
      
      // Render Watermark
      if (watermark?.enabled) {
        targetCtx.save();
        targetCtx.globalAlpha = watermark.opacity || 0.5;
        
        const pad = 20;
        let wx = 0;
        let wy = 0;
        
        const getPositions = (w, h) => {
          const pos = watermark.position || 'bottom-right';
          if (pos === 'bottom-right') return { x: canvas.width - pad - w, y: canvas.height - pad - h };
          if (pos === 'bottom-left') return { x: pad, y: canvas.height - pad - h };
          if (pos === 'top-right') return { x: canvas.width - pad - w, y: pad };
          if (pos === 'top-left') return { x: pad, y: pad };
          return { x: pad, y: pad };
        };
        
        if (watermark.imageUrl && imageCacheRef.current[watermark.imageUrl]) {
          const wmImg = imageCacheRef.current[watermark.imageUrl];
          const scale = (watermark.size || 24) * 3 / Math.max(wmImg.width, wmImg.height);
          const drawW = wmImg.width * scale;
          const drawH = wmImg.height * scale;
          const { x, y } = getPositions(drawW, drawH);
          targetCtx.drawImage(wmImg, x, y, drawW, drawH);
        } else if (watermark.text) {
          targetCtx.font = `bold ${watermark.size || 24}px Impact, sans-serif`;
          const fillColor = watermark.color || '#ffffff';
          targetCtx.fillStyle = fillColor;
          targetCtx.strokeStyle = fillColor === '#000000' ? '#ffffff' : '#000000';
          targetCtx.lineWidth = Math.max(2, (watermark.size || 24) / 10);
          targetCtx.textBaseline = 'top';
          targetCtx.textAlign = 'left';
          
          const textMetrics = targetCtx.measureText(watermark.text);
          const w = textMetrics.width;
          const h = watermark.size || 24;
          const { x, y } = getPositions(w, h);
          
          targetCtx.strokeText(watermark.text, x, y);
          targetCtx.fillText(watermark.text, x, y);
        }
        
        targetCtx.restore();
      }

      // If global composition filter is enabled, draw the rendered composition canvas with the filter
      if (applyGlobalFilter && compCanvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawImageFiltered(ctx, compCanvas, filterCss, 0, 0, canvas.width, canvas.height);
      }

      // Draw active layer selection handles and rotation knob on the screen canvas (unfiltered and sharp)
      if (activeHandleDrawer && !skipHandles) {
        activeHandleDrawer(ctx);
      }

      // Draw Snapping Guides
      if (!skipHandles && isDragging.current && snappingLines.current && (snappingLines.current.horizontal !== null || snappingLines.current.vertical !== null)) {
        const { horizontal, vertical } = snappingLines.current;
        ctx.save();
        ctx.setLineDash([6, 6]);
        
        if (horizontal !== null) {
          const isHeaderOrFooter = activeCaption?.isHeaderCaption || activeCaption?.isFooterCaption;
          const y = isHeaderOrFooter ? (horizontal * canvas.height) : (headerExtH + horizontal * canvasH);
          const isCenter = Math.abs(horizontal - 0.5) < 0.002;
          ctx.strokeStyle = isCenter ? '#00f0ff' : '#a855f7';
          ctx.lineWidth = isCenter ? 2 : 1.5;
          ctx.shadowColor = isCenter ? 'rgba(0, 240, 255, 0.7)' : 'rgba(168, 85, 247, 0.7)';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        
        if (vertical !== null) {
          const x = vertical * canvas.width;
          const isCenter = Math.abs(vertical - 0.5) < 0.002;
          ctx.strokeStyle = isCenter ? '#00f0ff' : '#a855f7';
          ctx.lineWidth = isCenter ? 2 : 1.5;
          ctx.shadowColor = isCenter ? 'rgba(0, 240, 255, 0.7)' : 'rgba(168, 85, 247, 0.7)';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    if (baseImgRef.current && baseImgRef.current.src === imgSrc) {
      renderCanvas(baseImgRef.current);
    } else if (imgSrc) {
        const baseImg = new Image();
        if (imgSrc && !imgSrc.startsWith('blob:') && !imgSrc.startsWith('data:')) baseImg.crossOrigin = 'anonymous';
        baseImg.onload = () => {
          if (baseImg.width && baseImg.height && (naturalSize.w !== baseImg.width || naturalSize.h !== baseImg.height)) {
            setNaturalSize({ w: baseImg.width, h: baseImg.height });
          }
          baseImgRef.current = baseImg;
          renderCanvas(baseImg);
        };
        baseImg.onerror = () => {
          renderCanvas(null);
        };
        baseImg.src = imgSrc;
    } else {
      renderCanvas(null);
    }
  }, [captions, stickers, activeLayerId, imageLayers, slotImages, slotTransforms, activeIsNativeLayout, editingCaptionId, aspectRatio, imageFit, watermark, drawings, isDrawingMode, imgSrc, filters, liveBgColor, canvasHeader, canvasFooter, demotivational, canvasFlipX]);

  // Helper to rotate point for hit testing
  const rotatePoint = (px, py, cx, cy, angle) => {
    const rad = angle * Math.PI / 180;
    const dx = px - cx;
    const dy = py - cy;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0, clientY = 0;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if (e.clientX !== undefined && e.clientY !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    if (e.cancelable && e.target !== editableRef.current) {
      e.preventDefault();
    }
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDrawingMode) {
      isDrawingActive.current = true;
      const isEraser = drawTool === 'eraser';
      const strokeColor = isEraser ? (canvasBgColor || '#ffffff') : brushColor;
      const strokeMode = drawTool === 'highlighter' ? 'highlighter' : (drawTool === 'glow' ? 'glow' : (isEraser ? 'eraser' : 'pen'));
      const initialStroke = {
        id: `brush-${Date.now()}`,
        type: isEraser ? 'eraser' : (drawTool || 'brush'),
        mode: strokeMode,
        color: strokeColor,
        size: brushSize,
        points: [{ x: coords.x, y: coords.y }]
      };
      currentStroke.current = initialStroke;
      lastDrawPoint.current = { x: coords.x, y: coords.y };

      // Immediate visual dot on canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.fillStyle = strokeColor;
        if (strokeMode === 'highlighter') {
          ctx.globalAlpha = 0.45;
        } else if (strokeMode === 'glow') {
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = Math.max(8, brushSize * 1.5);
        }
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    let hitLayer = null;

    // A. Priority 1: Check Active Layer interactive handles (only if layer is unlocked)
    if (activeLayerId) {
      // 1. Active Sticker handles
      const activeStk = stickers.find(s => s.id === activeLayerId);
      if (activeStk && !activeStk.locked) {
        const cx = activeStk.x * canvas.width;
        const cy = getStickerCenterY(activeStk);
        const stkSize = (activeStk.scale || 1.0) * 52;
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeStk.rotation || 0));
        const hs = stkSize / 2 + 6;

        const handles = [
          { type: 'delete_layer', x: cx - hs, y: cy - hs, r: 26 },
          { type: 'rotate_sticker', x: cx, y: cy - stkSize / 2 - 28, r: 24 },
          { type: 'resize_sticker_br', x: cx + hs, y: cy + hs, r: 24 },
        ];

        for (const h of handles) {
          if (Math.hypot(p.x - h.x, p.y - h.y) <= h.r) {
            hitLayer = { 
              id: activeStk.id, 
              type: h.type, 
              x: activeStk.x, 
              y: activeStk.y, 
              scale: activeStk.scale || 1.0, 
              rotation: activeStk.rotation || 0 
            };
            break;
          }
        }
      }

      // 2. Active Caption handles
      if (!hitLayer) {
        const activeCap = captions.find(c => c.id === activeLayerId);
        if (activeCap && !activeCap.locked) {
          let cx = (activeCap.x ?? 0.5) * canvas.width;
          let cy = getCaptionCenterY(activeCap, canvas);
          if (activeCap.isWhatsAppCard) {
            const cardW = Math.max(180, (activeCap.width || 0.82) * canvas.width);
            const halfW = cardW / 2;
            const minPadX = 14;
            if (cardW <= canvas.width - minPadX * 2) {
              cx = Math.max(halfW + minPadX, Math.min(canvas.width - halfW - minPadX, cx));
            }
          }
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeCap.rotation || 0));

          const renderMaxWidth = (activeCap.width || 0.9) * canvas.width;
          const fontSize = activeCap.fontSize || 50;
          ctx.font = `bold ${fontSize}px ${activeCap.fontFamily || 'Impact, sans-serif'}`;
          const lines = wrapText(ctx, activeCap.text, renderMaxWidth);
          let maxLineWidth = 0;
          for (const line of lines) {
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
          }
          const isBubble = !!activeCap.bubbleStyle;
          const hasBg = (activeCap.bgColor && activeCap.bgColor !== 'transparent' && activeCap.bgColor !== 'none') || isBubble;
          const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(16, fontSize * 0.25));
          const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(10, fontSize * 0.16));
          let boxWidth = (activeCap.hasCustomWidth && activeCap.width)
            ? Math.max(maxLineWidth + padX * 2, activeCap.width * canvas.width)
            : (maxLineWidth + padX * 2);
          boxWidth = Math.min(canvas.width - 16, boxWidth);
          const textHeight = lines.length * (fontSize * 1.2);
          let boxHeight = textHeight + padY * 2;
          if (activeCap.curve && Math.abs(activeCap.curve) > 0) {
            boxHeight += Math.round(getCurveSagitta(maxLineWidth, activeCap.curve));
          }

          if (activeCap.isBreakingNews) {
            boxWidth = Math.max(300, (activeCap.width || 0.94) * canvas.width);
            boxHeight = getBreakingNewsHeight(activeCap);
          } else if (activeCap.isTweetCard) {
            boxWidth = Math.max(180, (activeCap.width || 0.88) * canvas.width);
            boxHeight = getTweetCardHeight(ctx, activeCap, boxWidth);
          } else if (activeCap.isInstagramCard) {
            boxWidth = Math.max(180, (activeCap.width || 0.88) * canvas.width);
            boxHeight = getInstagramCardHeight(ctx, activeCap, boxWidth);
          } else if (activeCap.isWhatsAppCard) {
            boxWidth = Math.max(180, (activeCap.width || 0.84) * canvas.width);
            boxHeight = getWhatsAppCardHeight(ctx, activeCap, boxWidth);
          }
          const halfW = boxWidth / 2;
          const halfH = boxHeight / 2;

          const topY = cy - halfH;
          const bottomY = cy + halfH;
          const leftX = cx - halfW;
          const rightX = cx + halfW;

          // Screen scale factor ensures touch target is at least 44px on user's physical screen
          const screenScale = canvasRef.current
            ? (canvas.width / Math.max(1, canvasRef.current.getBoundingClientRect().width))
            : 2.5;
          const touchHitRadius = Math.max(48, Math.round(22 * screenScale));
          const deleteHitRadius = Math.max(52, Math.round(24 * screenScale));

          const handles = [
            { type: 'delete_layer', x: leftX, y: topY, r: deleteHitRadius },
            { type: 'rotate_caption', x: cx, y: topY - 28, r: touchHitRadius },
            { type: 'resize_caption_l', x: leftX, y: cy, r: touchHitRadius },
            { type: 'resize_caption_r', x: rightX, y: cy, r: touchHitRadius },
            { type: 'resize_caption_br', x: rightX, y: bottomY, r: touchHitRadius }
          ];

          let closestHandle = null;
          let minDistance = Infinity;

          for (const h of handles) {
            const dist = Math.hypot(p.x - h.x, p.y - h.y);
            if (dist <= h.r && dist < minDistance) {
              minDistance = dist;
              closestHandle = h;
            }
          }

          if (closestHandle) {
            // Check double-click on side handles to quickly reset back to auto-fit width
            if (closestHandle.type === 'resize_caption_l' || closestHandle.type === 'resize_caption_r') {
              const now = Date.now();
              if (lastTapRef.current.id === `${activeCap.id}-${closestHandle.type}` && (now - lastTapRef.current.time) < 350) {
                lastTapRef.current = { id: null, time: 0 };
                onUpdateCaptionBounds(activeCap.id, { hasCustomWidth: false, width: 0.9 });
                return;
              }
              lastTapRef.current = { id: `${activeCap.id}-${closestHandle.type}`, time: now };
            }

            const cornerDist = Math.hypot(closestHandle.x - cx, closestHandle.y - cy);
            hitLayer = { 
              id: activeCap.id, 
              type: closestHandle.type, 
              x: activeCap.x, 
              y: activeCap.y,
              isHeaderCaption: !!activeCap.isHeaderCaption, 
              isFooterCaption: !!activeCap.isFooterCaption, 
              hasCustomPos: !!activeCap.hasCustomPos,
              boxWidth,
              boxHeight,
              width: activeCap.width || (boxWidth / canvas.width), 
              rotation: activeCap.rotation || 0,
              fontSize: activeCap.fontSize || 50,
              initialFontSize: activeCap.fontSize || 50,
              initialWidth: activeCap.width || (boxWidth / canvas.width),
              initialBoxWidth: boxWidth,
              initialBoxHeight: boxHeight,
              initialDist: Math.max(15, cornerDist),
              handleRelX: closestHandle.x - cx,
              handleRelY: closestHandle.y - cy,
              hasCustomWidth: !!activeCap.hasCustomWidth
            };
          }
        }
      }

      // 3. Active Image Layer handles
      if (!hitLayer) {
        const activeImg = imageLayers.find(l => l.id === activeLayerId);
        if (activeImg && !activeImg.locked) {
          const cached = imageCacheRef.current[activeImg.url];
          if (cached) {
            const cx = activeImg.x * canvas.width;
            const cy = getImageLayerCenterY(activeImg);
            const scale = activeImg.scale || 1.0;
            const baseW = cached.width || 200;
            const baseH = cached.height || 200;
            const fitScale = Math.min(320 / baseW, 320 / baseH);
            const w = activeImg.boxWidth || activeImg.width || (baseW * fitScale * scale);
            const h = activeImg.boxHeight || activeImg.height || (baseH * fitScale * scale);
            const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeImg.rotation || 0));

            const hw = w / 2 + 6;
            const hh = h / 2 + 6;

            const isCropping = activeImg.fitMode === 'crop';

            const handles = activeImg.isFaceMorph ? [
              { type: 'delete_layer', x: cx - hw * 0.72, y: cy - hh * 0.72, r: 26 },
              { type: 'rotate_imageLayer', x: cx, y: cy - hh - 28, r: 24 },
              { type: 'resize_imageLayer_br', x: cx + hw * 0.72, y: cy + hh * 0.72, r: 24 }
            ] : isCropping ? [
              // In crop mode: only middle handles are active; delete and resize are removed per user request
              { type: 'resize_imageLayer_t',  x: cx,      y: cy - hh, r: 24 },
              { type: 'resize_imageLayer_b',  x: cx,      y: cy + hh, r: 24 },
              { type: 'resize_imageLayer_l',  x: cx - hw, y: cy,      r: 24 },
              { type: 'resize_imageLayer_r',  x: cx + hw, y: cy,      r: 24 }
            ] : [
              { type: 'delete_layer', x: cx - hw, y: cy - hh, r: 26 },
              { type: 'rotate_imageLayer', x: cx, y: cy - hh - 28, r: 22 },
              { type: 'resize_imageLayer_br', x: cx + hw, y: cy + hh, r: 22 },
              { type: 'resize_imageLayer_t',  x: cx,      y: cy - hh, r: 22 },
              { type: 'resize_imageLayer_b',  x: cx,      y: cy + hh, r: 22 },
              { type: 'resize_imageLayer_l',  x: cx - hw, y: cy,      r: 22 },
              { type: 'resize_imageLayer_r',  x: cx + hw, y: cy,      r: 22 }
            ];

            let closestHandle = null;
            let minDistance = Infinity;

            for (const h of handles) {
              const dist = Math.hypot(p.x - h.x, p.y - h.y);
              if (dist <= h.r && dist < minDistance) {
                minDistance = dist;
                closestHandle = h;
              }
            }

            if (closestHandle) {
              hitLayer = { 
                id: activeImg.id, 
                type: closestHandle.type, 
                x: activeImg.x, 
                y: activeImg.y, 
                scale, 
                rotation: activeImg.rotation || 0, 
                baseW, baseH, fitScale, 
                boxWidth: w, 
                boxHeight: h, 
                width: w, 
                height: h,
                crop: activeImg.crop ? { ...activeImg.crop } : { x: 0, y: 0, width: 1, height: 1 },
                fitMode: activeImg.fitMode
              };
            }
          }
        }
      }
    }

    // B. Priority 2: Check ALL layers in Descending Stack Order (top-most layer under pointer wins)
    if (!hitLayer) {
      const allLayersRev = [
        ...(imageLayers || []).map(l => ({ ...l, _type: 'imageLayer', zIndex: l.zIndex ?? 0 })),
        ...(stickers || []).map(l => ({ ...l, _type: 'sticker', zIndex: l.zIndex ?? 0 })),
        ...(captions || []).map(l => ({ ...l, _type: 'caption', zIndex: l.zIndex ?? 0 }))
      ];
      allLayersRev.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)); // Descending: topmost first

      for (const layer of allLayersRev) {
        if (hitLayer) break;
        if (layer.hidden) continue; // Skip hidden layers

        if (layer._type === 'sticker') {
          const stk = layer;
          const cx = stk.x * canvas.width;
          const cy = getStickerCenterY(stk);
          const stkSize = (stk.scale || 1.0) * 52;
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0));
          if (p.x >= cx - stkSize / 2 - 6 && p.x <= cx + stkSize / 2 + 6 && p.y >= cy - stkSize / 2 - 6 && p.y <= cy + stkSize / 2 + 6) {
            hitLayer = { 
              id: stk.id, 
              type: 'sticker', 
              x: stk.x, 
              y: stk.y, 
              scale: stk.scale || 1.0, 
              rotation: stk.rotation || 0,
              locked: !!stk.locked
            };
          }
        } else if (layer._type === 'caption') {
          const cap = layer;
          let cx = (cap.x ?? 0.5) * canvas.width;
          let cy = getCaptionCenterY(cap, canvas);
          if (cap.isWhatsAppCard) {
            const cardW = Math.max(180, (cap.width || 0.82) * canvas.width);
            const halfW = cardW / 2;
            const minPadX = 14;
            if (cardW <= canvas.width - minPadX * 2) {
              cx = Math.max(halfW + minPadX, Math.min(canvas.width - halfW - minPadX, cx));
            }
          }
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(cap.rotation || 0));
          const fontSize = cap.fontSize || 50;
          ctx.font = `bold ${fontSize}px ${cap.fontFamily || 'Impact, sans-serif'}`;
          const renderMaxWidth = (cap.width || 0.9) * canvas.width;
          const lines = wrapText(ctx, cap.text || '', renderMaxWidth);
          let maxLineWidth = 0;
          for (const line of lines) {
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
          }
          const isBubble = !!cap.bubbleStyle;
          const hasBg = (cap.bgColor && cap.bgColor !== 'transparent' && cap.bgColor !== 'none') || isBubble;
          const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15));
          const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1));
          let boxWidth = (cap.hasCustomWidth && cap.width)
            ? Math.max(maxLineWidth + padX * 2, cap.width * canvas.width)
            : (maxLineWidth + padX * 2);
          boxWidth = Math.min(canvas.width - 16, boxWidth);
          const lineHeight = fontSize * 1.2;
          let boxHeight = lines.length * lineHeight + padY * 2;
          if (cap.curve && Math.abs(cap.curve) > 0) {
            boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
          }

          if (cap.isBreakingNews) {
            boxWidth = Math.max(300, (cap.width || 0.94) * canvas.width);
            boxHeight = getBreakingNewsHeight(cap);
          } else if (cap.isTweetCard) {
            boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
            boxHeight = getTweetCardHeight(ctx, cap, boxWidth);
          } else if (cap.isInstagramCard) {
            boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
            boxHeight = getInstagramCardHeight(ctx, cap, boxWidth);
          } else if (cap.isWhatsAppCard) {
            boxWidth = Math.max(180, (cap.width || 0.84) * canvas.width);
            boxHeight = getWhatsAppCardHeight(ctx, cap, boxWidth);
          }

          let hitBox = false;
          if (hasBg && cap.bgStyle === 'banner') {
             const bannerY = - ((lines.length - 1) * lineHeight) / 2 - lineHeight / 2 - padY;
             hitBox = (p.y >= cy + bannerY && p.y <= cy + bannerY + boxHeight);
          } else {
             hitBox = (p.x >= cx - boxWidth / 2 && p.x <= cx + boxWidth / 2 && p.y >= cy - boxHeight / 2 && p.y <= cy + boxHeight / 2);
          }

          if (hitBox) {
            hitLayer = { 
              id: cap.id, 
              type: 'caption', 
              x: cap.x, 
              y: cap.y,
              isHeaderCaption: !!cap.isHeaderCaption,
              isFooterCaption: !!cap.isFooterCaption,
              hasCustomPos: !!cap.hasCustomPos,
              boxWidth,
              boxHeight,
              width: cap.width || (boxWidth / canvas.width),
              rotation: cap.rotation || 0,
              fontSize: cap.fontSize || 50,
              initialFontSize: cap.fontSize || 50,
              initialWidth: cap.width || 0.9,
              initialBoxWidth: boxWidth,
              initialBoxHeight: boxHeight,
              hasCustomWidth: !!cap.hasCustomWidth,
              locked: !!cap.locked
            };
          }
        } else if (layer._type === 'imageLayer') {
          const imgLayer = layer;
          const cx = imgLayer.x * canvas.width;
          const cy = getImageLayerCenterY(imgLayer);
          const cached = imageCacheRef.current[imgLayer.url];
          
          if (cached) {
            const baseW = cached.width || 200;
            const baseH = cached.height || 200;
            const scale = imgLayer.scale || 1.0;
            const maxDim = 320;
            const fitScale = Math.min(maxDim / baseW, maxDim / baseH);
            const w = imgLayer.boxWidth || imgLayer.width || (baseW * fitScale * scale);
            const h = imgLayer.boxHeight || imgLayer.height || (baseH * fitScale * scale);

            const p = rotatePoint(coords.x, coords.y, cx, cy, -(imgLayer.rotation || 0));
            if (p.x >= cx - w / 2 && p.x <= cx + w / 2 && p.y >= cy - h / 2 && p.y <= cy + h / 2) {
              hitLayer = { 
                id: imgLayer.id, 
                type: 'imageLayer', 
                x: imgLayer.x, 
                y: imgLayer.y, 
                scale: imgLayer.scale || 1.0, 
                rotation: imgLayer.rotation || 0,
                baseW, baseH, fitScale,
                boxWidth: w,
                boxHeight: h,
                width: w,
                height: h,
                locked: !!imgLayer.locked,
                crop: imgLayer.crop ? { ...imgLayer.crop } : undefined,
                fitMode: imgLayer.fitMode
              };
            }
          }
        }
      }
    }

    if (!hitLayer && isHeaderEnabled && coords.y <= headerExtH) {
      const hCap = captions.find(c => c.isHeaderCaption);
      if (hCap && !hCap.hasCustomPos) {
        hitLayer = {
          id: hCap.id,
          type: 'caption',
          x: hCap.x,
          y: hCap.y,
          isHeaderCaption: true,
          hasCustomPos: false,
          locked: !!hCap.locked
        };
      }
    }

    if (!hitLayer && isFooterEnabled && coords.y >= (headerExtH + canvasH)) {
      const fCap = captions.find(c => c.isFooterCaption);
      if (fCap && !fCap.hasCustomPos) {
        hitLayer = {
          id: fCap.id,
          type: 'caption',
          x: fCap.x,
          y: fCap.y,
          isFooterCaption: true,
          hasCustomPos: false,
          locked: !!fCap.locked
        };
      }
    }

    if (hitLayer) {
      if (hitLayer.type === 'delete_layer') {
        if (onDeleteLayer) onDeleteLayer();
        return;
      }
      
      if (hitLayer.type === 'caption') {
        const now = Date.now();
        const clickedCap = captions.find(c => c.id === hitLayer.id);
        const isSocial = clickedCap?.isTweetCard || clickedCap?.isInstagramCard || clickedCap?.isWhatsAppCard;
        if (!isSocial && lastTapRef.current.id === hitLayer.id && (now - lastTapRef.current.time) < 350) {
          setEditingCaptionId(hitLayer.id);
          focusTextarea();
        }
        lastTapRef.current = { id: hitLayer.id, time: now };
      }

      if (onSelectLayer) onSelectLayer(hitLayer.id);

      // Only begin dragging if the layer is not locked
      if (!hitLayer.locked) {
        isDragging.current = true;
        dragTarget.current = hitLayer;
        dragStartCoords.current = coords;
        hasDragged.current = false;

        // Prevent browser selection / autoscroll during drag
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        if (window.getSelection) {
          window.getSelection().removeAllRanges();
        }

        const isCap = hitLayer.type === 'caption' || hitLayer.type?.startsWith('resize_caption_') || hitLayer.type === 'rotate_caption';
        const isStk = hitLayer.type === 'sticker' || hitLayer.type?.startsWith('resize_sticker_') || hitLayer.type === 'rotate_sticker';
        const isImg = hitLayer.type === 'imageLayer' || hitLayer.type?.startsWith('resize_imageLayer_') || hitLayer.type === 'rotate_imageLayer';

        const centerX = hitLayer.x * canvas.width;
        const centerY = isCap
          ? getCaptionCenterY(hitLayer)
          : isStk
          ? getStickerCenterY(hitLayer)
          : isImg
          ? getImageLayerCenterY(hitLayer)
          : (headerExtH + (hitLayer.y || 0) * canvasH);
        const initDist = hitLayer.initialDist || Math.hypot(coords.x - centerX, coords.y - centerY);

        const isHeaderOrFooter = hitLayer.isHeaderCaption || hitLayer.isFooterCaption;
        const initialNormalizedY = (isHeaderOrFooter && !hitLayer.hasCustomPos)
          ? (centerY / Math.max(1, canvas.height || totalCanvasH))
          : hitLayer.y;

        initialLayerPos.current = { 
          x: hitLayer.x, 
          y: initialNormalizedY, 
          centerX,
          centerY,
          width: hitLayer.boxWidth || hitLayer.width,
          height: hitLayer.boxHeight || hitLayer.height,
          boxWidth: hitLayer.boxWidth || hitLayer.width,
          boxHeight: hitLayer.boxHeight || hitLayer.height,
          scale: hitLayer.scale || 1.0,
          rotation: hitLayer.rotation || 0,
          initialDist: Math.max(15, initDist),
          initialFontSize: hitLayer.initialFontSize || hitLayer.fontSize || 50,
          initialWidth: hitLayer.initialWidth || hitLayer.width || 0.9,
          initialBoxWidth: hitLayer.initialBoxWidth || hitLayer.boxWidth,
          initialBoxHeight: hitLayer.initialBoxHeight || hitLayer.boxHeight,
          handleRelX: hitLayer.handleRelX,
          handleRelY: hitLayer.handleRelY,
          hasCustomWidth: hitLayer.hasCustomWidth,
          crop: hitLayer.crop ? { ...hitLayer.crop } : undefined,
          fitMode: hitLayer.fitMode
        };
      }
    } else {
      if (onSelectLayer) onSelectLayer(null);
      setEditingCaptionId(null);
      if (editableRef.current) editableRef.current.blur();
      
      // Native slot handling for pinch-to-zoom
      if (activeIsNativeLayout && activeLayoutDef) {
        const totalSlots = activeLayoutDef.slots;
        const isVert = activeLayoutDef.id === '2-vert' || activeLayoutDef.id === '3-stacked';
        const isHoriz = activeLayoutDef.id === '2-horiz' || activeLayoutDef.id === '3-horiz';
        const isGrid = activeLayoutDef.id === '4-grid';
        const isHybrid = activeLayoutDef.id === '3-hybrid';

        let hitSlotIdx = -1;
        for (let idx = 0; idx < totalSlots; idx++) {
          let x = 0, y = headerExtH, slotW = canvasW, slotH = canvasH;
          if (isVert) { slotH = canvasH / totalSlots; y = headerExtH + idx * slotH; }
          else if (isHoriz) { slotW = canvasW / totalSlots; x = idx * slotW; y = headerExtH; }
          else if (isGrid) { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx % 2) * slotW; y = headerExtH + Math.floor(idx / 2) * slotH; }
          else if (isHybrid) {
            if (idx === 0) { slotW = canvasW; slotH = canvasH / 2; x = 0; y = headerExtH; }
            else { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx - 1) * slotW; y = headerExtH + canvasH / 2; }
          }
          if (coords.x >= x && coords.x <= x + slotW && coords.y >= y && coords.y <= y + slotH) {
            hitSlotIdx = idx;
            break;
          }
        }

        if (hitSlotIdx !== -1) {
          isDragging.current = true;
          const hasImage = !!slotImages[hitSlotIdx];
          dragTarget.current = { type: hasImage ? 'slot' : 'empty-slot', idx: hitSlotIdx };
          dragStartCoords.current = coords;
          
          if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDist.current = Math.hypot(dx, dy);
            const currentTransform = slotTransforms[hitSlotIdx] || { scale: 1.5 };
            initialSlotScale.current = currentTransform.scale || 1.0;
          }
        }
      }
    }
  };

  const handlePointerEnd = (e) => {
    if (canvasRef.current && !isDrawingMode) {
      canvasRef.current.style.cursor = 'default';
    }
    if (isDrawingMode && isDrawingActive.current) {
      isDrawingActive.current = false;
      lastDrawPoint.current = null;
      if (currentStroke.current) {
        const strokeToSave = currentStroke.current;
        currentStroke.current = null;
        if (strokeToSave.points.length > 0 && onAddDrawing) {
          onAddDrawing(strokeToSave);
        }
      }
      return;
    }

    const wasCleanTap = !hasDragged.current;
    const tappedId = dragTarget.current?.id;
    const tappedType = dragTarget.current?.type;

    isDragging.current = false;
    hasDragged.current = false;
    dragTarget.current = null;
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';

    if (wasCleanTap && tappedType === 'empty-slot') {
      // Slot actions are now handled by DOM overlays on the canvas
    }

    // Clean tap on caption: select layer, activate editing mode and open keyboard immediately (only for regular text captions, not tweet cards)
    if (wasCleanTap && tappedType === 'caption' && tappedId) {
      if (onSelectLayer) onSelectLayer(tappedId);
      const tappedCap = captions.find(c => c.id === tappedId);
      const isSocial = tappedCap?.isTweetCard || tappedCap?.isInstagramCard || tappedCap?.isWhatsAppCard;
      if (!isSocial) {
        setEditingCaptionId(tappedId);
        setEditingCaptionText(tappedCap ? tappedCap.text : '');
        focusTextarea();
      } else {
        setEditingCaptionId(null);
        if (editableRef.current) editableRef.current.blur();
      }
    }
  };

  const handleTextOverlayPointerDown = (e) => {
    handlePointerDown(e);
  };

  const handleTextOverlayPointerEnd = (e) => {
    handlePointerEnd(e);
  };

  const updateHoverCursor = (coords) => {
    const canvas = canvasRef.current;
    if (!canvas || isDrawingMode) return;

    if (activeLayerId) {
      const activeStk = stickers.find(s => s.id === activeLayerId);
      if (activeStk && !activeStk.locked) {
        const cx = activeStk.x * canvas.width;
        const cy = getStickerCenterY(activeStk);
        const stkSize = (activeStk.scale || 1.0) * 52;
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeStk.rotation || 0));
        const hs = stkSize / 2 + 6;

        if (Math.hypot(p.x - (cx - hs), p.y - (cy - hs)) <= 26) {
          canvas.style.cursor = 'pointer'; return;
        }
        if (Math.hypot(p.x - cx, p.y - (cy - stkSize / 2 - 28)) <= 24) {
          canvas.style.cursor = 'grab'; return;
        }
        if (Math.hypot(p.x - (cx + hs), p.y - (cy + hs)) <= 24) {
          canvas.style.cursor = 'nwse-resize'; return;
        }
        if (p.x >= cx - stkSize / 2 - 6 && p.x <= cx + stkSize / 2 + 6 && p.y >= cy - stkSize / 2 - 6 && p.y <= cy + stkSize / 2 + 6) {
          canvas.style.cursor = 'move'; return;
        }
      }

      const activeCap = captions.find(c => c.id === activeLayerId);
      if (activeCap && !activeCap.locked) {
        let cx = (activeCap.x ?? 0.5) * canvas.width;
        let cy = getCaptionCenterY(activeCap, canvas);
        if (activeCap.isWhatsAppCard) {
          const cardW = Math.max(180, (activeCap.width || 0.82) * canvas.width);
          const halfW = cardW / 2;
          const minPadX = 14;
          if (cardW <= canvas.width - minPadX * 2) {
            cx = Math.max(halfW + minPadX, Math.min(canvas.width - halfW - minPadX, cx));
          }
        }
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeCap.rotation || 0));
        const renderMaxWidth = (activeCap.width || 0.9) * canvas.width;
        const fontSize = activeCap.fontSize || 50;
        const ctx = canvas.getContext('2d');
        let maxLineWidth = 0;
        let lines = [activeCap.text || ''];
        if (ctx) {
          ctx.font = `bold ${fontSize}px ${activeCap.fontFamily || 'Impact, sans-serif'}`;
          lines = wrapText(ctx, activeCap.text || '', renderMaxWidth);
          for (const line of lines) maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }
        const isBubble = !!activeCap.bubbleStyle;
        const hasBg = (activeCap.bgColor && activeCap.bgColor !== 'transparent' && activeCap.bgColor !== 'none') || isBubble;
        const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(16, fontSize * 0.25));
        const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(10, fontSize * 0.16));
        let boxWidth = (activeCap.hasCustomWidth && activeCap.width)
          ? Math.max(maxLineWidth + padX * 2, activeCap.width * canvas.width)
          : (maxLineWidth + padX * 2);
        boxWidth = Math.min(canvas.width - 16, boxWidth);
        const textHeight = lines.length * (fontSize * 1.2);
        let boxHeight = textHeight + padY * 2;
        if (activeCap.curve && Math.abs(activeCap.curve) > 0) {
          boxHeight += Math.round(getCurveSagitta(maxLineWidth, activeCap.curve));
        }

        if (activeCap.isBreakingNews) {
          boxWidth = Math.max(300, (activeCap.width || 0.94) * canvas.width);
          boxHeight = getBreakingNewsHeight(activeCap);
        } else if (activeCap.isTweetCard) {
          boxWidth = Math.max(180, (activeCap.width || 0.88) * canvas.width);
          boxHeight = getTweetCardHeight(ctx, activeCap, boxWidth);
        } else if (activeCap.isInstagramCard) {
          boxWidth = Math.max(180, (activeCap.width || 0.88) * canvas.width);
          boxHeight = getInstagramCardHeight(ctx, activeCap, boxWidth);
        } else if (activeCap.isWhatsAppCard) {
          boxWidth = Math.max(180, (activeCap.width || 0.84) * canvas.width);
          boxHeight = getWhatsAppCardHeight(ctx, activeCap, boxWidth);
        }

        const halfW = boxWidth / 2;
        const halfH = boxHeight / 2;

        const topY = cy - halfH;
        const bottomY = cy + halfH;
        const leftX = cx - halfW;
        const rightX = cx + halfW;

        const screenScale = canvasRef.current
          ? (canvas.width / Math.max(1, canvasRef.current.getBoundingClientRect().width))
          : 2.5;
        const hoverHitRadius = Math.max(38, Math.round(18 * screenScale));
        const deleteHoverRadius = Math.max(42, Math.round(20 * screenScale));

        if (Math.hypot(p.x - leftX, p.y - topY) <= deleteHoverRadius) {
          canvas.style.cursor = 'pointer'; return;
        }
        if (Math.hypot(p.x - cx, p.y - (topY - 28)) <= hoverHitRadius) {
          canvas.style.cursor = 'grab'; return;
        }
        if (Math.hypot(p.x - leftX, p.y - cy) <= hoverHitRadius || Math.hypot(p.x - rightX, p.y - cy) <= hoverHitRadius) {
          canvas.style.cursor = 'ew-resize'; return;
        }
        if (Math.hypot(p.x - rightX, p.y - bottomY) <= hoverHitRadius) {
          canvas.style.cursor = 'nwse-resize'; return;
        }
        if (p.x >= cx - halfW && p.x <= cx + halfW && p.y >= cy - halfH && p.y <= cy + halfH) {
          canvas.style.cursor = 'move'; return;
        }
      }

      const activeImg = imageLayers.find(l => l.id === activeLayerId);
      if (activeImg && !activeImg.locked) {
        const cached = imageCacheRef.current[activeImg.url];
        if (cached) {
          const cx = activeImg.x * canvas.width;
          const cy = getImageLayerCenterY(activeImg);
          const scale = activeImg.scale || 1.0;
          const baseW = cached.width || 200;
          const baseH = cached.height || 200;
          const fitScale = Math.min(320 / baseW, 320 / baseH);
          const w = activeImg.boxWidth || activeImg.width || (baseW * fitScale * scale);
          const h = activeImg.boxHeight || activeImg.height || (baseH * fitScale * scale);
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeImg.rotation || 0));
          const hw = w / 2 + 6;
          const hh = h / 2 + 6;

          const isCropping = activeImg.fitMode === 'crop';

          if (!isCropping) {
            if (Math.hypot(p.x - (cx - hw), p.y - (cy - hh)) <= 26) {
              canvas.style.cursor = 'pointer'; return;
            }
            if (Math.hypot(p.x - cx, p.y - (cy - hh - 28)) <= 22) {
              canvas.style.cursor = 'grab'; return;
            }
            if (Math.hypot(p.x - (cx + hw), p.y - (cy + hh)) <= 22) {
              canvas.style.cursor = 'nwse-resize'; return;
            }
          }
          if (Math.hypot(p.x - cx, p.y - (cy - hh)) <= 22 || Math.hypot(p.x - cx, p.y - (cy + hh)) <= 22) {
            canvas.style.cursor = 'ns-resize'; return;
          }
          if (Math.hypot(p.x - (cx - hw), p.y - cy) <= 22 || Math.hypot(p.x - (cx + hw), p.y - cy) <= 22) {
            canvas.style.cursor = 'ew-resize'; return;
          }
          if (p.x >= cx - w / 2 && p.x <= cx + w / 2 && p.y >= cy - h / 2 && p.y <= cy + h / 2) {
            canvas.style.cursor = 'move'; return;
          }
        }
      }
    }

    if (isHeaderEnabled && coords.y <= headerExtH) {
      canvas.style.cursor = 'pointer';
      return;
    }

    for (const stk of stickers) {
      if (stk.hidden) continue;
      const cx = stk.x * canvas.width;
      const cy = getStickerCenterY(stk);
      const stkSize = (stk.scale || 1.0) * 52;
      const p = rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0));
      if (p.x >= cx - stkSize / 2 && p.x <= cx + stkSize / 2 && p.y >= cy - stkSize / 2 && p.y <= cy + stkSize / 2) {
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    for (const l of imageLayers) {
      if (l.hidden) continue;
      const cx = l.x * canvas.width;
      const cy = getImageLayerCenterY(l);
      const cached = imageCacheRef.current[l.url];
      if (cached) {
        const scale = l.scale || 1.0;
        const baseW = cached.width || 200;
        const baseH = cached.height || 200;
        const fitScale = Math.min(320 / baseW, 320 / baseH);
        const w = l.boxWidth || l.width || (baseW * fitScale * scale);
        const h = l.boxHeight || l.height || (baseH * fitScale * scale);
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(l.rotation || 0));
        if (p.x >= cx - w / 2 && p.x <= cx + w / 2 && p.y >= cy - h / 2 && p.y <= cy + h / 2) {
          canvas.style.cursor = 'pointer';
          return;
        }
      }
    }

    for (const cap of captions) {
      if (cap.hidden) continue;
      const cx = cap.x * canvas.width;
      const cy = getCaptionCenterY(cap);
      const p = rotatePoint(coords.x, coords.y, cx, cy, -(cap.rotation || 0));
      const fontSize = cap.fontSize || 50;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `bold ${fontSize}px ${cap.fontFamily || 'Impact, sans-serif'}`;
        const renderMaxWidth = (cap.width || 0.9) * canvas.width;
        const lines = wrapText(ctx, cap.text || '', renderMaxWidth);
        let maxLineWidth = 0;
        for (const line of lines) maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        const isBubble = !!cap.bubbleStyle;
        const hasBg = (cap.bgColor && cap.bgColor !== 'transparent' && cap.bgColor !== 'none') || isBubble;
        const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15));
        const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1));
        let boxWidth = (cap.hasCustomWidth && cap.width)
          ? Math.max(maxLineWidth + padX * 2, cap.width * canvas.width)
          : (maxLineWidth + padX * 2);
        boxWidth = Math.min(canvas.width - 16, boxWidth);
        const lineHeight = fontSize * 1.2;
        let boxHeight = lines.length * lineHeight + padY * 2;
        if (cap.curve && Math.abs(cap.curve) > 0) {
          boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
        }
        if (cap.isBreakingNews) {
          boxWidth = Math.max(300, (cap.width || 0.94) * canvas.width);
          boxHeight = getBreakingNewsHeight(cap);
        } else if (cap.isTweetCard) {
          boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
          boxHeight = getTweetCardHeight(ctx, cap, boxWidth);
        } else if (cap.isInstagramCard) {
          boxWidth = Math.max(180, (cap.width || 0.88) * canvas.width);
          boxHeight = getInstagramCardHeight(ctx, cap, boxWidth);
        } else if (cap.isWhatsAppCard) {
          boxWidth = Math.max(180, (cap.width || 0.84) * canvas.width);
          boxHeight = getWhatsAppCardHeight(ctx, cap, boxWidth);
        }
        if (p.x >= cx - boxWidth / 2 && p.x <= cx + boxWidth / 2 && p.y >= cy - boxHeight / 2 && p.y <= cy + boxHeight / 2) {
          canvas.style.cursor = 'pointer';
          return;
        }
      }
    }

    canvas.style.cursor = 'default';
  };

  const handlePointerMove = (e) => {
    if (e.cancelable && (isDrawingActive.current || isDragging.current)) {
      e.preventDefault();
    }
    if (isDrawingMode && isDrawingActive.current && currentStroke.current) {
      const coords = getCanvasCoords(e);
      const stroke = currentStroke.current;
      const lastPt = lastDrawPoint.current || stroke.points[stroke.points.length - 1];

      const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
      if (dist >= 1.5) {
        stroke.points.push({ x: coords.x, y: coords.y });
        lastDrawPoint.current = { x: coords.x, y: coords.y };

        // Instant hardware-accelerated 2D canvas drawing (no React state lag!)
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (stroke.mode === 'highlighter') {
              ctx.globalAlpha = 0.45;
            } else if (stroke.mode === 'glow') {
              ctx.shadowColor = stroke.color;
              ctx.shadowBlur = Math.max(8, stroke.size * 1.5);
            }
            ctx.beginPath();
            ctx.moveTo(lastPt.x, lastPt.y);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(e);

    if (!isDragging.current || !dragTarget.current) {
      if (!isDrawingMode) {
        updateHoverCursor(coords);
      }
      return;
    }

    const dx = (coords.x - dragStartCoords.current.x) / canvas.width;
    const isHeaderOrFooter = dragTarget.current?.isHeaderCaption || dragTarget.current?.isFooterCaption;
    const dy = isHeaderOrFooter
      ? ((coords.y - dragStartCoords.current.y) / canvas.height)
      : ((coords.y - dragStartCoords.current.y) / canvasH);

    // Mark as dragged if moved more than threshold (prevents accidental drag on tap on touchscreens)
    const pixelDx = Math.abs(coords.x - dragStartCoords.current.x);
    const pixelDy = Math.abs(coords.y - dragStartCoords.current.y);
    const dragThreshold = (e.touches && e.touches.length > 0) ? 18 : 6;
    if (pixelDx > dragThreshold || pixelDy > dragThreshold) {
      hasDragged.current = true;
      // Blur the textarea immediately when dragging starts so keyboard dismisses
      if (dragTarget.current?.type === 'caption' && editableRef.current) {
        editableRef.current.blur();
      }
    }

    if (dragTarget.current.type === 'slot') {
      if (typeof onUpdateSlotTransform === 'function') {
        const slotIdx = dragTarget.current.idx;
        
        // Handle Pinch to Zoom
        if (e.touches && e.touches.length === 2 && initialPinchDist.current) {
          const dxPinch = e.touches[0].clientX - e.touches[1].clientX;
          const dyPinch = e.touches[0].clientY - e.touches[1].clientY;
          const currentPinchDist = Math.hypot(dxPinch, dyPinch);
          const scaleFactor = currentPinchDist / initialPinchDist.current;
          
          const newScale = Math.max(0.5, Math.min(5.0, initialSlotScale.current * scaleFactor));
          
          onUpdateSlotTransform(slotIdx, (prev) => ({
            ...prev,
            scale: newScale
          }));
        } else {
          // Handle standard dragging
          onUpdateSlotTransform(slotIdx, (prev) => ({
            ...prev,
            offsetX: prev.offsetX + dx,
            offsetY: prev.offsetY + dy
          }));
          dragStartCoords.current = coords; // reset start coords for continuous offset calculation
        }
      }
      return;
    }
    
    if (dragTarget.current.type === 'empty-slot') {
      return;
    }

    if (dragTarget.current.type.startsWith('rotate_')) {
      const centerX = initialLayerPos.current.centerX ?? (initialLayerPos.current.x * canvas.width);
      const centerY = initialLayerPos.current.centerY ?? (headerExtH + initialLayerPos.current.y * canvasH);
      const angleRad = Math.atan2(coords.y - centerY, coords.x - centerX);
      let angleDeg = (angleRad * 180 / Math.PI) + 90; // offset since handle is at top (-90 deg)
      
      let normalizedAngle = ((angleDeg % 360) + 360) % 360;
      // Clean snapping to 0, 90, 180, 270, 360 degrees within 3.5 degrees threshold
      const snapAngles = [0, 90, 180, 270, 360];
      for (const snap of snapAngles) {
        if (Math.abs(normalizedAngle - snap) < 3.5) {
          angleDeg = snap === 360 ? 0 : snap;
          break;
        }
      }

      const newRotation = angleDeg;
      const id = dragTarget.current.id;

      scheduleDragBatch(() => {
        if (!dragTarget.current) return;
        if (dragTarget.current.type === 'rotate_caption' && onUpdateCaptionBounds) {
          onUpdateCaptionBounds(id, { rotation: newRotation });
        } else if (dragTarget.current.type === 'rotate_sticker' && onUpdateStickerBounds) {
          onUpdateStickerBounds(id, { rotation: newRotation });
        } else if (dragTarget.current.type === 'rotate_imageLayer' && onUpdateImageLayerBounds) {
          onUpdateImageLayerBounds(id, { rotation: newRotation });
        }
      });
      return;
    }

    if (dragTarget.current.type.startsWith('resize_imageLayer_')) {
      const id = dragTarget.current.id;
      const imgLayer = imageLayers.find(l => l.id === id);
      if (!imgLayer || !onUpdateImageLayerBounds) return;

      const centerX = initialLayerPos.current.centerX ?? (initialLayerPos.current.x * canvas.width);
      const centerY = initialLayerPos.current.centerY ?? (headerExtH + initialLayerPos.current.y * canvasH);
      const handleType = dragTarget.current.type;

      const initW = initialLayerPos.current.boxWidth || initialLayerPos.current.width || 160;
      const initH = initialLayerPos.current.boxHeight || initialLayerPos.current.height || 160;
      const initScale = initialLayerPos.current.scale || 1.0;
      const isCropping = (imgLayer.fitMode === 'crop') || (initialLayerPos.current.fitMode === 'crop');

      if (isCropping) {
        const initCrop = initialLayerPos.current.crop || { x: 0, y: 0, width: 1, height: 1 };
        const rot = (imgLayer.rotation || 0);
        let naturalFullW = initW / Math.max(0.01, initCrop.width || 1);
        let naturalFullH = initH / Math.max(0.01, initCrop.height || 1);
        const cached = imageCacheRef.current[imgLayer.url];
        if (cached && cached.width && cached.height) {
          const baseW = cached.width;
          const baseH = cached.height;
          const fitScale = Math.min(320 / baseW, 320 / baseH);
          const scale = initialLayerPos.current.scale || imgLayer.scale || 1.0;
          if (!initialLayerPos.current.crop || (initialLayerPos.current.crop.width === 1 && initialLayerPos.current.crop.height === 1)) {
            naturalFullW = baseW * fitScale * scale;
            naturalFullH = baseH * fitScale * scale;
          }
        }

        const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -rot);

        if (handleType === 'resize_imageLayer_r') {
          const localLeft = centerX - initW / 2;
          const rawW = localCoords.x - localLeft;
          const maxCropW = Math.max(0.02, 1.0 - (initCrop.x || 0));
          const minCropW = Math.min(maxCropW, Math.max(0.02, 20 / naturalFullW));
          const targetCropW = rawW / naturalFullW;
          const newCropWidth = Math.max(minCropW, Math.min(maxCropW, targetCropW));
          const newW = Math.max(20, Math.round(newCropWidth * naturalFullW));
          const newLocalCenterX = localLeft + newW / 2;
          const newCenter = rotatePoint(newLocalCenterX, centerY, centerX, centerY, rot);

          onUpdateImageLayerBounds(id, {
            x: newCenter.x / canvas.width,
            y: (newCenter.y - headerExtH) / canvasH,
            width: newW,
            boxWidth: newW,
            crop: { ...initCrop, width: newCropWidth },
            fitMode: 'crop'
          });
          return;
        }

        if (handleType === 'resize_imageLayer_l') {
          const localRight = centerX + initW / 2;
          const rawW = localRight - localCoords.x;
          const rightCropEdge = Math.min(1.0, (initCrop.x || 0) + (initCrop.width || 1));
          const maxCropW = Math.max(0.02, rightCropEdge);
          const minCropW = Math.min(maxCropW, Math.max(0.02, 20 / naturalFullW));
          const targetCropW = rawW / naturalFullW;
          const newCropWidth = Math.max(minCropW, Math.min(maxCropW, targetCropW));
          const newCropX = Math.max(0, rightCropEdge - newCropWidth);
          const newW = Math.max(20, Math.round(newCropWidth * naturalFullW));
          const newLocalCenterX = localRight - newW / 2;
          const newCenter = rotatePoint(newLocalCenterX, centerY, centerX, centerY, rot);

          onUpdateImageLayerBounds(id, {
            x: newCenter.x / canvas.width,
            y: (newCenter.y - headerExtH) / canvasH,
            width: newW,
            boxWidth: newW,
            crop: { ...initCrop, x: newCropX, width: newCropWidth },
            fitMode: 'crop'
          });
          return;
        }

        if (handleType === 'resize_imageLayer_b') {
          const localTop = centerY - initH / 2;
          const rawH = localCoords.y - localTop;
          const maxCropH = Math.max(0.02, 1.0 - (initCrop.y || 0));
          const minCropH = Math.min(maxCropH, Math.max(0.02, 20 / naturalFullH));
          const targetCropH = rawH / naturalFullH;
          const newCropHeight = Math.max(minCropH, Math.min(maxCropH, targetCropH));
          const newH = Math.max(20, Math.round(newCropHeight * naturalFullH));
          const newLocalCenterY = localTop + newH / 2;
          const newCenter = rotatePoint(centerX, newLocalCenterY, centerX, centerY, rot);

          onUpdateImageLayerBounds(id, {
            x: newCenter.x / canvas.width,
            y: (newCenter.y - headerExtH) / canvasH,
            height: newH,
            boxHeight: newH,
            crop: { ...initCrop, height: newCropHeight },
            fitMode: 'crop'
          });
          return;
        }

        if (handleType === 'resize_imageLayer_t') {
          const localBottom = centerY + initH / 2;
          const rawH = localBottom - localCoords.y;
          const bottomCropEdge = Math.min(1.0, (initCrop.y || 0) + (initCrop.height || 1));
          const maxCropH = Math.max(0.02, bottomCropEdge);
          const minCropH = Math.min(maxCropH, Math.max(0.02, 20 / naturalFullH));
          const targetCropH = rawH / naturalFullH;
          const newCropHeight = Math.max(minCropH, Math.min(maxCropH, targetCropH));
          const newCropY = Math.max(0, bottomCropEdge - newCropHeight);
          const newH = Math.max(20, Math.round(newCropHeight * naturalFullH));
          const newLocalCenterY = localBottom - newH / 2;
          const newCenter = rotatePoint(centerX, newLocalCenterY, centerX, centerY, rot);

          onUpdateImageLayerBounds(id, {
            x: newCenter.x / canvas.width,
            y: (newCenter.y - headerExtH) / canvasH,
            height: newH,
            boxHeight: newH,
            crop: { ...initCrop, y: newCropY, height: newCropHeight },
            fitMode: 'crop'
          });
          return;
        }

        // In crop mode, corner resize is disabled
        return;
      }

      const nextFitMode = (!imgLayer.fitMode || imgLayer.fitMode === 'fit') ? 'stretch' : imgLayer.fitMode;

      if (handleType === 'resize_imageLayer_l' || handleType === 'resize_imageLayer_r') {
        // Horizontal stretch / crop
        const currentAngle = (imgLayer.rotation || 0);
        const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -currentAngle);
        const horizontalDist = Math.abs(localCoords.x - centerX);
        const newWidth = Math.max(30, Math.round(horizontalDist * 2));

        onUpdateImageLayerBounds(id, {
          width: newWidth,
          boxWidth: newWidth,
          height: initH,
          boxHeight: initH,
          fitMode: nextFitMode
        });
        return;
      }

      if (handleType === 'resize_imageLayer_t' || handleType === 'resize_imageLayer_b') {
        // Vertical stretch / crop
        const currentAngle = (imgLayer.rotation || 0);
        const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -currentAngle);
        const verticalDist = Math.abs(localCoords.y - centerY);
        const newHeight = Math.max(30, Math.round(verticalDist * 2));

        onUpdateImageLayerBounds(id, {
          width: initW,
          boxWidth: initW,
          height: newHeight,
          boxHeight: newHeight,
          fitMode: nextFitMode
        });
        return;
      }

      // Corner handles: uniform proportional scaling
      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const initDist = initialLayerPos.current.initialDist || 50;
      const scaleFactor = Math.max(0.05, currentDist / initDist);

      const newWidth = Math.max(30, Math.round(initW * scaleFactor));
      const newHeight = Math.max(30, Math.round(initH * scaleFactor));
      const newScale = Math.max(0.1, Math.min(10.0, Number((initScale * scaleFactor).toFixed(2))));

      onUpdateImageLayerBounds(id, { 
        width: newWidth, 
        height: newHeight, 
        boxWidth: newWidth, 
        boxHeight: newHeight, 
        scale: newScale 
      });
      return;
    }
    
    if (dragTarget.current.type.startsWith('resize_sticker_')) {
      const id = dragTarget.current.id;
      const stk = stickers.find(s => s.id === id);
      if (!stk || !onUpdateStickerBounds) return;

      const centerX = initialLayerPos.current.centerX ?? (initialLayerPos.current.x * canvas.width);
      const centerY = initialLayerPos.current.centerY ?? (headerExtH + initialLayerPos.current.y * canvasH);

      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const initDist = initialLayerPos.current.initialDist || Math.max(10, (stk.scale || 1.0) * 52 * 0.7);
      const initScale = initialLayerPos.current.scale || 1.0;

      const scaleFactor = currentDist / initDist;
      const newScale = Math.max(0.2, Math.min(20.0, Number((initScale * scaleFactor).toFixed(2))));
      onUpdateStickerBounds(id, { scale: newScale });
      return;
    }
    
    if (dragTarget.current.type.startsWith('resize_caption_')) {
      const id = dragTarget.current.id;
      const cap = captions.find(c => c.id === id);
      if (!cap || !onUpdateCaptionBounds) return;

      const centerX = initialLayerPos.current.centerX ?? (initialLayerPos.current.x * canvas.width);
      const centerY = initialLayerPos.current.centerY ?? (headerExtH + initialLayerPos.current.y * canvasH);
      const rot = initialLayerPos.current.rotation || 0;
      const handleType = dragTarget.current.type;

      // Transform pointer coordinates into layer's local rotated coordinate space!
      const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -rot);

      // Safe bounds limit inside canvas box with safety margin (8px)
      const edgePad = 8;
      const rad = Math.abs((rot * Math.PI) / 180);
      const cosR = Math.abs(Math.cos(rad));
      const sinR = Math.abs(Math.sin(rad));
      const maxAvailX = Math.max(20, Math.min(centerX - edgePad, canvas.width - centerX - edgePad));
      const maxAvailY = Math.max(20, Math.min(centerY - edgePad, canvas.height - centerY - edgePad));

      if (handleType === 'resize_caption_l' || handleType === 'resize_caption_r') {
        const localDx = localCoords.x - centerX;
        const rawHalfWidth = handleType === 'resize_caption_r'
          ? Math.max(30, localDx)
          : Math.max(30, -localDx);

        // Clamp width so box never expands outside the canvas box
        const currentH = initialLayerPos.current.initialBoxHeight || initialLayerPos.current.boxHeight || 60;
        let maxAllowedHalfW = canvas.width / 2 - edgePad;

        if (cosR > 0.08) {
          const limitFromX = (maxAvailX - (currentH / 2) * sinR) / cosR;
          maxAllowedHalfW = Math.min(maxAllowedHalfW, Math.max(30, limitFromX));
        }
        if (sinR > 0.08) {
          const limitFromY = (maxAvailY - (currentH / 2) * cosR) / sinR;
          maxAllowedHalfW = Math.min(maxAllowedHalfW, Math.max(30, limitFromY));
        }

        const halfWidth = Math.max(30, Math.min(maxAllowedHalfW, rawHalfWidth));
        const newBoxWidthPx = halfWidth * 2;
        const newWidth = Math.max(0.15, Math.min(0.98, Number((newBoxWidthPx / canvas.width).toFixed(3))));

        onUpdateCaptionBounds(id, { 
          width: newWidth,
          hasCustomWidth: true
        });
        return;
      }

      // Corner handles: proportional scaling
      const localDx = localCoords.x - centerX;
      const localDy = localCoords.y - centerY;
      const initDist = initialLayerPos.current.initialDist || 50;

      // Projection along the corner diagonal vector for natural, smooth scaling
      const initRelX = initialLayerPos.current.handleRelX || (handleType.includes('r') ? 50 : -50);
      const initRelY = initialLayerPos.current.handleRelY || (handleType.includes('b') ? 50 : -50);
      const proj = (localDx * initRelX + localDy * initRelY) / (initDist * initDist);

      // Clamp scaleFactor so the resized text element box stays strictly inside canvas boundaries
      const initW = initialLayerPos.current.initialBoxWidth || initialLayerPos.current.boxWidth || 100;
      const initH = initialLayerPos.current.initialBoxHeight || initialLayerPos.current.boxHeight || 60;
      const initHalfExtentX = Math.max(20, (initW / 2) * cosR + (initH / 2) * sinR);
      const initHalfExtentY = Math.max(20, (initW / 2) * sinR + (initH / 2) * cosR);

      const maxScaleX = maxAvailX / initHalfExtentX;
      const maxScaleY = maxAvailY / initHalfExtentY;
      const maxAllowedScale = Math.max(0.35, Math.min(maxScaleX, maxScaleY));

      const scaleFactor = Math.max(0.1, Math.min(maxAllowedScale, proj));

      const isSocial = cap.isTweetCard || cap.isInstagramCard || cap.isWhatsAppCard;
      const defaultCardWidth = cap.isWhatsAppCard ? 0.84 : 0.88;
      const initFontSize = initialLayerPos.current.initialFontSize || cap.fontSize || (isSocial ? 16 : 50);
      const newFontSize = Math.max(10, Math.min(220, Math.round(initFontSize * scaleFactor)));

      const initWidth = initialLayerPos.current.initialWidth || cap.width || (isSocial ? defaultCardWidth : 0.9);
      const newWidth = Math.max(0.15, Math.min(0.98, Number((initWidth * scaleFactor).toFixed(3))));

      onUpdateCaptionBounds(id, { 
        fontSize: newFontSize,
        width: newWidth
      });
      return;
    }

    // Standard translation
    const targetId = dragTarget.current.id;
    let newX = initialLayerPos.current.x + dx;
    let newY = initialLayerPos.current.y + dy;

    if (dragTarget.current.type === 'caption') {
      const rot = initialLayerPos.current.rotation || 0;
      const rad = Math.abs((rot * Math.PI) / 180);
      const bW = initialLayerPos.current.boxWidth || ((initialLayerPos.current.width || 0.5) * canvas.width) || 100;
      const bH = initialLayerPos.current.boxHeight || 60;
      const halfExtX = (bW / 2) * Math.abs(Math.cos(rad)) + (bH / 2) * Math.abs(Math.sin(rad));
      const halfExtY = (bW / 2) * Math.abs(Math.sin(rad)) + (bH / 2) * Math.abs(Math.cos(rad));
      const edgePad = 8;
      const minX = Math.min(0.5, (halfExtX + edgePad) / canvas.width);
      const maxX = Math.max(0.5, (canvas.width - halfExtX - edgePad) / canvas.width);
      const isHeaderOrFooter = dragTarget.current?.isHeaderCaption || dragTarget.current?.isFooterCaption;
      const effectiveCanvasH = isHeaderOrFooter ? canvas.height : canvasH;
      const minY = Math.min(0.5, (halfExtY + edgePad) / effectiveCanvasH);
      const maxY = Math.max(0.5, (effectiveCanvasH - halfExtY - edgePad) / effectiveCanvasH);
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
    }

    const SNAP_DIST = 0.015;

    let snapH = null;
    let snapV = null;
    
    // 1. Center Snapping
    if (Math.abs(newX - 0.5) < SNAP_DIST) { newX = 0.5; snapV = 0.5; }
    if (Math.abs(newY - 0.5) < SNAP_DIST) { newY = 0.5; snapH = 0.5; }

    // 2. Layer-to-Layer Snapping
    captions.forEach((c) => {
      if (c.id !== targetId) {
        if (Math.abs(newX - c.x) < SNAP_DIST) { newX = c.x; snapV = c.x; }
        if (Math.abs(newY - c.y) < SNAP_DIST) { newY = c.y; snapH = c.y; }
      }
    });
    stickers.forEach((s) => {
      if (s.id !== targetId) {
        if (Math.abs(newX - s.x) < SNAP_DIST) { newX = s.x; snapV = s.x; }
        if (Math.abs(newY - s.y) < SNAP_DIST) { newY = s.y; snapH = s.y; }
      }
    });
    (imageLayers || []).forEach((img) => {
      if (img.id !== targetId) {
        if (Math.abs(newX - img.x) < SNAP_DIST) { newX = img.x; snapV = img.x; }
        if (Math.abs(newY - img.y) < SNAP_DIST) { newY = img.y; snapH = img.y; }
      }
    });
    
    snappingLines.current = { horizontal: snapH, vertical: snapV };

    scheduleDragBatch(() => {
      if (!dragTarget.current) return;
      if (dragTarget.current.type === 'caption' && onUpdateCaptionBounds) {
        const isHeaderOrFooter = dragTarget.current?.isHeaderCaption || dragTarget.current?.isFooterCaption;
        if (isHeaderOrFooter) {
          dragTarget.current.hasCustomPos = true;
        }
        onUpdateCaptionBounds(dragTarget.current.id, { 
          x: newX, 
          y: newY,
          ...(isHeaderOrFooter ? { hasCustomPos: true } : {})
        });
      } else if (dragTarget.current.type === 'sticker' && onUpdateStickerBounds) {
        onUpdateStickerBounds(dragTarget.current.id, { x: newX, y: newY });
      } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerBounds) {
        onUpdateImageLayerBounds(dragTarget.current.id, { x: newX, y: newY });
      } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerPosition) {
        onUpdateImageLayerPosition(dragTarget.current.id, newX, newY);
      }
    });
  };

  const handlePointerUp = () => {
    flushDragBatch();
    if (canvasRef.current && !isDrawingMode) {
      canvasRef.current.style.cursor = 'default';
    }
    if (isDrawingMode && isDrawingActive.current) {
      isDrawingActive.current = false;
      lastDrawPoint.current = null;
      if (currentStroke.current) {
        const strokeToSave = currentStroke.current;
        currentStroke.current = null;
        if (strokeToSave.points.length > 0 && onAddDrawing) {
          onAddDrawing(strokeToSave);
        }
      }
      return;
    }
    isDragging.current = false;
    hasDragged.current = false;
    dragTarget.current = null;
    if (snappingLines.current.horizontal !== null || snappingLines.current.vertical !== null) {
      snappingLines.current = { horizontal: null, vertical: null };
    }
    if (baseImgRef.current) renderCanvas(baseImgRef.current);
  };

  useEffect(() => {
    if (baseImgRef.current || isNativeLayout) {
      // Just force a re-render. To force a re-render in CanvasEditor we just call renderCanvas.
      // But renderCanvas is inside the component body, so it is accessible.
      // Let's check if renderCanvas is defined in the body... yes.
      // We will inject a dummy state update to force the component to re-execute and thus call renderCanvas via the existing mechanisms, OR just call renderCanvas directly.
      // Wait, renderCanvas takes the image. 
      if (typeof renderCanvas === 'function') {
         renderCanvas(baseImgRef.current);
      }
    }
  }, [liveBgColor, isNativeLayout]);
  
// Keep focus on active caption whenever selected (not for social cards)
  useEffect(() => {
    const isSocial = activeCaption?.isTweetCard || activeCaption?.isInstagramCard || activeCaption?.isWhatsAppCard;
    if (activeCaption && !isSocial && editingCaptionId === activeCaption.id) {
      focusTextarea();
    }
  }, [activeCaption?.id, editingCaptionId]);

  const handleWheel = (e) => {
    if (!activeIsNativeLayout || !activeLayoutDef || !onUpdateSlotTransform) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(e);
    
    const totalSlots = activeLayoutDef.slots;
    const isVert = activeLayoutDef.id === '2-vert' || activeLayoutDef.id === '3-stacked';
    const isHoriz = activeLayoutDef.id === '2-horiz' || activeLayoutDef.id === '3-horiz';
    const isGrid = activeLayoutDef.id === '4-grid';
    const isHybrid = activeLayoutDef.id === '3-hybrid';

    let hitSlotIdx = -1;
    for (let idx = 0; idx < totalSlots; idx++) {
      let x = 0, y = headerExtH, slotW = canvasW, slotH = canvasH;
      if (isVert) { slotH = canvasH / totalSlots; y = headerExtH + idx * slotH; }
      else if (isHoriz) { slotW = canvasW / totalSlots; x = idx * slotW; y = headerExtH; }
      else if (isGrid) { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx % 2) * slotW; y = headerExtH + Math.floor(idx / 2) * slotH; }
      else if (isHybrid) {
        if (idx === 0) { slotW = canvasW; slotH = canvasH / 2; x = 0; y = headerExtH; }
        else { slotW = canvasW / 2; slotH = canvasH / 2; x = (idx - 1) * slotW; y = headerExtH + canvasH / 2; }
      }
      if (coords.x >= x && coords.x <= x + slotW && coords.y >= y && coords.y <= y + slotH) {
        hitSlotIdx = idx;
        break;
      }
    }

    if (hitSlotIdx !== -1 && slotImages && slotImages[hitSlotIdx]) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      onUpdateSlotTransform(hitSlotIdx, (prev) => {
        const prevScale = prev?.scale || 1.5;
        const newScale = Math.max(0.4, Math.min(6.0, Number((prevScale * zoomFactor).toFixed(2))));
        return {
          ...prev,
          scale: newScale
        };
      });
    }
  };

  const computedFontSize = activeCaption ? (activeCaption.fontSize || 50) * (canvasScale || 1) : 18;

  return (
    <div
      ref={wrapperRef}
      className="canvas-interactive-wrapper"
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        touchAction: 'none',
        flex: 'none',
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: `${canvasW} / ${totalCanvasH}`,
        boxSizing: 'border-box'
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerEnd}
      onDragStart={(e) => e.preventDefault()}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        className="meme-canvas"
        onDragStart={(e) => e.preventDefault()}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: isDrawingMode ? 'crosshair' : 'default',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
      />

      {/* SEAMLESS LIVE CANVAS TEXT EDITOR — ONLY FOR REGULAR CAPTIONS, NOT SOCIAL CARDS */}
      {!isDrawingMode && activeCaption && !activeCaption.isTweetCard && !activeCaption.isInstagramCard && !activeCaption.isWhatsAppCard && (
        <textarea
          ref={editableRef}
          className="seamless-live-text-editor"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            position: 'absolute',
            left: activeCaption ? `${activeCaption.x * 100}%` : '-9999px',
            top: activeCaption
              ? (activeCaption.isHeaderCaption && !activeCaption.hasCustomPos
                  ? `${((headerExtH / 2) / Math.max(1, totalCanvasH)) * 100}%`
                  : (activeCaption.isFooterCaption && !activeCaption.hasCustomPos)
                  ? `${(((headerExtH + canvasH + (footerExtH / 2))) / Math.max(1, totalCanvasH)) * 100}%`
                  : `${(((headerExtH + activeCaption.y * canvasH) / Math.max(1, totalCanvasH)) * 100)}%`)
              : '-9999px',
            transform: activeCaption ? `translate(-50%, -50%) rotate(${activeCaption.rotation || 0}deg)` : 'translate(-50%, -50%)',
            width: activeCaption ? `${Math.min(95, Math.max(35, (activeCaption.width || 0.8) * 100))}%` : '1px',
            minHeight: activeCaption ? '44px' : '1px',
            opacity: 0.001,
            pointerEvents: activeCaption ? 'auto' : 'none',
            color: 'transparent',
            caretColor: 'transparent',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            zIndex: activeCaption ? 15 : -1,
            padding: '0',
            margin: '0',
            fontSize: '16px',
            touchAction: 'manipulation',
            overflow: 'hidden'
          }}
          rows={2}
          value={activeCaption ? (activeCaption.text || '') : ''}
          onChange={(e) => {
            if (activeCaption && onUpdateCaptionText) {
              onUpdateCaptionText(activeCaption.id, e.target.value);
            }
          }}
          onFocus={(e) => {
            try {
              const len = e.target.value.length;
              e.target.setSelectionRange(len, len);
            } catch {
              // Selection fallback
            }
          }}
          onBlur={() => {
            setEditingCaptionId(null);
          }}
          onTouchStart={(e) => {
            handleTextOverlayPointerDown(e);
          }}
          onTouchEnd={(e) => {
            handleTextOverlayPointerEnd(e);
          }}
          onMouseDown={handleTextOverlayPointerDown}
          onMouseUp={handleTextOverlayPointerEnd}
        />
      )}
    </div>
  );
});

export default CanvasEditor;
