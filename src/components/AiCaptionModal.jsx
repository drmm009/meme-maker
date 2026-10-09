import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Check, Copy, Key, ArrowRight, X, Type, PanelTop } from 'lucide-react';
import { AI_MEME_CATEGORIES, generateMemeCaptionsWithGemini } from '../data/aiMemeCaptions';

export default function AiCaptionModal({ isOpen, onClose, onApplyCaption, templateName }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [targetMode, setTargetMode] = useState('caption'); // 'caption' | 'header'
  const [customPrompt, setCustomPrompt] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const results = await generateMemeCaptionsWithGemini({
        apiKey: geminiApiKey,
        prompt: customPrompt,
        templateName,
        category: selectedCategory,
        count: 4
      });
      setCaptions(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIdeas();
    }
  }, [isOpen, selectedCategory]);

  const handleSaveApiKey = (key) => {
    setGeminiApiKey(key);
    localStorage.setItem('gemini_api_key', key.trim());
  };

  const handleCopy = (e, text, idx) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const handleSelectCaption = (text) => {
    onApplyCaption(text, targetMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(12px)',
        background: 'rgba(0, 0, 0, 0.72)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'rgba(18, 18, 22, 0.98)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh'
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--cyber-cyan)' }} />
            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff' }}>
              AI Captions
            </span>
          </div>

          {/* Minimalist Target Switcher: Caption vs Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '2px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <button
                type="button"
                onClick={() => setTargetMode('caption')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: targetMode === 'caption' ? 600 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: targetMode === 'caption' ? 'var(--primary-gradient)' : 'transparent',
                  color: targetMode === 'caption' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Type size={11} />
                <span>Caption</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('header')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: targetMode === 'header' ? 600 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: targetMode === 'header' ? 'var(--primary-gradient)' : 'transparent',
                  color: targetMode === 'header' ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <PanelTop size={11} />
                <span>Header</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-icon btn-ghost btn-xs"
              onClick={onClose}
              title="Close"
              style={{ borderRadius: '8px', color: 'rgba(255, 255, 255, 0.6)', width: '26px', height: '26px' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '14px 18px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Minimal Prompt Input with integrated Generate Button */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Topic or vibe (e.g. coffee, coding, 3AM)..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchIdeas();
              }}
              style={{
                fontSize: '0.82rem',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                flex: 1
              }}
            />
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={fetchIdeas}
              disabled={loading}
              title="Generate fresh captions"
              style={{
                height: '35px',
                padding: '0 12px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                flexShrink: 0
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? '...' : 'Generate'}</span>
            </button>
          </div>

          {/* Minimal Category Chips */}
          <div
            style={{
              display: 'flex',
              gap: '5px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              paddingBottom: '2px'
            }}
          >
            {AI_MEME_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '12px',
                    fontSize: '0.71rem',
                    fontWeight: isSelected ? 600 : 400,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    border: isSelected ? '1px solid var(--cyber-cyan)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ marginRight: '3px' }}>{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Minimal 1-Click Captions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'rgba(255, 255, 255, 0.5)' }}>
                <RefreshCw
                  size={18}
                  className="animate-spin"
                  style={{ margin: '0 auto 8px', color: 'var(--cyber-cyan)' }}
                />
                <p style={{ fontSize: '0.78rem', margin: 0 }}>Generating fresh captions...</p>
              </div>
            ) : captions.length > 0 ? (
              captions.map((capText, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectCaption(capText)}
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                    e.currentTarget.style.transform = 'none';
                  }}
                  title={`Click to apply as ${targetMode}`}
                >
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.92)',
                      lineHeight: 1.4,
                      flex: 1
                    }}
                  >
                    {capText}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-icon btn-ghost btn-xs"
                      onClick={(e) => handleCopy(e, capText, idx)}
                      title="Copy to clipboard"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        color: copiedIdx === idx ? '#22c55e' : 'rgba(255, 255, 255, 0.45)'
                      }}
                    >
                      {copiedIdx === idx ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                    </button>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: 'var(--cyber-cyan)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(6, 182, 212, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>Use</span>
                      <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 0',
                  color: 'rgba(255, 255, 255, 0.45)',
                  fontSize: '0.78rem'
                }}
              >
                No captions found. Try clicking Generate.
              </div>
            )}
          </div>
        </div>

        {/* Quiet Footer: Gemini API Key */}
        <div
          style={{
            padding: '8px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            style={{
              background: 'none',
              border: 'none',
              color: geminiApiKey ? 'var(--cyber-cyan)' : 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.68rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Key size={11} />
            <span>{geminiApiKey ? 'Gemini Key Configured' : 'Custom Gemini Key (Optional)'}</span>
          </button>
          <span style={{ fontSize: '0.66rem', color: 'rgba(255, 255, 255, 0.35)' }}>
            1-tap to apply
          </span>
        </div>

        {/* Collapsible Key Input */}
        {showKeyInput && (
          <div
            style={{
              padding: '8px 18px 12px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              gap: '6px'
            }}
          >
            <input
              type="password"
              className="form-input"
              placeholder="Paste Google Gemini API Key..."
              value={geminiApiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              style={{ fontSize: '0.75rem', padding: '5px 8px', borderRadius: '6px', flex: 1 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
