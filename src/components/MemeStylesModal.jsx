import React, { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { IG_PRESET_IMAGES } from '../data/igPresetImages';
import { TWITTER_PERSONAS, RANDOM_TWEETS, INSTAGRAM_PERSONAS, RANDOM_IG_CAPTIONS, WHATSAPP_PERSONAS } from './social-studio/personas';
import TweetPreview from './social-studio/TweetPreview';
import InstagramPreview from './social-studio/InstagramPreview';
import WhatsAppPreview from './social-studio/WhatsAppPreview';
import TweetControls from './social-studio/TweetControls';
import InstagramControls from './social-studio/InstagramControls';
import WhatsAppControls from './social-studio/WhatsAppControls';

export default function MemeStylesModal({
  isOpen,
  onClose,
  initialPlatform = 'tweet',
  cardData = null,
  onUpdateCard,
  onAddTweetCard,
  onAddInstagramCard,
  onAddWhatsAppCard
}) {
  const [activePlatform, setActivePlatform] = useState(initialPlatform);

  // Sync initial platform and cardData when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (cardData) {
      if (cardData.isTweetCard) {
        setActivePlatform('tweet');
        if (cardData.tweetName) setTweetName(cardData.tweetName);
        if (cardData.tweetHandle) setTweetHandle(cardData.tweetHandle);
        if (cardData.text !== undefined) setTweetText(cardData.text);
        if (cardData.tweetVerified !== undefined) setTweetVerified(cardData.tweetVerified);
        if (cardData.tweetTheme) setTweetTheme(cardData.tweetTheme);
        if (cardData.tweetAvatarBg) setTweetAvatarBg(cardData.tweetAvatarBg);
      } else if (cardData.isInstagramCard) {
        setActivePlatform('instagram');
        if (cardData.igUsername) setIgUsername(cardData.igUsername);
        if (cardData.igSubtitle !== undefined) setIgSubtitle(cardData.igSubtitle);
        if (cardData.text !== undefined) setIgText(cardData.text);
        if (cardData.igVerified !== undefined) setIgVerified(cardData.igVerified);
        if (cardData.igHasStoryRing !== undefined) setIgHasStoryRing(cardData.igHasStoryRing);
        if (cardData.igLikesText !== undefined) setIgLikesText(cardData.igLikesText);
        if (cardData.igLikesCount !== undefined) setIgLikesCount(cardData.igLikesCount);
        if (cardData.igCommentsCount !== undefined) setIgCommentsCount(cardData.igCommentsCount);
        if (cardData.igRepostsCount !== undefined) setIgRepostsCount(cardData.igRepostsCount);
        if (cardData.igSharesCount !== undefined) setIgSharesCount(cardData.igSharesCount);
        if (cardData.igFollowText !== undefined) setIgFollowText(cardData.igFollowText);
        if (cardData.topCommentUser !== undefined) setIgTopCommentUser(cardData.topCommentUser);
        if (cardData.topCommentText !== undefined) setIgTopCommentText(cardData.topCommentText);
        if (cardData.igTheme) setIgTheme(cardData.igTheme);
        if (cardData.igTime) setIgTime(cardData.igTime);
        if (cardData.igPostImage) setIgPostImage(cardData.igPostImage);
        if (cardData.igAvatarBg) setIgAvatarBg(cardData.igAvatarBg);
      } else if (cardData.isWhatsAppCard) {
        setActivePlatform('whatsapp');
        if (cardData.waContactName) setWaName(cardData.waContactName);
        if (cardData.waStatus) setWaStatus(cardData.waStatus);
        if (cardData.waDatePill) setWaDatePill(cardData.waDatePill);
        if (cardData.waTheme) setWaTheme(cardData.waTheme);
        if (cardData.waShowHeader !== undefined) setWaShowHeader(cardData.waShowHeader);
        if (cardData.waShowFooter !== undefined) setWaShowFooter(cardData.waShowFooter);
        if (cardData.waShowDoodles !== undefined) setWaShowDoodles(cardData.waShowDoodles);
        if (cardData.waMessages && Array.isArray(cardData.waMessages)) {
          setWaMessages(cardData.waMessages);
          setActiveWaMsgIndex(0);
        }
        if (cardData.waAvatarBg) setWaAvatarBg(cardData.waAvatarBg);
      }
    } else if (initialPlatform) {
      setActivePlatform(initialPlatform);
    }
  }, [isOpen, initialPlatform, cardData]);

  // 1. Twitter / X State
  const [activePersona, setActivePersona] = useState('elon');
  const [tweetName, setTweetName] = useState('Elon Musk');
  const [tweetHandle, setTweetHandle] = useState('@elonmusk');
  const [tweetText, setTweetText] = useState('thinking about deleting the database and moving to the woods');
  const [tweetVerified, setTweetVerified] = useState(true);
  const [tweetTheme, setTweetTheme] = useState('light');
  const [tweetAvatarBg, setTweetAvatarBg] = useState('linear-gradient(135deg, #0ea5e9, #38bdf8)');

  // 2. Instagram State
  const [activeIgPersona, setActiveIgPersona] = useState('nightowl');
  const [igUsername, setIgUsername] = useState('3am.thoughts');
  const [igSubtitle, setIgSubtitle] = useState('Suggested for you');
  const [igText, setIgText] = useState('told myself i\'d sleep early tonight. it\'s 3:07 AM and i now know exactly how bricks are made 🧱 no regrets. some regrets.');
  const [igVerified, setIgVerified] = useState(false);
  const [igHasStoryRing, setIgHasStoryRing] = useState(true);
  const [igLikesText, setIgLikesText] = useState('48,213');
  const [igLikesCount, setIgLikesCount] = useState('48,213');
  const [igCommentsCount, setIgCommentsCount] = useState('1,204');
  const [igRepostsCount, setIgRepostsCount] = useState('3,317');
  const [igSharesCount, setIgSharesCount] = useState('9,862');
  const [igFollowText, setIgFollowText] = useState('Follow');
  const [igTopCommentUser, setIgTopCommentUser] = useState('');
  const [igTopCommentText, setIgTopCommentText] = useState('');
  const [igTime, setIgTime] = useState('2 hours ago');
  const [igShowTranslation, setIgShowTranslation] = useState(false);
  const [igTheme, setIgTheme] = useState('light');
  const [igAvatarBg, setIgAvatarBg] = useState('linear-gradient(135deg, #312e81, #6366f1)');
  const [igPostImage, setIgPostImage] = useState(IG_PRESET_IMAGES.nightOwl);
  const [showIgMoreOptions, setShowIgMoreOptions] = useState(false);

  // 3. WhatsApp State
  const [activeWaPersona, setActiveWaPersona] = useState('newspaper');
  const [waName, setWaName] = useState('+91 81210 03003');
  const [waStatus, setWaStatus] = useState('last seen yesterday at 6:43 PM');
  const [waDatePill, setWaDatePill] = useState('Yesterday');
  const [waTheme, setWaTheme] = useState('light');
  const [waShowHeader, setWaShowHeader] = useState(true);
  const [waShowFooter, setWaShowFooter] = useState(true);
  const [waShowDoodles, setWaShowDoodles] = useState(true);
  const [waAvatarBg, setWaAvatarBg] = useState('#dfe5e7');
  const [waMessages, setWaMessages] = useState(WHATSAPP_PERSONAS[0].messages);
  const [activeWaMsgIndex, setActiveWaMsgIndex] = useState(0);

  if (!isOpen) return null;

  // Handlers for Twitter
  const handleApplyPersona = (p) => {
    setActivePersona(p.id);
    setTweetName(p.name);
    setTweetHandle(p.handle);
    setTweetVerified(p.verified);
    setTweetText(p.text);
    if (p.avatarBg) setTweetAvatarBg(p.avatarBg);
  };

  const handleRandomTweet = () => {
    const remaining = RANDOM_TWEETS.filter(t => t !== tweetText);
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setTweetText(pick);
  };

  // Handlers for Instagram
  const handleApplyIgPersona = (p) => {
    setActiveIgPersona(p.id);
    setIgUsername(p.username);
    setIgSubtitle(p.subtitle !== undefined ? p.subtitle : 'Suggested for you');
    setIgVerified(p.verified);
    setIgHasStoryRing(p.hasStoryRing);
    setIgLikesText(p.likesText || '');
    setIgText(p.text);
    if (p.likesCount !== undefined) setIgLikesCount(p.likesCount);
    if (p.commentsCount !== undefined) setIgCommentsCount(p.commentsCount);
    if (p.repostsCount !== undefined) setIgRepostsCount(p.repostsCount);
    if (p.sharesCount !== undefined) setIgSharesCount(p.sharesCount);
    if (p.followText !== undefined) setIgFollowText(p.followText);
    if (p.topCommentUser !== undefined) setIgTopCommentUser(p.topCommentUser);
    if (p.topCommentText !== undefined) setIgTopCommentText(p.topCommentText);
    if (p.time) setIgTime(p.time);
    if (p.avatarBg) setIgAvatarBg(p.avatarBg);
    if (p.postImage) setIgPostImage(p.postImage);
  };

  const handleRandomIgCaption = () => {
    const remaining = RANDOM_IG_CAPTIONS.filter(t => t !== igText);
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setIgText(pick);
  };

  const handleUploadPostImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setIgPostImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handlers for WhatsApp (Multi-message conversation)
  const handleApplyWaPersona = (p) => {
    setActiveWaPersona(p.id);
    setWaName(p.name);
    setWaStatus(p.status);
    if (p.datePill) setWaDatePill(p.datePill);
    if (p.messages) {
      setWaMessages(p.messages);
      setActiveWaMsgIndex(0);
    }
    if (p.avatarBg) setWaAvatarBg(p.avatarBg);
  };

  const handleAddWaMessage = () => {
    const lastMsg = waMessages[waMessages.length - 1];
    const newDir = lastMsg && lastMsg.direction === 'received' ? 'sent' : 'received';
    const newMsg = {
      id: `msg-${Date.now()}`,
      text: newDir === 'sent' ? 'Haha sounds good!' : 'Let me know what you think!',
      direction: newDir,
      time: '11:45 PM',
      ticks: 'blue'
    };
    const next = [...waMessages, newMsg];
    setWaMessages(next);
    setActiveWaMsgIndex(next.length - 1);
  };

  const handleUpdateWaMessage = (id, updates) => {
    setWaMessages(waMessages.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleRemoveWaMessage = (id) => {
    if (waMessages.length <= 1) return;
    const removedIdx = waMessages.findIndex(m => m.id === id);
    const next = waMessages.filter(m => m.id !== id);
    setWaMessages(next);
    setActiveWaMsgIndex(prev => {
      if (prev >= next.length) return next.length - 1;
      if (removedIdx <= prev) return Math.max(0, prev - 1);
      return prev;
    });
  };

  // Header Title per platform
  let modalTitle = 'Social Cards Studio';
  if (activePlatform === 'tweet') {
    modalTitle = cardData ? 'Edit Tweet Card' : 'Tweet Card';
  } else if (activePlatform === 'instagram') {
    modalTitle = cardData ? 'Edit Instagram Card' : 'Instagram Card';
  } else if (activePlatform === 'whatsapp') {
    modalTitle = cardData ? 'Edit WhatsApp Card' : 'WhatsApp Card';
  }

  const handleAddCurrentCard = () => {
    if (activePlatform === 'tweet') {
      const tweetData = {
        name: tweetName,
        handle: tweetHandle,
        text: tweetText,
        verified: tweetVerified,
        theme: tweetTheme,
        avatarBg: tweetAvatarBg,
        time: '10:42 PM · Oct 8, 2026',
        metrics: '💬 14.2K    🔁 62.8K    ❤️ 420.5K    📊 18.2M'
      };
      if (cardData && onUpdateCard) {
        onUpdateCard(tweetData);
      } else if (onAddTweetCard) {
        onAddTweetCard(tweetData);
      }
    } else if (activePlatform === 'instagram') {
      const igData = {
        username: igUsername,
        subtitle: igSubtitle,
        text: igText,
        verified: igVerified,
        hasStoryRing: igHasStoryRing,
        likesText: igLikesText,
        likesCount: igLikesCount,
        commentsCount: igCommentsCount,
        repostsCount: igRepostsCount,
        sharesCount: igSharesCount,
        followText: igFollowText,
        topCommentUser: igTopCommentUser,
        topCommentText: igTopCommentText,
        postImage: igPostImage,
        theme: igTheme,
        time: igTime || '28 September',
        showTranslation: igShowTranslation
      };
      if (cardData && onUpdateCard) {
        onUpdateCard(igData);
      } else if (onAddInstagramCard) {
        onAddInstagramCard(igData);
      }
    } else if (activePlatform === 'whatsapp') {
      const waData = {
        contactName: waName,
        status: waStatus,
        datePill: waDatePill,
        text: waMessages[0]?.text || '',
        messages: waMessages,
        direction: waMessages[0]?.direction || 'received',
        ticks: 'blue',
        theme: waTheme,
        showHeader: waShowHeader,
        showFooter: waShowFooter,
        showDoodles: waShowDoodles,
        avatarBg: waAvatarBg,
        time: waMessages[waMessages.length - 1]?.time || '11:42 PM'
      };
      if (cardData && onUpdateCard) {
        onUpdateCard(waData);
      } else if (onAddWhatsAppCard) {
        onAddWhatsAppCard(waData);
      }
    }
    if (onClose) onClose();
  };

  const isEditing = Boolean(cardData);

  const getAddBtnLabel = () => {
    if (isEditing) {
      if (activePlatform === 'tweet') return 'Save Tweet Card';
      if (activePlatform === 'instagram') return 'Save Instagram Post';
      return 'Save WhatsApp Card';
    }
    if (activePlatform === 'tweet') return 'Add Tweet Card to Meme';
    if (activePlatform === 'instagram') return 'Add Instagram Card to Meme';
    return 'Add WhatsApp Card to Meme';
  };

  // Everything the platform previews and controls (social-studio/) read and change.
  const s = {
    setActivePersona, tweetName, setTweetName, tweetHandle, setTweetHandle, tweetText,
    setTweetText, tweetVerified, setTweetVerified, tweetTheme, setTweetTheme, tweetAvatarBg,
    setActiveIgPersona, igUsername, setIgUsername, igSubtitle, setIgSubtitle, igText,
    setIgText, igVerified, setIgVerified, igHasStoryRing, setIgHasStoryRing, igLikesCount,
    setIgLikesCount, igCommentsCount, setIgCommentsCount, igRepostsCount, setIgRepostsCount, igSharesCount,
    setIgSharesCount, igFollowText, igTopCommentUser, setIgTopCommentUser, igTopCommentText, setIgTopCommentText,
    igTime, setIgTime, igShowTranslation, setIgShowTranslation, igTheme, setIgTheme,
    igAvatarBg, igPostImage, showIgMoreOptions, setShowIgMoreOptions, setActiveWaPersona, waName,
    setWaName, waStatus, setWaStatus, waDatePill, setWaDatePill, waTheme,
    setWaTheme, waShowHeader, setWaShowHeader, waShowFooter, setWaShowFooter, waShowDoodles,
    setWaShowDoodles, waAvatarBg, waMessages, activeWaMsgIndex, setActiveWaMsgIndex, handleRandomTweet,
    handleRandomIgCaption, handleUploadPostImage, handleAddWaMessage, handleUpdateWaMessage, handleRemoveWaMessage,
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      height="min(88vh, 800px)"
      maxHeight="min(88vh, 800px)"
      contentStyle={{ padding: '8px 18px 24px 18px', overflowY: 'auto' }}
      footer={
        <button
          type="button"
          className="btn btn-sm hover-lift"
          onClick={handleAddCurrentCard}
          style={{
            width: '100%',
            fontWeight: 800,
            padding: '13px 18px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            background: activePlatform === 'whatsapp'
              ? 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)'
              : (isEditing
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ff5e36 0%, #ff3b30 100%)'),
            border: 'none',
            color: '#ffffff',
            boxShadow: activePlatform === 'whatsapp'
              ? '0 6px 20px rgba(37, 211, 102, 0.35)'
              : (isEditing
                ? '0 6px 20px rgba(16, 185, 129, 0.45)'
                : '0 6px 20px rgba(255, 94, 54, 0.45)'),
            letterSpacing: '-0.01em',
            cursor: 'pointer'
          }}
        >
          {isEditing ? (
            <Check size={18} strokeWidth={2.6} />
          ) : (
            <Plus size={18} strokeWidth={2.5} />
          )}
          <span>{getAddBtnLabel()}</span>
        </button>
      }
    >
      {/* ─── Platform Personas Carousel ─── */}
      <div
        className="bs-category-bar"
        style={{
          padding: '2px 2px 12px 2px',
          marginBottom: '12px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}
      >
        {activePlatform === 'tweet' && TWITTER_PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`bs-category-btn ${activePersona === p.id ? 'active' : ''}`}
            onClick={() => handleApplyPersona(p)}
          >
            <span>{p.label}</span>
          </button>
        ))}

        {activePlatform === 'instagram' && INSTAGRAM_PERSONAS.map((p) => {
          const IconComp = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              className={`bs-category-btn ${activeIgPersona === p.id ? 'active' : ''}`}
              onClick={() => handleApplyIgPersona(p)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {IconComp && (
                <IconComp
                  size={13}
                  strokeWidth={2.2}
                  style={{
                    color: 'currentColor',
                    opacity: 0.9,
                    flexShrink: 0
                  }}
                />
              )}
              <span>{p.label}</span>
            </button>
          );
        })}

        {activePlatform === 'whatsapp' && WHATSAPP_PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`bs-category-btn ${activeWaPersona === p.id ? 'active' : ''}`}
            onClick={() => handleApplyWaPersona(p)}
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Card Interactive Preview ─── */}
      <div
        style={{
          background: '#0d0f15',
          borderRadius: '20px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '16px',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: activePlatform === 'whatsapp' ? '#25d366' : (activePlatform === 'tweet' ? '#1d9bf0' : '#e1306c'),
                display: 'inline-block'
              }}
            />
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: activePlatform === 'whatsapp' ? '#25d366' : (activePlatform === 'tweet' ? '#1d9bf0' : '#e1306c')
              }}
            >
              Live Preview
            </span>
          </div>
          <span style={{ fontSize: '0.70rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'capitalize' }}>
            {activePlatform === 'tweet' ? tweetTheme : activePlatform === 'instagram' ? igTheme : waTheme} Mode
          </span>
        </div>

        {/* 1. TWITTER / X PREVIEW */}
        {activePlatform === 'tweet' && (
          <TweetPreview s={s} />
        )}

        {/* 2. INSTAGRAM POST CARD PREVIEW (IMAGE FIRST, THEN ACTION BAR, THEN LIKES, THEN CAPTION BELOW LIKES) */}
        {activePlatform === 'instagram' && (
          <InstagramPreview s={s} />
        )}

        {/* 3. AUTHENTIC WHATSAPP CHAT CARD PREVIEW */}
        {activePlatform === 'whatsapp' && (
          <WhatsAppPreview s={s} />
        )}
      </div>

      {/* ─── Form Controls ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Section Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <span style={{ fontSize: '0.70rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.5)' }}>
            Customize Card
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* 1. TWITTER CONTROLS */}
        {activePlatform === 'tweet' && (
          <TweetControls s={s} />
        )}

        {/* 2. MINIMALIST INSTAGRAM CONTROLS */}
        {activePlatform === 'instagram' && (
          <InstagramControls s={s} />
        )}

        {/* 3. AUTHENTIC MINIMALIST WHATSAPP CONTROLS */}
        {activePlatform === 'whatsapp' && (
          <WhatsAppControls s={s} />
        )}
      </div>
    </BottomSheet>
  );
}
