export const getBreakingNewsHeight = (cap) => {
  const topH = 26;
  const midH = Math.max(52, (cap.fontSize || 26) * 1.5);
  const botH = 22;
  return topH + midH + botH;
};

export const drawBreakingNewsChyron = (ctx, barW, cap) => {
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
