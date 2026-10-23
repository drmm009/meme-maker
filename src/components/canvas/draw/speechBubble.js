import { isColorDark } from '../../../utils/captionLayout';
import { drawRoundRect } from './text';

export const drawSpeechBubble = (ctx, x, y, width, height, style, fillColor = '#ffffff', strokeColor = '#000000', strokeWidth = 3) => {
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
