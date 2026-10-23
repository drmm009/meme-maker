import { twitterCheckPath, twitterStarBadgePath } from '../paths';

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

export const drawTweetVectorStrokeIcon = (ctx, path, x, y, size, strokeColor) => {
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

export const drawTweetVerifiedBadge = (ctx, x, y, size) => {
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
