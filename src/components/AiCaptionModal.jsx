import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Check, Copy, Key, ArrowRight, X, MessageSquare, PanelTop } from 'lucide-react';
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
    <div className="modal-backdrop animate-fade-in" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--bg-surface-2, #18181b)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg, #a855f7, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>AI Meme Caption Generator</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #a1a1aa)' }}>Instant viral jokes, punchlines & relatable captions</p>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost btn-xs" onClick={onClose} style={{ borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Category Chips */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Category / Vibe</label>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {AI_MEME_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`btn btn-xs ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    borderRadius: '20px',
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span style={{ marginRight: '4px' }}>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Topic Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Custom topic (e.g. debugging on Friday, 3AM motivation)..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchIdeas(); }}
              style={{ fontSize: '0.82rem', padding: '8px 12px', borderRadius: '10px', flex: 1 }}
            />
            <button
              className="btn btn-primary btn-sm hover-lift"
              onClick={fetchIdeas}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', borderRadius: '10px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Thinking...' : 'Generate'}</span>
            </button>
          </div>

          {/* Generated Captions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: 'var(--cyber-cyan)' }} />
                <p style={{ fontSize: '0.85rem' }}>Generating witty meme punchlines...</p>
              </div>
            ) : captions.length > 0 ? (
              captions.map((capText, idx) => (
                <div
                  key={idx}
                  className="hover-lift"
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-surface-1, rgba(255,255,255,0.04))',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main, #ffffff)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                    "{capText}"
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => handleCopy(capText, idx)}
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      {copiedIdx === idx ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                      {copiedIdx === idx ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={() => {
                        onApplyCaption(capText, 'header');
                        onClose();
                      }}
                      title="Apply as Modern Extended Header Banner"
                      style={{ fontSize: '0.75rem', gap: '4px' }}
                    >
                      <PanelTop size={12} style={{ color: 'var(--cyber-cyan)' }} /> As Header
                    </button>
                    <button
                      className="btn btn-xs btn-primary shadow-glow"
                      onClick={() => {
                        onApplyCaption(capText, 'caption');
                        onClose();
                      }}
                      style={{ fontSize: '0.75rem', gap: '4px', padding: '4px 12px' }}
                    >
                      Apply Text <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                No captions found. Try rerolling or choosing another category!
              </div>
            )}
          </div>

          {/* Gemini API Key Toggle (Optional) */}
          <div style={{ marginTop: '4px', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setShowKeyInput(!showKeyInput)}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Key size={12} /> {geminiApiKey ? 'Gemini API Key Configured (Active)' : 'Use Custom Gemini API Key (Optional)'}
            </button>

            {showKeyInput && (
              <div className="animate-fade-in" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Paste your Google Gemini API key (AI Studio)..."
                  value={geminiApiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  style={{ fontSize: '0.78rem', padding: '6px 10px', borderRadius: '8px' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Stored safely in your browser's localStorage. Enables infinite live AI generation with Google Gemini!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
