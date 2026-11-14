// Home's AI Meme Studio card: a prompt field and four vibe shortcuts. Either one opens the AI meme
// maker through `onOpen`, starting from that prompt.
import { useState } from 'react';
import { Laugh, Code, Flame, Wand2, Heart, ArrowUp, X } from 'lucide-react';

const AI_VIBE_MODES = [
  { id: 'roast', icon: Flame, emoji: '🔥', label: 'Roast Mode', prompt: 'Roast my daily morning routine and procrastination' },
  { id: 'sarcastic', icon: Laugh, emoji: '😂', label: 'Sarcastic', prompt: 'When the code works on the first try and you suspect a trap' },
  { id: 'wholesome', icon: Heart, emoji: '🐱', label: 'Wholesome', prompt: 'My cat looking at me with unconditional love and judgment' },
  { id: 'tech', icon: Code, emoji: '🧠', label: 'Tech Humor', prompt: 'Pushing directly to production on a Friday afternoon' },
];

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

export default function AiMemePrompt({ onOpen: openAiMeme }) {
  const [aiPromptText, setAiPromptText] = useState('');
  const [selectedVibe, setSelectedVibe] = useState(null);

  const handleSelectVibe = (vibe) => {
    setSelectedVibe(vibe.id);
    setAiPromptText(vibe.prompt);
    openAiMeme(vibe.prompt);
  };

  const handleOpenAiPrompt = (e) => {
    e?.preventDefault?.();
    openAiMeme(aiPromptText.trim());
  };

  return (
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
                <span className="hero-title-main">AI Meme Studio</span>
              </span>
              <br />
              <span className="hero-title-line hero-title-line-2">
                <span className="hero-title-gradient grad-sunset">Prompt Generator</span>
              </span>
            </h2>
          </div>

          <div className="hero-rocket-graphic" aria-hidden="true">
            <GraphicAiRobot3D />
          </div>
        </div>

        {/* Interactive Prompt Input Box (Search Bar UI) */}
        <form onSubmit={handleOpenAiPrompt} className="ai-hero-input-form">
          <div className="ai-hero-input-row">
            <div className="ai-input-prefix">
              <Wand2 size={18} className="ai-hero-input-icon" />
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

        {/* Creative Vibe / Style Quick Selector (Placed Below Input Box) */}
        <div className="ai-vibe-modes-row" role="region" aria-label="Creative Vibe Selector">
          <span className="ai-vibe-label">Quick Vibe:</span>
          <div className="ai-vibe-pill-list">
            {AI_VIBE_MODES.map((vibe) => {
              const VibeIcon = vibe.icon;
              return (
                <button
                  key={vibe.id}
                  type="button"
                  className={`ai-vibe-pill ${selectedVibe === vibe.id ? 'active' : ''}`}
                  onClick={() => handleSelectVibe(vibe)}
                  title={`Generate ${vibe.label} meme`}
                >
                  {VibeIcon ? <VibeIcon size={14} className="ai-vibe-icon" /> : null}
                  <span className="ai-vibe-name">{vibe.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
