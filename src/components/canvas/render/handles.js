// Selection UI drawn over the active layer: box, delete/resize/side badges, rotate knob.
export const THEME_CORAL = '#f06853';

const THEME_GLOW = 'rgba(240, 104, 83, 0.45)';

export const THEME_BADGE_BG = '#ffffff';

// 1. Selection Box Outline (Smooth rounded rectangle with soft coral glow)
export const drawSelectionBox = (uiCtx, bx, by, bw, bh, radius = 10) => {
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
export const drawDeleteHandle = (uiCtx, hx, hy) => {
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
export const drawResizeHandle = (uiCtx, hx, hy) => {
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


// 5. Side Stretch Handle (Crisp white rounded capsule for width stretching)
export const drawSideHandle = (uiCtx, hx, hy, isVertical = true) => {
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
export const drawRotateHandle = (uiCtx, startX, startY, knobX, knobY) => {
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
