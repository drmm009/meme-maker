import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Image as ImageIcon, Sparkles, Type } from 'lucide-react';
import { getFilterCss, drawImageFiltered } from '../data/photoFilters';

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

const isColorDark = (colorStr) => {
  if (!colorStr) return false;
  const str = String(colorStr).trim().toLowerCase();
  if (str === 'black' || str === '#000' || str === '#000000') return true;
  if (str === 'white' || str === '#fff' || str === '#ffffff' || str === 'transparent' || str === 'none') return false;
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16) || 0;
      const g = parseInt(hex.slice(2, 4), 16) || 0;
      const b = parseInt(hex.slice(4, 6), 16) || 0;
      return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }
  }
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10) || 0;
    const g = parseInt(rgbMatch[2], 10) || 0;
    const b = parseInt(rgbMatch[3], 10) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }
  return false;
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
    drawRoundRect(ctx, x, y, width, height, 16);
    ctx.beginPath();
    ctx.moveTo(x + width - 6, y + height);
    ctx.quadraticCurveTo(x + width + 8, y + height, x + width + 6, y + height + 6);
    ctx.quadraticCurveTo(x + width, y + height + 2, x + width - 14, y + height);
    ctx.fill();
  } else if (style === 'imessage-receive') {
    const isDark = isColorDark(fillColor);
    ctx.fillStyle = fillColor || (isDark ? '#262628' : '#e9e9eb');
    drawRoundRect(ctx, x, y, width, height, 16);
    ctx.beginPath();
    ctx.moveTo(x + 6, y + height);
    ctx.quadraticCurveTo(x - 8, y + height, x - 6, y + height + 6);
    ctx.quadraticCurveTo(x, y + height + 2, x + 14, y + height);
    ctx.fill();
  } else if (style === 'whatsapp-send') {
    ctx.fillStyle = fillColor || '#005c4b';
    drawRoundRect(ctx, x, y, width, height, 10);
    ctx.beginPath();
    ctx.moveTo(x + width, y + height - 12);
    ctx.lineTo(x + width + 6, y + height);
    ctx.lineTo(x + width - 8, y + height);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'whatsapp-receive') {
    const isDark = isColorDark(fillColor);
    ctx.fillStyle = fillColor || (isDark ? '#202c33' : '#ffffff');
    drawRoundRect(ctx, x, y, width, height, 10);
    ctx.beginPath();
    ctx.moveTo(x, y + height - 12);
    ctx.lineTo(x - 6, y + height);
    ctx.lineTo(x + 8, y + height);
    ctx.closePath();
    ctx.fill();
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

const drawCurvedText = (ctx, line, curve, baseLy, textAnchorX, fontSize, shouldStroke, strokeColor, strokeWidth, textColor) => {
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
    if (shouldStroke) {
      ctx.strokeText(ch, 0, 0);
    }
    ctx.fillText(ch, 0, 0);
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

const getTweetCardHeight = (ctx, cap, cardW) => {
  const pad = 18;
  const bodyFontSize = cap.fontSize ? Math.min(24, Math.max(16, cap.fontSize)) : 18;
  ctx.save();
  ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const wrappedLines = wrapText(ctx, cap.text || '', cardW - pad * 2);
  ctx.restore();
  const bodyH = wrappedLines.length * (bodyFontSize * 1.35);
  return Math.round(pad + 44 + 10 + bodyH + 12 + 16 + 12 + 24 + pad);
};

const drawTweetCard = (ctx, cardW, cap) => {
  ctx.save();
  const theme = cap.tweetTheme || 'dark';
  const isDark = theme !== 'light';
  const cardBg = theme === 'dim' ? '#15202b' : (isDark ? '#000000' : '#ffffff');
  const textColor = isDark ? '#ffffff' : '#0f1419';
  const mutedColor = isDark ? '#71767b' : '#536471';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

  const name = cap.tweetName || 'Elon Musk';
  const handle = cap.tweetHandle || '@elonmusk';
  const text = cap.text || "thinking about deleting the database and moving to the woods";
  const time = cap.tweetTime || '10:42 PM · Oct 7, 2026';
  const isVerified = cap.tweetVerified !== false;

  const pad = 18;
  const avatarR = 20;
  const bodyFontSize = cap.fontSize ? Math.min(24, Math.max(16, cap.fontSize)) : 18;

  ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const wrappedLines = wrapText(ctx, text, cardW - pad * 2);
  const bodyH = wrappedLines.length * (bodyFontSize * 1.35);

  const cardH = Math.round(pad + 44 + 10 + bodyH + 12 + 16 + 12 + 24 + pad);
  const startX = - cardW / 2;
  const startY = - cardH / 2;

  ctx.fillStyle = cardBg;
  drawRoundRect(ctx, startX, startY, cardW, cardH, 16);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Avatar circle
  const avX = startX + pad + avatarR;
  const avY = startY + pad + avatarR;
  ctx.beginPath();
  ctx.arc(avX, avY, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#27272a' : '#e4e4e7';
  ctx.fill();
  ctx.fillStyle = isDark ? '#a1a1aa' : '#71717a';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.charAt(0).toUpperCase() || 'U', avX, avY);

  // Name & Handle
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = textColor;
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
  const nameY = startY + pad + 2;
  ctx.fillText(name, startX + pad + 50, nameY);

  const nameWidth = ctx.measureText(name).width;
  if (isVerified) {
    const badgeX = startX + pad + 54 + nameWidth;
    ctx.beginPath();
    ctx.arc(badgeX + 7, nameY + 9, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1d9bf0';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', badgeX + 7, nameY + 9);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = mutedColor;
  ctx.font = 'normal 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(handle, startX + pad + 50, nameY + 20);

  // X Logo top-right
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = isDark ? '#ffffff' : '#000000';
  ctx.textAlign = 'right';
  ctx.fillText('𝕏', startX + cardW - pad, startY + pad + 4);

  // Body text
  let curY = startY + pad + 44 + 10;
  ctx.fillStyle = textColor;
  ctx.font = `normal ${bodyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (const line of wrappedLines) {
    ctx.fillText(line, startX + pad, curY);
    curY += (bodyFontSize * 1.35);
  }

  // Timestamp
  curY += 8;
  ctx.fillStyle = mutedColor;
  ctx.font = 'normal 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(time, startX + pad, curY);

  // Divider
  curY += 22;
  ctx.strokeStyle = borderColor;
  ctx.beginPath();
  ctx.moveTo(startX + pad, curY);
  ctx.lineTo(startX + cardW - pad, curY);
  ctx.stroke();

  // Metrics
  curY += 10;
  ctx.fillStyle = mutedColor;
  ctx.font = 'normal 13px -apple-system, BlinkMacSystemFont, sans-serif';
  const metrics = cap.tweetMetrics || `💬 1.2K    🔁 42.8K    ❤️ 189.5K    📊 3.2M`;
  ctx.fillText(metrics, startX + pad, curY);

  ctx.restore();
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
    isVideoPlaying = true,
    watermark,
    canvasBgColor = '#ffffff',
    drawings = [],
    onAddDrawing,
    isDrawingMode = false,
    drawTool = 'brush',
    brushColor = '#a855f7',
    brushSize = 10,
    canvasHeader,
    onUpdateCanvasHeader,
    canvasFooter,
    onUpdateCanvasFooter,
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
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (editingCaptionId && activeLayerId === editingCaptionId) {
      setCursorVisible(true);
      const interval = setInterval(() => setCursorVisible(v => !v), 530);
      return () => clearInterval(interval);
    } else {
      setCursorVisible(false);
      if (editingCaptionId && activeLayerId !== editingCaptionId) {
        setEditingCaptionId(null);
      }
    }
  }, [editingCaptionId, activeLayerId]);
  const lastTapRef = useRef({ id: null, time: 0 });


  const imgSrc = template?.imageUrl || imageUrl;
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
      const hFontSize = headerCap.fontSize || 36;
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
      const fFontSize = footerCap.fontSize || 36;
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

  // Focus textarea ONLY when explicitly called (not on selection change)
  const focusTextarea = () => {
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
  const handlePointerEndRef = useRef(null);
  
  useLayoutEffect(() => {
    handlePointerDownRef.current = handlePointerDown;
    handlePointerMoveRef.current = handlePointerMove;
    handlePointerEndRef.current = handlePointerEnd;
  });

  // Native non-passive touch listeners: handle drag & drawing AND block page scroll
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e) => {
      if (isDrawingMode && e.cancelable) e.preventDefault();
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

    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Global window listeners for mouse drag & drawing so it doesn't stop when cursor moves outside canvas
  useEffect(() => {
    const onGlobalMouseMove = (e) => {
      if ((isDragging.current || isDrawingActive.current) && handlePointerMoveRef.current) {
        handlePointerMoveRef.current(e);
      }
    };
    const onGlobalMouseUp = (e) => {
      if ((isDragging.current || isDrawingActive.current) && handlePointerEndRef.current) {
        handlePointerEndRef.current(e);
      }
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, []);

  const baseImgRef = useRef(null);
  const compCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderCanvas = (img) => {
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

      const drawDeleteHandle = (uiCtx, hx, hy) => {
        uiCtx.beginPath();
        uiCtx.fillStyle = '#ef4444';
        uiCtx.strokeStyle = '#ffffff';
        uiCtx.lineWidth = 3;
        uiCtx.arc(hx, hy, 22, 0, Math.PI * 2);
        uiCtx.fill();
        uiCtx.stroke();
        
        uiCtx.save();
        uiCtx.translate(hx, hy);
        // Draw Trash Icon
        uiCtx.beginPath();
        uiCtx.strokeStyle = '#ffffff';
        uiCtx.lineWidth = 2.5;
        uiCtx.lineCap = 'round';
        uiCtx.lineJoin = 'round';
        
        // Lid
        uiCtx.moveTo(-7, -5);
        uiCtx.lineTo(7, -5);
        // Handle
        uiCtx.moveTo(-3, -5);
        uiCtx.lineTo(-3, -8);
        uiCtx.lineTo(3, -8);
        uiCtx.lineTo(3, -5);
        // Bin
        uiCtx.moveTo(-6, -5);
        uiCtx.lineTo(-5, 7);
        uiCtx.lineTo(5, 7);
        uiCtx.lineTo(6, -5);
        // Lines
        uiCtx.moveTo(-2, -1);
        uiCtx.lineTo(-2, 4);
        uiCtx.moveTo(2, -1);
        uiCtx.lineTo(2, 4);
        
        uiCtx.stroke();
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
        const cy = imgLayer.y * canvas.height;
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
          
          const scale = imgLayer.scale || 1.0;
          const maxDim = 320;
          const fitScale = Math.min(maxDim / baseW, maxDim / baseH);
          const w = imgLayer.boxWidth || imgLayer.width || (baseW * fitScale * scale);
          const h = imgLayer.boxHeight || imgLayer.height || (baseH * fitScale * scale);

          const mode = imgLayer.fitMode || 'fit';
          
          if (mode === 'stretch') {
            targetCtx.drawImage(drawSource, -w / 2, -h / 2, w, h);
          } else {
            const imgAspect = baseW / baseH;
            const boxAspect = w / h;
            let drawW = w;
            let drawH = h;
            
            if (mode === 'crop') {
              if (boxAspect > imgAspect) {
                drawW = w;
                drawH = w / imgAspect;
              } else {
                drawH = h;
                drawW = h * imgAspect;
              }
            } else { // fit
              if (boxAspect > imgAspect) {
                drawH = h;
                drawW = h * imgAspect;
              } else {
                drawH = w;
                drawH = w / imgAspect;
              }
            }
            
            targetCtx.save();
            targetCtx.beginPath();
            targetCtx.rect(-w / 2, -h / 2, w, h);
            targetCtx.clip();
            targetCtx.drawImage(drawSource, -drawW / 2, -drawH / 2, drawW, drawH);
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
              uiCtx.strokeStyle = '#f97316';
              uiCtx.lineWidth = 3;
              uiCtx.setLineDash([6, 6]);
              uiCtx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
              
              uiCtx.setLineDash([]);

              // Rotation handle stem
              uiCtx.beginPath();
              uiCtx.strokeStyle = '#000000';
              uiCtx.lineWidth = 2;
              uiCtx.moveTo(0, -hh);
              uiCtx.lineTo(0, -hh - 60);
              uiCtx.stroke();
              
              // Rotation handle circle
              uiCtx.beginPath();
              uiCtx.fillStyle = '#f97316';
              uiCtx.arc(0, -hh - 60, 16, 0, Math.PI * 2);
              uiCtx.fill();
              uiCtx.stroke();

              // Round handles for resizing, stretching, and cropping (4 corners + 4 middle of sides)
              uiCtx.fillStyle = '#f97316';
              uiCtx.strokeStyle = '#000000';
              uiCtx.lineWidth = 2;
              const drawRoundHandle = (hx, hy) => {
                uiCtx.beginPath();
                uiCtx.arc(hx, hy, 14, 0, Math.PI * 2);
                uiCtx.fill();
                uiCtx.stroke();
              };

              // 4 Corner handles
              drawRoundHandle(-hw, -hh); // TL
              drawRoundHandle(hw, -hh);  // TR
              drawRoundHandle(-hw, hh);  // BL
              drawRoundHandle(hw, hh);   // BR

              // 4 Middle-of-side handles
              drawRoundHandle(0, -hh);  // Top middle
              drawRoundHandle(0, hh);   // Bottom middle
              drawRoundHandle(-hw, 0);  // Left middle
              drawRoundHandle(hw, 0);   // Right middle
              
              drawDeleteHandle(uiCtx, -hw - 36, -hh - 36);
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
        const sy = stk.y * canvas.height;
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
            uiCtx.strokeStyle = '#f97316';
            uiCtx.lineWidth = 3;
            uiCtx.setLineDash([6, 6]);
            uiCtx.strokeRect(-stkSize / 2 - 6, -stkSize / 2 - 6, stkSize + 12, stkSize + 12);
            
            uiCtx.setLineDash([]);
            uiCtx.fillStyle = '#f97316';
            uiCtx.strokeStyle = '#000000';
            uiCtx.lineWidth = 2;
            
            const drawHandle = (x, y) => {
              uiCtx.beginPath();
              uiCtx.arc(x, y, 14, 0, Math.PI * 2);
              uiCtx.fill();
              uiCtx.stroke();
            };
            
            const hs = stkSize / 2 + 6;
            drawHandle(-hs, -hs); // TL
            drawHandle(hs, -hs); // TR
            drawHandle(-hs, hs); // BL
            drawHandle(hs, hs); // BR
            
            uiCtx.beginPath();
            uiCtx.moveTo(0, -stkSize / 2 - 6);
            uiCtx.lineTo(0, -stkSize / 2 - 40);
            uiCtx.stroke();
            
            uiCtx.beginPath();
            uiCtx.fillStyle = '#f97316';
            uiCtx.arc(0, -stkSize / 2 - 40, 16, 0, Math.PI * 2);
            uiCtx.fill();
            uiCtx.stroke();
            
            drawDeleteHandle(uiCtx, -hs - 36, -hs - 36);
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
        const cx = cap.x * canvas.width;
        const cy = (cap.isHeaderCaption && !cap.hasCustomPos)
          ? (headerExtH / 2)
          : (cap.isFooterCaption && !cap.hasCustomPos)
          ? (headerExtH + canvasH + (footerExtH / 2))
          : (cap.y * canvas.height);
        
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

        const fontSize = cap.fontSize || 50;
        const fontFamily = cap.fontFamily || 'Impact, sans-serif';
        targetCtx.font = `bold ${fontSize}px ${fontFamily}`;
        const align = cap.align || 'center';
        targetCtx.textAlign = align;
        targetCtx.textBaseline = 'middle';

        const renderMaxWidth = (cap.width || 0.9) * canvas.width;
        
        let displayString = cap.text || '';
        if (cap.id === editingCaptionId && cap.id === activeLayerId && cursorVisible && !isDrawingMode) {
          displayString += '|';
        }
        
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
        const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15));
        const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1));
        let boxWidth = maxLineWidth + padX * 2;
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
          boxWidth = Math.min(540, (cap.width || 0.88) * canvas.width);
          boxHeight = getTweetCardHeight(targetCtx, cap, boxWidth);
          drawTweetCard(targetCtx, boxWidth, cap);
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
                textColor
              );
            } else {
              if (shouldStroke) {
                targetCtx.strokeStyle = cap.stroke;
                targetCtx.lineWidth = cap.strokeWidth || Math.max(3, fontSize / 7);
                targetCtx.lineJoin = 'miter';
                targetCtx.miterLimit = 2;
                targetCtx.setLineDash([]);
                targetCtx.strokeText(line, textAnchorX, ly);
              }

              targetCtx.fillStyle = textColor;
              targetCtx.fillText(line, textAnchorX, ly);
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

            uiCtx.strokeStyle = '#f97316';
            uiCtx.lineWidth = 3;
            uiCtx.setLineDash([6, 6]);
            
            uiCtx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            
            uiCtx.setLineDash([]);
            uiCtx.fillStyle = '#f97316';
            uiCtx.strokeStyle = '#000000';
            uiCtx.lineWidth = 2;
            
            const drawHandle = (x, y) => {
              uiCtx.beginPath();
              uiCtx.arc(x, y, 14, 0, Math.PI * 2);
              uiCtx.fill();
              uiCtx.stroke();
            };
            
            drawHandle(boxX, boxY); // Top Left
            drawHandle(boxX + boxWidth, boxY); // Top Right
            drawHandle(boxX, boxY + boxHeight); // Bottom Left
            drawHandle(boxX + boxWidth, boxY + boxHeight); // Bottom Right
            
            if (!cap.isHeaderCaption && !cap.isFooterCaption) {
              uiCtx.beginPath();
              uiCtx.moveTo(0, boxY);
              uiCtx.lineTo(0, boxY - 34);
              uiCtx.stroke();
              
              uiCtx.beginPath();
              uiCtx.fillStyle = '#f97316';
              uiCtx.arc(0, boxY - 34, 16, 0, Math.PI * 2);
              uiCtx.fill();
              uiCtx.stroke();

              drawDeleteHandle(uiCtx, boxX - 36, boxY - 36);
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
      if (activeHandleDrawer) {
        activeHandleDrawer(ctx);
      }

      // Draw Snapping Guides
      if (isDragging.current && snappingLines.current && (snappingLines.current.horizontal !== null || snappingLines.current.vertical !== null)) {
        const { horizontal, vertical } = snappingLines.current;
        ctx.save();
        ctx.setLineDash([6, 6]);
        
        if (horizontal !== null) {
          const y = horizontal * canvas.height;
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
        baseImg.src = imgSrc;
    } else {
      renderCanvas(null);
    }
  }, [captions, stickers, activeLayerId, imageLayers, slotImages, slotTransforms, activeIsNativeLayout, editingCaptionId, cursorVisible, aspectRatio, imageFit, watermark, drawings, isDrawingMode, imgSrc, filters, liveBgColor, canvasHeader, canvasFooter, demotivational, canvasFlipX]);

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
        const cy = activeStk.y * canvas.height;
        const stkSize = (activeStk.scale || 1.0) * 52;
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeStk.rotation || 0));
        const hs = stkSize / 2 + 6;

        const handles = [
          { type: 'delete_layer', x: cx - hs - 36, y: cy - hs - 36, r: 26 },
          { type: 'rotate_sticker', x: cx, y: cy - stkSize / 2 - 40, r: 24 },
          { type: 'resize_sticker_tl', x: cx - hs, y: cy - hs, r: 22 },
          { type: 'resize_sticker_tr', x: cx + hs, y: cy - hs, r: 22 },
          { type: 'resize_sticker_bl', x: cx - hs, y: cy + hs, r: 22 },
          { type: 'resize_sticker_br', x: cx + hs, y: cy + hs, r: 22 },
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
          const cx = activeCap.x * canvas.width;
          const cy = (activeCap.isHeaderCaption && !activeCap.hasCustomPos)
            ? (headerExtH / 2)
            : (activeCap.isFooterCaption && !activeCap.hasCustomPos)
            ? (headerExtH + canvasH + (footerExtH / 2))
            : (activeCap.y * canvas.height);
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
          const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15));
          const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1));
          let boxWidth = maxLineWidth + padX * 2;
          const textHeight = lines.length * (fontSize * 1.2);
          let boxHeight = textHeight + padY * 2;
          if (activeCap.curve && Math.abs(activeCap.curve) > 0) {
            boxHeight += Math.round(getCurveSagitta(maxLineWidth, activeCap.curve));
          }

          if (activeCap.isBreakingNews) {
            boxWidth = Math.max(300, (activeCap.width || 0.94) * canvas.width);
            boxHeight = getBreakingNewsHeight(activeCap);
          } else if (activeCap.isTweetCard) {
            boxWidth = Math.min(540, (activeCap.width || 0.88) * canvas.width);
            boxHeight = getTweetCardHeight(ctx, activeCap, boxWidth);
          }
          const halfW = boxWidth / 2;
          const halfH = boxHeight / 2;

          const topY = cy - halfH;
          const bottomY = cy + halfH;
          const leftX = cx - halfW;
          const rightX = cx + halfW;

          const handles = [
            ...((!activeCap.isHeaderCaption && !activeCap.isFooterCaption) ? [{ type: 'delete_layer', x: leftX - 36, y: topY - 36, r: 26 }] : []),
            ...((!activeCap.isHeaderCaption && !activeCap.isFooterCaption) ? [{ type: 'rotate_caption', x: cx, y: topY - 34, r: 24 }] : []),
            { type: 'resize_caption_tl', x: leftX, y: topY, r: 24 },
            { type: 'resize_caption_tr', x: rightX, y: topY, r: 24 },
            { type: 'resize_caption_bl', x: leftX, y: bottomY, r: 24 },
            { type: 'resize_caption_br', x: rightX, y: bottomY, r: 24 }
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
            const cornerDist = Math.hypot(closestHandle.x - cx, closestHandle.y - cy);
            hitLayer = { 
              id: activeCap.id, 
              type: closestHandle.type, 
              x: activeCap.x, 
              y: (activeCap.isHeaderCaption && !activeCap.hasCustomPos)
                ? ((headerExtH / 2) / canvas.height)
                : (activeCap.isFooterCaption && !activeCap.hasCustomPos)
                ? ((headerExtH + canvasH + (footerExtH / 2)) / canvas.height)
                : activeCap.y,
              isHeaderCaption: !!activeCap.isHeaderCaption, 
              isFooterCaption: !!activeCap.isFooterCaption, 
              boxWidth,
              boxHeight,
              width: (boxWidth / canvas.width), 
              rotation: activeCap.rotation || 0,
              fontSize: activeCap.fontSize || 50,
              initialFontSize: activeCap.fontSize || 50,
              initialWidth: activeCap.width || (boxWidth / canvas.width),
              initialDist: Math.max(15, cornerDist)
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
            const cy = activeImg.y * canvas.height;
            const scale = activeImg.scale || 1.0;
            const baseW = cached.width || 200;
            const baseH = cached.height || 200;
            const fitScale = Math.min(320 / baseW, 320 / baseH);
            const w = activeImg.boxWidth || activeImg.width || (baseW * fitScale * scale);
            const h = activeImg.boxHeight || activeImg.height || (baseH * fitScale * scale);
            const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeImg.rotation || 0));

            const hw = w / 2 + 6;
            const hh = h / 2 + 6;

            const handles = [
              { type: 'delete_layer', x: cx - hw - 36, y: cy - hh - 36, r: 26 },
              { type: 'rotate_imageLayer', x: cx, y: cy - hh - 60, r: 22 },
              { type: 'resize_imageLayer_tl', x: cx - hw, y: cy - hh, r: 22 },
              { type: 'resize_imageLayer_tr', x: cx + hw, y: cy - hh, r: 22 },
              { type: 'resize_imageLayer_bl', x: cx - hw, y: cy + hh, r: 22 },
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
                height: h 
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
          const cy = stk.y * canvas.height;
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
          const cx = cap.x * canvas.width;
          const cy = (cap.isHeaderCaption && !cap.hasCustomPos)
            ? (headerExtH / 2)
            : (cap.isFooterCaption && !cap.hasCustomPos)
            ? (headerExtH + canvasH + (footerExtH / 2))
            : (cap.y * canvas.height);
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
          let boxWidth = maxLineWidth + padX * 2;
          const lineHeight = fontSize * 1.2;
          let boxHeight = lines.length * lineHeight + padY * 2;
          if (cap.curve && Math.abs(cap.curve) > 0) {
            boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
          }

          if (cap.isBreakingNews) {
            boxWidth = Math.max(300, (cap.width || 0.94) * canvas.width);
            boxHeight = getBreakingNewsHeight(cap);
          } else if (cap.isTweetCard) {
            boxWidth = Math.min(540, (cap.width || 0.88) * canvas.width);
            boxHeight = getTweetCardHeight(ctx, cap, boxWidth);
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
              y: (cap.isHeaderCaption && !cap.hasCustomPos)
                ? ((headerExtH / 2) / canvas.height)
                : (cap.isFooterCaption && !cap.hasCustomPos)
                ? ((headerExtH + canvasH + (footerExtH / 2)) / canvas.height)
                : cap.y,
              isHeaderCaption: !!cap.isHeaderCaption,
              isFooterCaption: !!cap.isFooterCaption,
              boxWidth,
              boxHeight,
              width: (boxWidth / canvas.width),
              rotation: cap.rotation || 0,
              fontSize: cap.fontSize || 50,
              locked: !!cap.locked
            };
          }
        } else if (layer._type === 'imageLayer') {
          const imgLayer = layer;
          const cx = imgLayer.x * canvas.width;
          const cy = imgLayer.y * canvas.height;
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
                locked: !!imgLayer.locked
              };
            }
          }
        }
      }
    }

    if (!hitLayer && isHeaderEnabled && coords.y <= headerExtH) {
      const hCap = captions.find(c => c.isHeaderCaption);
      if (hCap) {
        hitLayer = {
          id: hCap.id,
          type: 'caption',
          x: hCap.x,
          y: (hCap.isHeaderCaption && !hCap.hasCustomPos) ? ((headerExtH / 2) / canvas.height) : hCap.y,
          isHeaderCaption: true,
          locked: !!hCap.locked
        };
      }
    }

    if (!hitLayer && isFooterEnabled && coords.y >= (headerExtH + canvasH)) {
      const fCap = captions.find(c => c.isFooterCaption);
      if (fCap) {
        hitLayer = {
          id: fCap.id,
          type: 'caption',
          x: fCap.x,
          y: (fCap.isFooterCaption && !fCap.hasCustomPos) ? ((headerExtH + canvasH + (footerExtH / 2)) / canvas.height) : fCap.y,
          isFooterCaption: true,
          locked: !!fCap.locked
        };
      }
    }

    if (hitLayer) {
      if (hitLayer.type === 'delete_layer') {
        if (onDeleteLayer) onDeleteLayer();
        return;
      }
      
      if (onSelectLayer) onSelectLayer(hitLayer.id);

      // Only begin dragging if the layer is not locked
      if (!hitLayer.locked) {
        isDragging.current = true;
        dragTarget.current = hitLayer;
        dragStartCoords.current = coords;

        const centerX = hitLayer.x * canvas.width;
        const centerY = hitLayer.y * canvas.height;
        const initDist = hitLayer.initialDist || Math.hypot(coords.x - centerX, coords.y - centerY);

        initialLayerPos.current = { 
          x: hitLayer.x, 
          y: hitLayer.y, 
          width: hitLayer.boxWidth || hitLayer.width,
          height: hitLayer.boxHeight || hitLayer.height,
          boxWidth: hitLayer.boxWidth || hitLayer.width,
          boxHeight: hitLayer.boxHeight || hitLayer.height,
          scale: hitLayer.scale || 1.0,
          rotation: hitLayer.rotation || 0,
          initialDist: Math.max(15, initDist),
          initialFontSize: hitLayer.initialFontSize || hitLayer.fontSize || 50,
          initialWidth: hitLayer.initialWidth || hitLayer.width || 0.9
        };
      }
    } else {
      if (onSelectLayer) onSelectLayer(null);
      setEditingCaptionId(null);
      setCursorVisible(false);
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
          let x = 0, y = 0, slotW = canvas.width, slotH = canvas.height;
          if (isVert) { slotH = canvas.height / totalSlots; y = idx * slotH; }
          else if (isHoriz) { slotW = canvas.width / totalSlots; x = idx * slotW; }
          else if (isGrid) { slotW = canvas.width / 2; slotH = canvas.height / 2; x = (idx % 2) * slotW; y = Math.floor(idx / 2) * slotH; }
          else if (isHybrid) {
            if (idx === 0) { slotW = canvas.width; slotH = canvas.height / 2; x = 0; y = 0; }
            else { slotW = canvas.width / 2; slotH = canvas.height / 2; x = (idx - 1) * slotW; y = canvas.height / 2; }
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

    if (wasCleanTap && tappedType === 'empty-slot') {
      // Slot actions are now handled by DOM overlays on the canvas
    }

    // Clean tap on caption: select layer, activate editing mode and open keyboard immediately
    if (wasCleanTap && tappedType === 'caption' && tappedId) {
      if (onSelectLayer) onSelectLayer(tappedId);
      setEditingCaptionId(tappedId);
      const activeCap = captions.find(c => c.id === tappedId);
      setEditingCaptionText(activeCap ? activeCap.text : '');
      focusTextarea();
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
        const cy = activeStk.y * canvas.height;
        const stkSize = (activeStk.scale || 1.0) * 52;
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeStk.rotation || 0));
        const hs = stkSize / 2 + 6;

        if (Math.hypot(p.x - (cx - hs - 36), p.y - (cy - hs - 36)) <= 26) {
          canvas.style.cursor = 'pointer'; return;
        }
        if (Math.hypot(p.x - cx, p.y - (cy - stkSize / 2 - 40)) <= 24) {
          canvas.style.cursor = 'grab'; return;
        }
        if (Math.hypot(p.x - (cx - hs), p.y - (cy - hs)) <= 22 || Math.hypot(p.x - (cx + hs), p.y - (cy + hs)) <= 22) {
          canvas.style.cursor = 'nwse-resize'; return;
        }
        if (Math.hypot(p.x - (cx + hs), p.y - (cy - hs)) <= 22 || Math.hypot(p.x - (cx - hs), p.y - (cy + hs)) <= 22) {
          canvas.style.cursor = 'nesw-resize'; return;
        }
        if (p.x >= cx - stkSize / 2 - 6 && p.x <= cx + stkSize / 2 + 6 && p.y >= cy - stkSize / 2 - 6 && p.y <= cy + stkSize / 2 + 6) {
          canvas.style.cursor = 'move'; return;
        }
      }

      const activeCap = captions.find(c => c.id === activeLayerId);
      if (activeCap && !activeCap.locked) {
        const cx = activeCap.x * canvas.width;
        const cy = (activeCap.isHeaderCaption && !activeCap.hasCustomPos)
          ? (headerExtH / 2)
          : (activeCap.isFooterCaption && !activeCap.hasCustomPos)
          ? (headerExtH + canvasH + (footerExtH / 2))
          : (activeCap.y * canvas.height);
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
        const padX = isBubble ? Math.max(24, fontSize * 0.5) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15));
        const padY = isBubble ? Math.max(18, fontSize * 0.4) : (hasBg && activeCap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1));
        let boxWidth = maxLineWidth + padX * 2;
        const textHeight = lines.length * (fontSize * 1.2);
        let boxHeight = textHeight + padY * 2;
        if (activeCap.curve && Math.abs(activeCap.curve) > 0) {
          boxHeight += Math.round(getCurveSagitta(maxLineWidth, activeCap.curve));
        }

        if (activeCap.isBreakingNews) {
          boxWidth = Math.max(300, (activeCap.width || 0.94) * canvas.width);
          boxHeight = getBreakingNewsHeight(activeCap);
        } else if (activeCap.isTweetCard) {
          boxWidth = Math.min(540, (activeCap.width || 0.88) * canvas.width);
          boxHeight = getTweetCardHeight(ctx, activeCap, boxWidth);
        }

        const halfW = boxWidth / 2;
        const halfH = boxHeight / 2;

        const topY = cy - halfH;
        const bottomY = cy + halfH;
        const leftX = cx - halfW;
        const rightX = cx + halfW;

        if (!activeCap.isHeaderCaption && !activeCap.isFooterCaption && Math.hypot(p.x - (leftX - 36), p.y - (topY - 36)) <= 26) {
          canvas.style.cursor = 'pointer'; return;
        }
        if (!activeCap.isHeaderCaption && !activeCap.isFooterCaption && Math.hypot(p.x - cx, p.y - (topY - 34)) <= 24) {
          canvas.style.cursor = 'grab'; return;
        }
        if (Math.hypot(p.x - leftX, p.y - topY) <= 22 || Math.hypot(p.x - rightX, p.y - bottomY) <= 22) {
          canvas.style.cursor = 'nwse-resize'; return;
        }
        if (Math.hypot(p.x - rightX, p.y - topY) <= 22 || Math.hypot(p.x - leftX, p.y - bottomY) <= 22) {
          canvas.style.cursor = 'nesw-resize'; return;
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
          const cy = activeImg.y * canvas.height;
          const scale = activeImg.scale || 1.0;
          const baseW = cached.width || 200;
          const baseH = cached.height || 200;
          const fitScale = Math.min(320 / baseW, 320 / baseH);
          const w = activeImg.boxWidth || activeImg.width || (baseW * fitScale * scale);
          const h = activeImg.boxHeight || activeImg.height || (baseH * fitScale * scale);
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeImg.rotation || 0));
          const hw = w / 2 + 6;
          const hh = h / 2 + 6;

          if (Math.hypot(p.x - (cx - hw - 36), p.y - (cy - hh - 36)) <= 26) {
            canvas.style.cursor = 'pointer'; return;
          }
          if (Math.hypot(p.x - cx, p.y - (cy - hh - 60)) <= 22) {
            canvas.style.cursor = 'grab'; return;
          }
          if (Math.hypot(p.x - (cx - hw), p.y - (cy - hh)) <= 22 || Math.hypot(p.x - (cx + hw), p.y - (cy + hh)) <= 22) {
            canvas.style.cursor = 'nwse-resize'; return;
          }
          if (Math.hypot(p.x - (cx + hw), p.y - (cy - hh)) <= 22 || Math.hypot(p.x - (cx - hw), p.y - (cy + hh)) <= 22) {
            canvas.style.cursor = 'nesw-resize'; return;
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
      const cy = stk.y * canvas.height;
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
      const cy = l.y * canvas.height;
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
      const cy = (cap.isHeaderCaption && !cap.hasCustomPos)
        ? (headerExtH / 2)
        : (cap.isFooterCaption && !cap.hasCustomPos)
        ? (headerExtH + canvasH + (footerExtH / 2))
        : (cap.y * canvas.height);
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
        let boxWidth = maxLineWidth + padX * 2;
        const lineHeight = fontSize * 1.2;
        let boxHeight = lines.length * lineHeight + padY * 2;
        if (cap.curve && Math.abs(cap.curve) > 0) {
          boxHeight += Math.round(getCurveSagitta(maxLineWidth, cap.curve));
        }
        if (cap.isBreakingNews) {
          boxWidth = Math.max(300, (cap.width || 0.94) * canvas.width);
          boxHeight = getBreakingNewsHeight(cap);
        } else if (cap.isTweetCard) {
          boxWidth = Math.min(540, (cap.width || 0.88) * canvas.width);
          boxHeight = getTweetCardHeight(ctx, cap, boxWidth);
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
    const dy = (coords.y - dragStartCoords.current.y) / canvas.height;

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
      const centerX = initialLayerPos.current.x * canvas.width;
      const centerY = initialLayerPos.current.y * canvas.height;
      const angleRad = Math.atan2(coords.y - centerY, coords.x - centerX);
      let angleDeg = (angleRad * 180 / Math.PI) + 90; // offset since handle is at top (-90 deg)
      
      const newRotation = angleDeg;
      const id = dragTarget.current.id;

      if (dragTarget.current.type === 'rotate_caption' && onUpdateCaptionBounds) {
        onUpdateCaptionBounds(id, { rotation: newRotation });
      } else if (dragTarget.current.type === 'rotate_sticker' && onUpdateStickerBounds) {
        onUpdateStickerBounds(id, { rotation: newRotation });
      } else if (dragTarget.current.type === 'rotate_imageLayer' && onUpdateImageLayerBounds) {
        onUpdateImageLayerBounds(id, { rotation: newRotation });
      }
      return;
    }

    if (dragTarget.current.type.startsWith('resize_imageLayer_')) {
      const id = dragTarget.current.id;
      const imgLayer = imageLayers.find(l => l.id === id);
      if (!imgLayer || !onUpdateImageLayerBounds) return;

      const centerX = initialLayerPos.current.x * canvas.width;
      const centerY = initialLayerPos.current.y * canvas.height;
      const handleType = dragTarget.current.type;

      const initW = initialLayerPos.current.boxWidth || initialLayerPos.current.width || 160;
      const initH = initialLayerPos.current.boxHeight || initialLayerPos.current.height || 160;
      const initScale = initialLayerPos.current.scale || 1.0;
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

      const centerX = initialLayerPos.current.x * canvas.width;
      const centerY = initialLayerPos.current.y * canvas.height;

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

      const centerX = initialLayerPos.current.x * canvas.width;
      const centerY = initialLayerPos.current.y * canvas.height;
      // Corner handles: stretch to resize text font size & box proportionally, just like sticker and image layers
      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const initDist = initialLayerPos.current.initialDist || 50;
      const scaleFactor = Math.max(0.1, currentDist / initDist);

      const initFontSize = initialLayerPos.current.initialFontSize || cap.fontSize || 50;
      const newFontSize = Math.max(16, Math.min(250, Math.round(initFontSize * scaleFactor)));

      const initWidth = initialLayerPos.current.initialWidth || cap.width || 0.9;
      const newWidth = Math.max(0.15, Math.min(1.0, Number((initWidth * scaleFactor).toFixed(3))));

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

    if (dragTarget.current.type === 'caption' && onUpdateCaptionBounds) {
      onUpdateCaptionBounds(dragTarget.current.id, { x: newX, y: newY });
    
    } else if (dragTarget.current.type === 'sticker' && onUpdateStickerBounds) {
      onUpdateStickerBounds(dragTarget.current.id, { x: newX, y: newY });
    } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerBounds) {
      onUpdateImageLayerBounds(dragTarget.current.id, { x: newX, y: newY });
    } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerPosition) {
      onUpdateImageLayerPosition(dragTarget.current.id, newX, newY);
    }
  };

  const handlePointerUp = () => {
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
      if (baseImgRef.current) renderCanvas(baseImgRef.current);
    }
  };

  // Global window listeners so fast mouse or touch drags don't freeze when leaving the canvas element
  useEffect(() => {
    const handleGlobalMove = (e) => {
      if (isDragging.current && handlePointerMoveRef.current) {
        handlePointerMoveRef.current(e);
      }
    };
    const handleGlobalUp = (e) => {
      if (isDragging.current || isDrawingActive.current) {
        if (handlePointerEndRef.current) handlePointerEndRef.current(e);
        else handlePointerUp();
      }
    };
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);
    window.addEventListener('touchcancel', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
      window.removeEventListener('touchcancel', handleGlobalUp);
    };
  }, []);

  
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
  
// Keep focus on active caption whenever selected
  useEffect(() => {
    if (activeCaption && editingCaptionId === activeCaption.id) {
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
      let x = 0, y = 0, slotW = canvas.width, slotH = canvas.height;
      if (isVert) { slotH = canvas.height / totalSlots; y = idx * slotH; }
      else if (isHoriz) { slotW = canvas.width / totalSlots; x = idx * slotW; }
      else if (isGrid) { slotW = canvas.width / 2; slotH = canvas.height / 2; x = (idx % 2) * slotW; y = Math.floor(idx / 2) * slotH; }
      else if (isHybrid) {
        if (idx === 0) { slotW = canvas.width; slotH = canvas.height / 2; x = 0; y = 0; }
        else { slotW = canvas.width / 2; slotH = canvas.height / 2; x = (idx - 1) * slotW; y = canvas.height / 2; }
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
      style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', touchAction: 'none', width: '100%', flex: 1, minHeight: 0 }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerEnd}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerEnd}
      onTouchCancel={handlePointerEnd}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        className="meme-canvas"
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: isDrawingMode ? 'crosshair' : 'default',
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          display: 'block',
          objectFit: 'contain'
        }}
      />

      {/* SEAMLESS LIVE CANVAS TEXT EDITOR — EXACTLY AS SAVED VERSION WITH MOBILE TAP FOCUS */}
      {!isDrawingMode && (
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
                  : `${activeCaption.y * 100}%`)
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
            setCursorVisible(false);
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
