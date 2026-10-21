import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, Check, Copy, Key, ArrowRight, Type, PanelTop } from 'lucide-react';
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

  const fetchIdeasRef = useRef(fetchIdeas);
  fetchIdeasRef.current = fetchIdeas;

  useEffect(() => {
    if (isOpen) {
      fetchIdeasRef.current();
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
            borderRadius: '999px',
            padding: '3px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            gap: '2px'
          }}
        >
          <button
            type="button"
            onClick={() => setTargetMode('caption')}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: targetMode === 'caption' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              background: targetMode === 'caption' ? 'var(--primary-gradient)' : 'transparent',
              color: targetMode === 'caption' ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <Type size={12} />
            <span>Caption</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetMode('header')}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: targetMode === 'header' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              background: targetMode === 'header' ? 'var(--primary-gradient)' : 'transparent',
              color: targetMode === 'header' ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <PanelTop size={12} />
            <span>Header</span>
          </button>
        </div>
      }
      maxHeight="84vh"
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '2px 0'
            }}
          >
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              style={{
                background: 'none',
                border: 'none',
                color: geminiApiKey ? 'var(--cyber-cyan)' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.72rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                padding: '4px 0',
                transition: 'color 0.15s ease'
              }}
            >
              <Key size={13} style={{ color: geminiApiKey ? 'var(--cyber-cyan)' : 'rgba(255, 255, 255, 0.4)' }} />
              <span>{geminiApiKey ? 'Gemini Key Configured' : 'Custom Gemini Key (Optional)'}</span>
            </button>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontWeight: 500,
                letterSpacing: '0.02em'
              }}
            >
              Tap card to apply
            </span>
          </div>

          {showKeyInput && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '8px 10px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <input
                type="password"
                className="form-input"
                placeholder="Paste Google Gemini API Key..."
                value={geminiApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                style={{
                  height: '38px',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  padding: '0 16px',
                  borderRadius: '9999px',
                  flex: 1,
                  background: '#16181f',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.35)',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
              {geminiApiKey && (
                <button
                  type="button"
                  className="btn btn-xs"
                  onClick={handleClearApiKey}
                  title="Remove saved key from this browser"
                  style={{
                    padding: '0 14px',
                    height: '38px',
                    borderRadius: '9999px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      }
    >
      {/* Search / Topic Input with Integrated Generate Button */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            flex: 1,
            height: '42px',
            fontSize: '0.88rem',
            fontWeight: 500,
            padding: '0 16px',
            borderRadius: '9999px',
            background: '#16181f',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.35)',
            color: '#ffffff',
            outline: 'none',
            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={fetchIdeas}
          disabled={loading}
          title="Generate fresh captions"
          style={{
            height: '42px',
            padding: '0 18px',
            borderRadius: '9999px',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.28)'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? '...' : 'Generate'}</span>
        </button>
      </div>

      {/* Horizontal Category Chips */}
      <div
        className="horizontal-scroll-only"
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          padding: '2px 0 4px',
          WebkitOverflowScrolling: 'touch'
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
                padding: '6px 13px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: isSelected ? 700 : 500,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                cursor: 'pointer',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.26), rgba(6, 182, 212, 0.12))'
                  : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.68)',
                border: isSelected
                  ? '1px solid var(--cyber-cyan)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isSelected ? '0 2px 10px rgba(6, 182, 212, 0.22)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Caption Suggestions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '38px 0',
              color: 'rgba(255, 255, 255, 0.55)',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '14px',
              border: '1px dashed rgba(255, 255, 255, 0.08)'
            }}
          >
            <RefreshCw
              size={22}
              className="animate-spin"
              style={{ margin: '0 auto 10px', color: 'var(--cyber-cyan)' }}
            />
            <p style={{ fontSize: '0.82rem', margin: 0, fontWeight: 500 }}>
              Crafting hilarious captions...
            </p>
          </div>
        ) : captions.length > 0 ? (
          captions.map((capText, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectCaption(capText)}
              style={{
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.035)',
                borderRadius: '13px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.38)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.035)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'none';
              }}
              title={`Click to apply as ${targetMode}`}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.94)',
                  lineHeight: 1.42,
                  flex: 1
                }}
              >
                {capText}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-icon btn-ghost"
                  onClick={(e) => handleCopy(e, capText, idx)}
                  title="Copy to clipboard"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: copiedIdx === idx ? 'rgba(34, 197, 94, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                    border: copiedIdx === idx ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: copiedIdx === idx ? '#22c55e' : 'rgba(255, 255, 255, 0.55)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copiedIdx === idx ? <Check size={14} color="#22c55e" /> : <Copy size={13} />}
                </button>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--cyber-cyan)',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: 'rgba(6, 182, 212, 0.14)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Use</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '30px 16px',
              color: 'rgba(255, 255, 255, 0.45)',
              fontSize: '0.8rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '14px',
              border: '1px dashed rgba(255, 255, 255, 0.08)'
            }}
          >
            No captions found for this prompt. Tap <strong style={{ color: 'var(--cyber-cyan)' }}>Generate</strong> to create some!
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
