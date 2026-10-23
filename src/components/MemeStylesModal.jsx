import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, User, AtSign, Sparkles, Dices, Check,
  MessageCircle, Repeat, Heart, Bookmark, Share2,
  Phone, Video, MoreVertical, Send, CheckCheck,
  Upload, Image as ImageIcon, Trash2, ArrowLeftRight, ChevronLeft, ChevronRight, ChevronDown,
  Newspaper, Rocket, Trophy, Smile, Briefcase, Calendar, Paperclip, Camera, Mic
} from 'lucide-react';
import BottomSheet from './BottomSheet';

const WHATSAPP_DOODLE_CSS_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' opacity='0.045'%3E%3Cpath d='M15 15h20v14H24l-6 5v-5h-3z'/%3E%3Ccircle cx='110' cy='30' r='8'/%3E%3Cpath d='M110 26v4l3 2'/%3E%3Cpath d='M150 40c0-4 4-8 8-8s8 4 8 8c0 8-16 16-16 16s-16-8-16-16c0-4 4-8 8-8s8 4 8 8z'/%3E%3Ccircle cx='55' cy='75' r='3' fill='%23fff'/%3E%3Cpath d='M58 75V62h10v10'/%3E%3Ccircle cx='68' cy='72' r='3' fill='%23fff'/%3E%3Crect x='130' y='100' width='16' height='12' rx='2'/%3E%3Ccircle cx='138' cy='106' r='3'/%3E%3Ccircle cx='40' cy='130' r='9'/%3E%3Ccircle cx='37' cy='128' r='1' fill='%23fff'/%3E%3Ccircle cx='43' cy='128' r='1' fill='%23fff'/%3E%3Cpath d='M37 133a4 4 0 0 0 6 0'/%3E%3Cpath d='M95 145l2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z'/%3E%3Cpath d='M150 155l3 3 6-7m-4 4l3 3 6-7'/%3E%3C/g%3E%3C/svg%3E")`;

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
  inc42: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23f7f5f0"/><defs><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="%23d6d0c4"/></pattern></defs><rect width="600" height="600" fill="url(%23dots)"/><rect x="25" y="25" width="550" height="550" rx="16" fill="%23ffffff" stroke="%23e5e0d8" stroke-width="2"/><text x="45" y="70" fill="%23b91c1c" font-size="26" font-family="sans-serif" font-weight="900" letter-spacing="1">INSIDE TANMAY BHAT'S</text><text x="45" y="112" fill="%23111827" font-size="34" font-family="sans-serif" font-weight="900">STARTUP PORTFOLIO</text><text x="45" y="142" fill="%234b5563" font-size="14" font-family="sans-serif" font-weight="700">19 Startup Bets From The Creator-Turned-Investor</text><rect x="45" y="165" width="180" height="180" rx="10" fill="%23f9fafb" stroke="%23e5e7eb"/><rect x="45" y="165" width="180" height="28" rx="6" fill="%23b91c1c"/><text x="135" y="184" fill="%23ffffff" font-size="12" font-family="sans-serif" font-weight="800" text-anchor="middle">FINTECH</text><text x="60" y="222" fill="%231f2937" font-size="14" font-family="sans-serif" font-weight="700">◆ TRACKK</text><text x="60" y="252" fill="%231f2937" font-size="14" font-family="sans-serif" font-weight="700">◆ smallcase</text><text x="60" y="282" fill="%231f2937" font-size="14" font-family="sans-serif" font-weight="700">◆ EquityList</text><text x="60" y="312" fill="%231f2937" font-size="14" font-family="sans-serif" font-weight="700">◆ Flint.money</text><circle cx="310" cy="255" r="70" fill="%23fee2e2"/><circle cx="310" cy="255" r="62" fill="%23b91c1c"/><text x="310" y="266" fill="%23ffffff" font-size="32" font-family="sans-serif" font-weight="900" text-anchor="middle">TB</text><text x="310" y="340" fill="%23b91c1c" font-size="38" font-family="sans-serif" font-weight="900" text-anchor="middle">$</text><rect x="375" y="165" width="180" height="180" rx="10" fill="%23f9fafb" stroke="%23e5e7eb"/><rect x="375" y="165" width="180" height="28" rx="6" fill="%23b91c1c"/><text x="465" y="184" fill="%23ffffff" font-size="12" font-family="sans-serif" font-weight="800" text-anchor="middle">MEDIA &amp; ENT</text><text x="390" y="222" fill="%231f2937" font-size="14" font-family="sans-serif" font-weight="700">★ RIGI TV</text><text x="390" y="252" fill="%231f2937" font-size="14" font-family="sans-serif" font-weight="700">★ HYPD.</text><text x="390" y="282" fill="%231f2937" font-size="14" font-family="sans-serif" font-weight="700">★ atom.com</text><text x="390" y="312" fill="%231f2937" font-size="14" font-family="sans-serif" font-weight="700">★ Unikon.ai</text><rect x="45" y="365" width="160" height="120" rx="10" fill="%23f9fafb" stroke="%23e5e7eb"/><rect x="45" y="365" width="160" height="26" rx="6" fill="%23b91c1c"/><text x="125" y="382" fill="%23ffffff" font-size="11" font-family="sans-serif" font-weight="800" text-anchor="middle">CLEAN TECH</text><text x="58" y="420" fill="%231f2937" font-size="13" font-family="sans-serif" font-weight="700">alt carbon</text><rect x="220" y="365" width="160" height="120" rx="10" fill="%23f9fafb" stroke="%23e5e7eb"/><rect x="220" y="365" width="160" height="26" rx="6" fill="%23b91c1c"/><text x="300" y="382" fill="%23ffffff" font-size="11" font-family="sans-serif" font-weight="800" text-anchor="middle">ECOMMERCE</text><text x="235" y="420" fill="%231f2937" font-size="13" font-family="sans-serif" font-weight="700">ROTORIS</text><rect x="395" y="365" width="160" height="120" rx="10" fill="%23f9fafb" stroke="%23e5e7eb"/><rect x="395" y="365" width="160" height="26" rx="6" fill="%23b91c1c"/><text x="475" y="382" fill="%23ffffff" font-size="11" font-family="sans-serif" font-weight="800" text-anchor="middle">HEALTH TECH</text><text x="410" y="420" fill="%231f2937" font-size="13" font-family="sans-serif" font-weight="700">ULTRAHUMAN</text><text x="45" y="525" fill="%239ca3af" font-size="11" font-family="sans-serif">Note: This is not an exhaustive list. · Inc42 Datalabs</text></svg>`,
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

/* ─── Instagram Presets & Data (Latest UI Reference Anatomy) ─── */
const INSTAGRAM_PERSONAS = [
  {
    id: 'inc42',
    label: 'Tech Media (inc42)',
    icon: Newspaper,
    username: 'inc42.media',
    subtitle: 'Suggested for you',
    verified: true,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #b91c1c, #ef4444)',
    likesCount: '1,583',
    commentsCount: '15',
    repostsCount: '15',
    sharesCount: '295',
    followText: 'Follow',
    likesText: '1,583',
    text: 'Remember Tanmay Bhat from the AIB... more',
    time: '28 September',
    postImage: IG_PRESET_IMAGES.inc42
  },
  {
    id: 'zuck',
    label: 'Mark Zuckerberg',
    icon: Rocket,
    username: 'zuck',
    subtitle: 'Suggested for you',
    verified: true,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    likesCount: '142.5K',
    commentsCount: '14.2K',
    repostsCount: '8.4K',
    sharesCount: '29.1K',
    followText: 'Follow',
    likesText: 'Liked by cristiano and 1,842,509 others',
    text: 'Meta announces AGI is just a guy named Dave in a basement writing if-else statements. Link in bio.',
    time: '2 hours ago',
    postImage: IG_PRESET_IMAGES.zuck
  },
  {
    id: 'egg',
    label: 'World Record Egg',
    icon: Trophy,
    username: 'world_record_egg',
    subtitle: 'Egg Gang',
    verified: true,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    likesCount: '58.9M',
    commentsCount: '3.8M',
    repostsCount: '1.2M',
    sharesCount: '4.5M',
    followText: 'Follow',
    likesText: 'Liked by kyliejenner and 58,912,400 others',
    text: 'Let’s set a world record together and get the most liked post on Instagram. We got this 💪',
    time: '1 day ago',
    postImage: IG_PRESET_IMAGES.egg
  },
  {
    id: 'cat',
    label: 'Chonky Cat',
    icon: Smile,
    username: 'chonk_vibes',
    subtitle: 'Living Room, Couch',
    verified: false,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #eab308)',
    likesCount: '412K',
    commentsCount: '892',
    repostsCount: '450',
    sharesCount: '12.8K',
    followText: 'Follow',
    likesText: 'Liked by 412,890 others',
    text: 'I did not knock the glass off the table. Gravity did. I am completely innocent of all charges.',
    time: '4 hours ago',
    postImage: IG_PRESET_IMAGES.cat
  },
  {
    id: 'aesthetic',
    label: 'Aesthetic Creator',
    icon: Sparkles,
    username: 'daily_aesthetic',
    subtitle: 'Coffee & Sunsets',
    verified: true,
    hasStoryRing: false,
    avatarBg: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    likesCount: '98.4K',
    commentsCount: '1,420',
    repostsCount: '610',
    sharesCount: '3.2K',
    followText: 'Follow',
    likesText: 'Liked by zendaya and 984,210 others',
    text: 'Romanticize your life even when your code refuses to compile. ✨ Matcha latte in hand, zero bugs in sight.',
    time: '5 hours ago',
    postImage: IG_PRESET_IMAGES.aesthetic
  },
  {
    id: 'startup',
    label: 'Silicon Valley',
    icon: Briefcase,
    username: 'startup_grind',
    subtitle: 'San Francisco, CA',
    verified: false,
    hasStoryRing: true,
    avatarBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
    likesCount: '74.1K',
    commentsCount: '648',
    repostsCount: '1,120',
    sharesCount: '8.9K',
    followText: 'Follow',
    likesText: 'Liked by elonmusk and 74,102 others',
    text: 'We just raised $50M seed round to replace meetings with silence. Hiring 10 senior devs to maintain the silence.',
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
    id: 'newspaper',
    label: '📰 Newspaper Ad',
    name: '+91 81210 03003',
    status: 'last seen yesterday at 6:43 PM',
    datePill: 'Yesterday',
    avatarBg: '#202c33',
    messages: [
      { id: 'm1', text: 'Hi, I need some help.', direction: 'sent', time: '12:28 PM', ticks: 'blue' },
      { id: 'm2', text: 'Hello. Are you looking for advertising in newspaper. Please let us know what kind of ad you are looking to advertise. We will reply you shortly', direction: 'received', time: '12:31 PM', ticks: 'none' },
      { id: 'm3', text: 'Yes', direction: 'sent', time: '12:31 PM', ticks: 'blue' },
      { id: 'm4', text: 'In English and Gujarati', direction: 'sent', time: '12:31 PM', ticks: 'blue' },
      { id: 'm5', text: '??', direction: 'sent', time: '11:34 AM', ticks: 'blue' },
      { id: 'm6', text: 'We request you to please share the matter along with the newspaper name, date, and city.', direction: 'received', time: '12:16 PM', ticks: 'none' }
    ]
  },
  {
    id: 'mom',
    label: '❤️ Mom',
    name: 'Mom ❤️',
    status: 'online',
    datePill: 'TODAY',
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
    datePill: 'TODAY',
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

/* ─── Harmonized BottomSheet Input Style (Matching Add Template Search Bar) ─── */
const inputStyle = {
  width: '100%',
  height: '42px',
  fontSize: '0.88rem',
  fontWeight: 500,
  background: '#16181f',
  borderRadius: '9999px',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  padding: '0 16px',
  color: '#ffffff',
  outline: 'none',
  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.35)',
  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};

const textareaStyle = {
  ...inputStyle,
  height: 'auto',
  minHeight: '72px',
  borderRadius: '18px',
  padding: '12px 16px',
  lineHeight: 1.45,
  resize: 'vertical'
};

const inputFocusHandler = (e) => {
  e.target.style.borderColor = '#ff5e36';
  e.target.style.background = '#1a1c24';
  e.target.style.boxShadow = '0 0 0 3px rgba(255, 94, 54, 0.22), 0 4px 14px rgba(0, 0, 0, 0.35)';
};
const inputBlurHandler = (e) => {
  e.target.style.borderColor = 'rgba(255, 255, 255, 0.14)';
  e.target.style.background = '#16181f';
  e.target.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.35)';
};

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
  const [activeIgPersona, setActiveIgPersona] = useState('inc42');
  const [igUsername, setIgUsername] = useState('inc42.media');
  const [igSubtitle, setIgSubtitle] = useState('Suggested for you');
  const [igText, setIgText] = useState('Remember Tanmay Bhat from the AIB... more');
  const [igVerified, setIgVerified] = useState(true);
  const [igHasStoryRing, setIgHasStoryRing] = useState(true);
  const [igLikesText, setIgLikesText] = useState('1,583');
  const [igLikesCount, setIgLikesCount] = useState('1,583');
  const [igCommentsCount, setIgCommentsCount] = useState('15');
  const [igRepostsCount, setIgRepostsCount] = useState('15');
  const [igSharesCount, setIgSharesCount] = useState('295');
  const [igFollowText, setIgFollowText] = useState('Follow');
  const [igTopCommentUser, setIgTopCommentUser] = useState('');
  const [igTopCommentText, setIgTopCommentText] = useState('');
  const [igTime, setIgTime] = useState('28 September');
  const [igShowTranslation, setIgShowTranslation] = useState(false);
  const [igTheme, setIgTheme] = useState('light');
  const [igAvatarBg, setIgAvatarBg] = useState('linear-gradient(135deg, #b91c1c, #ef4444)');
  const [igPostImage, setIgPostImage] = useState(IG_PRESET_IMAGES.inc42);
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

  const handleRandomWaDialogue = () => {
    const pick = RANDOM_DIALOGUES[Math.floor(Math.random() * RANDOM_DIALOGUES.length)];
    setWaMessages(pick);
    setActiveWaMsgIndex(0);
  };

  // Header Title and Icon per platform
  let modalTitle = 'Social Cards Studio';
  let modalIcon = <Sparkles size={17} />;
  if (activePlatform === 'tweet') {
    modalTitle = cardData ? 'Edit Tweet Card' : 'Tweet Card';
    modalIcon = <XLogo size={17} />;
  } else if (activePlatform === 'instagram') {
    modalTitle = cardData ? 'Edit Instagram Card' : 'Instagram Card';
    modalIcon = <InstagramLogo size={17} color="#e1306c" />;
  } else if (activePlatform === 'whatsapp') {
    modalTitle = cardData ? 'Edit WhatsApp Card' : 'WhatsApp Card';
    modalIcon = <WhatsAppLogo size={17} color="#25d366" />;
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

              {/* Follow button + 3-dots menu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  style={{
                    background: igTheme === 'dark' ? '#262626' : '#efefef',
                    border: 'none',
                    borderRadius: 8,
                    padding: '5px 14px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    color: igTheme === 'light' ? '#000000' : '#ffffff',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {igFollowText || 'Follow'}
                </button>
                <div style={{ display: 'flex', gap: '3px', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
                  <span style={{ fontSize: '1.2rem', lineHeight: 0.5, letterSpacing: '1px' }}>•••</span>
                </div>
              </div>
            </div>

            {/* Post Image (User Editable / Custom Uploaded) */}
            <div
              style={{
                width: '100%',
                maxHeight: '220px',
                aspectRatio: '16 / 11',
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
                  <ImageIcon size={32} strokeWidth={1.5} />
                  <span style={{ fontSize: '0.76rem' }}>No photo uploaded</span>
                </div>
              )}

              {/* Quick Image Upload Button on Preview */}
              <label
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
                }}
              >
                <Upload size={11} />
                <span>Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPostImage}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Content Area Below Image: Actions -> Caption -> Time */}
            <div style={{ padding: '10px 14px 14px 14px' }}>
              {/* Modern Action Icons Row — inline icon + count */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  color: igTheme === 'light' ? '#262626' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Heart size={21} strokeWidth={2} style={{ color: '#ff3040', fill: '#ff3040' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{igLikesCount || '1,583'}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MessageCircle size={21} strokeWidth={2} />
                    <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{igCommentsCount || '15'}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Repeat size={21} strokeWidth={2} />
                    <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{igRepostsCount || '15'}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Send size={20} strokeWidth={2} />
                    <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{igSharesCount || '295'}</span>
                  </span>
                </div>
                <Bookmark size={21} strokeWidth={2} />
              </div>

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
                  {igTime || '28 September'}
                </span>
                {igShowTranslation === true && (
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

        {/* 3. AUTHENTIC WHATSAPP CHAT CARD PREVIEW */}
        {activePlatform === 'whatsapp' && (
          <div
            style={{
              background: waTheme === 'light' ? '#efeae2' : '#0b141a',
              backgroundImage: waShowDoodles ? WHATSAPP_DOODLE_CSS_BG : 'none',
              backgroundRepeat: 'repeat',
              color: waTheme === 'light' ? '#111b21' : '#e9edef',
              border: waTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}
          >
            {/* Authentic WhatsApp Header Bar */}
            {waShowHeader && (
              <div
                style={{
                  background: waTheme === 'light' ? '#f0f2f5' : '#121b22',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: waTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Clean White Back Chevron */}
                  <ChevronLeft size={18} color={waTheme === 'light' ? '#111b21' : '#ffffff'} style={{ cursor: 'pointer', flexShrink: 0 }} />

                  {/* Contact Avatar */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: waAvatarBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      border: waTheme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)',
                      flexShrink: 0
                    }}
                  >
                    {(waName || 'W').replace(/^\+91\s*/, '').charAt(0).toUpperCase() || 'W'}
                  </div>

                  {/* Name and Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.84rem', color: waTheme === 'light' ? '#111b21' : '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {waName || 'Contact Name'}
                    </span>
                    <span style={{ fontSize: '0.67rem', color: waStatus === 'online' ? '#25d366' : (waTheme === 'light' ? '#667781' : '#8696a0'), fontWeight: waStatus === 'online' ? 600 : 400 }}>
                      {waStatus}
                    </span>
                  </div>
                </div>

                {/* White Outline Phone Call Icon */}
                <Phone size={16} color={waTheme === 'light' ? '#111b21' : '#ffffff'} style={{ flexShrink: 0 }} />
              </div>
            )}

            {/* Conversation Stream */}
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '170px', overflowY: 'auto' }}>
              {/* Centered WhatsApp Date Badge */}
              <div
                style={{
                  alignSelf: 'center',
                  background: waTheme === 'light' ? 'rgba(255, 255, 255, 0.92)' : '#182229',
                  padding: '2px 10px',
                  borderRadius: '6px',
                  border: waTheme === 'light' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
                  marginBottom: '2px'
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 500, color: waTheme === 'light' ? '#54656f' : '#8696a0' }}>
                  {waDatePill || 'Yesterday'}
                </span>
              </div>

              {/* Multi-Message Sequence with authentic speech bubble tails */}
              {waMessages.map((msg, index) => {
                const isSent = msg.direction === 'sent';
                const prevMsg = waMessages[index - 1];
                const isConsecutive = prevMsg && prevMsg.direction === msg.direction;
                const hasTail = !isConsecutive;
                const isSelected = activeWaMsgIndex === index;

                return (
                  <div
                    key={msg.id || index}
                    onClick={() => setActiveWaMsgIndex(index)}
                    style={{
                      alignSelf: isSent ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      background: isSent
                        ? (waTheme === 'light' ? '#d9fdd3' : '#005c4b')
                        : (waTheme === 'light' ? '#ffffff' : '#202c33'),
                      color: waTheme === 'light' ? '#111b21' : '#e9edef',
                      padding: '6px 10px 4px 10px',
                      borderRadius: isSent
                        ? (hasTail ? '8px 2px 8px 8px' : '8px')
                        : (hasTail ? '2px 8px 8px 8px' : '8px'),
                      boxShadow: isSelected
                        ? '0 0 0 1.5px #25d366, 0 2px 6px rgba(0, 0, 0, 0.25)'
                        : '0 1px 2px rgba(0, 0, 0, 0.16)',
                      position: 'relative',
                      marginTop: isConsecutive ? '-2px' : '3px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Click to edit Message ${index + 1}`}
                  >
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.35, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {msg.text || '...'}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px',
                        fontSize: '0.60rem',
                        color: waTheme === 'light' ? '#667781' : '#8696a0',
                        marginTop: '2px'
                      }}
                    >
                      <span>{msg.time || '11:42 PM'}</span>
                      {isSent && (
                        <span style={{ color: msg.ticks === 'grey' ? '#8696a0' : '#53bdeb', fontWeight: 700, fontSize: '0.70rem', lineHeight: 1 }}>
                          {msg.ticks === 'single' ? '✓' : '✓✓'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Authentic Modern Bottom Input Bar */}
            {waShowFooter && (
              <div
                style={{
                  background: waTheme === 'light' ? '#f0f2f5' : '#0b141a',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: waTheme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <Plus size={18} color={waTheme === 'light' ? '#54656f' : '#8696a0'} />
                <div
                  style={{
                    flex: 1,
                    background: waTheme === 'light' ? '#ffffff' : '#202c33',
                    borderRadius: '20px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    color: '#8696a0',
                    fontSize: '0.75rem'
                  }}
                >
                  <span>Message</span>
                  <Paperclip size={13} color="#8696a0" />
                </div>
                <Camera size={16} color={waTheme === 'light' ? '#54656f' : '#8696a0'} />
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: waTheme === 'light' ? '#00a884' : '#202c33',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.80rem'
                  }}
                >
                  <Mic size={13} color="#ffffff" />
                </div>
              </div>
            )}
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
                style={textareaStyle}
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

        {/* 2. MINIMALIST INSTAGRAM CONTROLS */}
        {activePlatform === 'instagram' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Row 1: Username & Subtitle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                  <User size={12} style={{ color: '#ff5e36' }} /> Username
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={igUsername}
                    onChange={(e) => {
                      setIgUsername(e.target.value);
                      setActiveIgPersona('custom');
                    }}
                    placeholder="e.g. inc42.media"
                    style={{ ...inputStyle, paddingRight: '40px' }}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                  <button
                    type="button"
                    onClick={() => setIgVerified(!igVerified)}
                    title={igVerified ? 'Verified (tap to toggle)' : 'Unverified (tap to toggle)'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      opacity: igVerified ? 1 : 0.25,
                      transition: 'opacity 0.2s',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <InstagramVerifiedBadge size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                  <Sparkles size={12} style={{ color: '#ff5e36' }} /> Subtitle
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={igSubtitle}
                  onChange={(e) => {
                    setIgSubtitle(e.target.value);
                    setActiveIgPersona('custom');
                  }}
                  placeholder="e.g. Suggested for you"
                  style={inputStyle}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>
            </div>

            {/* Row 2: Caption (Hero text) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                  Caption
                </label>
                <button
                  type="button"
                  onClick={handleRandomIgCaption}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    color: '#ff5e36',
                    background: '#16181f',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '9999px',
                    padding: '3px 10px',
                    cursor: 'pointer'
                  }}
                >
                  <Dices size={12} strokeWidth={2.4} /> Surprise Me
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
                placeholder="Write an Instagram caption..."
                style={{ ...textareaStyle, minHeight: '62px' }}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              />
            </div>

            {/* Row 3: Minimalist Inline Engagement Bar (4 icons + compact counts in 1 row) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                  Metrics
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setIgTheme('light')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      background: igTheme === 'light' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      border: igTheme === 'light' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                      color: igTheme === 'light' ? '#ffffff' : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer'
                    }}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setIgTheme('dark')}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      background: igTheme === 'dark' ? 'rgba(255, 94, 54, 0.25)' : 'transparent',
                      border: igTheme === 'dark' ? '1px solid #ff5e36' : '1px solid transparent',
                      color: igTheme === 'dark' ? '#ff5e36' : 'rgba(255,255,255,0.4)',
                      cursor: 'pointer'
                    }}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* 4 compact metric inputs side-by-side in one sleek row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Heart size={13} style={{ position: 'absolute', left: '10px', color: '#ff3040', fill: '#ff3040', pointerEvents: 'none', zIndex: 1 }} />
                  <input
                    type="text"
                    value={igLikesCount}
                    onChange={(e) => setIgLikesCount(e.target.value)}
                    placeholder="1,583"
                    title="Likes Count"
                    style={{ ...inputStyle, height: '38px', padding: '0 8px 0 28px', fontSize: '0.80rem', fontWeight: 600, textAlign: 'left' }}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MessageCircle size={13} style={{ position: 'absolute', left: '10px', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', zIndex: 1 }} />
                  <input
                    type="text"
                    value={igCommentsCount}
                    onChange={(e) => setIgCommentsCount(e.target.value)}
                    placeholder="15"
                    title="Comments Count"
                    style={{ ...inputStyle, height: '38px', padding: '0 8px 0 28px', fontSize: '0.80rem', fontWeight: 600, textAlign: 'left' }}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Repeat size={13} style={{ position: 'absolute', left: '10px', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', zIndex: 1 }} />
                  <input
                    type="text"
                    value={igRepostsCount}
                    onChange={(e) => setIgRepostsCount(e.target.value)}
                    placeholder="15"
                    title="Reposts Count"
                    style={{ ...inputStyle, height: '38px', padding: '0 8px 0 28px', fontSize: '0.80rem', fontWeight: 600, textAlign: 'left' }}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Send size={12} style={{ position: 'absolute', left: '10px', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', zIndex: 1 }} />
                  <input
                    type="text"
                    value={igSharesCount}
                    onChange={(e) => setIgSharesCount(e.target.value)}
                    placeholder="295"
                    title="Shares Count"
                    style={{ ...inputStyle, height: '38px', padding: '0 8px 0 28px', fontSize: '0.80rem', fontWeight: 600, textAlign: 'left' }}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>
              </div>
            </div>

            {/* Row 4: More Options disclosure */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '2px' }}>
              <button
                type="button"
                onClick={() => setShowIgMoreOptions(!showIgMoreOptions)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: showIgMoreOptions ? '#ff5e36' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                <span>{showIgMoreOptions ? 'Fewer options' : 'More options'}</span>
                <ChevronDown
                  size={12}
                  style={{
                    transform: showIgMoreOptions ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>
            </div>

            {/* Collapsible Advanced Section (Timestamp, Pinned Comment, Translation, Story Ring) */}
            {showIgMoreOptions && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Timestamp */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                      Timestamp
                    </label>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[
                        { short: '28 Sep', full: '28 September' },
                        { short: '5h', full: '5 hours ago' },
                        { short: '1d', full: '1 day ago' }
                      ].map((t) => (
                        <button
                          key={t.short}
                          type="button"
                          onClick={() => setIgTime(t.full)}
                          style={{
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: igTime === t.full ? 'rgba(255, 94, 54, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            border: igTime === t.full ? '1px solid #ff5e36' : '1px solid transparent',
                            color: igTime === t.full ? '#ff5e36' : 'rgba(255, 255, 255, 0.6)',
                            fontSize: '0.62rem',
                            cursor: 'pointer'
                          }}
                        >
                          {t.short}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={igTime}
                    onChange={(e) => setIgTime(e.target.value)}
                    placeholder="e.g. 28 September"
                    style={{ ...inputStyle, height: '38px', fontSize: '0.82rem' }}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                  />
                </div>

                {/* Optional Pinned Comment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>
                      Top Commenter (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={igTopCommentUser}
                      onChange={(e) => setIgTopCommentUser(e.target.value)}
                      placeholder="e.g. cristiano"
                      style={{ ...inputStyle, height: '38px', fontSize: '0.82rem' }}
                      onFocus={inputFocusHandler}
                      onBlur={inputBlurHandler}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>
                      Comment Text
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={igTopCommentText}
                      onChange={(e) => setIgTopCommentText(e.target.value)}
                      placeholder="e.g. AGI when? 😂👏"
                      style={{ ...inputStyle, height: '38px', fontSize: '0.82rem' }}
                      onFocus={inputFocusHandler}
                      onBlur={inputBlurHandler}
                    />
                  </div>
                </div>

                {/* Secondary Toggles (Story Ring & Translation) */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                    <input
                      type="checkbox"
                      checked={igHasStoryRing}
                      onChange={(e) => setIgHasStoryRing(e.target.checked)}
                      style={{ accentColor: '#ff5e36', width: 14, height: 14 }}
                    />
                    <span>Story Ring</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                    <input
                      type="checkbox"
                      checked={igShowTranslation}
                      onChange={(e) => setIgShowTranslation(e.target.checked)}
                      style={{ accentColor: '#ff5e36', width: 14, height: 14 }}
                    />
                    <span>Show "See translation" link</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. AUTHENTIC MINIMALIST WHATSAPP CONTROLS */}
        {activePlatform === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Minimalist Contact & Status Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px'
              }}
            >
              <div>
                <label style={{ fontSize: '0.66rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                  Name / Number
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={waName}
                  onChange={(e) => {
                    setWaName(e.target.value);
                    setActiveWaPersona('custom');
                  }}
                  placeholder="+91 81210 03003"
                  style={{
                    ...inputStyle,
                    height: '34px',
                    fontSize: '0.80rem',
                    background: '#0d1015',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '8px',
                    padding: '0 10px'
                  }}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.66rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                  Status
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={waStatus}
                  onChange={(e) => {
                    setWaStatus(e.target.value);
                    setActiveWaPersona('custom');
                  }}
                  placeholder="online"
                  style={{
                    ...inputStyle,
                    height: '34px',
                    fontSize: '0.80rem',
                    background: '#0d1015',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '8px',
                    padding: '0 10px'
                  }}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.66rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                  Date Badge
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={waDatePill}
                  onChange={(e) => setWaDatePill(e.target.value)}
                  placeholder="Yesterday"
                  style={{
                    ...inputStyle,
                    height: '34px',
                    fontSize: '0.80rem',
                    background: '#0d1015',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '8px',
                    padding: '0 10px'
                  }}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>
            </div>

            {/* Conversation Messages Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Messages
                </span>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    padding: '1px 6px',
                    borderRadius: '999px'
                  }}
                >
                  {waMessages.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddWaMessage}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  color: '#25d366',
                  background: 'rgba(37, 211, 102, 0.1)',
                  border: '1px solid rgba(37, 211, 102, 0.28)',
                  borderRadius: '9999px',
                  padding: '3px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={12} strokeWidth={2.5} />
                <span>Add Message</span>
              </button>
            </div>

            {/* Message Selector Buttons: Message 1, Message 2, etc. */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'center'
              }}
            >
              {waMessages.map((msg, index) => {
                const isSelected = activeWaMsgIndex === index;
                const isSent = msg.direction === 'sent';

                return (
                  <button
                    key={msg.id || index}
                    type="button"
                    onClick={() => setActiveWaMsgIndex(isSelected ? null : index)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected
                        ? 'rgba(37, 211, 102, 0.12)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected
                        ? '1px solid #25d366'
                        : '1px solid rgba(255, 255, 255, 0.09)',
                      color: isSelected ? '#25d366' : 'rgba(255, 255, 255, 0.72)',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(37, 211, 102, 0.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Click to ${isSelected ? 'close' : 'open'} Message ${index + 1}`}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isSent ? '#25d366' : '#8696a0',
                        flexShrink: 0
                      }}
                    />
                    <span>Message {index + 1}</span>
                    <ChevronDown
                      size={11}
                      style={{
                        transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.18s ease',
                        opacity: isSelected ? 1 : 0.5
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Active Message Container (opens when user clicks a message button) */}
            {activeWaMsgIndex !== null && waMessages[activeWaMsgIndex] && (() => {
              const msg = waMessages[activeWaMsgIndex];
              const isSent = msg.direction === 'sent';

              return (
                <div
                  style={{
                    background: '#11141b',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderLeft: `3px solid ${isSent ? '#25d366' : '#8696a0'}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  {/* Streamlined Top Control Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    {/* iOS-style Segmented Sender Control */}
                    <div
                      style={{
                        display: 'inline-flex',
                        background: 'rgba(0, 0, 0, 0.45)',
                        borderRadius: '8px',
                        padding: '2px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleUpdateWaMessage(msg.id, { direction: 'sent' })}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: isSent ? 700 : 500,
                          background: isSent ? 'rgba(37, 211, 102, 0.22)' : 'transparent',
                          color: isSent ? '#25d366' : 'rgba(255, 255, 255, 0.45)',
                          border: isSent ? '1px solid rgba(37, 211, 102, 0.35)' : '1px solid transparent',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title="Switch to Sent message (Green, on Right)"
                      >
                        <span>Sent</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateWaMessage(msg.id, { direction: 'received' })}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: !isSent ? 700 : 500,
                          background: !isSent ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                          color: !isSent ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                          border: !isSent ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        title="Switch to Received message (Slate, on Left)"
                      >
                        <span>Received</span>
                      </button>
                    </div>

                    {/* Timestamp & Ticks Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={msg.time || '11:42 PM'}
                        onChange={(e) => handleUpdateWaMessage(msg.id, { time: e.target.value })}
                        style={{
                          height: '27px',
                          width: '74px',
                          fontSize: '0.70rem',
                          textAlign: 'center',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          color: 'rgba(255, 255, 255, 0.9)',
                          padding: '0 4px',
                          fontWeight: 500
                        }}
                        onFocus={inputFocusHandler}
                        onBlur={inputBlurHandler}
                        title="Message timestamp"
                      />

                      {isSent && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextTicks = msg.ticks === 'blue' ? 'grey' : msg.ticks === 'grey' ? 'single' : 'blue';
                            handleUpdateWaMessage(msg.id, { ticks: nextTicks });
                          }}
                          style={{
                            height: '27px',
                            padding: '0 8px',
                            borderRadius: '6px',
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: msg.ticks === 'blue' ? '#53bdeb' : '#8696a0',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            transition: 'all 0.15s ease'
                          }}
                          title="Click to cycle read receipts (Blue / Grey / Single)"
                        >
                          <span>{msg.ticks === 'single' ? '✓ Single' : msg.ticks === 'grey' ? '✓✓ Grey' : '✓✓ Blue'}</span>
                        </button>
                      )}
                    </div>

                    {/* Step Prev/Next, Delete, and Close Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                      <button
                        type="button"
                        disabled={activeWaMsgIndex === 0}
                        onClick={() => setActiveWaMsgIndex(prev => Math.max(0, prev - 1))}
                        style={{
                          width: '27px',
                          height: '27px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          color: activeWaMsgIndex === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                          cursor: activeWaMsgIndex === 0 ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="Previous message"
                      >
                        <ChevronLeft size={13} />
                      </button>

                      <button
                        type="button"
                        disabled={activeWaMsgIndex === waMessages.length - 1}
                        onClick={() => setActiveWaMsgIndex(prev => Math.min(waMessages.length - 1, prev + 1))}
                        style={{
                          width: '27px',
                          height: '27px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          color: activeWaMsgIndex === waMessages.length - 1 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                          cursor: activeWaMsgIndex === waMessages.length - 1 ? 'not-allowed' : 'pointer',
                          padding: 0
                        }}
                        title="Next message"
                      >
                        <ChevronRight size={13} />
                      </button>

                      {waMessages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWaMessage(msg.id)}
                          style={{
                            width: '27px',
                            height: '27px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.22)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveWaMsgIndex(null)}
                        style={{
                          width: '27px',
                          height: '27px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.35)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          padding: 0
                        }}
                        title="Close editor"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Message Textarea */}
                  <div>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={msg.text}
                      onChange={(e) => handleUpdateWaMessage(msg.id, { text: e.target.value })}
                      placeholder="Type message text..."
                      style={{
                        ...textareaStyle,
                        minHeight: '46px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '0.82rem',
                        lineHeight: 1.4,
                        color: '#ffffff'
                      }}
                      onFocus={inputFocusHandler}
                      onBlur={inputBlurHandler}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Minimalist Appearance Options Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                paddingTop: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setWaShowHeader(!waShowHeader)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '7px',
                    fontSize: '0.70rem',
                    fontWeight: waShowHeader ? 600 : 500,
                    background: waShowHeader ? 'rgba(37, 211, 102, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: waShowHeader ? '1px solid rgba(37, 211, 102, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: waShowHeader ? '#25d366' : 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.72rem' }}>{waShowHeader ? '✓' : '○'}</span>
                  <span>Header</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWaShowFooter(!waShowFooter)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '7px',
                    fontSize: '0.70rem',
                    fontWeight: waShowFooter ? 600 : 500,
                    background: waShowFooter ? 'rgba(37, 211, 102, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: waShowFooter ? '1px solid rgba(37, 211, 102, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: waShowFooter ? '#25d366' : 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.72rem' }}>{waShowFooter ? '✓' : '○'}</span>
                  <span>Input Bar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWaShowDoodles(!waShowDoodles)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '7px',
                    fontSize: '0.70rem',
                    fontWeight: waShowDoodles ? 600 : 500,
                    background: waShowDoodles ? 'rgba(37, 211, 102, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: waShowDoodles ? '1px solid rgba(37, 211, 102, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: waShowDoodles ? '#25d366' : 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.72rem' }}>{waShowDoodles ? '✓' : '○'}</span>
                  <span>Doodles</span>
                </button>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  background: 'rgba(0, 0, 0, 0.45)',
                  borderRadius: '7px',
                  padding: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setWaTheme('dark')}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '5px',
                    fontSize: '0.68rem',
                    fontWeight: waTheme === 'dark' ? 700 : 500,
                    background: waTheme === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                    color: waTheme === 'dark' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    border: waTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setWaTheme('light')}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '5px',
                    fontSize: '0.68rem',
                    fontWeight: waTheme === 'light' ? 700 : 500,
                    background: waTheme === 'light' ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                    color: waTheme === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    border: waTheme === 'light' ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Light
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
