import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, User, AtSign, Sparkles, Dices, Check,
  MessageCircle, Repeat, Heart, Bookmark, Share2,
  Phone, Video, MoreVertical, Send, CheckCheck,
  Upload, Image as ImageIcon, Trash2, ArrowLeftRight, ChevronLeft
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

export const WhatsAppCheckmarks = ({ ticks = 'blue', size = 14 }) => {
  const isBlue = ticks === 'blue';
  const color = isBlue ? '#53bdeb' : '#8696a0';
  const isDouble = ticks !== 'single';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', color, fontSize: size, lineHeight: 1, letterSpacing: '-3px', marginRight: isDouble ? '3px' : '1px' }}>
      <span>✓</span>{isDouble && <span>✓</span>}
    </span>
  );
};

/* ─── Modern iOS WhatsApp Header Glyphs ─── */
const IOSVideoGlyph = ({ size = 18, color = '#007aff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d="M4 6.5A2.5 2.5 0 0 0 1.5 9v6A2.5 2.5 0 0 0 4 17.5h9a2.5 2.5 0 0 0 2.5-2.5V9A2.5 2.5 0 0 0 13 6.5H4zm13.78 3.03a1 1 0 0 0-1.28.96v3.02a1 1 0 0 0 1.28.96l3.5-1.5a1 1 0 0 0 .72-.96v-1a1 1 0 0 0-.72-.96l-3.5-1.5z" />
  </svg>
);

const IOSPhoneGlyph = ({ size = 17, color = '#007aff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
  </svg>
);

/* ─── Standalone Crisp Preset Post Images for Instagram ─── */
export const IG_PRESET_IMAGES = {
  zuck: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="50%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%23311042"/></linearGradient><linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><rect width="600" height="600" fill="url(%23g1)"/><circle cx="300" cy="240" r="140" fill="none" stroke="url(%23glow)" stroke-width="4" opacity="0.6"/><polygon points="260,180 380,240 260,300" fill="%2338bdf8"/><rect x="120" y="420" width="360" height="40" rx="12" fill="%231e293b" stroke="%2338bdf8" stroke-width="1.5"/><text x="300" y="446" fill="%23f8fafc" font-size="18" font-family="sans-serif" font-weight="700" text-anchor="middle">META CONNECT 2026 // OPEN WEIGHTS</text><text x="300" y="520" fill="%2394a3b8" font-size="15" font-family="sans-serif" text-anchor="middle">⚡ Keynote Livestream &amp; Demo</text></svg>`,
  egg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23fdfaf5"/><defs><radialGradient id="eggShade" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="%23ffedd5"/><stop offset="50%" stop-color="%23ea580c"/><stop offset="100%" stop-color="%239a3412"/></radialGradient><filter id="eggShadow"><feDropShadow dx="0" dy="25" stdDeviation="20" flood-opacity="0.18"/></filter></defs><ellipse cx="300" cy="310" rx="135" ry="175" fill="url(%23eggShade)" filter="url(%23eggShadow)"/><ellipse cx="270" cy="240" rx="30" ry="45" fill="%23fff" opacity="0.3" transform="rotate(-15 270 240)"/><text x="300" y="540" fill="%23431407" font-size="16" font-family="sans-serif" font-weight="800" letter-spacing="2" text-anchor="middle">%23EGGGANG · 58.9M LIKES</text></svg>`,
  cat: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23fef3c7"/><circle cx="300" cy="330" r="160" fill="%23f97316"/><polygon points="190,210 240,110 270,200" fill="%23ea580c"/><polygon points="205,195 240,130 260,195" fill="%23fda4af"/><polygon points="410,210 360,110 330,200" fill="%23ea580c"/><polygon points="395,195 360,130 340,195" fill="%23fda4af"/><circle cx="240" cy="310" r="28" fill="%23fff"/><circle cx="244" cy="310" r="16" fill="%231e293b"/><circle cx="250" cy="304" r="6" fill="%23fff"/><circle cx="360" cy="310" r="28" fill="%23fff"/><circle cx="356" cy="310" r="16" fill="%231e293b"/><circle cx="362" cy="304" r="6" fill="%23fff"/><polygon points="300,345 288,335 312,335" fill="%23f43f5e"/><path d="M288 348 Q300 365 312 348" stroke="%23431407" stroke-width="4" fill="none"/><line x1="170" y1="330" x2="250" y2="340" stroke="%23ea580c" stroke-width="4"/><line x1="160" y1="355" x2="250" y2="355" stroke="%23ea580c" stroke-width="4"/><line x1="430" y1="330" x2="350" y2="340" stroke="%23ea580c" stroke-width="4"/><line x1="440" y1="355" x2="350" y2="355" stroke="%23ea580c" stroke-width="4"/><text x="300" y="540" fill="%237c2d12" font-size="18" font-family="sans-serif" font-weight="700" text-anchor="middle">ZERO THOUGHTS BEHIND THESE EYES</text></svg>`,
  aesthetic: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23e0e7ff"/><defs><linearGradient id="warmBg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fce7f3"/><stop offset="100%" stop-color="%23ede9fe"/></linearGradient></defs><rect width="600" height="600" fill="url(%23warmBg)"/><rect x="140" y="100" width="320" height="220" rx="16" fill="%231e293b"/><rect x="155" y="115" width="290" height="185" rx="8" fill="%230f172a"/><circle cx="300" cy="205" r="30" fill="%23a855f7" opacity="0.8"/><text x="300" y="270" fill="%2338bdf8" font-size="14" font-family="monospace" text-anchor="middle">npm run romanticize-life</text><circle cx="300" cy="420" r="70" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="3"/><circle cx="300" cy="420" r="55" fill="%2310b981"/><ellipse cx="300" cy="420" rx="35" ry="20" fill="%23d1fae5" opacity="0.8"/><text x="300" y="550" fill="%23475569" font-size="16" font-family="serif" font-style="italic" text-anchor="middle">matcha latte + 0 unread slacks ✨</text></svg>`,
  startup: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23090d16"/><defs><linearGradient id="termGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23131b2e"/><stop offset="100%" stop-color="%230d121f"/></linearGradient></defs><rect x="50" y="60" width="500" height="480" rx="14" fill="url(%23termGrad)" stroke="%231e293b" stroke-width="2"/><circle cx="80" cy="88" r="6" fill="%23ef4444"/><circle cx="102" cy="88" r="6" fill="%23f59e0b"/><circle cx="124" cy="88" r="6" fill="%2310b981"/><text x="80" y="150" fill="%23ec4899" font-size="18" font-family="monospace" font-weight="700">const<tspan fill="%2338bdf8"> startup </tspan><tspan fill="%23fff">=</tspan><tspan fill="%23e2e8f0"> {</tspan></text><text x="110" y="195" fill="%2394a3b8" font-size="16" font-family="monospace">funding:<tspan fill="%2322c55e"> '$50M'</tspan>,</text><text x="110" y="240" fill="%2394a3b8" font-size="16" font-family="monospace">revenue:<tspan fill="%23f43f5e"> '$0.00'</tspan>,</text><text x="110" y="285" fill="%2394a3b8" font-size="16" font-family="monospace">vibes:<tspan fill="%23a855f7"> 'immaculate'</tspan>,</text><text x="110" y="330" fill="%2394a3b8" font-size="16" font-family="monospace">ai_engineers:<tspan fill="%23eab308"> 42</tspan></text><text x="80" y="375" fill="%23e2e8f0" font-size="18" font-family="monospace">};</text><rect x="80" y="420" width="440" height="60" rx="8" fill="%2310b981" opacity="0.15" stroke="%2310b981" stroke-width="1"/><text x="100" y="456" fill="%2334d399" font-size="15" font-family="monospace">✔ Deployment complete to 14 regions</text></svg>`
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
  'replacing our entire backend with a Google Sheet for maximum velocity',
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
    text: 'Meta announces AGI is just a guy named Dave in a basement writing if-else statements. Link in bio.',
    commentsCount: '14,209',
    topCommentUser: 'cristiano',
    topCommentText: 'AGI when? 😂👏',
    time: '2 hours ago',
    postImage: IG_PRESET_IMAGES.zuck
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
    text: 'Let’s set a world record together and get the most liked post on Instagram. We got this 💪',
    commentsCount: '3,842,109',
    topCommentUser: 'kyliejenner',
    topCommentText: 'Take the crown 👑',
    time: '1 day ago',
    postImage: IG_PRESET_IMAGES.egg
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
    text: 'I did not knock the glass off the table. Gravity did. I am completely innocent of all charges.',
    commentsCount: '892',
    topCommentUser: 'doge',
    topCommentText: 'much innocent such gravity',
    time: '4 hours ago',
    postImage: IG_PRESET_IMAGES.cat
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
    text: 'Romanticize your life even when your code refuses to compile. ✨ Matcha latte in hand, zero bugs in sight.',
    commentsCount: '1,420',
    topCommentUser: 'zendaya',
    topCommentText: 'Obsessed with this vibe ✨',
    time: '5 hours ago',
    postImage: IG_PRESET_IMAGES.aesthetic
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
    text: 'We just raised $50M seed round to replace meetings with silence. Hiring 10 senior devs to maintain the silence.',
    commentsCount: '648',
    topCommentUser: 'elonmusk',
    topCommentText: 'Sounds like a hard problem',
    time: '7 hours ago',
    postImage: IG_PRESET_IMAGES.startup
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

/* ─── WhatsApp Presets & Multi-Message Conversations ─── */
const WHATSAPP_PERSONAS = [
  {
    id: 'mom',
    label: '❤️ Mom',
    name: 'Mom ❤️',
    status: 'online',
    avatarBg: 'linear-gradient(135deg, #f43f5e, #fda4af)',
    messages: [
      { id: 'm1', text: 'Please remember to eat vegetables and don’t stay up until 4 AM arguing with strangers on the internet.', direction: 'received', time: '11:42 PM', ticks: 'blue' },
      { id: 'm2', text: 'I am eating healthy right now mom! 👍', direction: 'sent', time: '11:43 PM', ticks: 'blue' },
      { id: 'm3', text: 'Pizza is not a vegetable. I can see your location at Domino’s.', direction: 'received', time: '11:44 PM', ticks: 'blue' }
    ]
  },
  {
    id: 'boss',
    label: '💼 The Boss',
    name: 'Boss 💼',
    status: 'online',
    avatarBg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    messages: [
      { id: 'b1', text: 'Hey, I know you’re on PTO in the mountains right now...', direction: 'received', time: '8:01 AM', ticks: 'blue' },
      { id: 'b2', text: 'Yeah, signal is pretty bad up here!', direction: 'sent', time: '8:02 AM', ticks: 'blue' },
      { id: 'b3', text: 'Great. Can you hop on a quick 3-hour emergency alignment sync?', direction: 'received', time: '8:03 AM', ticks: 'blue' }
    ]
  },
  {
    id: 'fbi',
    label: '🕵️ FBI Agent',
    name: 'FBI Agent 🕵️',
    status: 'typing...',
    avatarBg: 'linear-gradient(135deg, #1e293b, #0f172a)',
    messages: [
      { id: 'f1', text: 'We saw what you just googled.', direction: 'received', time: '2:14 AM', ticks: 'blue' },
      { id: 'f2', text: 'Wait who is this?? 😳', direction: 'sent', time: '2:15 AM', ticks: 'blue' },
      { id: 'f3', text: 'Close the incognito tab immediately and go to sleep.', direction: 'received', time: '2:16 AM', ticks: 'blue' }
    ]
  },
  {
    id: 'delivery',
    label: '🍕 Delivery Guy',
    name: 'Delivery Driver 🛵',
    status: 'online',
    avatarBg: 'linear-gradient(135deg, #f97316, #ea580c)',
    messages: [
      { id: 'd1', text: 'I’ve been standing outside your door for 15 minutes.', direction: 'received', time: '9:15 PM', ticks: 'blue' },
      { id: 'd2', text: 'Which door? I don\'t see anyone outside!', direction: 'sent', time: '9:16 PM', ticks: 'blue' },
      { id: 'd3', text: 'I’m on your porch eating your fries. They’re really good.', direction: 'received', time: '9:17 PM', ticks: 'blue' }
    ]
  },
  {
    id: 'landlord',
    label: '🏠 Landlord',
    name: 'Landlord 🔑',
    status: 'last seen 2m ago',
    avatarBg: 'linear-gradient(135deg, #64748b, #475569)',
    messages: [
      { id: 'l1', text: 'Rent was due 60 seconds ago.', direction: 'received', time: '12:01 AM', ticks: 'grey' },
      { id: 'l2', text: 'It\'s 12:01 AM on the 1st!! The bank is closed!', direction: 'sent', time: '12:02 AM', ticks: 'blue' },
      { id: 'l3', text: 'A $400 late convenience fee has been applied to your account.', direction: 'received', time: '12:03 AM', ticks: 'grey' }
    ]
  }
];

const RANDOM_DIALOGUES = [
  [
    { id: 'r1', text: 'Are you alive? You haven’t sent a meme in 45 minutes.', direction: 'received', time: '4:20 PM', ticks: 'blue' },
    { id: 'r2', text: 'Barely surviving this meeting that could have been a silent nod.', direction: 'sent', time: '4:21 PM', ticks: 'blue' },
    { id: 'r3', text: 'Hang in there, sending emergency coffee via thoughts & prayers.', direction: 'received', time: '4:22 PM', ticks: 'blue' }
  ],
  [
    { id: 'r1', text: 'Hey, quick question about that code you wrote 3 years ago.', direction: 'received', time: '5:01 PM', ticks: 'blue' },
    { id: 'r2', text: 'I was a different person back then, please do not hold me accountable.', direction: 'sent', time: '5:02 PM', ticks: 'blue' },
    { id: 'r3', text: 'Well it broke production in 14 countries. Have a great weekend!', direction: 'received', time: '5:03 PM', ticks: 'blue' }
  ]
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
  const [igCommentsCount, setIgCommentsCount] = useState('14,209');
  const [igShowComments, setIgShowComments] = useState(true);
  const [igTopCommentUser, setIgTopCommentUser] = useState('cristiano');
  const [igTopCommentText, setIgTopCommentText] = useState('AGI when? 😂👏');
  const [igTime, setIgTime] = useState('2 hours ago');
  const [igShowTranslation, setIgShowTranslation] = useState(true);
  const [igTheme, setIgTheme] = useState('dark');
  const [igAvatarBg, setIgAvatarBg] = useState('linear-gradient(135deg, #0ea5e9, #38bdf8)');
  const [igPostImage, setIgPostImage] = useState(IG_PRESET_IMAGES.zuck);

  // 3. WhatsApp State
  const [activeWaPersona, setActiveWaPersona] = useState('mom');
  const [waName, setWaName] = useState('Mom ❤️');
  const [waStatus, setWaStatus] = useState('online');
  const [waTheme, setWaTheme] = useState('dark');
  const [waShowHeader, setWaShowHeader] = useState(true);
  const [waAvatarBg, setWaAvatarBg] = useState('linear-gradient(135deg, #f43f5e, #fda4af)');
  const [waMessages, setWaMessages] = useState(WHATSAPP_PERSONAS[0].messages);

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
    if (p.commentsCount) setIgCommentsCount(p.commentsCount);
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
    if (p.messages) setWaMessages(p.messages);
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
    setWaMessages([...waMessages, newMsg]);
  };

  const handleUpdateWaMessage = (id, updates) => {
    setWaMessages(waMessages.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleRemoveWaMessage = (id) => {
    if (waMessages.length <= 1) return;
    setWaMessages(waMessages.filter(m => m.id !== id));
  };

  const handleRandomWaDialogue = () => {
    const pick = RANDOM_DIALOGUES[Math.floor(Math.random() * RANDOM_DIALOGUES.length)];
    setWaMessages(pick);
  };

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
          postImage: igPostImage,
          theme: igTheme,
          time: igTime || '2 hours ago',
          commentsCount: igCommentsCount,
          showComments: igShowComments,
          topCommentUser: igTopCommentUser,
          topCommentText: igTopCommentText,
          showTranslation: igShowTranslation
        });
      }
    } else if (activePlatform === 'whatsapp') {
      if (onAddWhatsAppCard) {
        onAddWhatsAppCard({
          contactName: waName,
          status: waStatus,
          text: waMessages[0]?.text || '',
          messages: waMessages,
          direction: waMessages[0]?.direction || 'received',
          ticks: 'blue',
          theme: waTheme,
          showHeader: waShowHeader,
          time: waMessages[waMessages.length - 1]?.time || '11:42 PM'
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

        {activePlatform === 'instagram' && INSTAGRAM_PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`bs-category-btn ${activeIgPersona === p.id ? 'active' : ''}`}
            onClick={() => handleApplyIgPersona(p)}
          >
            <span>{p.label}</span>
          </button>
        ))}

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
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5e36', display: 'inline-block' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ff5e36' }}>
              Live Preview
            </span>
          </div>
          <span style={{ fontSize: '0.70rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'capitalize' }}>
            {activePlatform === 'tweet' ? tweetTheme : activePlatform === 'instagram' ? igTheme : waTheme} Mode
          </span>
        </div>

        {/* 1. TWITTER / X PREVIEW */}
        {activePlatform === 'tweet' && (
          <div
            style={{
              background: tweetTheme === 'light' ? '#ffffff' : (tweetTheme === 'dim' ? '#15202b' : '#000000'),
              color: tweetTheme === 'light' ? '#0f1419' : '#ffffff',
              border: tweetTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '14px 16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: tweetAvatarBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#ffffff',
                    fontSize: '1rem',
                    flexShrink: 0
                  }}
                >
                  {(tweetName || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: tweetTheme === 'light' ? '#0f1419' : '#ffffff' }}>
                      {tweetName || 'Name'}
                    </span>
                    {tweetVerified && <TwitterVerifiedBadge size={15} checkColor={tweetTheme === 'light' ? '#ffffff' : '#000000'} />}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: tweetTheme === 'light' ? '#536471' : '#71767b' }}>
                    {tweetHandle || '@handle'}
                  </span>
                </div>
              </div>
              <XLogo size={18} color={tweetTheme === 'light' ? '#0f1419' : '#ffffff'} />
            </div>

            <div style={{ fontSize: '0.95rem', lineHeight: 1.38, marginBottom: '12px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {tweetText || 'Tweet something...'}
            </div>

            <div style={{ fontSize: '0.74rem', color: tweetTheme === 'light' ? '#536471' : '#71767b', marginBottom: '10px', display: 'flex', gap: '6px' }}>
              <span>10:42 PM · Oct 8, 2026</span>
              <span>·</span>
              <strong style={{ color: tweetTheme === 'light' ? '#0f1419' : '#ffffff' }}>18.2M Views</strong>
            </div>

            <div style={{ borderTop: tweetTheme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', color: tweetTheme === 'light' ? '#536471' : '#71767b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
                <MessageCircle size={15} /> 14.2K
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
                <Repeat size={15} /> 62.8K
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
                <Heart size={15} /> 420.5K
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
                <Bookmark size={15} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
                <Share2 size={15} />
              </div>
            </div>
          </div>
        )}

        {/* 2. INSTAGRAM POST CARD PREVIEW (IMAGE FIRST, THEN ACTION BAR, THEN LIKES, THEN CAPTION BELOW LIKES) */}
        {activePlatform === 'instagram' && (
          <div
            style={{
              background: igTheme === 'light' ? '#ffffff' : '#000000',
              color: igTheme === 'light' ? '#262626' : '#ffffff',
              border: igTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              overflow: 'hidden',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}
          >
            {/* Header: Avatar, Username, Subtitle, 3-dots */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Avatar with Rainbow Story Ring */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    padding: igHasStoryRing ? 2 : 0,
                    background: igHasStoryRing
                      ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                      : 'transparent',
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

              {/* 3-dots menu */}
              <div style={{ display: 'flex', gap: '3px', paddingLeft: '8px', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
                <span style={{ fontSize: '1.2rem', lineHeight: 0.5, letterSpacing: '1px' }}>•••</span>
              </div>
            </div>

            {/* Post Image (User Editable / Custom Uploaded) */}
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                maxHeight: '280px',
                background: igTheme === 'light' ? '#f3f4f6' : '#111827',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {igPostImage ? (
                <img
                  src={igPostImage}
                  alt="Post preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#9ca3af' }}>
                  <ImageIcon size={36} strokeWidth={1.5} />
                  <span style={{ fontSize: '0.78rem' }}>No photo uploaded</span>
                </div>
              )}

              {/* Quick Image Upload Button on Preview */}
              <label
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                }}
              >
                <Upload size={12} />
                <span>Upload Custom Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPostImage}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Content Area Below Image: Actions -> Likes -> Caption -> Comments/Time */}
            <div style={{ padding: '10px 14px 14px 14px' }}>
              {/* Action Icons Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  color: igTheme === 'light' ? '#262626' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Heart size={21} strokeWidth={2} style={{ color: '#ff3040', fill: '#ff3040' }} />
                  <MessageCircle size={21} strokeWidth={2} />
                  <Send size={20} strokeWidth={2} />
                </div>
                <Bookmark size={21} strokeWidth={2} />
              </div>

              {/* Likes Text (Above Caption) */}
              {igLikesText && (
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.84rem', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
                    {igLikesText}
                  </span>
                </div>
              )}

              {/* Caption Content (BELOW LIKES ICON & LIKES COUNT) */}
              <div
                style={{
                  fontSize: '0.86rem',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: igTheme === 'light' ? '#262626' : '#ffffff',
                  marginBottom: '6px'
                }}
              >
                <strong style={{ marginRight: '6px', fontWeight: 700 }}>{igUsername || 'username'}</strong>
                <span>{igText || 'Caption here...'}</span>
              </div>

              {/* Comments Count */}
              {igShowComments !== false && Boolean(igCommentsCount) && (
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', color: igTheme === 'light' ? '#737373' : '#a8a8a8', cursor: 'pointer' }}>
                    {igCommentsCount.startsWith('View') ? igCommentsCount : `View all ${igCommentsCount} comments`}
                  </span>
                </div>
              )}

              {/* Optional Top / Pinned Comment */}
              {igTopCommentUser && igTopCommentText && (
                <div style={{ fontSize: '0.80rem', lineHeight: 1.35, marginBottom: '4px', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
                  <strong style={{ marginRight: '6px', fontWeight: 700 }}>{igTopCommentUser}</strong>
                  <span>{igTopCommentText}</span>
                </div>
              )}

              {/* Timestamp & Translation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.68rem', color: igTheme === 'light' ? '#8e8e8e' : '#737373', textTransform: 'none' }}>
                  {igTime || '2 hours ago'}
                </span>
                {igShowTranslation !== false && (
                  <>
                    <span style={{ fontSize: '0.68rem', color: igTheme === 'light' ? '#8e8e8e' : '#737373' }}>·</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: igTheme === 'light' ? '#262626' : '#ffffff', cursor: 'pointer' }}>
                      See translation
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. MODERN iOS WHATSAPP CHAT CARD PREVIEW (MULTI-MESSAGE CONVERSATION) */}
        {activePlatform === 'whatsapp' && (
          <div
            style={{
              background: waTheme === 'light' ? '#efeae2' : '#0b141a',
              color: waTheme === 'light' ? '#111b21' : '#e9edef',
              border: waTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}
          >
            {/* Modern iOS WhatsApp Header Bar */}
            {waShowHeader && (
              <div
                style={{
                  background: waTheme === 'light' ? '#f6f6f6' : '#1f2c34',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: waTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* iOS Blue Back Chevron */}
                  <span style={{ color: '#007aff', fontWeight: 600, fontSize: '1.25rem', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
                    ‹
                  </span>
                  
                  {/* Contact Avatar */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: waAvatarBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#ffffff',
                      fontSize: '0.90rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                  >
                    {(waName || 'W').charAt(0).toUpperCase()}
                  </div>

                  {/* Name and Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.90rem', color: waTheme === 'light' ? '#111b21' : '#e9edef' }}>
                      {waName || 'Contact Name'}
                    </span>
                    <span style={{ fontSize: '0.70rem', color: waStatus === 'online' ? '#25d366' : (waTheme === 'light' ? '#667781' : '#8696a0'), fontWeight: waStatus === 'online' ? 600 : 400 }}>
                      {waStatus}
                    </span>
                  </div>
                </div>

                {/* iOS Call Glyphs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <IOSVideoGlyph size={19} color="#007aff" />
                  <IOSPhoneGlyph size={17} color="#007aff" />
                </div>
              </div>
            )}

            {/* Conversation Stream */}
            <div style={{ padding: '14px 14px 16px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Centered iOS Date Pill */}
              <div
                style={{
                  alignSelf: 'center',
                  background: waTheme === 'light' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(18, 27, 34, 0.78)',
                  backdropFilter: 'blur(8px)',
                  padding: '3px 12px',
                  borderRadius: '10px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  marginBottom: '4px'
                }}
              >
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: waTheme === 'light' ? '#54656f' : '#8696a0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  TODAY
                </span>
              </div>

              {/* Multi-Message Sequence */}
              {waMessages.map((msg, index) => {
                const isSent = msg.direction === 'sent';
                const prevMsg = waMessages[index - 1];
                const isClustered = prevMsg && prevMsg.direction === msg.direction;

                return (
                  <div
                    key={msg.id || index}
                    style={{
                      alignSelf: isSent ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      background: isSent
                        ? (waTheme === 'light' ? '#d9fdd3' : '#005c4b')
                        : (waTheme === 'light' ? '#ffffff' : '#202c33'),
                      color: waTheme === 'light' ? '#111b21' : '#e9edef',
                      padding: '7px 11px 5px 12px',
                      borderRadius: isSent
                        ? (isClustered ? '14px 14px 4px 14px' : '14px 14px 4px 14px')
                        : (isClustered ? '14px 14px 14px 4px' : '14px 14px 14px 4px'),
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.14)',
                      position: 'relative',
                      marginTop: isClustered ? '-4px' : '0'
                    }}
                  >
                    <div style={{ fontSize: '0.86rem', lineHeight: 1.35, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {msg.text || '...'}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px',
                        fontSize: '0.64rem',
                        color: waTheme === 'light' ? '#667781' : '#8696a0',
                        marginTop: '3px'
                      }}
                    >
                      <span>{msg.time || '11:42 PM'}</span>
                      {isSent && <WhatsAppCheckmarks ticks={msg.ticks || 'blue'} size={13} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                  Tweet Text <span style={{ fontWeight: 400, opacity: 0.7 }}>{tweetText.length}/280</span>
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
                rows={3}
                value={tweetText}
                onChange={(e) => {
                  setTweetText(e.target.value);
                  setActivePersona('custom');
                }}
                placeholder="What's happening?"
                style={{ ...inputStyle, lineHeight: 1.4, minHeight: '68px', resize: 'vertical' }}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#ffffff' }}>
                <input
                  type="checkbox"
                  checked={tweetVerified}
                  onChange={(e) => setTweetVerified(e.target.checked)}
                  style={{ accentColor: '#ff5e36', width: 16, height: 16 }}
                />
                <span>Blue Verified Badge</span>
              </label>

              <div style={{ display: 'flex', gap: '6px' }}>
                {['dark', 'dim', 'light'].map((th) => (
                  <button
                    key={th}
                    type="button"
                    className={`bs-category-btn ${tweetTheme === th ? 'active' : ''}`}
                    onClick={() => setTweetTheme(th)}
                    style={{ height: 28, padding: '0 10px', fontSize: '0.72rem', textTransform: 'capitalize' }}
                  >
                    {th}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 2. INSTAGRAM CONTROLS */}
        {activePlatform === 'instagram' && (
          <>
            {/* Username & Subtitle */}
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

            {/* Likes Line Input & Quick Presets */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                  Likes Count & Text
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { label: 'Friend + Count', val: 'Liked by cristiano and 1,842,509 others' },
                    { label: '1.8M likes', val: '1,842,509 likes' },
                    { label: '420K likes', val: '420.5K likes' },
                    { label: '12K likes', val: '12,410 likes' }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setIgLikesText(p.val)}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: igLikesText === p.val ? 'rgba(255, 94, 54, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        border: igLikesText === p.val ? '1px solid #ff5e36' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: igLikesText === p.val ? '#ff5e36' : 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                className="form-input"
                value={igLikesText}
                onChange={(e) => setIgLikesText(e.target.value)}
                placeholder="e.g. Liked by cristiano and 1,842,509 others"
                style={inputStyle}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              />
            </div>

            {/* Caption Textarea (Below Likes Icon & Likes Line) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                  Caption (Appears below likes icon)
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
                rows={3}
                value={igText}
                onChange={(e) => {
                  setIgText(e.target.value);
                  setActiveIgPersona('custom');
                }}
                placeholder="Write an Instagram caption..."
                style={{ ...inputStyle, lineHeight: 1.4, minHeight: '68px', resize: 'vertical' }}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              />
            </div>

            {/* Comments Count & Timestamp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                    Comments Count
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['42', '420', '1,420', '14.2K'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setIgCommentsCount(c)}
                        style={{
                          padding: '1px 6px',
                          borderRadius: '5px',
                          background: igCommentsCount === c ? 'rgba(255, 94, 54, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                          border: igCommentsCount === c ? '1px solid #ff5e36' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: igCommentsCount === c ? '#ff5e36' : 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={igCommentsCount}
                  onChange={(e) => setIgCommentsCount(e.target.value)}
                  placeholder="e.g. 420 or 1,420"
                  style={inputStyle}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                    Timestamp
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['2h', '5h', '1d'].map(t => {
                      const full = t === '2h' ? '2 hours ago' : t === '5h' ? '5 hours ago' : '1 day ago';
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setIgTime(full)}
                          style={{
                            padding: '1px 6px',
                            borderRadius: '5px',
                            background: igTime === full ? 'rgba(255, 94, 54, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                            border: igTime === full ? '1px solid #ff5e36' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: igTime === full ? '#ff5e36' : 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={igTime}
                  onChange={(e) => setIgTime(e.target.value)}
                  placeholder="e.g. 2 hours ago"
                  style={inputStyle}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>
            </div>

            {/* Top / Pinned Comment (Optional) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: '6px' }}>
                  Top Commenter (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={igTopCommentUser}
                  onChange={(e) => setIgTopCommentUser(e.target.value)}
                  placeholder="e.g. cristiano"
                  style={inputStyle}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: '6px' }}>
                  Top Comment Text
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={igTopCommentText}
                  onChange={(e) => setIgTopCommentText(e.target.value)}
                  placeholder="e.g. AGI when? 😂👏"
                  style={inputStyle}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>
            </div>

            {/* Options Row: Verified Badge, Story Ring, Show Comments, Translation, Theme */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.76rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={igVerified}
                    onChange={(e) => setIgVerified(e.target.checked)}
                    style={{ accentColor: '#ff5e36', width: 15, height: 15 }}
                  />
                  <span>Verified</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.76rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={igHasStoryRing}
                    onChange={(e) => setIgHasStoryRing(e.target.checked)}
                    style={{ accentColor: '#ff5e36', width: 15, height: 15 }}
                  />
                  <span>Story Ring</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.76rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={igShowComments}
                    onChange={(e) => setIgShowComments(e.target.checked)}
                    style={{ accentColor: '#ff5e36', width: 15, height: 15 }}
                  />
                  <span>Comments</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.76rem', color: '#ffffff' }}>
                  <input
                    type="checkbox"
                    checked={igShowTranslation}
                    onChange={(e) => setIgShowTranslation(e.target.checked)}
                    style={{ accentColor: '#ff5e36', width: 15, height: 15 }}
                  />
                  <span>Translation</span>
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

        {/* 3. MODERN iOS WHATSAPP CONTROLS (MULTI-MESSAGE CONVERSATION MANAGER) */}
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

            {/* Conversation Messages List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                  Conversation Messages ({waMessages.length})
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleRandomWaDialogue}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#ff5e36',
                      background: '#16181f',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '9999px',
                      padding: '3px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    <Dices size={12} /> Surprise Dialogue
                  </button>
                  <button
                    type="button"
                    onClick={handleAddWaMessage}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'var(--primary-gradient)',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '3px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} strokeWidth={2.4} /> Add Message
                  </button>
                </div>
              </div>

              {/* Message Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {waMessages.map((msg, index) => {
                  const isSent = msg.direction === 'sent';

                  return (
                    <div
                      key={msg.id || index}
                      style={{
                        background: '#16181f',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '14px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {/* Message Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.70rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
                            #{index + 1}
                          </span>

                          {/* Direction Toggle Pill */}
                          <button
                            type="button"
                            onClick={() => handleUpdateWaMessage(msg.id, { direction: isSent ? 'received' : 'sent' })}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: isSent ? 'rgba(37, 211, 102, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                              border: isSent ? '1px solid #25d366' : '1px solid rgba(255, 255, 255, 0.2)',
                              color: isSent ? '#25d366' : '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <ArrowLeftRight size={10} />
                            <span>{isSent ? 'Sent (Green)' : 'Received (Slate)'}</span>
                          </button>
                        </div>

                        {/* Delete message if > 1 */}
                        {waMessages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveWaMessage(msg.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                            title="Delete this message"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Message Content Input */}
                      <textarea
                        className="form-input"
                        rows={2}
                        value={msg.text}
                        onChange={(e) => handleUpdateWaMessage(msg.id, { text: e.target.value })}
                        placeholder="Type message text..."
                        style={{ ...inputStyle, minHeight: '44px', padding: '6px 10px', fontSize: '0.82rem', resize: 'vertical' }}
                        onFocus={inputFocusHandler}
                        onBlur={inputBlurHandler}
                      />

                      {/* Message Time and Ticks */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Time:</span>
                          <input
                            type="text"
                            value={msg.time || '11:42 PM'}
                            onChange={(e) => handleUpdateWaMessage(msg.id, { time: e.target.value })}
                            style={{ ...inputStyle, padding: '3px 8px', fontSize: '0.74rem', width: '90px' }}
                          />
                        </div>

                        {isSent && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {['blue', 'grey', 'single'].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleUpdateWaMessage(msg.id, { ticks: t })}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontSize: '0.66rem',
                                  background: (msg.ticks || 'blue') === t ? 'rgba(83, 189, 235, 0.25)' : 'rgba(255,255,255,0.06)',
                                  border: (msg.ticks || 'blue') === t ? '1px solid #53bdeb' : '1px solid transparent',
                                  color: (msg.ticks || 'blue') === t ? '#53bdeb' : 'rgba(255,255,255,0.6)',
                                  cursor: 'pointer'
                                }}
                              >
                                {t === 'blue' ? '✓✓ Blue' : t === 'grey' ? '✓✓ Grey' : '✓ Single'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Header toggle and Theme */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#ffffff' }}>
                <input
                  type="checkbox"
                  checked={waShowHeader}
                  onChange={(e) => setWaShowHeader(e.target.checked)}
                  style={{ accentColor: '#25d366', width: 16, height: 16 }}
                />
                <span>Show iOS Header Bar</span>
              </label>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={`bs-category-btn ${waTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => setWaTheme('dark')}
                  style={{ height: 28, padding: '0 10px', fontSize: '0.72rem' }}
                >
                  Dark OLED
                </button>
                <button
                  type="button"
                  className={`bs-category-btn ${waTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setWaTheme('light')}
                  style={{ height: 28, padding: '0 10px', fontSize: '0.72rem' }}
                >
                  Light iOS
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
