import { tweetBookmarkPath, tweetCommentPath, tweetHeartPath, tweetRepeatPath, tweetSharePath, tweetXLogoPath } from '../paths';
import { drawRoundRect, wrapText } from '../text';
import { drawTweetVectorStrokeIcon, drawTweetVerifiedBadge } from './shared';

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

export const drawTweetXLogo = (ctx, x, y, size, color) => {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fill(tweetXLogoPath);
  ctx.restore();
};

export const getTweetCardHeight = (ctx, cap, cardW) => {
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

export const drawTweetCard = (ctx, cardW, cap) => {
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
