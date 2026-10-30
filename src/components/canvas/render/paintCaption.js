import { THEME_BADGE_BG, THEME_CORAL, drawDeleteHandle, drawResizeHandle, drawRotateHandle, drawSelectionBox, drawSideHandle } from './handles';
import { isColorDark } from '../../../utils/captionLayout';
import { drawCurvedText, drawRoundRect, drawTextLineWithEffect, getCurveSagitta, wrapText } from '../draw/text';
import { drawWhatsAppCard, getWhatsAppCardHeight } from '../draw/socialCards/whatsapp';
import { drawBreakingNewsChyron, getBreakingNewsHeight } from '../draw/chyron';
import { drawTweetCard, getTweetCardHeight } from '../draw/socialCards/tweet';
import { drawInstagramCard, getInstagramCardHeight } from '../draw/socialCards/instagram';
import { drawSpeechBubble } from '../draw/speechBubble';
import { applyCaptionFont, captionGradient, captionLineHeight, fittedFontSize, underlineMetrics } from '../draw/captionFont';

export function paintCaption({
  activeLayerId, canvas, dragTarget, getCaptionCenterY, isDragging, isDrawingMode, layer,
  reportActiveBox, reportBox, setActiveHandleDrawer, targetCtx
}) {
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

const fontFamily = cap.fontFamily || 'Impact, sans-serif';
const fontSize = fittedFontSize(targetCtx, { ...cap, fontFamily }, (cap.width || 0.9) * canvas.width);
applyCaptionFont(targetCtx, { ...cap, fontFamily }, fontSize);
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
const lineHeight = captionLineHeight(cap, fontSize);
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
  // A gradient fill replaces the colour (not on bubbles, whose text colour follows the bubble).
  const gradientFill = isBubble ? null : captionGradient(targetCtx, cap, maxLineWidth);
  if (gradientFill) textColor = gradientFill;

  const shouldStroke = cap.stroke && cap.stroke !== 'transparent' && (!hasBg || (cap.stroke !== cap.bgColor && cap.stroke !== bgFillColor));
  const textAnchorX = align === 'left' ? (-boxWidth / 2 + padX) : (align === 'right' ? (boxWidth / 2 - padX) : 0);

  // The caption's own drop shadow, under every line (the text effects may add their own).
  targetCtx.save();
  if (cap.shadowSize > 0) {
    targetCtx.shadowColor = cap.shadowColor || 'rgba(0, 0, 0, 0.8)';
    targetCtx.shadowBlur = cap.shadowSize;
    targetCtx.shadowOffsetX = Math.round(cap.shadowSize * 0.35);
    targetCtx.shadowOffsetY = Math.round(cap.shadowSize * 0.35);
  }
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
      if (cap.underline && line.trim()) {
        const w = targetCtx.measureText(line).width;
        const x0 = align === 'left' ? textAnchorX : align === 'right' ? textAnchorX - w : textAnchorX - w / 2;
        const { offset, thickness } = underlineMetrics(fontSize);
        targetCtx.save();
        if (shouldStroke) {
          targetCtx.strokeStyle = cap.stroke;
          targetCtx.lineWidth = Math.max(2, (cap.strokeWidth || fontSize / 7) / 2);
          targetCtx.strokeRect(x0, ly + offset, w, thickness);
        }
        targetCtx.fillStyle = textColor;
        targetCtx.fillRect(x0, ly + offset, w, thickness);
        targetCtx.restore();
      }
    }
  });
  targetCtx.restore();
}

reportBox?.(cap.id, { x: cx, y: cy, w: boxWidth, h: boxHeight });
if (cap.id === activeLayerId && !isDrawingMode) {
  const rot = cap.rotation || 0;
  reportActiveBox?.({ x: cx, y: cy, w: boxWidth, h: boxHeight, rotation: rot });
  setActiveHandleDrawer((uiCtx) => {
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
  });
}

targetCtx.restore();
}
