import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Check, Copy, Key, ArrowRight, X, PanelTop } from 'lucide-react';
import { AI_MEME_CATEGORIES, generateMemeCaptionsWithGemini } from '../data/aiMemeCaptions';

export default function AiCaptionModal({ isOpen, onClose, onApplyCaption, templateName }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
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
        backdropFilter: 'blur(10px)',
        background: 'rgba(0, 0, 0, 0.65)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(20, 20, 26, 0.96)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--cyber-cyan)' }} />
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
              AI Captions
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="btn btn-icon btn-ghost btn-xs"
              onClick={() => setShowKeyInput(!showKeyInput)}
              title={geminiApiKey ? 'Gemini API Key (Configured)' : 'Set Custom Gemini API Key'}
              style={{
                borderRadius: '8px',
                color: geminiApiKey ? 'var(--cyber-cyan)' : 'rgba(255, 255, 255, 0.5)'
              }}
            >
              <Key size={14} />
            </button>
            <button
              type="button"
              className="btn btn-icon btn-ghost btn-xs"
              onClick={onClose}
              title="Close"
              style={{ borderRadius: '8px', color: 'rgba(255, 255, 255, 0.6)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Optional Collapsible API Key Bar */}
        {showKeyInput && (
          <div
            className="animate-fade-in"
            style={{
              padding: '8px 18px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              type="password"
              className="form-input"
              placeholder="Paste Google Gemini API key..."
              value={geminiApiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              style={{ fontSize: '0.76rem', padding: '6px 10px', borderRadius: '8px', flex: 1 }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Saved locally
            </span>
          </div>
        )}

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
          {/* Prompt Input with Integrated Generate Action */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Topic or idea (e.g. debugging, 3AM, monday)..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchIdeas();
              }}
              style={{
                fontSize: '0.82rem',
                padding: '9px 38px 9px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                width: '100%'
              }}
            />
            <button
              type="button"
              className="btn btn-icon btn-ghost btn-xs"
              onClick={fetchIdeas}
              disabled={loading}
              title="Generate new captions"
              style={{
                position: 'absolute',
                right: '6px',
                borderRadius: '6px',
                color: loading ? 'var(--cyber-cyan)' : 'rgba(255, 255, 255, 0.6)'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Minimal Category Filter Tags */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
              scrollbarWidth: 'none'
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
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 600 : 500,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                    border: isSelected ? '1px solid rgba(255, 255, 255, 0.28)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ marginRight: '4px' }}>{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Captions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'rgba(255, 255, 255, 0.5)' }}>
                <RefreshCw
                  size={20}
                  className="animate-spin"
                  style={{ margin: '0 auto 8px', color: 'var(--cyber-cyan)' }}
                />
                <p style={{ fontSize: '0.8rem', margin: 0 }}>Thinking of captions...</p>
              </div>
            ) : captions.length > 0 ? (
              captions.map((capText, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '11px 13px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'background 0.15s ease, border-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.83rem',
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.92)',
                      lineHeight: 1.45,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {capText}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '5px'
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleCopy(capText, idx)}
                      title="Copy to clipboard"
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 7px',
                        borderRadius: '6px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedIdx === idx ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                      <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => {
                        onApplyCaption(capText, 'header');
                        onClose();
                      }}
                      title="Apply as top header"
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <PanelTop size={12} style={{ color: 'var(--cyber-cyan)' }} />
                      <span>Header</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => {
                        onApplyCaption(capText, 'caption');
                        onClose();
                      }}
                      title="Apply as caption"
                      style={{
                        fontSize: '0.72rem',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Use</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '28px 0',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.8rem'
                }}
              >
                No captions found. Try rerolling or picking another category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
