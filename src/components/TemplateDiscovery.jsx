import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { fetchOpenSourceMemes } from '../services/memeService';
import {
  Plus, Upload,
  Search, Sparkles, Image as ImageIcon, Video,
  Flame, Star, Drama, Clapperboard, LayoutGrid, Layers, Check,
  Smile, ArrowDownAZ, Zap, ChevronRight, ChevronLeft, ArrowRight, Eye, Wand2, Share2,
  Briefcase, Heart, ArrowUp, X, SlidersHorizontal, Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeGet, safeSet } from '../utils/storage';
import './TemplateDiscovery.css';

const TAGS = [
  { id: 'featured', label: 'Featured', icon: Flame },
  { id: 'all', label: 'All Memes', icon: Layers },
  { id: 'social', label: 'Social Cards', icon: Share2 },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: Clapperboard },
  { id: 'reaction', label: 'Reactions', icon: Smile },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'classics', label: 'Classics', icon: Drama },
  { id: 'multi-panel', label: 'Multi-Panel', icon: LayoutGrid },
];

const QUICK_PROMPTS = [
  '☕ Monday morning meeting',
  '💻 Code works on first try',
  '🐱 Cat judging my choices',
  '🍕 2 AM weekend hunger',
  '🚀 Pushing directly to prod'
];

export const AI_VIBE_MODES = [
  { id: 'roast', emoji: '🔥', label: 'Roast Mode', prompt: 'Roast my daily morning routine and procrastination' },
  { id: 'sarcastic', emoji: '😂', label: 'Sarcastic', prompt: 'When the code works on the first try and you suspect a trap' },
  { id: 'wholesome', emoji: '🐱', label: 'Wholesome', prompt: 'My cat looking at me with unconditional love and judgment' },
  { id: 'tech', emoji: '🧠', label: 'Tech Humor', prompt: 'Pushing directly to production on a Friday afternoon' },
];

const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: Flame, color: '#ff5e36' },
  { id: 'popular', label: 'Most Popular', icon: Star, color: '#eab308' },
  { id: 'newest', label: 'Newest', icon: Sparkles, color: '#06b6d4' },
  { id: 'name', label: 'A-Z Name', icon: ArrowDownAZ, color: '#a855f7' }
];

/* --- Bespoke 3D Volumetric SVG Graphics for Hero Carousel (From Primary Version) --- */

function GraphicRocket3D() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-3d-svg rocket-3d-svg">
      <defs>
        <linearGradient id="rocketBody3D" x1="0%" y1="30%" x2="100%" y2="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="20%" stopColor="#f8fafc" />
          <stop offset="55%" stopColor="#e2e8f0" />
          <stop offset="80%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="rocketNose3D" x1="15%" y1="15%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="35%" stopColor="#f43f5e" />
          <stop offset="75%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>
        <linearGradient id="rocketFinLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="40%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
        <linearGradient id="rocketFinRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="60%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#700733" />
        </linearGradient>
        <linearGradient id="portholeChrome" x1="20%" y1="20%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#e2e8f0" />
          <stop offset="75%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <radialGradient id="portholeCyan" cx="35%" cy="35%" r="68%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="30%" stopColor="#38bdf8" />
          <stop offset="75%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
        <radialGradient id="flameCore" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#ff5e36" />
          <stop offset="85%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="flameInnerHot" cx="50%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <filter id="thrusterGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g transform="translate(6, 2) rotate(38, 60, 60)">
        <g filter="url(#thrusterGlow)">
          <path d="M53 82 C44 94 48 108 60 118 C72 108 76 94 67 82 Z" fill="url(#flameCore)" />
          <path d="M55 83 C49 92 53 101 60 109 C67 101 71 92 65 83 Z" fill="url(#flameInnerHot)" />
          <path d="M57 83 C54 89 57 95 60 99 C63 95 66 89 63 83 Z" fill="#ffffff" opacity="0.95" />
        </g>
        <circle cx="56" cy="116" r="2.2" fill="#fde047" opacity="0.95" />
        <circle cx="64" cy="118" r="1.8" fill="#ff5e36" opacity="0.85" />
        <circle cx="60" cy="122" r="1.5" fill="#ec4899" opacity="0.8" />
        <path d="M47 62 C34 68 25 75 25 81 C25 84 28 85 34 84 L48 78 Z" fill="url(#rocketFinLeft)" />
        <path d="M47 62 C37 67 30 73 30 78 C30 80 33 81 37 80 L48 76 Z" fill="#fda4af" opacity="0.5" />
        <path d="M73 62 C86 68 95 75 95 81 C95 84 92 85 86 84 L72 78 Z" fill="url(#rocketFinRight)" />
        <path d="M73 62 C83 67 90 73 90 78 C90 80 87 81 83 80 L72 76 Z" fill="#4c0519" opacity="0.6" />
        <path d="M49 77 L71 77 L67 83 L53 83 Z" fill="#1e293b" />
        <ellipse cx="60" cy="83" rx="7" ry="2.2" fill="#f97316" />
        <path d="M48 35 C42 49 42 65 48 78 L72 78 C78 65 78 49 72 35 Z" fill="url(#rocketBody3D)" />
        <path d="M50 36 C45 49 45 65 49 75 C52 75 51 50 55 38 Z" fill="#ffffff" opacity="0.8" />
        <path d="M59 58 L57 78 L63 78 L61 58 Z" fill="#be123c" />
        <path d="M59 58 L58 78 L60 78 L60 58 Z" fill="#fda4af" opacity="0.6" />
        <path d="M48 35 C48 23 54 15 60 15 C66 15 72 23 72 35 Z" fill="url(#rocketNose3D)" />
        <ellipse cx="56" cy="24" rx="3.5" ry="6.5" transform="rotate(-15 56 24)" fill="#ffffff" opacity="0.85" />
        <circle cx="60" cy="50" r="11" fill="url(#portholeChrome)" />
        <circle cx="60" cy="50" r="8.8" fill="#0f172a" />
        <circle cx="60" cy="50" r="7.5" fill="url(#portholeCyan)" />
        <ellipse cx="58" cy="47.5" rx="3.8" ry="1.8" transform="rotate(-30 58 47.5)" fill="#ffffff" opacity="0.95" />
        <circle cx="62.5" cy="52.5" r="1.1" fill="#ffffff" opacity="0.75" />
      </g>
      <path d="M104 7 C104 12 100 16 95 16 C100 16 104 20 104 25 C104 20 108 16 113 16 C108 16 104 12 104 7 Z" fill="#facc15" />
      <circle cx="104" cy="16" r="1.5" fill="#ffffff" />
      <path d="M112 40 C112 43 109 45 106 45 C109 45 112 47 112 50 C112 47 115 45 118 45 C115 45 112 43 112 40 Z" fill="#ffffff" opacity="0.95" />
      <path d="M82 3 C82 6 79 8 76 8 C79 8 82 10 82 13 C82 10 85 8 88 8 C85 8 82 6 82 3 Z" fill="#f472b6" opacity="0.9" />
      <circle cx="101" cy="58" r="1.8" fill="#f472b6" opacity="0.85" />
      <circle cx="114" cy="28" r="1.2" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

function GraphicAiRobot3D() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-3d-svg ai-robot-3d-svg">
      <defs>
        <linearGradient id="aiOrbGrad" x1="15%" y1="15%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#e0e7ff" />
          <stop offset="60%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <radialGradient id="aiVisorGrad" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
        <linearGradient id="aiRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="aiGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g transform="translate(6, 4)">
        <ellipse cx="58" cy="102" rx="24" ry="6" fill="#0f172a" opacity="0.35" filter="blur(4px)" className="ai-motion-shadow" />
        <g className="ai-motion-ring-back">
          <ellipse cx="58" cy="62" rx="42" ry="16" fill="none" stroke="url(#aiRingGrad)" strokeWidth="3" opacity="0.55" strokeDasharray="6 3" transform="rotate(-22 58 62)" />
        </g>
        <g className="ai-motion-character">
          <circle cx="58" cy="58" r="30" fill="url(#aiOrbGrad)" />
          <ellipse cx="50" cy="40" rx="14" ry="6" fill="#ffffff" opacity="0.75" transform="rotate(-30 50 40)" />
          <rect x="36" y="47" width="44" height="22" rx="11" fill="url(#aiVisorGrad)" stroke="#1e1b4b" strokeWidth="1.5" />
          <g className="ai-motion-eyes">
            <ellipse cx="48" cy="57" rx="3.5" ry="4.5" fill="#38bdf8" filter="url(#aiGlow)" />
            <ellipse cx="48" cy="57" rx="2" ry="3" fill="#ffffff" />
            <ellipse cx="68" cy="57" rx="3.5" ry="4.5" fill="#38bdf8" filter="url(#aiGlow)" />
            <ellipse cx="68" cy="57" rx="2" ry="3" fill="#ffffff" />
          </g>
          <path d="M58 28 L58 16" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <g className="ai-motion-beacon">
            <circle cx="58" cy="13" r="5" fill="#38bdf8" filter="url(#aiGlow)" />
            <circle cx="58" cy="13" r="2.5" fill="#ffffff" />
          </g>
        </g>
        <g className="ai-motion-ring-front">
          <path d="M20 70 A 42 16 0 0 0 96 54" fill="none" stroke="url(#aiRingGrad)" strokeWidth="3.5" transform="rotate(-22 58 62)" />
        </g>
      </g>
      <g className="ai-motion-sparkles">
        <path d="M102 12 C102 18 97 22 91 22 C97 22 102 26 102 32 C102 26 107 22 113 22 C107 22 102 18 102 12 Z" fill="#38bdf8" />
        <circle cx="102" cy="22" r="1.8" fill="#ffffff" />
        <path d="M110 52 C110 55 107 57 104 57 C107 57 110 59 110 62 C110 59 113 57 116 57 C113 57 110 55 110 52 Z" fill="#c084fc" opacity="0.9" />
        <path d="M78 8 C78 11 75 13 72 13 C75 13 78 15 78 18 C78 15 81 13 84 13 C81 13 78 11 78 8 Z" fill="#facc15" />
        <circle cx="114" cy="38" r="1.5" fill="#ffffff" opacity="0.9" />
      </g>
    </svg>
  );
}

function GraphicFaceSwap3D() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-3d-svg face-swap-3d-svg">
      <defs>
        <linearGradient id="maskGold3D" x1="15%" y1="10%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="85%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="maskBacking" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="maskGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g transform="translate(6, 4)">
        <ellipse cx="64" cy="62" rx="27" ry="33" fill="url(#maskBacking)" opacity="0.45" transform="rotate(18 64 62)" filter="url(#maskGlow)" className="face-motion-backing" />
        <g className="face-motion-mask" transform="rotate(-10 56 60)">
          <path d="M30 42 C30 24 42 16 58 16 C74 16 86 24 86 42 C86 64 74 86 58 92 C42 86 30 64 30 42 Z" fill="url(#maskGold3D)" />
          <ellipse cx="58" cy="26" rx="16" ry="6" fill="#ffffff" opacity="0.65" />
          <circle cx="41" cy="58" r="6" fill="#f43f5e" opacity="0.5" />
          <circle cx="75" cy="58" r="6" fill="#f43f5e" opacity="0.5" />
          <path d="M40 44 C44 38 52 38 54 44 C50 42 44 42 40 44 Z" fill="#1e1b4b" />
          <path d="M62 44 C64 38 72 38 76 44 C72 42 66 42 62 44 Z" fill="#1e1b4b" />
          <circle cx="47" cy="42" r="1.5" fill="#ffffff" />
          <circle cx="69" cy="42" r="1.5" fill="#ffffff" />
          <path d="M45 66 C49 76 67 76 71 66 Z" fill="#450a0a" />
          <path d="M48 66 C51 70 65 70 68 66 Z" fill="#ffffff" />
          <path d="M58 32 L58 56" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
        </g>
        <g className="face-motion-arrows">
          <path d="M88 42 C96 50 96 66 86 76" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
          <polygon points="84,72 87,79 92,75" fill="#ec4899" />
          <path d="M28 72 C20 64 20 48 30 38" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
          <polygon points="32,42 29,35 24,39" fill="#facc15" />
        </g>
      </g>
      <g className="face-motion-sparkles">
        <path d="M104 12 C104 17 100 21 95 21 C100 21 104 25 104 30 C104 25 108 21 113 21 C108 21 104 17 104 12 Z" fill="#facc15" />
        <circle cx="104" cy="21" r="1.5" fill="#ffffff" />
        <path d="M80 6 C80 9 77 11 74 11 C77 11 80 13 80 16 C80 13 83 11 86 11 C83 11 80 9 80 6 Z" fill="#ec4899" opacity="0.9" />
        <circle cx="112" cy="46" r="1.6" fill="#f43f5e" />
        <circle cx="16" cy="30" r="1.8" fill="#facc15" opacity="0.8" />
      </g>
    </svg>
  );
}

function GraphicCutout3D() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-3d-svg cutout-3d-svg">
      <defs>
        <linearGradient id="scissorChrome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#cbd5e1" />
          <stop offset="75%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="scissorMint" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <pattern id="cutoutChecker" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#334155" opacity="0.3" />
          <rect x="4" y="4" width="4" height="4" fill="#334155" opacity="0.3" />
        </pattern>
        <filter id="laserGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g transform="translate(4, 4)">
        <g className="cutout-motion-card" transform="rotate(-8 52 62)">
          <rect x="22" y="28" width="56" height="56" rx="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="23" y="29" width="54" height="54" rx="13" fill="url(#cutoutChecker)" />
          <path d="M64 28 L78 42 L64 42 Z" fill="#38bdf8" opacity="0.85" />
          <path d="M64 28 L78 42 L64 42 Z" stroke="#ffffff" strokeWidth="1" />
        </g>
        <path d="M26 36 Q 52 14 78 36" fill="none" stroke="#34d399" strokeWidth="2.5" filter="url(#laserGlow)" strokeDasharray="3 3" className="cutout-motion-laser" />
        <g className="cutout-motion-scissors" transform="translate(56, 32) rotate(42)">
          <g className="scissor-blade-top-group">
            <path d="M0 0 L34 -5 C36 -5 36 -2 34 0 L0 3 Z" fill="url(#scissorChrome)" />
            <path d="M0 0 L32 -3" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
            <path d="M-2 -2 C-8 -8 -18 -8 -20 -2 C-22 4 -14 10 -6 4 Z" fill="url(#scissorMint)" />
            <circle cx="-11" cy="-1" r="3.5" fill="#0f172a" />
          </g>
          <g className="scissor-blade-bottom-group">
            <path d="M0 0 L34 5 C36 5 36 2 34 0 L0 -3 Z" fill="url(#scissorChrome)" />
            <path d="M-2 2 C-8 8 -18 8 -20 2 C-22 -4 -14 -10 -6 -4 Z" fill="url(#scissorMint)" />
            <circle cx="-11" cy="1" r="3.5" fill="#0f172a" />
          </g>
          <circle cx="2" cy="0" r="3.5" fill="#facc15" />
          <circle cx="2" cy="0" r="1.5" fill="#1e293b" />
        </g>
      </g>
      <g className="cutout-motion-sparkles">
        <path d="M104 10 C104 15 100 19 95 19 C100 19 104 23 104 28 C104 23 108 19 113 19 C108 19 104 15 104 10 Z" fill="#34d399" />
        <circle cx="104" cy="19" r="1.5" fill="#ffffff" />
        <path d="M80 6 C80 9 77 11 74 11 C77 11 80 13 80 16 C80 13 83 11 86 11 C83 11 80 9 80 6 Z" fill="#38bdf8" opacity="0.9" />
        <circle cx="112" cy="44" r="1.5" fill="#ffffff" />
        <circle cx="14" cy="50" r="1.8" fill="#34d399" opacity="0.8" />
      </g>
    </svg>
  );
}

function GraphicVideoTimeline3D() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-3d-svg video-3d-svg">
      <defs>
        <linearGradient id="clapperBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="clapperCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id="videoGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g transform="translate(6, 4)">
        <ellipse cx="58" cy="100" rx="26" ry="6" fill="#0f172a" opacity="0.4" filter="blur(4px)" className="video-motion-shadow" />
        <g className="video-motion-clapper" transform="rotate(-8 56 58)">
          <rect x="20" y="38" width="72" height="52" rx="10" fill="url(#clapperBodyGrad)" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="26" y="58" width="60" height="20" rx="6" fill="#0369a1" opacity="0.35" />
          <line x1="36" y1="58" x2="36" y2="78" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="48" y1="58" x2="48" y2="78" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="60" y1="58" x2="60" y2="78" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="72" y1="58" x2="72" y2="78" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
          <polygon points="52,62 64,68 52,74" fill="#38bdf8" filter="url(#videoGlow)" />
          <polygon points="53,63 62,68 53,73" fill="#ffffff" />
          <g className="video-motion-stick" transform="translate(20, 22)">
            <rect x="0" y="0" width="72" height="14" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <polygon points="10,0 20,0 12,14 2,14" fill="#38bdf8" />
            <polygon points="30,0 40,0 32,14 22,14" fill="#38bdf8" />
            <polygon points="50,0 60,0 52,14 42,14" fill="#38bdf8" />
          </g>
        </g>
      </g>
      <g className="video-motion-sparkles">
        <path d="M102 12 C102 17 98 21 93 21 C98 21 102 25 102 30 C102 25 106 21 111 21 C106 21 102 17 102 12 Z" fill="#38bdf8" />
        <circle cx="102" cy="21" r="1.5" fill="#ffffff" />
        <path d="M78 6 C78 9 75 11 72 11 C75 11 78 13 78 16 C78 13 81 11 84 11 C81 11 78 9 78 6 Z" fill="#818cf8" opacity="0.9" />
        <circle cx="112" cy="46" r="1.6" fill="#38bdf8" />
      </g>
    </svg>
  );
}

function GraphicSocialChat3D() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-3d-svg social-3d-svg">
      <defs>
        <linearGradient id="socialCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="50%" stopColor="#311042" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="waGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#25d366" />
          <stop offset="100%" stopColor="#128c7e" />
        </linearGradient>
        <filter id="socialGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g transform="translate(6, 4)">
        <ellipse cx="58" cy="100" rx="26" ry="6" fill="#0f172a" opacity="0.4" filter="blur(4px)" className="social-motion-shadow" />
        <g className="social-motion-phone" transform="rotate(-6 56 58)">
          <rect x="22" y="24" width="68" height="72" rx="14" fill="url(#socialCardGrad)" stroke="#ec4899" strokeWidth="1.5" />
          <circle cx="34" cy="38" r="6" fill="#f43f5e" />
          <rect x="44" y="35" width="28" height="4" rx="2" fill="#ffffff" opacity="0.8" />
          <rect x="44" y="41" width="18" height="3" rx="1.5" fill="#f472b6" opacity="0.6" />
          <rect x="28" y="50" width="56" height="18" rx="8" fill="url(#waGreenGrad)" filter="url(#socialGlow)" opacity="0.9" />
          <rect x="34" y="56" width="36" height="4" rx="2" fill="#ffffff" />
          <rect x="34" y="62" width="22" height="3" rx="1.5" fill="#dcfce7" opacity="0.9" />
          <g transform="translate(60, 68)" className="social-motion-heart">
            <circle cx="12" cy="12" r="10" fill="#f43f5e" />
            <path d="M12 8 C10 6 7 7 7 10 C7 13 12 16 12 16 C12 16 17 13 17 10 C17 7 14 6 12 8 Z" fill="#ffffff" />
          </g>
        </g>
      </g>
      <g className="social-motion-sparkles">
        <path d="M102 12 C102 17 98 21 93 21 C98 21 102 25 102 30 C102 25 106 21 111 21 C106 21 102 17 102 12 Z" fill="#ec4899" />
        <circle cx="102" cy="21" r="1.5" fill="#ffffff" />
        <path d="M78 6 C78 9 75 11 72 11 C75 11 78 13 78 16 C78 13 81 11 84 11 C81 11 78 9 78 6 Z" fill="#facc15" opacity="0.9" />
        <circle cx="112" cy="46" r="1.6" fill="#f43f5e" />
      </g>
    </svg>
  );
}

/* --- Carousel Slides Configuration (Studio Features in Primary Hero Banner UI) --- */
export const STUDIO_HERO_SLIDES = [
  {
    id: 'customlayout',
    action: 'custom',
    title: 'Create Now',
    badgeText: '🚀 100% FREE APP',
    badgeClass: 'badge-emerald',
    badgeDotClass: 'dot-emerald',
    titleMain: 'UNLEASH YOUR',
    titleGradient: 'VIRAL MEME IDEAS',
    titleGradClass: 'grad-sunset',
    tagline: 'Unleash your viral meme ideas with custom layouts.',
    glowTheme: 'glow-theme-studio',
    glowColor: 'rgba(255, 94, 54, 0.45)',
    icon: Plus,
    renderGraphic: () => <GraphicRocket3D />,
    primaryVariant: 'pill-sunset',
    secondaryLabel: 'AI Generator',
    secondaryIcon: Sparkles,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'ai'
  },
  {
    id: 'videotrim',
    action: 'video',
    title: 'Create Viral Video',
    badgeText: '🎬 TIMELINE & AUDIO SYNC',
    badgeClass: 'badge-cyan',
    badgeDotClass: 'dot-cyan',
    titleMain: 'CREATE VIRAL',
    titleGradient: 'MEME VIDEOS',
    titleGradClass: 'grad-electric',
    tagline: 'Trim video clips, sync audio & curved captions',
    glowTheme: 'glow-theme-ai',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    icon: Video,
    renderGraphic: () => <GraphicVideoTimeline3D />,
    primaryVariant: 'pill-cyan',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  },
  {
    id: 'stickers',
    action: 'stickers',
    title: 'Generate Stickers',
    badgeText: '🔥 100% FREE AI CUTOUT',
    badgeClass: 'badge-mint',
    badgeDotClass: 'dot-mint',
    titleMain: 'REMOVE BACKGROUND',
    titleGradient: 'MAKE STICKERS',
    titleGradClass: 'grad-mint-cyan',
    tagline: 'Extract clean cutout stickers in 1 tap for any photo.',
    glowTheme: 'glow-theme-cutout',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    icon: Scissors,
    renderGraphic: () => <GraphicCutout3D />,
    primaryVariant: 'pill-mint',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  },
  {
    id: 'faceswap',
    action: 'faceswap',
    title: 'Face Swap',
    badgeText: '🎭 100% FREE FACE SWAP',
    badgeClass: 'badge-amber',
    badgeDotClass: 'dot-amber',
    titleMain: 'SWAP YOUR FACE',
    titleGradient: 'INTO ANY MEME',
    titleGradClass: 'grad-amber-fuchsia',
    tagline: 'Swap your face into viral memes instantly without hassle.',
    glowTheme: 'glow-theme-face',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    icon: Smile,
    renderGraphic: () => <GraphicFaceSwap3D />,
    primaryVariant: 'pill-amber',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  },
  {
    id: 'socialcards',
    action: 'social',
    title: 'Social Cards',
    badgeText: '💬 INTERACTIVE SOCIAL CARDS',
    badgeClass: 'badge-fuchsia',
    badgeDotClass: 'dot-fuchsia',
    titleMain: 'CREATE REALISTIC',
    titleGradient: 'SOCIAL CARDS',
    titleGradClass: 'grad-fuchsia-violet',
    tagline: 'Craft Twitter, WhatsApp & Instagram cards',
    glowTheme: 'glow-theme-face',
    glowColor: 'rgba(217, 70, 239, 0.45)',
    icon: Share2,
    renderGraphic: () => <GraphicSocialChat3D />,
    primaryVariant: 'pill-fuchsia',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  },
  {
    id: 'aipunchlines',
    action: 'ai',
    title: 'AI Punchlines',
    badgeText: '⚡ 100% FREE AI MEMES',
    badgeClass: 'badge-cyan',
    badgeDotClass: 'dot-cyan',
    titleMain: 'PROMPT-TO-MEME',
    titleGradient: 'AI PUNCHLINES',
    titleGradClass: 'grad-electric',
    tagline: 'Turn prompts into viral captions & punchlines',
    glowTheme: 'glow-theme-ai',
    glowColor: 'rgba(129, 140, 248, 0.45)',
    icon: Wand2,
    renderGraphic: () => <GraphicAiRobot3D />,
    primaryVariant: 'studio-pill-ai',
    secondaryLabel: 'Upload',
    secondaryIcon: Upload,
    secondaryVariant: 'studio-pill-dark',
    secondaryAction: 'upload'
  }
];

export const STUDIO_FEATURES = STUDIO_HERO_SLIDES;

// Stable numeric order for mixed string ids ("imgflip-123", "giphy-abc", "custom-...").
// Trailing digits win; otherwise fall back to trendingScore so sort is deterministic (never NaN).
export function templateNumericId(t) {
  if (!t) return 0;
  const m = String(t.id || '').match(/(\d+)$/);
  if (m) return Number(m[1]);
  return t.trendingScore || 0;
}

// Compute dynamic, contextual badges so templates show a variety of labels
export function getTemplateBadge(template, index = 0) {
  if (!template) return { label: 'Popular', icon: Flame, color: '#ff5e36' };
  if (template.type === 'video') {
    return { label: '', iconOnly: true, icon: Video, color: '#38bdf8' };
  }
  if (template.tag === 'pro') {
    return { label: 'Pro', icon: Zap, color: '#facc15' };
  }
  if (template.category === 'social' || (template.tags && template.tags.includes('social'))) {
    return { label: 'Social', icon: Share2, color: '#38bdf8' };
  }
  if (template.category === 'reaction') {
    return { label: 'Reaction', icon: Smile, color: '#a855f7' };
  }
  if (template.category === 'classic' || (template.trendingScore && template.trendingScore >= 135 && template.trendingScore < 140)) {
    return { label: 'Classic', icon: Drama, color: '#f59e0b' };
  }
  if (template.tag === 'trending' || (template.trendingScore && template.trendingScore >= 140)) {
    return { label: 'Trending', icon: Flame, color: '#ff3b60' };
  }
  if (index % 6 === 4 || (template.trendingScore && template.trendingScore < 30)) {
    return { label: 'New', icon: Sparkles, color: '#10b981' };
  }
  return { label: 'Popular', icon: Flame, color: '#ff5e36' };
}

export default function TemplateDiscovery({ onSelectTemplate, onCreateCustom, onOpenAiGenerator }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('featured');
  const [sortBy, setSortBy] = useState('trending');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');
  const [selectedVibe, setSelectedVibe] = useState(null);
  const searchInputRef = useRef(null);
  const sortRef = useRef(null);

  // Favorites persistence
  const [favorites, setFavorites] = useState(() => {
    const saved = safeGet('meme_favorite_templates', []);
    return Array.isArray(saved) ? saved : [];
  });

  // Responsive mobile check and columns count
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 640;
    }
    return false;
  });

  const [columnsCount, setColumnsCount] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1200) return 4;
      if (window.innerWidth >= 680) return 3;
      return 2;
    }
    return 2;
  });

  useEffect(() => {
    const updateDimensions = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 640);
      if (w >= 1200) setColumnsCount(4);
      else if (w >= 680) setColumnsCount(3);
      else setColumnsCount(2);
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const toggleFavorite = (e, templateId) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      safeSet('meme_favorite_templates', next);
      return next;
    });
  };

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen]);

  // Template List with dynamic fetch
  const [templatesList, setTemplatesList] = useState(() => [...MEME_TEMPLATES, ...VIDEO_MEME_TEMPLATES]);

  useEffect(() => {
    let isCancelled = false;
    fetchOpenSourceMemes().then((online) => {
      if (!isCancelled && Array.isArray(online) && online.length > 0) {
        setTemplatesList([...online, ...VIDEO_MEME_TEMPLATES]);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  // Filtered Templates for Search & Masonry Grid View
  const filteredTemplates = useMemo(() => {
    return templatesList.filter((template) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        (template.tags && template.tags.some((tag) => tag.toLowerCase().includes(q))) ||
        (template.category && template.category.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (selectedTag === 'featured' || selectedTag === 'all') return true;
      if (selectedTag === 'favorites') return favorites.includes(template.id);
      if (selectedTag === 'social') {
        return template.category === 'social' || (template.tags && template.tags.includes('social'));
      }
      if (selectedTag === 'images') return template.type !== 'video';
      if (selectedTag === 'videos') return template.type === 'video';
      if (selectedTag === 'reaction') {
        return template.category === 'reaction' || (template.tags && template.tags.includes('reaction'));
      }
      if (selectedTag === 'classics') {
        return template.category === 'classic' || (template.tags && template.tags.includes('classic'));
      }
      if (selectedTag === 'multi-panel') {
        return template.category === 'multi-panel' || (template.tags && template.tags.includes('multi-panel'));
      }

      return template.category === selectedTag;
    }).sort((a, b) => {
      if (sortBy === 'popular') return (b.trendingScore || 0) - (a.trendingScore || 0);
      if (sortBy === 'newest') return templateNumericId(b) - templateNumericId(a);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    });
  }, [templatesList, searchQuery, selectedTag, sortBy, favorites]);

  // Curated Shelves Data
  const trendingShelfTemplates = useMemo(() => {
    return templatesList
      .filter(t => t.category !== 'social' && !(t.tags && t.tags.includes('social')))
      .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
      .slice(0, 14);
  }, [templatesList]);

  const socialShelfTemplates = useMemo(() => {
    return templatesList.filter(t => t.category === 'social' || (t.tags && t.tags.includes('social'))).slice(0, 6);
  }, [templatesList]);

  const workShelfTemplates = useMemo(() => {
    const workKeywords = [
      'meeting', 'fine', 'skeleton', 'clown', 'bernie', 'same picture', 'paid', 
      'lenny', 'harold', 'brain', 'homies', 'scientist', 'kermit'
    ];
    return templatesList.filter(t => 
      t.category !== 'social' && (
        workKeywords.some(k => t.name.toLowerCase().includes(k)) ||
        (t.tags && t.tags.some(tag => workKeywords.some(k => tag.toLowerCase().includes(k))))
      )
    ).slice(0, 10);
  }, [templatesList]);

  const relationshipShelfTemplates = useMemo(() => {
    const relKeywords = ['boyfriend', 'cat', 'thinking about other', 'padme', 'friendship ended', 'drake', 'buttons', 'couple'];
    return templatesList.filter(t => 
      t.category !== 'social' && (
        relKeywords.some(k => t.name.toLowerCase().includes(k)) ||
        (t.tags && t.tags.some(tag => relKeywords.some(k => tag.toLowerCase().includes(k))))
      )
    ).slice(0, 10);
  }, [templatesList]);

  const reactionsShelfTemplates = useMemo(() => {
    const reactKeywords = ['hotline', 'disaster', 'change my mind', 'spiderman pointing', 'pikachu', 'roll safe', 'simply', 'batman'];
    return templatesList.filter(t => 
      t.category !== 'social' && (
        t.category === 'reaction' ||
        reactKeywords.some(k => t.name.toLowerCase().includes(k)) ||
        (t.tags && t.tags.some(tag => reactKeywords.some(k => tag.toLowerCase().includes(k))))
      )
    ).slice(0, 10);
  }, [templatesList]);

  // Determine active view mode: Shelves vs Grid
  const isGridView = searchQuery.trim().length > 0 || selectedTag !== 'featured';

  // Pagination for grid
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedTag, sortBy]);

  const displayedTemplates = useMemo(() => {
    return filteredTemplates.slice(0, visibleCount);
  }, [filteredTemplates, visibleCount]);

  useEffect(() => {
    if (visibleCount >= filteredTemplates.length) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0] && entries[0].isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredTemplates.length));
          }
        },
        { rootMargin: '400px 0px' }
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    }
  }, [visibleCount, filteredTemplates.length]);

  const masonryColumns = useMemo(() => {
    const cols = Array.from({ length: columnsCount }, () => []);
    displayedTemplates.forEach((template, index) => {
      cols[index % columnsCount].push({ template, originalIndex: index });
    });
    return cols;
  }, [displayedTemplates, columnsCount]);

  const currentSortOption = SORT_OPTIONS.find(opt => opt.id === sortBy) || SORT_OPTIONS[0];

  const handleSelectVibe = (vibe) => {
    setSelectedVibe(vibe.id);
    setAiPromptText(vibe.prompt);
    if (onOpenAiGenerator) {
      onOpenAiGenerator(vibe.prompt);
    }
  };

  const handleOpenAiPrompt = (e) => {
    e?.preventDefault?.();
    if (onOpenAiGenerator) {
      onOpenAiGenerator(aiPromptText.trim() || 'Make a hilarious meme about my Monday routine');
    }
  };

  const handleShelfSeeAll = (tagId, sortOption = 'trending') => {
    setSelectedTag(tagId);
    setSortBy(sortOption);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cutoutFileInputRef = useRef(null);

  const handleCutoutImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl && onSelectTemplate) {
        onSelectTemplate({
          id: `upload-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, '') || (isVideo ? 'Uploaded Video' : 'Uploaded Meme'),
          imageUrl: dataUrl,
          rawImageUrl: dataUrl,
          videoUrl: isVideo ? dataUrl : undefined,
          type: isVideo ? 'video' : 'image',
          category: 'custom',
          width: 800,
          height: 800
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFeatureClick = (feature) => {
    const actionKey = typeof feature === 'string' ? feature : (feature?.action || feature?.id);
    if (actionKey === 'stickers') {
      const targetTemplate = templatesList.find(t => t.id === 'drake' || t.name.toLowerCase().includes('drake')) || templatesList[0];
      if (onSelectTemplate && targetTemplate) {
        onSelectTemplate({
          ...targetTemplate,
          initialTab: 'stickers',
          initialStickersModal: true
        });
      }
    } else if (actionKey === 'faceswap') {
      const targetTemplate = templatesList.find(t => t.id === 'drake' || t.name.toLowerCase().includes('drake')) || templatesList[0];
      if (onSelectTemplate && targetTemplate) {
        onSelectTemplate({
          ...targetTemplate,
          initialFaceSwap: true
        });
      }
    } else if (actionKey === 'video') {
      if (onCreateCustom) onCreateCustom('video');
    } else if (actionKey === 'custom') {
      if (onCreateCustom) onCreateCustom('image');
    } else if (actionKey === 'social') {
      const waTemplate = templatesList.find(t => t.id?.includes('whatsapp') || t.id?.includes('tweet')) || socialShelfTemplates[0];
      if (onSelectTemplate && waTemplate) {
        onSelectTemplate(waTemplate);
      } else {
        setSelectedTag('social');
      }
    } else if (actionKey === 'ai') {
      if (onOpenAiGenerator) {
        onOpenAiGenerator();
      }
    } else if (actionKey === 'upload') {
      cutoutFileInputRef.current?.click();
    }
  };

  // Carousel State & Touch/Autoplay controls for Hero Banner Studio Features
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const touchStartRef = useRef({ x: null, y: null });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__SET_HERO_SLIDE__ = (idx) => {
        setActiveSlideIndex(idx);
      };
    }
    if (isCarouselHovered) return;
    const timer = setInterval(() => {
      if (typeof window !== 'undefined' && window.__PAUSE_CAROUSEL__) return;
      setActiveSlideIndex((prev) => (prev + 1) % STUDIO_HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isCarouselHovered]);

  const handleNextSlide = (e) => {
    e?.stopPropagation?.();
    setActiveSlideIndex((prev) => (prev + 1) % STUDIO_HERO_SLIDES.length);
  };

  const handlePrevSlide = (e) => {
    e?.stopPropagation?.();
    setActiveSlideIndex((prev) => (prev - 1 + STUDIO_HERO_SLIDES.length) % STUDIO_HERO_SLIDES.length);
  };

  const handleDotClick = (index) => {
    setActiveSlideIndex(index);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current.x) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNextSlide();
      } else {
        handlePrevSlide();
      }
    }
    touchStartRef.current = { x: null, y: null };
  };

  const currentSlide = STUDIO_HERO_SLIDES[activeSlideIndex] || STUDIO_HERO_SLIDES[0];

  const handleResetToFeatured = () => {
    setSelectedTag('featured');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="template-discovery animate-fade-in">
      {/* 1. STUDIO FEATURES: Flagship Hero Banner Carousel (ON TOP OF HOMESCREEN) */}
      {!isGridView && (
        <section className="features-carousel-section" aria-label="Studio Features Showcase">
          {/* Flagship Hero Banner Carousel with Primary Orange Glow Glass Effect */}
          <div 
            className={`hero-banner-wrapper ${currentSlide.glowTheme}`}
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
            onTouchStart={(e) => { setIsCarouselHovered(true); handleTouchStart(e); }}
            onTouchEnd={(e) => { setIsCarouselHovered(false); handleTouchEnd(e); }}
          >
            <div className="hero-glow-orb hero-glow-orb-1" aria-hidden="true" />

            {/* Carousel Left / Right Navigation Controls (Desktop hover arrows) */}
            <button 
              type="button"
              className="hero-carousel-nav hero-nav-prev" 
              onClick={handlePrevSlide} 
              aria-label="Previous feature banner"
            >
              <ChevronLeft size={16} />
            </button>

            <button 
              type="button"
              className="hero-carousel-nav hero-nav-next" 
              onClick={handleNextSlide} 
              aria-label="Next feature banner"
            >
              <ChevronRight size={16} />
            </button>

            <div className="hero-banner">
              <div className="hero-slides-viewport">
                <div
                  className="hero-slides-track"
                  style={{ transform: `translateX(-${activeSlideIndex * 100}%)` }}
                >
                  {STUDIO_HERO_SLIDES.map((slide, idx) => {
                    const isActive = idx === activeSlideIndex;
                    const SlideIcon = slide.icon;
                    const SecIcon = slide.secondaryIcon;
                    return (
                      <div
                        key={slide.id}
                        className={`hero-slide-inner slide-${slide.id} ${isActive ? 'active' : ''}`}
                      >
                        <div className="hero-card-header">
                          <div className="hero-text-content">
                            <div className={`hero-free-badge ${slide.badgeClass}`}>
                              <span className={`hero-free-dot ${slide.badgeDotClass}`} />
                              <span>{slide.badgeText}</span>
                            </div>
                            <h2 className="hero-title">
                              <span className="hero-title-line hero-title-line-1">
                                <span className="hero-title-main">{slide.titleMain}</span>
                              </span>
                              <br />
                              <span className="hero-title-line hero-title-line-2">
                                <span className={`hero-title-gradient ${slide.titleGradClass}`}>
                                  {slide.titleGradient}
                                </span>
                              </span>
                            </h2>
                            <p className="hero-tagline">{slide.tagline}</p>
                          </div>

                          <div className="hero-rocket-graphic" aria-hidden="true">
                            {slide.renderGraphic()}
                          </div>
                        </div>

                        <div className="hero-actions">
                          <button
                            type="button"
                            className={`studio-pill-btn ${slide.primaryVariant}`}
                            onClick={() => handleFeatureClick(slide)}
                            aria-label={slide.title}
                          >
                            <SlideIcon size={17} className="studio-pill-icon" />
                            <span className="studio-pill-text">{slide.title}</span>
                          </button>

                          {slide.secondaryLabel && (
                            <button
                              type="button"
                              className={`studio-pill-btn ${slide.secondaryVariant}`}
                              onClick={() => handleFeatureClick(slide.secondaryAction)}
                              aria-label={slide.secondaryLabel}
                            >
                              <SecIcon size={17} className="studio-pill-icon" />
                              <span className="studio-pill-text">{slide.secondaryLabel}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hidden file input for Cutout Sticker upload */}
              <input
                type="file"
                ref={cutoutFileInputRef}
                style={{ display: 'none' }}
                accept="image/*,video/*"
                onChange={handleCutoutImageSelected}
              />

              {/* Carousel Dot / Pill Indicators */}
              <div className="hero-carousel-indicators" role="tablist" aria-label="Studio features navigation">
                {STUDIO_HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`hero-indicator-dot ${idx === activeSlideIndex ? 'active' : ''}`}
                    onClick={() => handleDotClick(idx)}
                    aria-label={`Slide ${idx + 1}: ${slide.titleMain} ${slide.titleGradient}`}
                    aria-selected={idx === activeSlideIndex}
                    role="tab"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Top Search & Filter Bar (Side-by-side matching Primary Glass UI) */}
      <div className="search-filter-row discovery-top-bar">
        <div className="search-pill-container">
          <Search className="search-pill-icon" size={19} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={isMobile ? "Search templates (Drake, Cat)..." : "Search templates (Drake, Wojak, Cat, Work)..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-pill-input"
          />
          {searchQuery && (
            <button 
              type="button" 
              className="search-pill-clear" 
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Popover Button */}
        <div className="sort-pill-wrapper" ref={sortRef}>
          <button
            type="button"
            className="search-filter-toggle-btn"
            onClick={() => setIsSortOpen(!isSortOpen)}
            aria-expanded={isSortOpen}
            title={`Sorted by: ${currentSortOption.label}`}
            aria-label="Filter and sort templates"
          >
            <SlidersHorizontal size={18} />
          </button>

          {/* Floating Sort Dropdown */}
          <AnimatePresence>
            {isSortOpen && (
              <motion.div
                className="sort-dropdown-popover"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <div className="sort-dropdown-header">Sort By</div>
                {SORT_OPTIONS.map((opt) => {
                  const OptIcon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`sort-dropdown-item ${sortBy === opt.id ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortOpen(false);
                      }}
                    >
                      <span className="sort-item-icon" style={{ display: 'flex', alignItems: 'center' }}>
                        <OptIcon size={16} color={opt.color || '#ff5e36'} />
                      </span>
                      <span className="sort-item-label">{opt.label}</span>
                      {sortBy === opt.id && <Check size={14} className="sort-check" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Category Tags Row matching Primary Acrylic Glass UI */}
      <div className="discovery-tags-scroll quick-actions-strip" role="tablist">
        {TAGS.map((tag) => {
          const isActive = selectedTag === tag.id;
          return (
            <button
              key={tag.id}
              type="button"
              className={`discovery-tag-pill quick-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setSelectedTag(tag.id);
                if (tag.id === 'featured') {
                  setSearchQuery('');
                }
              }}
              role="tab"
              aria-selected={isActive}
            >
              <span className="tag-label">{tag.label}</span>
              {tag.id === 'favorites' && favorites.length > 0 && (
                <span className="tag-count-badge quick-pill-count">{favorites.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW MODE 1: FEATURED SHELVES (Default Homescreen) */}
      {!isGridView ? (
        <div className="featured-shelves-container">
          {/* 1. SHELF 1: 🔥 Trending Memes with Cartoon Number Badges */}
          <section className="curated-shelf-section">
            <div className="shelf-header-row">
              <div className="shelf-title-left">
                <div className="shelf-icon-badge flame-badge">
                  <Flame size={16} />
                </div>
                <div>
                  <h3 className="shelf-heading">Trending Memes</h3>
                  <span className="shelf-subtext">● Updated today</span>
                </div>
              </div>
              <button
                type="button"
                className="shelf-see-all-btn"
                onClick={() => handleShelfSeeAll('all', 'trending')}
              >
                <span>See all</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="shelf-horizontal-scroll">
              {trendingShelfTemplates.map((template, idx) => {
                const rankNumber = idx + 1;
                return (
                  <div
                    key={template.id}
                    className="shelf-meme-card"
                    onClick={() => onSelectTemplate(template)}
                  >
                    {/* 3D-Styled Cartoon Number Badge for Top 3 Trending Cards */}
                    {rankNumber <= 3 && (
                      <div className={`shelf-rank-badge rank-${rankNumber}`}>
                        <span>{rankNumber}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      className={`shelf-favorite-btn ${favorites.includes(template.id) ? 'active' : ''}`}
                      onClick={(e) => toggleFavorite(e, template.id)}
                      title={favorites.includes(template.id) ? 'Remove favorite' : 'Add to favorites'}
                      aria-label="Toggle favorite"
                    >
                      <Star
                        size={12}
                        fill={favorites.includes(template.id) ? "#facc15" : "none"}
                        color={favorites.includes(template.id) ? "#facc15" : "rgba(255, 255, 255, 0.75)"}
                      />
                    </button>

                    <div className="shelf-card-thumb-wrap">
                      <img
                        src={template.imageUrl || template.thumbnailUrl}
                        alt={template.name}
                        loading="lazy"
                        decoding="async"
                        className="shelf-card-img"
                        onError={(e) => {
                          if (e.currentTarget.dataset.fbk || !template.fallbackUrl) return;
                          e.currentTarget.dataset.fbk = '1';
                          e.currentTarget.src = template.fallbackUrl;
                        }}
                      />
                      <div className="shelf-card-views">
                        <Eye size={10} />
                        <span>{((templateNumericId(template) % 30) + 14)}K</span>
                      </div>
                    </div>

                    <div className="shelf-card-info">
                      <span className="shelf-card-name" title={template.name}>{template.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. AI MEME STUDIO GENERATOR CONTAINER (BELOW TRENDING MEMES) */}
          <div className="hero-banner-wrapper glow-theme-ai ai-studio-generator-wrapper">
            <div className="hero-glow-orb hero-glow-orb-1" aria-hidden="true" />
            <div className="hero-banner ai-studio-banner-card" role="region" aria-label="AI Meme Studio Generator">
              <div className="hero-card-header">
                <div className="hero-text-content">
                  <div className="hero-free-badge badge-cyan">
                    <span className="hero-free-dot dot-cyan" />
                    <span>✨ POWERED BY GEMINI 2.5</span>
                  </div>
                  <h2 className="hero-title">
                    <span className="hero-title-line hero-title-line-1">
                      <span className="hero-title-main">AI MEME STUDIO</span>
                    </span>
                    <br />
                    <span className="hero-title-line hero-title-line-2">
                      <span className="hero-title-gradient grad-sunset">PROMPT GENERATOR</span>
                    </span>
                  </h2>
                  <p className="hero-tagline">
                    Turn any idea into viral memes with smart AI captions
                  </p>
                </div>

                <div className="hero-rocket-graphic" aria-hidden="true">
                  <GraphicAiRobot3D />
                </div>
              </div>

              {/* Creative Vibe / Style Quick Selector */}
              <div className="ai-vibe-modes-row" role="region" aria-label="Creative Vibe Selector">
                <span className="ai-vibe-label">Quick Vibe:</span>
                <div className="ai-vibe-pill-list">
                  {AI_VIBE_MODES.map((vibe) => (
                    <button
                      key={vibe.id}
                      type="button"
                      className={`ai-vibe-pill ${selectedVibe === vibe.id ? 'active' : ''}`}
                      onClick={() => handleSelectVibe(vibe)}
                      title={`Generate ${vibe.label} meme`}
                    >
                      <span className="ai-vibe-emoji">{vibe.emoji}</span>
                      <span className="ai-vibe-name">{vibe.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Prompt Input Box */}
              <form onSubmit={handleOpenAiPrompt} className="ai-hero-input-form">
                <div className="ai-hero-input-row">
                  <div className="ai-input-prefix">
                    <Wand2 size={16} className="ai-hero-input-icon" />
                  </div>
                  <input
                    type="text"
                    className="ai-hero-prompt-input"
                    placeholder="Make a meme about Monday morning meetings..."
                    value={aiPromptText}
                    onChange={(e) => setAiPromptText(e.target.value)}
                  />
                  {aiPromptText ? (
                    <button
                      type="button"
                      className="ai-hero-clear-btn"
                      onClick={() => setAiPromptText('')}
                      title="Clear prompt"
                      aria-label="Clear prompt"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    className="ai-hero-submit-btn"
                    title="Generate with AI"
                    aria-label="Generate with AI"
                  >
                    <ArrowUp size={16} strokeWidth={2.6} />
                  </button>
                </div>
              </form>

              {/* Quick Prompt Suggestion Chips for Instant 1-Tap Inspiration */}
              <div className="ai-hero-prompts-wrapper">
                <div className="ai-prompts-label-row">
                  <Sparkles size={11} className="ai-prompts-label-icon" />
                  <span className="ai-prompts-label">Instant Ideas:</span>
                </div>
                <div className="ai-hero-quick-prompts">
                  {QUICK_PROMPTS.map((promptText, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      className="ai-hero-prompt-chip"
                      onClick={() => {
                        setAiPromptText(promptText);
                        if (onOpenAiGenerator) {
                          onOpenAiGenerator(promptText);
                        }
                      }}
                    >
                      <Sparkles size={11} className="chip-sparkle" />
                      <span>{promptText}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Compatibility & Creative Tagline */}
              <div className="ai-hero-footnote">
                <div className="ai-footnote-text">
                  <Zap size={12} className="ai-footnote-icon" />
                  <span>Unleash your creativity with AI meme maker & curated templates</span>
                </div>
                <div className="ai-hero-stats-pill">
                  <span>⚡ Instant AI Generation</span>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE CALLOUT BANNER: "Create your own custom meme" */}
          <motion.div
            className="feature-promo-banner"
            onClick={onCreateCustom}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            role="button"
            tabIndex={0}
          >
            <div className="promo-banner-left">
              <div className="promo-banner-icon-squircle">
                <LayoutGrid size={22} />
              </div>
              <div className="promo-banner-texts">
                <div className="promo-banner-title-row">
                  <h4 className="promo-banner-title">Create your own meme</h4>
                  <span className="promo-banner-pill">NEW</span>
                </div>
                <p className="promo-banner-desc">
                  Use any custom layout, stickers or photo to create memes
                </p>
              </div>
            </div>
            <div className="promo-banner-arrow-btn" aria-hidden="true">
              <ChevronRight size={18} />
            </div>
          </motion.div>

          {/* SHELF 2: 📱 Social Media Cards Shelf (Twitter, Instagram, WhatsApp) */}
          <section className="curated-shelf-section">
            <div className="shelf-header-row">
              <div className="shelf-title-left">
                <div className="shelf-icon-badge social-badge">
                  <Share2 size={16} />
                </div>
                <div>
                  <h3 className="shelf-heading">Social Media Cards</h3>
                  <span className="shelf-subtext">● Twitter, WhatsApp & Instagram</span>
                </div>
              </div>
              <button
                type="button"
                className="shelf-see-all-btn"
                onClick={() => handleShelfSeeAll('social')}
              >
                <span>See all</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="shelf-horizontal-scroll">
              {socialShelfTemplates.map((template) => {
                const isTweet = template.id?.includes('tweet');
                const isInsta = template.id?.includes('instagram');
                const isWa = template.id?.includes('whatsapp');
                const tagLabel = isTweet ? '𝕏 Post' : isInsta ? 'IG Post' : isWa ? 'WA Chat' : 'Interactive';
                const cardClass = isTweet ? 'social-card-x' : isInsta ? 'social-card-ig' : isWa ? 'social-card-wa' : '';

                return (
                  <div
                    key={template.id}
                    className={`shelf-meme-card social-shelf-card ${cardClass}`}
                    onClick={() => onSelectTemplate(template)}
                  >
                    <span className="social-card-tag">{tagLabel}</span>
                    <div className="shelf-card-thumb-wrap">
                      <img
                        src={template.imageUrl || template.thumbnailUrl}
                        alt={template.name}
                        loading="lazy"
                        className="shelf-card-img"
                      />
                    </div>
                    <div className="shelf-card-info">
                      <span className="shelf-card-name" title={template.name}>{template.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SHELF 3: 💼 Work & Office Memes */}
          <section className="curated-shelf-section">
            <div className="shelf-header-row">
              <div className="shelf-title-left">
                <div className="shelf-icon-badge work-badge">
                  <Briefcase size={16} />
                </div>
                <div>
                  <h3 className="shelf-heading">Work & Office Memes</h3>
                  <span className="shelf-subtext">● Relatable 9-to-5 & tech humor</span>
                </div>
              </div>
              <button
                type="button"
                className="shelf-see-all-btn"
                onClick={() => handleShelfSeeAll('all')}
              >
                <span>See all</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="shelf-horizontal-scroll">
              {workShelfTemplates.map((template) => (
                <div
                  key={template.id}
                  className="shelf-meme-card"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="shelf-card-thumb-wrap">
                    <img
                      src={template.imageUrl || template.thumbnailUrl}
                      alt={template.name}
                      loading="lazy"
                      className="shelf-card-img"
                    />
                    <div className="shelf-card-views">
                      <Eye size={10} />
                      <span>{((templateNumericId(template) % 25) + 18)}K</span>
                    </div>
                  </div>
                  <div className="shelf-card-info">
                    <span className="shelf-card-name" title={template.name}>{template.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SHELF 4: 💑 Relationships & Dating */}
          <section className="curated-shelf-section">
            <div className="shelf-header-row">
              <div className="shelf-title-left">
                <div className="shelf-icon-badge heart-badge">
                  <Heart size={16} />
                </div>
                <div>
                  <h3 className="shelf-heading">Relationships & Life</h3>
                  <span className="shelf-subtext">● Dating, couples & friendships</span>
                </div>
              </div>
              <button
                type="button"
                className="shelf-see-all-btn"
                onClick={() => handleShelfSeeAll('all')}
              >
                <span>See all</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="shelf-horizontal-scroll">
              {relationshipShelfTemplates.map((template) => (
                <div
                  key={template.id}
                  className="shelf-meme-card"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="shelf-card-thumb-wrap">
                    <img
                      src={template.imageUrl || template.thumbnailUrl}
                      alt={template.name}
                      loading="lazy"
                      className="shelf-card-img"
                    />
                    <div className="shelf-card-views">
                      <Eye size={10} />
                      <span>{((templateNumericId(template) % 35) + 12)}K</span>
                    </div>
                  </div>
                  <div className="shelf-card-info">
                    <span className="shelf-card-name" title={template.name}>{template.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SHELF 5: ⚡ Reactions & Viral Classics */}
          <section className="curated-shelf-section">
            <div className="shelf-header-row">
              <div className="shelf-title-left">
                <div className="shelf-icon-badge react-badge">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="shelf-heading">Reactions & Classics</h3>
                  <span className="shelf-subtext">● Timeless internet gold</span>
                </div>
              </div>
              <button
                type="button"
                className="shelf-see-all-btn"
                onClick={() => handleShelfSeeAll('reaction')}
              >
                <span>See all</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="shelf-horizontal-scroll">
              {reactionsShelfTemplates.map((template) => (
                <div
                  key={template.id}
                  className="shelf-meme-card"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="shelf-card-thumb-wrap">
                    <img
                      src={template.imageUrl || template.thumbnailUrl}
                      alt={template.name}
                      loading="lazy"
                      className="shelf-card-img"
                    />
                    <div className="shelf-card-views">
                      <Eye size={10} />
                      <span>{((templateNumericId(template) % 28) + 20)}K</span>
                    </div>
                  </div>
                  <div className="shelf-card-info">
                    <span className="shelf-card-name" title={template.name}>{template.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* VIEW MODE 2: RESPONSIVE MASONRY GRID VIEW (Search, Category Filters, "See All") */
        <div className="grid-browse-container">
          {/* Breadcrumb / Return Pill */}
          <div className="grid-header-actions">
            <button
              type="button"
              className="back-to-featured-btn"
              onClick={handleResetToFeatured}
            >
              <span>← Back to Featured</span>
            </button>
            <div className="grid-results-count">
              {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} found
            </div>
          </div>

          {filteredTemplates.length > 0 ? (
            <>
              <div className="template-grid template-masonry-wrapper">
                {masonryColumns.map((colItems, colIdx) => (
                  <div key={colIdx} className="template-masonry-col">
                    {colItems.map(({ template, originalIndex }) => {
                      const badge = getTemplateBadge(template, originalIndex);
                      const BadgeIcon = badge.icon;
                      return (
                        <div
                          key={template.id}
                          className="template-card"
                          onClick={() => onSelectTemplate(template)}
                        >
                          {/* Top-Left Category Badge */}
                          <span 
                            className={`card-sticker-tag ${badge.iconOnly ? 'card-sticker-icon-only' : ''}`} 
                            style={{ borderColor: `${badge.color}45` }}
                            title={template.type === 'video' ? 'Video Template' : badge.label}
                          >
                            <BadgeIcon size={badge.iconOnly ? 13 : 11} strokeWidth={2.6} style={{ color: badge.color }} />
                            {badge.label ? badge.label : null}
                          </span>

                          {/* Top-Right Favorite Star Button */}
                          <button
                            type="button"
                            className={`card-favorite-btn ${favorites.includes(template.id) ? 'active' : ''}`}
                            onClick={(e) => toggleFavorite(e, template.id)}
                            title={favorites.includes(template.id) ? 'Remove favorite' : 'Add to favorites'}
                            aria-label={favorites.includes(template.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star 
                              size={13} 
                              fill={favorites.includes(template.id) ? "#facc15" : "none"} 
                              color={favorites.includes(template.id) ? "#facc15" : "rgba(255, 255, 255, 0.72)"} 
                              strokeWidth={favorites.includes(template.id) ? 2.2 : 1.8}
                            />
                          </button>

                          <div 
                            className="template-image-wrapper" 
                            style={{ 
                              position: 'relative', 
                              aspectRatio: (template.width && template.height)
                                ? `${Math.max(0.75, Math.min(1.12, template.width / template.height))}`
                                : '1 / 1'
                            }}
                          >
                            <img
                              src={template.type === 'video' ? template.thumbnailUrl : template.imageUrl}
                              alt={template.name}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const el = e.currentTarget;
                                if (el.dataset.fbk || !template.fallbackUrl) return;
                                el.dataset.fbk = '1';
                                el.src = template.fallbackUrl;
                              }}
                            />
                            
                            {template.type === 'video' && (
                              <div className="card-video-duration-badge">
                                {typeof template.durationMs === 'number' && Number.isFinite(template.durationMs)
                                  ? `${Math.round(template.durationMs / 1000)}s`
                                  : 'HD'}
                              </div>
                            )}

                            <div className="card-views-bottom-right-badge">
                              <Eye size={11} />
                              <span>{((templateNumericId(template) % 30) + 12)}K</span>
                            </div>
                          </div>

                          <div className="template-card-footer">
                            <span className="card-footer-title" title={template.name}>{template.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {visibleCount < filteredTemplates.length && (
                <div ref={sentinelRef} className="masonry-sentinel">
                  <button
                    type="button"
                    className="studio-pill-btn secondary masonry-load-more-btn"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredTemplates.length))}
                  >
                    Load more templates ({filteredTemplates.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <ImageIcon className="empty-icon" />
              <h3>No Meme Templates Found</h3>
              <p>
                {selectedTag === 'favorites' 
                  ? 'You haven\'t starred any templates yet. Click the star on any meme to save it here!' 
                  : 'Try searching for a different keyword or browse all categories!'}
              </p>
              <button
                type="button"
                className="studio-pill-btn primary"
                onClick={handleResetToFeatured}
                style={{ marginTop: '16px' }}
              >
                Back to Featured Memes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
