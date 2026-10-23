import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WhatsAppLogo } from '../../MemeStylesModal';

export default function WhatsAppCardEditor({
  activeCaption,
  updateActiveCaption,
  updateActiveCaptionProps,
}) {
  return (
    <>
      {activeCaption.isWhatsAppCard && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'var(--bg-surface-1)',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            marginTop: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <WhatsAppLogo size={16} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>iOS WhatsApp Card</span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {['dark', 'light'].map((th) => (
                <button
                  key={th}
                  type="button"
                  className={`btn btn-xs ${(activeCaption.waTheme || 'dark') === th ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => updateActiveCaptionProps({ waTheme: th })}
                  style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'capitalize' }}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Contact Name</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.waContactName || 'Mom ❤️'}
                onChange={(e) => updateActiveCaption('waContactName', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Status</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.waStatus || 'online'}
                onChange={(e) => updateActiveCaption('waStatus', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#22c55e' }}>
              <input
                type="checkbox"
                checked={activeCaption.waShowHeader !== false}
                onChange={(e) => updateActiveCaption('waShowHeader', e.target.checked)}
              />
              Show iOS Header
            </label>

            <button
              type="button"
              onClick={() => {
                const curMsgs = activeCaption.waMessages && activeCaption.waMessages.length > 0
                  ? activeCaption.waMessages
                  : [{ id: 'm1', text: activeCaption.text || '', direction: activeCaption.waDirection || 'received', time: activeCaption.waTime || '11:42 PM', ticks: activeCaption.waTicks || 'blue' }];
                const lastMsg = curMsgs[curMsgs.length - 1];
                const nextDir = lastMsg?.direction === 'sent' ? 'received' : 'sent';
                const newMsg = {
                  id: `m_${Date.now()}`,
                  text: nextDir === 'sent' ? 'Sure thing! 👍' : 'Sounds good!',
                  direction: nextDir,
                  time: '11:45 PM',
                  ticks: 'blue'
                };
                updateActiveCaptionProps({ waMessages: [...curMsgs, newMsg] });
              }}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(37, 211, 102, 0.2)',
                border: '1px solid #25d366',
                color: '#25d366',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={11} />
              <span>Add Message</span>
            </button>
          </div>

          {/* Multi-Message Conversation Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
            {((activeCaption.waMessages && activeCaption.waMessages.length > 0)
              ? activeCaption.waMessages
              : [{ id: 'm1', text: activeCaption.text || '', direction: activeCaption.waDirection || 'received', time: activeCaption.waTime || '11:42 PM', ticks: activeCaption.waTicks || 'blue' }]
            ).map((msg, index, arr) => {
              const isSent = msg.direction === 'sent';
              return (
                <div
                  key={msg.id || index}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: isSent ? '1px solid rgba(37, 211, 102, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>#{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = arr.map((m, i) => i === index ? { ...m, direction: isSent ? 'received' : 'sent' } : m);
                          updateActiveCaptionProps({ waMessages: updated, text: updated[0].text, waDirection: updated[0].direction });
                        }}
                        style={{
                          padding: '1px 6px',
                          borderRadius: '999px',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          background: isSent ? 'rgba(37, 211, 102, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                          border: isSent ? '1px solid #25d366' : '1px solid rgba(255, 255, 255, 0.2)',
                          color: isSent ? '#25d366' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        {isSent ? 'Sent (Green)' : 'Received (Slate)'}
                      </button>
                    </div>

                    {arr.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = arr.filter((_, i) => i !== index);
                          updateActiveCaptionProps({ waMessages: updated, text: updated[0].text, waDirection: updated[0].direction });
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '1px 4px' }}
                        title="Delete Message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <textarea
                    className="form-input"
                    rows={2}
                    value={msg.text || ''}
                    onChange={(e) => {
                      const updated = arr.map((m, i) => i === index ? { ...m, text: e.target.value } : m);
                      updateActiveCaptionProps({ waMessages: updated, text: updated[0].text });
                    }}
                    style={{ width: '100%', fontSize: '0.78rem', padding: '3px 6px', resize: 'vertical' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.4)' }}>Time:</span>
                      <input
                        type="text"
                        value={msg.time || '11:42 PM'}
                        onChange={(e) => {
                          const updated = arr.map((m, i) => i === index ? { ...m, time: e.target.value } : m);
                          updateActiveCaptionProps({ waMessages: updated });
                        }}
                        style={{ width: '75px', fontSize: '0.72rem', padding: '2px 4px' }}
                        className="form-input"
                      />
                    </div>

                    {isSent && (
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {['blue', 'grey', 'single'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              const updated = arr.map((m, i) => i === index ? { ...m, ticks: t } : m);
                              updateActiveCaptionProps({ waMessages: updated });
                            }}
                            style={{
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontSize: '0.62rem',
                              background: (msg.ticks || 'blue') === t ? 'rgba(83, 189, 235, 0.25)' : 'rgba(255,255,255,0.06)',
                              border: (msg.ticks || 'blue') === t ? '1px solid #53bdeb' : '1px solid transparent',
                              color: (msg.ticks || 'blue') === t ? '#53bdeb' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer'
                            }}
                          >
                            {t === 'blue' ? '✓✓' : t === 'grey' ? '✓✓' : '✓'}
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
      )}
    </>
  );
}
