import { isColorDark } from '../../utils/captionLayout';

export const isSocialCardCaption = (c) => Boolean(c && (c.isTweetCard || c.isInstagramCard || c.isWhatsAppCard));

// The outline that stands out against a text colour: black around light text, white around dark.
export const getContrastStroke = (color) => (isColorDark(color) ? '#ffffff' : '#000000');

export const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('#type=video')) return true;
  if (url.includes('#type=image')) return false;
  if (url.startsWith('data:video/')) return true;
  if (url.startsWith('data:image/')) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
};

export const cleanTemplateName = (rawName) => {
  if (!rawName) return '';
  return rawName
    .replace(/\b\d+x\d+\b/gi, '')
    .replace(/\bGrid\b/gi, '')
    .replace(/\bCustom\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};
