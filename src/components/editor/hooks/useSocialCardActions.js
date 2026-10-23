import { TWEET_TREND_PRESETS } from '../../canvas/draw/socialCards/tweet';
import { IG_PRESET_IMAGES } from '../../MemeStylesModal';
import { isSocialCardCaption } from '../memeEditorUtils';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export function useSocialCardActions() {
  const captions = useMemeEditorStore((s) => s.captions);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const showStylesModal = useEditorUiStore((s) => s.showStylesModal);
  const socialModalPlatform = useEditorUiStore((s) => s.socialModalPlatform);
  const setShowStylesModal = useEditorUiStore((s) => s.setShowStylesModal);
  const setSocialModalPlatform = useEditorUiStore((s) => s.setSocialModalPlatform);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);

    const handleOpenSocialModalForActiveCard = (targetPlatform) => {
    let platform = targetPlatform;
    const currentActiveCap = captions.find((c) => c.id === activeLayerId);
    const targetCap = (currentActiveCap && isSocialCardCaption(currentActiveCap))
      ? currentActiveCap
      : captions.find(c => {
          if (targetPlatform === 'whatsapp') return c.isWhatsAppCard;
          if (targetPlatform === 'instagram') return c.isInstagramCard;
          return c.isTweetCard;
        }) || captions.find(c => isSocialCardCaption(c));

    if (targetCap) {
      setActiveLayerId(targetCap.id);
      if (!platform) {
        if (targetCap.isInstagramCard) platform = 'instagram';
        else if (targetCap.isWhatsAppCard) platform = 'whatsapp';
        else platform = 'tweet';
      }
    }
    const finalPlatform = platform || 'tweet';
    if (showStylesModal && socialModalPlatform === finalPlatform) {
      setShowStylesModal(false);
    } else {
      setSocialModalPlatform(finalPlatform);
      setShowStylesModal(true);
    }
  };

  const handleUpdateSocialCard = (data = {}) => {
    const currentActiveCap = captions.find((c) => c.id === activeLayerId);
    const targetCap = (currentActiveCap && isSocialCardCaption(currentActiveCap))
      ? currentActiveCap
      : captions.find(c => {
          if (socialModalPlatform === 'whatsapp') return c.isWhatsAppCard;
          if (socialModalPlatform === 'instagram') return c.isInstagramCard;
          return c.isTweetCard;
        }) || captions.find(c => isSocialCardCaption(c));

    if (!targetCap) return;
    const targetId = targetCap.id;

    let updates = {};
    if (targetCap.isTweetCard) {
      updates = {
        text: data.text !== undefined ? data.text : targetCap.text,
        tweetName: data.name !== undefined ? data.name : targetCap.tweetName,
        tweetHandle: data.handle !== undefined ? data.handle : targetCap.tweetHandle,
        tweetVerified: data.verified !== undefined ? data.verified : targetCap.tweetVerified,
        tweetTheme: data.theme || targetCap.tweetTheme,
        tweetAvatarBg: data.avatarBg || targetCap.tweetAvatarBg,
        tweetTime: data.time || targetCap.tweetTime,
        tweetMetrics: data.metrics || targetCap.tweetMetrics
      };
    } else if (targetCap.isInstagramCard) {
      updates = {
        text: data.text !== undefined ? data.text : targetCap.text,
        igUsername: data.username !== undefined ? data.username : targetCap.igUsername,
        igSubtitle: data.subtitle !== undefined ? data.subtitle : targetCap.igSubtitle,
        igVerified: data.verified !== undefined ? data.verified : targetCap.igVerified,
        igHasStoryRing: data.hasStoryRing !== undefined ? data.hasStoryRing : targetCap.igHasStoryRing,
        igLikesCount: data.likesCount !== undefined ? data.likesCount : targetCap.igLikesCount,
        igLikesText: data.likesText !== undefined ? data.likesText : targetCap.igLikesText,
        igCommentsCount: data.commentsCount !== undefined ? data.commentsCount : targetCap.igCommentsCount,
        igRepostsCount: data.repostsCount !== undefined ? data.repostsCount : targetCap.igRepostsCount,
        igSharesCount: data.sharesCount !== undefined ? data.sharesCount : targetCap.igSharesCount,
        igFollowText: data.followText !== undefined ? data.followText : targetCap.igFollowText,
        topCommentUser: data.topCommentUser !== undefined ? data.topCommentUser : targetCap.topCommentUser,
        topCommentText: data.topCommentText !== undefined ? data.topCommentText : targetCap.topCommentText,
        igPostImage: data.postImage !== undefined ? data.postImage : targetCap.igPostImage,
        igTheme: data.theme || targetCap.igTheme,
        igTime: data.time || targetCap.igTime,
        color: (data.theme || targetCap.igTheme) === 'light' ? '#262626' : '#f5f5f5'
      };
    } else if (targetCap.isWhatsAppCard) {
      updates = {
        text: data.messages?.[0]?.text || data.text || targetCap.text,
        waContactName: data.contactName || data.name || targetCap.waContactName,
        waStatus: data.status !== undefined ? data.status : targetCap.waStatus,
        waMessages: data.messages && Array.isArray(data.messages) ? data.messages : targetCap.waMessages,
        waTheme: data.theme || targetCap.waTheme,
        waShowHeader: data.showHeader !== undefined ? data.showHeader : targetCap.waShowHeader,
        waShowFooter: data.showFooter !== undefined ? data.showFooter : targetCap.waShowFooter,
        waShowDoodles: data.showDoodles !== undefined ? data.showDoodles : targetCap.waShowDoodles,
        waDatePill: data.datePill !== undefined ? data.datePill : targetCap.waDatePill,
        waAvatarBg: data.avatarBg || targetCap.waAvatarBg
      };
    }

    const nextCaps = captions.map((cap) => {
      if (cap.id === targetId) {
        return { ...cap, ...updates };
      }
      return cap;
    });
    setCaptions(nextCaps);
    pushHistory();
    setActiveLayerId(targetId);
    setShowStylesModal(false);
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

    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveSubmenu(null);
    setActiveTab('text');
    pushHistory();
  };

  const handleAddInstagramCard = (data = {}) => {
    const username = data.username || 'inc42.media';
    const subtitle = data.subtitle || 'Suggested for you';
    const text = data.text || 'Remember Tanmay Bhat from the AIB... more';
    const verified = data.verified !== false;
    const hasStoryRing = data.hasStoryRing !== false;
    const likesText = data.likesText || '';
    const likesCount = data.likesCount || '1,583';
    const commentsCount = data.commentsCount || '15';
    const repostsCount = data.repostsCount || '15';
    const sharesCount = data.sharesCount || '295';
    const followText = data.followText || 'Follow';
    const postImage = data.postImage || IG_PRESET_IMAGES?.inc42 || null;
    const time = data.time || '28 September';
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

    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
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

    const nextCaps = [...captions, newCap];
    setCaptions(nextCaps);
    setActiveLayerId(newCap.id);
    setActiveSubmenu(null);
    setActiveTab('text');
    pushHistory();
  };

  return { handleOpenSocialModalForActiveCard, handleUpdateSocialCard, handleAddTweetCard, handleAddInstagramCard, handleAddWhatsAppCard };
}
