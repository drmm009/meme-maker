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
  if (style === 'speech-left' || style === 'whisper') {
    if (style === 'whisper') {
      ctx.setLineDash([Math.max(4, width * 0.03), Math.max(3, width * 0.02)]);
    }
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
    if (style === 'whisper') {
      ctx.setLineDash([]);
    }
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
  } else if (style === 'shout' || style === 'action-red') {
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
  } else if (style === 'action-neon') {
    const bevel = Math.min(14, width * 0.08, height * 0.2);
    ctx.beginPath();
    ctx.moveTo(x + bevel, y);
    ctx.lineTo(x + width - bevel, y);
    ctx.lineTo(x + width, y + bevel);
    ctx.lineTo(x + width, y + height - bevel);
    ctx.lineTo(x + width - bevel, y + height);
    ctx.lineTo(x + width * 0.35, y + height);
    ctx.lineTo(x + width * 0.2, y + height + 10);
    ctx.lineTo(x + width * 0.25, y + height);
    ctx.lineTo(x + bevel, y + height);
    ctx.lineTo(x, y + height - bevel);
    ctx.lineTo(x, y + bevel);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'imessage-send' || style === 'imessage-sms') {
    if (fillColor && fillColor !== 'transparent' && fillColor !== '#007aff' && fillColor !== '#34c759') {
      ctx.fillStyle = fillColor;
    } else {
      const grad = ctx.createLinearGradient(x, y, x, y + height);
      if (style === 'imessage-sms') {
        grad.addColorStop(0, '#3ee06a');
        grad.addColorStop(1, '#28c853');
      } else {
        grad.addColorStop(0, '#3299ff');
        grad.addColorStop(1, '#007aff');
      }
      ctx.fillStyle = grad;
    }

    const r = Math.min(20, Math.max(12, height * 0.38, width * 0.15));
    const tailW = Math.min(7, Math.max(5, width * 0.035));
    const tailH = Math.min(18, Math.max(12, height * 0.35));
    const tipX = x + width + tailW;
    const tipY = y + height;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.bezierCurveTo(x + width - r * 0.45, y, x + width, y + r * 0.45, x + width, y + r);
    ctx.lineTo(x + width, y + height - tailH);
    // Beak curve to signature iPhone outgoing tail tip
    ctx.bezierCurveTo(x + width, y + height - tailH * 0.5, x + width + 1, tipY - 1, tipX, tipY);
    // Flat underside curve joining the horizontal baseline seamlessly
    ctx.bezierCurveTo(tipX - 2.5, tipY, x + width - 2, tipY, x + width - 6, tipY);
    ctx.lineTo(x + r, tipY);
    ctx.bezierCurveTo(x + r * 0.45, tipY, x, tipY - r * 0.45, x, tipY - r);
    ctx.lineTo(x, y + r);
    ctx.bezierCurveTo(x, y + r * 0.45, x + r * 0.45, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
      ctx.stroke();
    }
  } else if (style === 'imessage-receive' || style === 'imessage-dark') {
    const isDark = style === 'imessage-dark' || isColorDark(fillColor);
    ctx.fillStyle = fillColor || (isDark ? '#262628' : '#e9e9eb');

    const r = Math.min(20, Math.max(12, height * 0.38, width * 0.15));
    const tailW = Math.min(7, Math.max(5, width * 0.035));
    const tailH = Math.min(18, Math.max(12, height * 0.35));
    const tipX = x - tailW;
    const tipY = y + height;

    ctx.beginPath();
    ctx.moveTo(x + 6, tipY);
    ctx.lineTo(x + width - r, tipY);
    ctx.bezierCurveTo(x + width - r * 0.45, tipY, x + width, tipY - r * 0.45, x + width, tipY - r);
    ctx.lineTo(x + width, y + r);
    ctx.bezierCurveTo(x + width, y + r * 0.45, x + width - r * 0.45, y, x + width - r, y);
    ctx.lineTo(x + r, y);
    ctx.bezierCurveTo(x + r * 0.45, y, x, y + r * 0.45, x, y + r);
    ctx.lineTo(x, y + height - tailH);
    // Beak curve to signature iPhone incoming tail tip
    ctx.bezierCurveTo(x, y + height - tailH * 0.5, x - 1, tipY - 1, tipX, tipY);
    // Flat underside curve joining the horizontal baseline seamlessly
    ctx.bezierCurveTo(tipX + 2.5, tipY, x + 2, tipY, x + 6, tipY);
    ctx.closePath();
    ctx.fill();
    if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
      ctx.stroke();
    }
  } else if (style === 'whatsapp-send' || style === 'whatsapp-light-send') {
    ctx.fillStyle = fillColor || (style === 'whatsapp-light-send' ? '#d9fdd3' : '#005c4b');
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
  } else if (style === 'whatsapp-receive' || style === 'whatsapp-light-receive') {
    const isDark = isColorDark(fillColor);
    ctx.fillStyle = fillColor || (style === 'whatsapp-light-receive' ? '#ffffff' : (isDark ? '#202c33' : '#ffffff'));
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
