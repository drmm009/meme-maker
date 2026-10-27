import { drawRoundRect, wrapText } from '../text';
import { drawTweetVectorStrokeIcon, drawTweetVerifiedBadge, parseLikesCount, setSocialCardImage, socialCardImageCache } from './shared';
import { instagramSendPath, tweetBookmarkPath, tweetCommentPath, tweetHeartPath, tweetRepeatPath } from '../paths';

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
      } catch {
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
