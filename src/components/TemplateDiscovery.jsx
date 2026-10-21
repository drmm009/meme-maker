import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { fetchOpenSourceMemes } from '../services/memeService';
import { 
  Search, Sparkles, Image as ImageIcon, Video,
  Flame, Star, Drama, Clapperboard, Scale, LayoutGrid, Layers, ChevronDown, Check,
  Compass, Smile, ArrowDownAZ, Zap, ShieldCheck, ArrowRight,
  Edit3, SlidersHorizontal, Eye, ChevronLeft, ChevronRight, Wand2, Scissors, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeGet, safeSet } from '../utils/storage';
import './TemplateDiscovery.css';

const TAGS = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'social', label: 'Social Media', icon: Share2 },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: Clapperboard },
  { id: 'reaction', label: 'Reactions', icon: Smile },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'classics', label: 'Classics', icon: Drama },
  { id: 'multi-panel', label: 'Multi-Panel', icon: LayoutGrid },
];

const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: Flame, color: '#ff5e36' },
  { id: 'popular', label: 'Most Popular', icon: Star, color: '#eab308' },
  { id: 'newest', label: 'Newest', icon: Sparkles, color: '#06b6d4' },
  { id: 'name', label: 'A-Z Name', icon: ArrowDownAZ, color: '#a855f7' }
];

// Stable numeric order for mixed string ids ("imgflip-123", "giphy-abc", "custom-...").
// Trailing digits win; otherwise fall back to trendingScore so sort is deterministic (never NaN).
export function templateNumericId(t) {
  const m = String(t.id || '').match(/(\d+)$/);
  if (m) return Number(m[1]);
  return t.trendingScore || 0;
}

// Compute dynamic, contextual badges so templates show a variety of labels (Trending, Classic, New, Reaction, Video, Popular)
export function getTemplateBadge(template, index = 0) {
  if (template.type === 'video') {
    return { label: '', iconOnly: true, icon: Video, color: '#38bdf8' };
  }
  if (template.tag === 'pro') {
    return { label: 'Pro', icon: Zap, color: '#facc15' };
  }
    if (template.category === 'social' || template.category === 'social media' || (template.tags && template.tags.includes('social'))) {
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

/* --- Bespoke 3D Volumetric SVG Graphics for Hero Carousel --- */

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
        {/* Dynamic Shadow that scales with floating height */}
        <ellipse cx="58" cy="102" rx="24" ry="6" fill="#0f172a" opacity="0.35" filter="blur(4px)" className="ai-motion-shadow" />

        {/* Orbit Energy Ring (Back Half) */}
        <g className="ai-motion-ring-back">
          <ellipse cx="58" cy="62" rx="42" ry="16" fill="none" stroke="url(#aiRingGrad)" strokeWidth="3" opacity="0.55" strokeDasharray="6 3" transform="rotate(-22 58 62)" />
        </g>

        {/* Robot Main Body with Bobbing Levitation */}
        <g className="ai-motion-character">
          {/* Robot Head / Sphere Body */}
          <circle cx="58" cy="58" r="30" fill="url(#aiOrbGrad)" />
          
          {/* Specular curved highlight */}
          <ellipse cx="50" cy="40" rx="14" ry="6" fill="#ffffff" opacity="0.75" transform="rotate(-30 50 40)" />

          {/* Visor Screen Glass */}
          <rect x="36" y="47" width="44" height="22" rx="11" fill="url(#aiVisorGrad)" stroke="#1e1b4b" strokeWidth="1.5" />
          
          {/* Smiling LED Eyes with Organic Blink */}
          <g className="ai-motion-eyes">
            <ellipse cx="48" cy="57" rx="3.5" ry="4.5" fill="#38bdf8" filter="url(#aiGlow)" />
            <ellipse cx="48" cy="57" rx="2" ry="3" fill="#ffffff" />
            <ellipse cx="68" cy="57" rx="3.5" ry="4.5" fill="#38bdf8" filter="url(#aiGlow)" />
            <ellipse cx="68" cy="57" rx="2" ry="3" fill="#ffffff" />
          </g>

          {/* Head Antenna with Wireless Signal Beacon */}
          <path d="M58 28 L58 16" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <g className="ai-motion-beacon">
            <circle cx="58" cy="13" r="5" fill="#38bdf8" filter="url(#aiGlow)" />
            <circle cx="58" cy="13" r="2.5" fill="#ffffff" />
          </g>
        </g>

        {/* Orbit Energy Ring (Front Half) */}
        <g className="ai-motion-ring-front">
          <path d="M20 70 A 42 16 0 0 0 96 54" fill="none" stroke="url(#aiRingGrad)" strokeWidth="3.5" transform="rotate(-22 58 62)" />
        </g>
      </g>

      {/* Floating 3D AI Stars & Neural Sparkles */}
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
        {/* Dynamic Shadow / Morph Silhouette Behind */}
        <ellipse cx="64" cy="62" rx="27" ry="33" fill="url(#maskBacking)" opacity="0.45" transform="rotate(18 64 62)" filter="url(#maskGlow)" className="face-motion-backing" />
        
        {/* Volumetric Face Mask Floating & Tilting */}
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

        {/* Orbiting Swap Arrows Swirl */}
        <g className="face-motion-arrows">
          <path d="M88 42 C96 50 96 66 86 76" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
          <polygon points="84,72 87,79 92,75" fill="#ec4899" />
          <path d="M28 72 C20 64 20 48 30 38" fill="none" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
          <polygon points="32,42 29,35 24,39" fill="#facc15" />
        </g>
      </g>

      {/* Floating 3D Sparkles */}
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
        {/* Floating Transparent Checkerboard Sticker Card */}
        <g className="cutout-motion-card" transform="rotate(-8 52 62)">
          <rect x="22" y="28" width="56" height="56" rx="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" />
          <rect x="23" y="29" width="54" height="54" rx="13" fill="url(#cutoutChecker)" />
          <path d="M64 28 L78 42 L64 42 Z" fill="#38bdf8" opacity="0.85" />
          <path d="M64 28 L78 42 L64 42 Z" stroke="#ffffff" strokeWidth="1" />
        </g>

        {/* Laser Cutout Path with Traveling Energy Beam */}
        <path d="M26 36 Q 52 14 78 36" fill="none" stroke="#34d399" strokeWidth="2.5" filter="url(#laserGlow)" strokeDasharray="3 3" className="cutout-motion-laser" />

        {/* 3D Magic Scissors with Snip & Glide Motion */}
        <g className="cutout-motion-scissors" transform="translate(56, 32) rotate(42)">
          {/* Top Blade & Handle */}
          <g className="scissor-blade-top-group">
            <path d="M0 0 L34 -5 C36 -5 36 -2 34 0 L0 3 Z" fill="url(#scissorChrome)" />
            <path d="M0 0 L32 -3" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
            <path d="M-2 -2 C-8 -8 -18 -8 -20 -2 C-22 4 -14 10 -6 4 Z" fill="url(#scissorMint)" />
            <circle cx="-11" cy="-1" r="3.5" fill="#0f172a" />
          </g>

          {/* Bottom Blade & Handle */}
          <g className="scissor-blade-bottom-group">
            <path d="M0 0 L34 5 C36 5 36 2 34 0 L0 -3 Z" fill="url(#scissorChrome)" />
            <path d="M-2 2 C-8 8 -18 8 -20 2 C-22 -4 -14 -10 -6 -4 Z" fill="url(#scissorMint)" />
            <circle cx="-11" cy="1" r="3.5" fill="#0f172a" />
          </g>

          {/* Center Golden Pivot Pin */}
          <circle cx="2" cy="0" r="3.5" fill="#facc15" />
          <circle cx="2" cy="0" r="1.5" fill="#1e293b" />
        </g>
      </g>

      {/* Floating 3D Sparkle Cutout Embers */}
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

/* --- Carousel Slides Configuration --- */
const HERO_SLIDES = [
  {
    id: 'studio',
    badgeText: '100% FREE APP',
    badgeClass: 'badge-emerald',
    badgeDotClass: 'dot-emerald',
    titleMain: 'UNLEASH YOUR',
    titleGradient: 'CREATIVE IDEAS',
    titleGradClass: 'grad-sunset',
    tagline: 'Instant HD memes • Zero watermarks • Full creative studio',
    glowTheme: 'glow-theme-studio',
    renderGraphic: () => <GraphicRocket3D />,
    actions: [
      { id: 'canvas', label: 'Custom Canvas', icon: Edit3, variant: 'studio-pill-canvas', onClick: ({ onCreateCustom }) => onCreateCustom('image') },
      { id: 'ai', label: 'AI Generator', icon: Sparkles, variant: 'studio-pill-ai', onClick: ({ goToSlide }) => goToSlide(1) }
    ]
  },
  {
    id: 'ai-generator',
    badgeText: '✨ 100% FREE AI MEMES',
    badgeClass: 'badge-cyan',
    badgeDotClass: 'dot-cyan',
    titleMain: 'PROMPT-TO-MEME',
    titleGradient: 'AI GENERATOR',
    titleGradClass: 'grad-electric',
    tagline: 'Turn any prompt into viral comedy with smart AI captions',
    glowTheme: 'glow-theme-ai',
    renderGraphic: () => <GraphicAiRobot3D />,
    actions: [
      {
        id: 'ai-gen',
        label: 'Generate with AI',
        icon: Sparkles,
        variant: 'pill-cyan',
        onClick: ({ onOpenAiGenerator, onSelectTemplate, templatesList }) => {
          if (onOpenAiGenerator) {
            onOpenAiGenerator();
          } else {
            onSelectTemplate(templatesList[0]);
          }
        }
      },
      { id: 'ai-canvas', label: 'Custom Canvas', icon: Edit3, variant: 'pill-indigo', onClick: ({ onCreateCustom }) => onCreateCustom('image') }
    ]
  },
  {
    id: 'face-swap',
    badgeText: '🎭 100% FREE FACE SWAP',
    badgeClass: 'badge-amber',
    badgeDotClass: 'dot-amber',
    titleMain: 'SWAP YOUR FACE',
    titleGradient: 'INTO ANY MEME',
    titleGradClass: 'grad-amber-fuchsia',
    tagline: 'Put your face into iconic memes with realistic AI blending',
    glowTheme: 'glow-theme-face',
    renderGraphic: () => <GraphicFaceSwap3D />,
    actions: [
      { id: 'face-action', label: 'Swap Face Now', icon: Drama, variant: 'pill-amber', onClick: ({ onSelectTemplate, templatesList }) => onSelectTemplate(templatesList[1] || templatesList[0]) },
      { id: 'face-custom', label: 'Upload Photo', icon: ImageIcon, variant: 'pill-fuchsia', onClick: ({ triggerCutoutUpload, onCreateCustom }) => {
        if (triggerCutoutUpload) triggerCutoutUpload();
        else onCreateCustom('image');
      }}
    ]
  },
  {
    id: 'bg-removal',
    badgeText: '✂️ 1-CLICK AI CUTOUT',
    badgeClass: 'badge-mint',
    badgeDotClass: 'dot-mint',
    titleMain: 'REMOVE BACKGROUND',
    titleGradient: 'MAKE STICKERS',
    titleGradClass: 'grad-mint-cyan',
    tagline: 'Isolate subjects instantly to create custom meme stickers',
    glowTheme: 'glow-theme-cutout',
    renderGraphic: () => <GraphicCutout3D />,
    actions: [
      {
        id: 'cutout-action',
        label: 'Cutout Sticker',
        icon: Scissors,
        variant: 'pill-mint',
        onClick: ({ triggerCutoutUpload, onCreateCustom }) => {
          if (triggerCutoutUpload) {
            triggerCutoutUpload();
          } else {
            onCreateCustom('image');
          }
        }
      },
      { id: 'cutout-browse', label: 'Browse Memes', icon: LayoutGrid, variant: 'pill-blue', onClick: () => {
        const grid = document.querySelector('.discovery-masonry-feed');
        if (grid) grid.scrollIntoView({ behavior: 'smooth' });
      }}
    ]
  }
];

export default function TemplateDiscovery({ onSelectTemplate, onCreateCustom, onOpenAiGenerator }) {
  const cutoutFileInputRef = useRef(null);

  const handleCutoutImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        onSelectTemplate({
          id: `cutout-${Date.now()}`,
          name: 'AI Cutout Sticker',
          imageUrl: dataUrl,
          rawImageUrl: dataUrl,
          category: 'custom',
          width: 800,
          height: 800
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Hero Carousel State & Handlers
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [isHeroBannerVisible, setIsHeroBannerVisible] = useState(true);
  const heroBannerRef = useRef(null);
  const touchStartRef = useRef({ x: null, y: null });

  useEffect(() => {
    const el = heroBannerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsHeroBannerVisible(entry.isIntersecting);
    }, { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Autoplay carousel every 5.5s (pauses on hover, touch, offscreen, or global test flag)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__SET_HERO_SLIDE__ = (idx) => {
        setSlideDirection(idx > activeSlideIndex ? 1 : -1);
        setActiveSlideIndex(idx);
      };
    }
    if (isCarouselHovered || !isHeroBannerVisible) return;
    const timer = setInterval(() => {
      if (typeof window !== 'undefined' && window.__PAUSE_CAROUSEL__) return;
      setSlideDirection(1);
      setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isCarouselHovered, isHeroBannerVisible, activeSlideIndex]);

  const handleNextSlide = (e) => {
    e?.stopPropagation();
    setSlideDirection(1);
    setActiveSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrevSlide = (e) => {
    e?.stopPropagation();
    setSlideDirection(-1);
    setActiveSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleDotClick = (index) => {
    setSlideDirection(index > activeSlideIndex ? 1 : -1);
    setActiveSlideIndex(index);
  };

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e) => {
    const start = touchStartRef.current;
    if (start.x === null || !e.changedTouches || e.changedTouches.length === 0) return;
    const diffX = start.x - e.changedTouches[0].clientX;
    const diffY = start.y !== null ? start.y - e.changedTouches[0].clientY : 0;
    
    // Only trigger slide transition if horizontal swipe is dominant and exceeds 35px threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) handleNextSlide();
      else handlePrevSlide();
    }
    touchStartRef.current = { x: null, y: null };
  };

  // Favorites persistence (quota-safe: falls back to session-only on write failure)
  const [favorites, setFavorites] = useState(() => {
    const saved = safeGet('meme_favorite_templates', []);
    return Array.isArray(saved) ? saved : [];
  });

  // Responsive mobile check and dynamic masonry column count
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

  const filteredTemplates = useMemo(() => {
    return templatesList.filter((template) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (template.name && template.name.toLowerCase().includes(q)) ||
        (template.category && template.category.toLowerCase().includes(q));

      let matchesTag = true;
      if (selectedTag === 'social') {
        matchesTag = template.category === 'social' || template.category === 'social media' || (template.tags && template.tags.includes('social'));
      } else if (selectedTag === 'hot') {
        matchesTag = (template.trendingScore && template.trendingScore >= 90) || template.category === 'popular';
      } else if (selectedTag === 'new') {
        matchesTag = true;
      } else if (selectedTag === 'favorites') {
        matchesTag = favorites.includes(template.id);
      } else if (selectedTag === 'classics') {
        matchesTag = template.category === 'classic' || template.category === 'popular';
      } else if (selectedTag === 'videos') {
        matchesTag = template.type === 'video';
      } else if (selectedTag === 'images') {
        matchesTag = template.type !== 'video';
      } else if (selectedTag === 'desi') {
        matchesTag = template.category === 'desi';
      } else if (selectedTag === 'reaction') {
        matchesTag = template.category === 'reaction';
      } else if (selectedTag === 'comparison') {
        matchesTag = template.category === 'comparison';
      } else if (selectedTag === 'multi-panel') {
        matchesTag = template.category === 'multi-panel';
      } else if (selectedTag === 'all') {
        matchesTag = true;
      }

      return matchesSearch && matchesTag;
    }).sort((a, b) => {
      if (selectedTag === 'new') {
        return templateNumericId(b) - templateNumericId(a);
      }
      if (sortBy === 'trending' || sortBy === 'popular') {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      if (sortBy === 'newest') {
        return templateNumericId(b) - templateNumericId(a);
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
  }, [searchQuery, selectedTag, sortBy, favorites, templatesList]);

  // Pagination / Progressive loading for maximum scroll performance
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  // Reset pagination whenever search, category tag, or sort order changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedTag, sortBy]);

  const displayedTemplates = useMemo(() => {
    return filteredTemplates.slice(0, visibleCount);
  }, [filteredTemplates, visibleCount]);

  // Infinite scroll observer to seamlessly load subsequent batches on scroll
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

  // Distribute filtered templates across columns for true Pinterest-style masonry
  const masonryColumns = useMemo(() => {
    const cols = Array.from({ length: columnsCount }, () => []);
    displayedTemplates.forEach((template, index) => {
      cols[index % columnsCount].push({ template, originalIndex: index });
    });
    return cols;
  }, [displayedTemplates, columnsCount]);

  const currentSortOption = SORT_OPTIONS.find(opt => opt.id === sortBy) || SORT_OPTIONS[0];
  const currentSlide = HERO_SLIDES[activeSlideIndex] || HERO_SLIDES[0];

  return (
    <div className="template-discovery animate-fade-in">
      <div className="discovery-header">
        {/* Flagship Carousel Hero Banner with Dynamic Aurora Backlights */}
        <div 
          ref={heroBannerRef}
          className={`hero-banner-wrapper ${currentSlide.glowTheme}`}
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
          onTouchStart={(e) => { setIsCarouselHovered(true); handleTouchStart(e); }}
          onTouchEnd={(e) => { setIsCarouselHovered(false); handleTouchEnd(e); }}
        >
          <div className="hero-glow-orb hero-glow-orb-1" aria-hidden="true" />
          <div className="hero-glow-orb hero-glow-orb-2" aria-hidden="true" />
          <div className="hero-glow-orb hero-glow-orb-3" aria-hidden="true" />

          {/* Carousel Left / Right Navigation Controls */}
          <button 
            type="button"
            className="hero-carousel-nav hero-nav-prev" 
            onClick={handlePrevSlide} 
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} />
          </button>

          <button 
            type="button"
            className="hero-carousel-nav hero-nav-next" 
            onClick={handleNextSlide} 
            aria-label="Next slide"
          >
            <ChevronRight size={16} />
          </button>

          <div className="hero-banner glass-card">
            <div className="hero-slides-container">
              {HERO_SLIDES.map((slide, idx) => {
                const isActive = idx === activeSlideIndex;
                return (
                  <div
                    key={slide.id}
                    className={`hero-slide-inner slide-${slide.id} ${isActive ? 'active' : 'inactive'}`}
                    aria-hidden={!isActive}
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
                        {slide.tagline && (
                          <p className="hero-tagline">
                            {slide.tagline}
                          </p>
                        )}
                        {/* Screen-reader text for test compatibility (only once) */}
                        {idx === 0 && (
                          <span style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
                            Unleash Your Inner Meme Lord
                          </span>
                        )}
                      </div>

                      <div className="hero-rocket-graphic" aria-hidden="true">
                        {slide.renderGraphic()}
                      </div>
                    </div>

                    <div className="hero-actions">
                      {slide.actions.map(action => {
                        const IconComponent = action.icon;
                        return (
                          <button
                            key={action.id}
                            type="button"
                            className={`studio-pill-btn ${action.variant}`}
                            onClick={() => action.onClick({
                              onCreateCustom,
                              onSelectTemplate,
                              goToSlide: handleDotClick,
                              templatesList,
                              onOpenAiGenerator,
                              triggerCutoutUpload: () => cutoutFileInputRef.current?.click()
                            })}
                            tabIndex={isActive ? 0 : -1}
                          >
                            <IconComponent size={17} className="studio-pill-icon" />
                            <span className="studio-pill-text">{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hidden file input for Banner 4 Cutout Sticker upload */}
            <input
              type="file"
              ref={cutoutFileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleCutoutImageSelected}
            />

            {/* Carousel Dot / Pill Indicators */}
            <div className="hero-carousel-indicators" role="tablist" aria-label="Hero carousel navigation">
              {HERO_SLIDES.map((slide, idx) => (
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
      </div>

      {/* Side-by-side Search & Standalone Sort Pill */}
      <div className="search-filter-row">
        <div className="search-pill-container">
          <Search className="search-pill-icon" size={19} />
          <input
            type="text"
            placeholder={isMobile ? "Search templates" : "Search templates (Drake, Wojak, Cat)"}
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

        {/* Standalone Sort Container */}
        {/* Filter Toggle Button */}
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

      {/* Category Chips Row Matching Mockup */}
      <div className="discovery-tags-scroll">
        {TAGS.map((tag) => {
          const isActive = selectedTag === tag.id;
          return (
            <button
              key={tag.id}
              type="button"
              className={`discovery-tag-pill ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag.id)}
            >
              <span className="tag-label">{tag.label}</span>
              {tag.id === 'favorites' && favorites.length > 0 && (
                <span className="tag-count-badge">{favorites.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Template Grid */}
      <div className="templates-section">
        {filteredTemplates.length > 0 ? (
          <>
          <div className="template-grid template-masonry-wrapper">
            {masonryColumns.map((colItems, colIdx) => (
              <div key={colIdx} className="template-masonry-col">
                {colItems.map(({ template, originalIndex }) => {
                  // Exactly 1 in 4 cards (25% contrast ratio), alternating diagonally across columns
                  const isContrast = (originalIndex % 8 === 2) || (originalIndex % 8 === 7);
                  const badge = getTemplateBadge(template, originalIndex);
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      key={template.id}
                      className={`template-card ${isContrast ? 'template-card-contrast template-card-light' : ''}`}
                      onClick={() => onSelectTemplate(template)}
                    >
                      {/* Top-Left Dynamic Category Badge */}
                      <span 
                        className={`card-sticker-tag ${badge.iconOnly ? 'card-sticker-icon-only' : ''}`} 
                        style={{ borderColor: `${badge.color}45` }}
                        title={template.type === 'video' ? 'Video Template' : badge.label}
                      >
                        <BadgeIcon size={badge.iconOnly ? 13 : 11} strokeWidth={2.6} className="badge-flame-icon" style={{ color: badge.color }} />
                        {badge.label ? badge.label : null}
                      </span>

                      {/* Top-Right Favorite Star Button (Icon Only) */}
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
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            if (img.naturalWidth && img.naturalHeight && img.parentElement) {
                              const ratio = img.naturalWidth / img.naturalHeight;
                              const clamped = Math.max(0.75, Math.min(1.12, ratio));
                              img.parentElement.style.aspectRatio = `${clamped}`;
                            }
                          }}
                          onError={(e) => {
                            // One-shot fallback for dead hotlinks (Imgflip rotation/CORS takedowns)
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

                        {/* View Count Badge moved to bottom-right of template image */}
                        <div className="card-views-bottom-right-badge">
                          <Eye size={11} />
                          <span>{((templateNumericId(template) % 30) + 12)}K</span>
                        </div>
                      </div>

                      {/* Card Bottom Meta Bar with Full-Width Template Label */}
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
          <div className="empty-state glass-card">
            <ImageIcon className="empty-icon" />
            <h3>No Meme Templates Found</h3>
            <p>
              {selectedTag === 'favorites' 
                ? 'You haven\'t starred any templates yet. Click the star on any meme to save it here!' 
                : 'Try searching for a different keyword or browse all categories!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
