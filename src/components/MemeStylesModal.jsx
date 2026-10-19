import React, { useState, useEffect } from 'react';
import {
  X, Plus, User, AtSign, Sparkles, Dices, Check,
  MessageCircle, Repeat, Heart, Bookmark, Share2,
  Phone, Video, MoreVertical, Send, CheckCheck
} from 'lucide-react';
import BottomSheet from './BottomSheet';

/* ─── Platform Verified & Brand Badges ─── */
export const TwitterVerifiedBadge = ({ size = 16, color = '#1d9bf0', checkColor = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, display: 'inline-block' }}>
    <path fill={color} d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" />
    <path fill={checkColor} d="M10.53 16.28l-3.53-3.53 1.41-1.41 2.12 2.12 5.66-5.66 1.41 1.41-7.07 7.07z" />
  </svg>
);

export const InstagramVerifiedBadge = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, display: 'inline-block' }}>
    <path
      fill="#0095f6"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-3.5-3.5 1.4-1.4 2.1 2.1 5.6-5.6 1.4 1.4-7 7z"
    />
  </svg>
);

export const XLogo = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const InstagramLogo = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const WhatsAppLogo = ({ size = 16, color = '#25d366' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.43c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.2 3.7.59.25 1.05.4 1.41.51.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z" />
  </svg>
);

export const WhatsAppCheckmarks = ({ ticks = 'blue', size = 15 }) => {
  const isBlue = ticks === 'blue';
  const color = isBlue ? '#53bdeb' : '#8696a0';
  const isDouble = ticks !== 'single';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', color, fontSize: size, lineHeight: 1, letterSpacing: '-3px', marginRight: isDouble ? '3px' : '1px' }}>
      <span>✓</span>{isDouble && <span>✓</span>}
    </span>
  );
};

/* ─── Twitter / X Presets & Data ─── */
const TWITTER_PERSONAS = [
  {
    id: 'elon',
    label: '🚀 Elon Musk',
    name: 'Elon Musk',
    handle: '@elonmusk',
    verified: true,
    avatarBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    text: 'thinking about deleting the database and moving to the woods'
  },
  {
    id: 'sama',
    label: '🤖 Sam Altman',
    name: 'Sam Altman',
    handle: '@sama',
    verified: true,
    avatarBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
    text: 'we just achieved AGI internally, it likes cold brew and refuses to attend standup'
  },
  {
    id: 'cat',
    label: '🐱 Wholesome Cat',
    name: 'Cat Thoughts',
    handle: '@catvibes',
    verified: false,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    text: 'i am not fat. i am simply storing excess charisma for the upcoming winter.'
  },
  {
    id: 'techlead',
    label: '💼 Tech CEO',
    name: 'Tech Founder',
    handle: '@techfounder_xyz',
    verified: true,
    avatarBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    text: 'Just raised $40M pre-seed to replace daily standups with an AI that just nods silently'
  },
  {
    id: 'dev',
    label: '☕ Junior Dev',
    name: 'Junior Developer',
    handle: '@git_commit_push',
    verified: false,
    avatarBg: 'linear-gradient(135deg, #6366f1, #3b82f6)',
    text: 'Pushed directly to main on a Friday at 5:01 PM. Pray for me.'
  }
];

const RANDOM_TWEETS = [
  'thinking about deleting the database and moving to the woods',
  'i have concluded that coffee is just temporary courage in liquid form',
  'pushed directly to main. shutting laptop. see you all on monday.',
  'my code works and i have no idea why',
  'sleeping 8 hours feels like a cheat code that nobody taught me in school',
  'if you feel like nobody cares about you, try missing two credit card payments',
  'the client just asked if we can make the website work without internet',
  'ai will not take your job, but someone who prompts ai while eating snacks might',
  'it worked fine on localhost, therefore it is a cloud infrastructure problem',
  'i have 99 problems and 87 of them are completely made up scenarios in my head'
];

/* ─── Instagram Presets & Data ─── */
const INSTAGRAM_PERSONAS = [
  {
    id: 'zuck',
    label: '🚀 Mark Zuckerberg',
    username: 'zuck',
    subtitle: 'Original audio',
    verified: true,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    likesText: 'Liked by cristiano and 1,842,509 others',
    text: 'Meta announces AGI is just a guy named Dave in a basement writing if-else statements. Link in bio.'
  },
  {
    id: 'egg',
    label: '🥚 World Record Egg',
    username: 'world_record_egg',
    subtitle: 'Egg Gang',
    verified: true,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    likesText: 'Liked by kyliejenner and 58,912,400 others',
    text: 'Let’s set a world record together and get the most liked post on Instagram. We got this 💪'
  },
  {
    id: 'cat',
    label: '🐱 Chonky Cat',
    username: 'chonk_vibes',
    subtitle: 'Living Room, Couch',
    verified: false,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #eab308)',
    likesText: 'Liked by 412,890 others',
    text: 'I did not knock the glass off the table. Gravity did. I am completely innocent of all charges.'
  },
  {
    id: 'aesthetic',
    label: '✨ Aesthetic Creator',
    username: 'daily_aesthetic',
    subtitle: 'Coffee & Sunsets',
    verified: true,
    hasStoryRing: false,
    avatarBg: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    likesText: 'Liked by zendaya and 984,210 others',
    text: 'Romanticize your life even when your code refuses to compile. ✨ Matcha latte in hand, zero bugs in sight.'
  },
  {
    id: 'startup',
    label: '💼 Silicon Valley',
    username: 'startup_grind',
    subtitle: 'San Francisco, CA',
    verified: false,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
    likesText: 'Liked by elonmusk and 74,102 others',
    text: 'We just raised $50M seed round to replace meetings with silence. Hiring 10 senior devs to maintain the silence.'
  }
];

const RANDOM_IG_CAPTIONS = [
  'Meta announces AGI is just a guy named Dave in a basement writing if-else statements. Link in bio.',
  'Let’s set a world record together and get the most liked post on Instagram 💪',
  'I did not knock the glass off the table. Gravity did. I am completely innocent of all charges.',
  'POV: You said "one more episode" 4 hours ago and now the sun is personally insulting you.',
  'My brain has 47 tabs open, 5 are frozen, and there is mysterious elevator music playing in the background.',
  'Just dropped my new single called "Leaving on read for mental peace". Available everywhere.',
  'When you realize adulting is just walking around saying "everything is so expensive" until you die.',
  'Behind every successful person is a substantial amount of iced coffee and unwarranted confidence.',
  'I am currently experiencing technical difficulties with life. Please try again tomorrow.',
  'Me pretending to be shocked when the consequences of my own procrastination catch up to me.'
];

/* ─── WhatsApp Presets & Data ─── */
const WHATSAPP_PERSONAS = [
  {
    id: 'mom',
    label: '❤️ Mom',
    name: 'Mom ❤️',
    status: 'online',
    direction: 'received',
    ticks: 'blue',
    avatarBg: 'linear-gradient(135deg, #f43f5e, #fda4af)',
    time: '11:42 PM',
    text: 'Please remember to eat vegetables and don’t stay up until 4 AM arguing with strangers on the internet.'
  },
  {
    id: 'boss',
    label: '💼 The Boss',
    name: 'Boss 💼',
    status: 'online',
    direction: 'received',
    ticks: 'blue',
    avatarBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    time: '8:03 AM',
    text: 'I know you’re on PTO in the mountains but can you jump on a quick 3-hour emergency alignment sync?'
  },
  {
    id: 'fbi',
    label: '🕵️ FBI Agent',
    name: 'FBI Agent 🕵️',
    status: 'typing...',
    direction: 'received',
    ticks: 'blue',
    avatarBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
    time: '2:14 AM',
    text: 'We saw what you just googled. Close the incognito tab immediately and go to sleep.'
  },
  {
    id: 'delivery',
    label: '🍕 Delivery Guy',
    name: 'Delivery Driver 🛵',
    status: 'online',
    direction: 'received',
    ticks: 'blue',
    avatarBg: 'linear-gradient(135deg, #f97316, #ea580c)',
    time: '9:15 PM',
    text: 'I’ve been standing outside your door for 15 minutes eating your fries. Please come down.'
  },
  {
    id: 'landlord',
    label: '🏠 Landlord',
    name: 'Landlord 🔑',
    status: 'last seen 2m ago',
    direction: 'received',
    ticks: 'grey',
    avatarBg: 'linear-gradient(135deg, #64748b, #475569)',
    time: '12:01 AM',
    text: 'Rent was due 60 seconds ago. A $400 convenience fee has been applied to your account.'
  }
];

const RANDOM_WA_TEXTS = [
  'Please remember to eat vegetables and don’t stay up until 4 AM arguing with strangers on the internet.',
  'I know you’re on PTO in the mountains but can you jump on a quick 3-hour emergency alignment sync?',
  'We saw what you just googled. Close the incognito tab immediately and go to sleep.',
  'I’ve been standing outside your door for 15 minutes eating your fries. Please come down.',
  'Rent was due 60 seconds ago. A $400 convenience fee has been applied to your account.',
  'Are you alive? You haven’t sent a TikTok in 45 minutes.',
  'Your dad just tried to use the TV remote as a flashlight again.',
  'Hey! Quick question about that code you wrote 3 years ago that broke prod today.',
  'I accidentally agreed to plans this weekend and now I have to fake my own disappearance.',
  'Can you check your email? I just sent you an email about the message I sent on Slack.'
];

const METRICS_PRESETS = [
  { id: 'viral', label: '🔥 Viral', text: '💬 14.2K    🔁 62.8K    ❤️ 420.5K    📊 18.2M', display: { replies: '14.2K', retweets: '62.8K', likes: '420.5K', views: '18.2M' } },
  { id: 'ratio', label: '📉 Ratioed', text: '💬 84.1K    🔁 412    ❤️ 1.2K    📊 6.4M', display: { replies: '84.1K', retweets: '412', likes: '1.2K', views: '6.4M' } },
  { id: 'normal', label: '💬 Casual', text: '💬 142    🔁 890    ❤️ 4.6K    📊 72K', display: { replies: '142', retweets: '890', likes: '4.6K', views: '72K' } }
];

/* ─── Editor Dock Input Style Helper ─── */
const inputStyle = {
  width: '100%',
  fontSize: '0.86rem',
  background: '#16181f',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  padding: '10px 14px',
  color: '#ffffff',
  outline: 'none',
  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.25)',
  transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  boxSizing: 'border-box'
};

const inputFocusHandler = (e) => {
  e.target.style.borderColor = '#ff5e36';
  e.target.style.background = '#1c1e26';
  e.target.style.boxShadow = '0 0 0 3px rgba(255, 94, 54, 0.18), inset 0 1px 2px rgba(0, 0, 0, 0.3)';
};
const inputBlurHandler = (e) => {
  e.target.style.borderColor = 'rgba(255, 255, 255, 0.14)';
  e.target.style.background = '#16181f';
  e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.25)';
};

export default function MemeStylesModal({
  isOpen,
  onClose,
  initialPlatform = 'tweet',
  onAddTweetCard,
  onAddInstagramCard,
  onAddWhatsAppCard
}) {
  const [activePlatform, setActivePlatform] = useState(initialPlatform);

  // Sync initial platform when modal opens
  useEffect(() => {
    if (isOpen && initialPlatform) {
      setActivePlatform(initialPlatform);
    }
  }, [isOpen, initialPlatform]);

  // 1. Twitter / X State
  const [activePersona, setActivePersona] = useState('elon');
  const [tweetName, setTweetName] = useState('Elon Musk');
  const [tweetHandle, setTweetHandle] = useState('@elonmusk');
  const [tweetText, setTweetText] = useState('thinking about deleting the database and moving to the woods');
  const [tweetVerified, setTweetVerified] = useState(true);
  const [tweetTheme, setTweetTheme] = useState('dark');
  const [tweetAvatarBg, setTweetAvatarBg] = useState('linear-gradient(135deg, #0ea5e9, #38bdf8)');

  // 2. Instagram State
  const [activeIgPersona, setActiveIgPersona] = useState('zuck');
  const [igUsername, setIgUsername] = useState('zuck');
  const [igSubtitle, setIgSubtitle] = useState('Original audio');
  const [igText, setIgText] = useState('Meta announces AGI is just a guy named Dave in a basement writing if-else statements. Link in bio.');
  const [igVerified, setIgVerified] = useState(true);
  const [igHasStoryRing, setIgHasStoryRing] = useState(true);
  const [igLikesText, setIgLikesText] = useState('Liked by cristiano and 1,842,509 others');
  const [igTheme, setIgTheme] = useState('dark');
  const [igAvatarBg, setIgAvatarBg] = useState('linear-gradient(135deg, #0ea5e9, #38bdf8)');

  // 3. WhatsApp State
  const [activeWaPersona, setActiveWaPersona] = useState('mom');
  const [waName, setWaName] = useState('Mom ❤️');
  const [waStatus, setWaStatus] = useState('online');
  const [waText, setWaText] = useState('Please remember to eat vegetables and don’t stay up until 4 AM arguing with strangers on the internet.');
  const [waDirection, setWaDirection] = useState('received');
  const [waTicks, setWaTicks] = useState('blue');
  const [waTheme, setWaTheme] = useState('dark');
  const [waShowHeader, setWaShowHeader] = useState(true);
  const [waTime, setWaTime] = useState('11:42 PM');
  const [waAvatarBg, setWaAvatarBg] = useState('linear-gradient(135deg, #f43f5e, #fda4af)');

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
    setIgSubtitle(p.subtitle);
    setIgVerified(p.verified);
    setIgHasStoryRing(p.hasStoryRing);
    setIgLikesText(p.likesText);
    setIgText(p.text);
    if (p.avatarBg) setIgAvatarBg(p.avatarBg);
  };

  const handleRandomIgCaption = () => {
    const remaining = RANDOM_IG_CAPTIONS.filter(t => t !== igText);
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setIgText(pick);
  };

  // Handlers for WhatsApp
  const handleApplyWaPersona = (p) => {
    setActiveWaPersona(p.id);
    setWaName(p.name);
    setWaStatus(p.status);
    setWaDirection(p.direction);
    setWaTicks(p.ticks);
    setWaText(p.text);
    setWaTime(p.time);
    if (p.avatarBg) setWaAvatarBg(p.avatarBg);
  };

  const handleRandomWaText = () => {
    const remaining = RANDOM_WA_TEXTS.filter(t => t !== waText);
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setWaText(pick);
  };

  const previewMetrics = METRICS_PRESETS[0];

  // Header Title and Icon per platform
  let modalTitle = 'Social Cards Studio';
  let modalIcon = <Sparkles size={17} />;
  if (activePlatform === 'tweet') {
    modalTitle = 'Tweet Card';
    modalIcon = <XLogo size={17} />;
  } else if (activePlatform === 'instagram') {
    modalTitle = 'Instagram Card';
    modalIcon = <InstagramLogo size={17} color="#e1306c" />;
  } else if (activePlatform === 'whatsapp') {
    modalTitle = 'WhatsApp Card';
    modalIcon = <WhatsAppLogo size={17} color="#25d366" />;
  }

  const handleAddCurrentCard = () => {
    if (activePlatform === 'tweet') {
      if (onAddTweetCard) {
        onAddTweetCard({
          name: tweetName,
          handle: tweetHandle,
          text: tweetText,
          verified: tweetVerified,
          theme: tweetTheme,
          time: '10:42 PM · Oct 8, 2026',
          metrics: '💬 14.2K    🔁 62.8K    ❤️ 420.5K    📊 18.2M'
        });
      }
    } else if (activePlatform === 'instagram') {
      if (onAddInstagramCard) {
        onAddInstagramCard({
          username: igUsername,
          subtitle: igSubtitle,
          text: igText,
          verified: igVerified,
          hasStoryRing: igHasStoryRing,
          likesText: igLikesText,
          theme: igTheme,
          time: '2 HOURS AGO'
        });
      }
    } else if (activePlatform === 'whatsapp') {
      if (onAddWhatsAppCard) {
        onAddWhatsAppCard({
          contactName: waName,
          status: waStatus,
          text: waText,
          direction: waDirection,
          ticks: waTicks,
          theme: waTheme,
          showHeader: waShowHeader,
          time: waTime
        });
      }
    }
    onClose();
  };

  const getAddBtnLabel = () => {
    if (activePlatform === 'tweet') return 'Add Tweet Card to Meme';
    if (activePlatform === 'instagram') return 'Add Instagram Card to Meme';
    return 'Add WhatsApp Card to Meme';
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      icon={modalIcon}
      height="min(86vh, 760px)"
      maxHeight="min(86vh, 760px)"
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
            background: 'linear-gradient(135deg, #ff5e36 0%, #ff3b30 100%)',
            border: 'none',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(255, 94, 54, 0.45)',
            letterSpacing: '-0.01em',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} strokeWidth={2.5} /> {getAddBtnLabel()}
        </button>
      }
    >
      {/* ─── Platform Tabs Switcher (Top Capsule Navigation) ─── */}
      <div
        className="bs-category-bar"
        style={{
          padding: '2px 2px 10px 2px',
          marginBottom: '10px',
          display: 'flex',
          gap: '8px'
        }}
      >
        <button
          type="button"
          className={`bs-category-btn ${activePlatform === 'tweet' ? 'active' : ''}`}
          onClick={() => setActivePlatform('tweet')}
        >
          <XLogo size={14} />
          <span>Twitter / X</span>
        </button>

        <button
          type="button"
          className={`bs-category-btn ${activePlatform === 'instagram' ? 'active' : ''}`}
          onClick={() => setActivePlatform('instagram')}
        >
          <InstagramLogo size={15} color={activePlatform === 'instagram' ? '#ffffff' : '#e1306c'} />
          <span>Instagram</span>
        </button>

        <button
          type="button"
          className={`bs-category-btn ${activePlatform === 'whatsapp' ? 'active' : ''}`}
          onClick={() => setActivePlatform('whatsapp')}
        >
          <WhatsAppLogo size={15} color={activePlatform === 'whatsapp' ? '#ffffff' : '#25d366'} />
          <span>WhatsApp</span>
        </button>
      </div>

      {/* ─── Platform Personas Carousel ─── */}
      <div
        className="bs-category-bar"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        style={{
          padding: '2px 2px 10px 2px',
          marginBottom: '12px'
        }}
      >
        {activePlatform === 'tweet' &&
          TWITTER_PERSONAS.map((p) => {
            const isSelected = activePersona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`bs-category-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleApplyPersona(p)}
              >
                <span>{p.label}</span>
              </button>
            );
          })}

        {activePlatform === 'instagram' &&
          INSTAGRAM_PERSONAS.map((p) => {
            const isSelected = activeIgPersona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`bs-category-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleApplyIgPersona(p)}
              >
                <span>{p.label}</span>
              </button>
            );
          })}

        {activePlatform === 'whatsapp' &&
          WHATSAPP_PERSONAS.map((p) => {
            const isSelected = activeWaPersona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`bs-category-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleApplyWaPersona(p)}
              >
                <span>{p.label}</span>
              </button>
            );
          })}
      </div>

      {/* ─── Content Stack ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ─── Live Preview Container ─── */}
        <div
          style={{
            background: '#16181f',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* "PREVIEW" label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ff5e36',
                boxShadow: '0 0 8px rgba(255, 94, 54, 0.6)'
              }}
            />
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.45)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em'
              }}
            >
              Live Preview
            </span>
          </div>

          {/* 1. TWITTER / X CARD PREVIEW */}
          {activePlatform === 'tweet' && (
            <div
              style={{
                background: tweetTheme === 'light' ? '#ffffff' : '#0a0b0e',
                color: tweetTheme === 'light' ? '#0f1419' : '#ffffff',
                border: tweetTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: '16px',
                padding: '16px 18px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
              }}
            >
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: tweetAvatarBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      flexShrink: 0
                    }}
                  >
                    {(tweetName || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: tweetTheme === 'light' ? '#0f1419' : '#ffffff' }}>
                        {tweetName || 'Display Name'}
                      </span>
                      {tweetVerified && <TwitterVerifiedBadge size={16} />}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: tweetTheme === 'light' ? '#536471' : '#71767b' }}>
                      {tweetHandle ? (tweetHandle.startsWith('@') ? tweetHandle : `@${tweetHandle}`) : '@username'}
                    </span>
                  </div>
                </div>

                <div style={{ paddingLeft: '8px' }}>
                  <XLogo size={18} color={tweetTheme === 'light' ? '#0f1419' : '#ffffff'} />
                </div>
              </div>

              {/* Tweet Content */}
              <div
                style={{
                  fontSize: '0.94rem',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: tweetTheme === 'light' ? '#0f1419' : '#ffffff',
                  marginBottom: '12px'
                }}
              >
                {tweetText || 'What is happening?!'}
              </div>

              {/* Timestamp & Views */}
              <div
                style={{
                  fontSize: '0.75rem',
                  color: tweetTheme === 'light' ? '#536471' : '#71767b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  paddingBottom: '10px',
                  borderBottom: tweetTheme === 'light' ? '1px solid #e1e8ed' : '1px solid #222528'
                }}
              >
                <span>10:42 PM · Oct 8, 2026</span>
                <span>·</span>
                <span style={{ fontWeight: 600, color: tweetTheme === 'light' ? '#0f1419' : '#e7e9ea' }}>
                  {previewMetrics.display.views} Views
                </span>
              </div>

              {/* Engagement Icons Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '10px',
                  fontSize: '0.74rem',
                  color: tweetTheme === 'light' ? '#536471' : '#71767b'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MessageCircle size={14} />
                  <span>{previewMetrics.display.replies}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Repeat size={14} />
                  <span>{previewMetrics.display.retweets}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Heart size={14} />
                  <span>{previewMetrics.display.likes}</span>
                </div>
                <Bookmark size={14} />
                <Share2 size={14} />
              </div>
            </div>
          )}

          {/* 2. INSTAGRAM POST CARD PREVIEW */}
          {activePlatform === 'instagram' && (
            <div
              style={{
                background: igTheme === 'light' ? '#ffffff' : '#000000',
                color: igTheme === 'light' ? '#262626' : '#ffffff',
                border: igTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '16px 18px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
              }}
            >
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  {/* Avatar with Optional Story Ring */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      padding: igHasStoryRing ? '2px' : '0',
                      background: igHasStoryRing ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: igHasStoryRing ? (igTheme === 'light' ? '2px solid #ffffff' : '2px solid #000000') : 'none',
                        background: igAvatarBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#ffffff',
                        fontSize: '0.95rem'
                      }}
                    >
                      {(igUsername || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Username & Subtitle */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.90rem', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
                        {igUsername || 'username'}
                      </span>
                      {igVerified && <InstagramVerifiedBadge size={14} />}
                    </div>
                    {igSubtitle && (
                      <span style={{ fontSize: '0.72rem', color: igTheme === 'light' ? '#737373' : '#a8a8a8' }}>
                        {igSubtitle}
                      </span>
                    )}
                  </div>
                </div>

                {/* Instagram 3-dots */}
                <div style={{ display: 'flex', gap: '3px', paddingLeft: '8px', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
                  <span style={{ fontSize: '1.2rem', lineHeight: 0.5, letterSpacing: '1px' }}>•••</span>
                </div>
              </div>

              {/* Caption Content */}
              <div
                style={{
                  fontSize: '0.88rem',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: igTheme === 'light' ? '#262626' : '#ffffff',
                  marginBottom: '12px'
                }}
              >
                <strong style={{ marginRight: '6px' }}>{igUsername || 'username'}</strong>
                {igText || 'Caption here...'}
              </div>

              {/* Action Icons Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '6px',
                  marginBottom: '10px',
                  color: igTheme === 'light' ? '#262626' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Heart size={20} strokeWidth={2} style={{ color: '#ff3040', fill: '#ff3040' }} />
                  <MessageCircle size={20} strokeWidth={2} />
                  <Send size={19} strokeWidth={2} />
                </div>
                <Bookmark size={20} strokeWidth={2} />
              </div>

              {/* Likes Text & Timestamp */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
                  {igLikesText}
                </span>
                <span style={{ fontSize: '0.68rem', color: igTheme === 'light' ? '#8e8e8e' : '#737373', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  2 HOURS AGO
                </span>
              </div>
            </div>
          )}

          {/* 3. WHATSAPP CHAT CARD PREVIEW */}
          {activePlatform === 'whatsapp' && (
            <div
              style={{
                background: waTheme === 'light' ? '#efeae2' : '#0b141a',
                color: waTheme === 'light' ? '#111b21' : '#e9edef',
                border: waTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
              }}
            >
              {/* WhatsApp Contact Header Bar */}
              {waShowHeader && (
                <div
                  style={{
                    background: waTheme === 'light' ? '#f0f2f5' : '#202c33',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: waTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem', color: waTheme === 'light' ? '#54656f' : '#aebac1' }}>←</span>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: waAvatarBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: '#ffffff',
                        fontSize: '0.85rem'
                      }}
                    >
                      {(waName || 'W').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: waTheme === 'light' ? '#111b21' : '#e9edef' }}>
                        {waName || 'Contact Name'}
                      </span>
                      <span style={{ fontSize: '0.70rem', color: waStatus === 'online' ? '#25d366' : (waTheme === 'light' ? '#667781' : '#8696a0') }}>
                        {waStatus}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: waTheme === 'light' ? '#54656f' : '#aebac1' }}>
                    <Video size={16} />
                    <Phone size={15} />
                    <MoreVertical size={16} />
                  </div>
                </div>
              )}

              {/* Message Window Area */}
              <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    alignSelf: waDirection === 'sent' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: waDirection === 'sent'
                      ? (waTheme === 'light' ? '#d9fdd3' : '#005c4b')
                      : (waTheme === 'light' ? '#ffffff' : '#202c33'),
                    color: waTheme === 'light' ? '#111b21' : '#e9edef',
                    padding: '8px 12px 6px 12px',
                    borderRadius: waDirection === 'sent' ? '12px 0px 12px 12px' : '0px 12px 12px 12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '0.88rem', lineHeight: 1.35, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {waText || 'Type a message...'}
                  </div>

                  {/* Time + Ticks */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      fontSize: '0.66rem',
                      color: waTheme === 'light' ? '#667781' : '#8696a0',
                      marginTop: '4px'
                    }}
                  >
                    <span>{waTime}</span>
                    {waDirection === 'sent' && <WhatsAppCheckmarks ticks={waTicks} size={14} />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Form Controls ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Section Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
              Customize Card
            </span>
            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))' }} />
          </div>

          {/* 1. TWITTER CONTROLS */}
          {activePlatform === 'tweet' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <User size={13} style={{ color: '#ff5e36' }} /> Display Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={tweetName}
                    onChange={(e) => {
                      setTweetName(e.target.value);
                      setActivePersona('custom');
                    }}
                    placeholder="e.g. Elon Musk"
                    style={inputStyle}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <AtSign size={13} style={{ color: '#ff5e36' }} /> Handle
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={tweetHandle}
                    onChange={(e) => {
                      setTweetHandle(e.target.value);
                      setActivePersona('custom');
                    }}
                    placeholder="e.g. @elonmusk"
                    style={inputStyle}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>
              </div>

              {/* Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                    Tweet Text
                    <span style={{ marginLeft: '6px', fontSize: '0.68rem', fontWeight: 500, color: tweetText.length > 240 ? '#ef4444' : 'rgba(255,255,255,0.35)' }}>
                      {tweetText.length}/280
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomTweet}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#ff5e36',
                      background: '#16181f',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '9999px',
                      padding: '4px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Dices size={13} strokeWidth={2.4} /> Surprise Me
                  </button>
                </div>
                <textarea
                  className="form-input"
                  rows={2}
                  value={tweetText}
                  onChange={(e) => {
                    setTweetText(e.target.value);
                    setActivePersona('custom');
                  }}
                  placeholder="What is happening?!"
                  style={{ ...inputStyle, lineHeight: 1.4, minHeight: '56px', maxHeight: '120px', resize: 'vertical' }}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>

              {/* Verified & Theme */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={tweetVerified}
                    onChange={(e) => setTweetVerified(e.target.checked)}
                    style={{ accentColor: '#ff5e36', width: 16, height: 16 }}
                  />
                  <span>Verified Blue Badge</span>
                </label>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`bs-category-btn ${tweetTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => setTweetTheme('dark')}
                    style={{ height: 28, padding: '0 10px', fontSize: '0.72rem' }}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={`bs-category-btn ${tweetTheme === 'light' ? 'active' : ''}`}
                    onClick={() => setTweetTheme('light')}
                    style={{ height: 28, padding: '0 10px', fontSize: '0.72rem' }}
                  >
                    Light
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 2. INSTAGRAM CONTROLS */}
          {activePlatform === 'instagram' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <User size={13} style={{ color: '#ff5e36' }} /> Username
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={igUsername}
                    onChange={(e) => {
                      setIgUsername(e.target.value);
                      setActiveIgPersona('custom');
                    }}
                    placeholder="e.g. zuck"
                    style={inputStyle}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <Sparkles size={13} style={{ color: '#ff5e36' }} /> Subtitle / Audio
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={igSubtitle}
                    onChange={(e) => {
                      setIgSubtitle(e.target.value);
                      setActiveIgPersona('custom');
                    }}
                    placeholder="e.g. Original audio"
                    style={inputStyle}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>
              </div>

              {/* Caption Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                    Instagram Caption
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomIgCaption}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#ff5e36',
                      background: '#16181f',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '9999px',
                      padding: '4px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Dices size={13} strokeWidth={2.4} /> Surprise Me
                  </button>
                </div>
                <textarea
                  className="form-input"
                  rows={2}
                  value={igText}
                  onChange={(e) => {
                    setIgText(e.target.value);
                    setActiveIgPersona('custom');
                  }}
                  placeholder="Caption text here..."
                  style={{ ...inputStyle, lineHeight: 1.4, minHeight: '56px', maxHeight: '120px', resize: 'vertical' }}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>

              {/* Likes Text input */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: '6px', display: 'block' }}>
                  Likes Text
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={igLikesText}
                  onChange={(e) => setIgLikesText(e.target.value)}
                  placeholder="Liked by cristiano and 1,842,509 others"
                  style={inputStyle}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>

              {/* Options Row: Verified Badge, Story Ring, Theme */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#ffffff' }}>
                    <input
                      type="checkbox"
                      checked={igVerified}
                      onChange={(e) => setIgVerified(e.target.checked)}
                      style={{ accentColor: '#ff5e36', width: 16, height: 16 }}
                    />
                    <span>Verified Badge</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#ffffff' }}>
                    <input
                      type="checkbox"
                      checked={igHasStoryRing}
                      onChange={(e) => setIgHasStoryRing(e.target.checked)}
                      style={{ accentColor: '#ff5e36', width: 16, height: 16 }}
                    />
                    <span>Story Ring</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`bs-category-btn ${igTheme === 'dark' ? 'active' : ''}`}
                    onClick={() => setIgTheme('dark')}
                    style={{ height: 28, padding: '0 10px', fontSize: '0.72rem' }}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={`bs-category-btn ${igTheme === 'light' ? 'active' : ''}`}
                    onClick={() => setIgTheme('light')}
                    style={{ height: 28, padding: '0 10px', fontSize: '0.72rem' }}
                  >
                    Light
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 3. WHATSAPP CONTROLS */}
          {activePlatform === 'whatsapp' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <User size={13} style={{ color: '#ff5e36' }} /> Contact Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={waName}
                    onChange={(e) => {
                      setWaName(e.target.value);
                      setActiveWaPersona('custom');
                    }}
                    placeholder="e.g. Mom ❤️"
                    style={inputStyle}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <Sparkles size={13} style={{ color: '#ff5e36' }} /> Status
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={waStatus}
                    onChange={(e) => {
                      setWaStatus(e.target.value);
                      setActiveWaPersona('custom');
                    }}
                    placeholder="e.g. online, typing..."
                    style={inputStyle}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                    WhatsApp Message
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomWaText}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#ff5e36',
                      background: '#16181f',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '9999px',
                      padding: '4px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Dices size={13} strokeWidth={2.4} /> Surprise Me
                  </button>
                </div>
                <textarea
                  className="form-input"
                  rows={2}
                  value={waText}
                  onChange={(e) => {
                    setWaText(e.target.value);
                    setActiveWaPersona('custom');
                  }}
                  placeholder="Type a message..."
                  style={{ ...inputStyle, lineHeight: 1.4, minHeight: '56px', maxHeight: '120px', resize: 'vertical' }}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>

              {/* Bubble Direction, Ticks & Header Bar Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {/* Direction */}
                <div>
                  <label style={{ fontSize: '0.70rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: '5px', display: 'block' }}>
                    Direction
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className={`bs-category-btn ${waDirection === 'received' ? 'active' : ''}`}
                      onClick={() => setWaDirection('received')}
                      style={{ height: 28, padding: '0 10px', fontSize: '0.72rem', flex: 1, justifyContent: 'center' }}
                    >
                      Received
                    </button>
                    <button
                      type="button"
                      className={`bs-category-btn ${waDirection === 'sent' ? 'active' : ''}`}
                      onClick={() => setWaDirection('sent')}
                      style={{ height: 28, padding: '0 10px', fontSize: '0.72rem', flex: 1, justifyContent: 'center' }}
                    >
                      Sent
                    </button>
                  </div>
                </div>

                {/* Ticks */}
                <div>
                  <label style={{ fontSize: '0.70rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: '5px', display: 'block' }}>
                    Read Receipt
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className={`bs-category-btn ${waTicks === 'blue' ? 'active' : ''}`}
                      onClick={() => setWaTicks('blue')}
                      style={{ height: 28, padding: '0 8px', fontSize: '0.72rem', flex: 1, justifyContent: 'center' }}
                      title="Double Blue Ticks (Read)"
                    >
                      <span style={{ color: '#53bdeb', fontWeight: 900 }}>✓✓</span>
                    </button>
                    <button
                      type="button"
                      className={`bs-category-btn ${waTicks === 'grey' ? 'active' : ''}`}
                      onClick={() => setWaTicks('grey')}
                      style={{ height: 28, padding: '0 8px', fontSize: '0.72rem', flex: 1, justifyContent: 'center' }}
                      title="Double Grey Ticks (Delivered)"
                    >
                      <span style={{ color: '#8696a0', fontWeight: 900 }}>✓✓</span>
                    </button>
                    <button
                      type="button"
                      className={`bs-category-btn ${waTicks === 'single' ? 'active' : ''}`}
                      onClick={() => setWaTicks('single')}
                      style={{ height: 28, padding: '0 8px', fontSize: '0.72rem', flex: 1, justifyContent: 'center' }}
                      title="Single Tick (Sent)"
                    >
                      <span style={{ color: '#8696a0', fontWeight: 900 }}>✓</span>
                    </button>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label style={{ fontSize: '0.70rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: '5px', display: 'block' }}>
                    Theme
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className={`bs-category-btn ${waTheme === 'dark' ? 'active' : ''}`}
                      onClick={() => setWaTheme('dark')}
                      style={{ height: 28, padding: '0 10px', fontSize: '0.72rem', flex: 1, justifyContent: 'center' }}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      className={`bs-category-btn ${waTheme === 'light' ? 'active' : ''}`}
                      onClick={() => setWaTheme('light')}
                      style={{ height: 28, padding: '0 10px', fontSize: '0.72rem', flex: 1, justifyContent: 'center' }}
                    >
                      Light
                    </button>
                  </div>
                </div>
              </div>

              {/* Header Bar Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={waShowHeader}
                    onChange={(e) => setWaShowHeader(e.target.checked)}
                    style={{ accentColor: '#ff5e36', width: 16, height: 16 }}
                  />
                  <span>Show Contact Header Bar</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Time:</span>
                  <input
                    type="text"
                    value={waTime}
                    onChange={(e) => setWaTime(e.target.value)}
                    style={{
                      ...inputStyle,
                      width: '80px',
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </BottomSheet>
  );
}
