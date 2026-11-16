import { TWEET_TREND_PRESETS } from '../../canvas/draw/socialCards/tweet';
import { IG_PRESET_IMAGES } from '../../../data/igPresetImages';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export function useSocialCardActions() {
  const captions = useMemeEditorStore((s) => s.captions);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);

  // A new card on top, or (with `replaceId`) in an old card's place, at its spot and depth.
  const withCard = (newCap, replaceId) => {
    const old = replaceId && captions.find((c) => c.id === replaceId);
    if (!old) return [...captions, newCap];
    return captions.map((c) => (c.id === replaceId ? { ...newCap, x: old.x, y: old.y, zIndex: old.zIndex } : c));
  };

  // Meme Culture Staples & Social Formats Handlers
      const handleAddTweetCard = (data = {}) => {
    const name = data.name || 'Elon Musk';
    const handle = data.handle || '@elonmusk';
    const text = data.text || 'thinking about deleting the database and moving to the woods';
    const verified = data.verified !== false;
    const theme = data.theme || 'dark';
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

    const newCap = {
      id: `cap-tweet-${Date.now()}`,
      text: text,
      tweetName: name,
      tweetHandle: handle,
      tweetVerified: verified,
      tweetTheme: theme,
      tweetTime: data.time || '10:42 PM · Oct 8, 2026',
      tweetMetrics: data.metrics || (TWEET_TREND_PRESETS?.viral?.text || '💬 14.2K    🔁 62.8K    ❤️ 420.5K    📊 18.2M'),
      tweetMetricsId: 'viral',
      tweetTrendRank: 'viral',
      tweetTopic: TWEET_TREND_PRESETS?.viral?.topic || 'Trending in World',
      isTweetCard: true,
      x: 0.5,
      y: 0.5,
      width: 0.88,
      fontSize: 18,
      color: theme === 'light' ? '#0f1419' : '#ffffff',
      stroke: 'transparent',
      strokeWidth: 0,
      zIndex: maxZ + 1
    };

    setCaptions(withCard(newCap, data.replaceId));
    setActiveLayerId(newCap.id);
    setActiveSubmenu(null);
    setActiveTab('text');
    pushHistory();
  };

  const handleAddInstagramCard = (data = {}) => {
    const username = data.username || '3am.thoughts';
    const subtitle = data.subtitle || 'Suggested for you';
    const text = data.text || 'told myself i\'d sleep early tonight. it\'s 3:07 AM and i now know exactly how bricks are made 🧱 no regrets. some regrets.';
    const verified = data.verified === true;
    const hasStoryRing = data.hasStoryRing !== false;
    const likesText = data.likesText || '';
    const likesCount = data.likesCount || '48,213';
    const commentsCount = data.commentsCount || '1,204';
    const repostsCount = data.repostsCount || '3,317';
    const sharesCount = data.sharesCount || '9,862';
    const followText = data.followText || 'Follow';
    const postImage = data.postImage || IG_PRESET_IMAGES?.nightOwl || null;
    const time = data.time || '2 hours ago';
    const theme = data.theme || 'light';
    const topCommentUser = data.topCommentUser || '';
    const topCommentText = data.topCommentText || '';
    const showTranslation = data.showTranslation === true;
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

    const newCap = {
      id: `cap-ig-${Date.now()}`,
      text: text,
      igUsername: username,
      igSubtitle: subtitle,
      igVerified: verified,
      igHasStoryRing: hasStoryRing,
      igLikesText: likesText,
      igLikesCount: likesCount,
      igCommentsCount: commentsCount,
      igRepostsCount: repostsCount,
      igSharesCount: sharesCount,
      igFollowText: followText,
      igTopCommentUser: topCommentUser,
      igTopCommentText: topCommentText,
      igShowTranslation: showTranslation,
      igPostImage: postImage,
      igTime: time,
      igTheme: theme,
      isInstagramCard: true,
      x: 0.5,
      y: 0.5,
      width: 0.70,
      fontSize: 15,
      color: theme === 'light' ? '#000000' : '#f5f5f5',
      stroke: 'transparent',
      strokeWidth: 0,
      zIndex: maxZ + 1
    };

    setCaptions(withCard(newCap, data.replaceId));
    setActiveLayerId(newCap.id);
    setActiveSubmenu(null);
    setActiveTab('text');
    pushHistory();
  };

  const handleAddWhatsAppCard = (data = {}) => {
    const contactName = data.contactName || 'Mom ❤️';
    const status = data.status || 'online';
    const text = data.text || 'Please remember to eat vegetables and don’t stay up until 4 AM arguing with strangers on the internet.';
    const direction = data.direction || 'received';
    const ticks = data.ticks || 'blue';
    const time = data.time || '11:42 PM';
    const messages = (data.messages && Array.isArray(data.messages) && data.messages.length > 0)
      ? data.messages
      : [
          { id: 'm1', text: text, direction: direction, time: time, ticks: ticks },
          { id: 'm2', text: 'I am eating healthy right now mom! 👍', direction: 'sent', time: '11:43 PM', ticks: 'blue' },
          { id: 'm3', text: 'Pizza is not a vegetable. I can see your location at Domino’s.', direction: 'received', time: '11:44 PM', ticks: 'blue' }
        ];
    const theme = data.theme || 'dark';
    const showHeader = data.showHeader !== false;
    const showFooter = data.showFooter !== false;
    const showDoodles = data.showDoodles !== false;
    const datePill = data.datePill || 'Yesterday';
    const avatarBg = data.avatarBg || '#202c33';
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));

    const newCap = {
      id: `cap-wa-${Date.now()}`,
      text: messages[0]?.text || text,
      waContactName: contactName,
      waStatus: status,
      waDirection: messages[0]?.direction || direction,
      waTicks: ticks,
      waTime: time,
      waTheme: theme,
      waShowHeader: showHeader,
      waShowFooter: showFooter,
      waShowDoodles: showDoodles,
      waDatePill: datePill,
      waAvatarBg: avatarBg,
      waMessages: messages,
      isWhatsAppCard: true,
      x: 0.5,
      y: 0.5,
      width: 0.88,
      fontSize: 14.5,
      color: '#ffffff',
      stroke: 'transparent',
      strokeWidth: 0,
      zIndex: maxZ + 1
    };

    setCaptions(withCard(newCap, data.replaceId));
    setActiveLayerId(newCap.id);
    setActiveSubmenu(null);
    setActiveTab('text');
    pushHistory();
  };

  return { handleAddTweetCard, handleAddInstagramCard, handleAddWhatsAppCard };
}
