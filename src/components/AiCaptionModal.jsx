import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Check, Copy, Key, ArrowRight, X, Type, PanelTop } from 'lucide-react';
import { AI_MEME_CATEGORIES, generateMemeCaptionsWithGemini } from '../data/aiMemeCaptions';
import { safeGet, safeSet, safeRemove } from '../utils/storage';
import BottomSheet from './BottomSheet';

export default function AiCaptionModal({ isOpen, onClose, onApplyCaption, templateName }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [targetMode, setTargetMode] = useState('caption'); // 'caption' | 'header'
  const [customPrompt, setCustomPrompt] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState(() => safeGet('gemini_api_key', '') || '');
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
    const trimmed = String(key || '').trim();
    setGeminiApiKey(trimmed);
    if (trimmed) {
      safeSet('gemini_api_key', trimmed);
    } else {
      safeRemove('gemini_api_key');
    }
  };

  const handleClearApiKey = () => {
    setGeminiApiKey('');
    safeRemove('gemini_api_key');
  };

  const handleCopy = (e, text, idx) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const handleSelectCaption = (text) => {
    onApplyCaption(text, targetMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="AI Captions"
      icon={<Sparkles size={16} style={{ color: 'var(--cyber-cyan)' }} />}
      badge={
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
      }
      maxHeight="82vh"
      footer={
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
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

          {showKeyInput && (
            <div
              style={{
                marginTop: '8px',
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
                style={{ fontSize: '0.75rem', padding: '6px 8px', borderRadius: '6px', flex: 1 }}
              />
              {geminiApiKey && (
                <button type="button" className="btn btn-xs btn-secondary" onClick={handleClearApiKey} title="Remove saved key from this browser">
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      }
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
    </BottomSheet>
  );
}
