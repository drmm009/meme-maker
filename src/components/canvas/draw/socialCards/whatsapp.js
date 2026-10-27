import { drawRoundRect, wrapText } from '../text';
import { drawTweetVectorStrokeIcon } from './shared';
import { iosChevronPath, iosPhonePath } from '../paths';

// WhatsApp Doodle Wallpaper Offscreen Canvas Pattern Cache
let waDoodlePatternCache = null;

let waDoodlePatternTheme = null;

export function getWhatsAppDoodlePattern(ctx, isDark = true) {
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

export function drawCanvasCameraIcon(ctx, cx, cy, size, color) {
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

export function drawCanvasMicIcon(ctx, cx, cy, size, color) {
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

export function drawCanvasPaperclipIcon(ctx, cx, cy, size, color) {
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
    totalH
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
