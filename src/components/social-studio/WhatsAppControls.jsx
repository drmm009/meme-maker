// The WhatsApp card's fields in Social Cards Studio (MemeStylesModal): contact, the messages one by one, and the appearance options.
// `s` is the modal's state and handlers.
import { Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { inputStyle, textareaStyle, inputFocusHandler, inputBlurHandler } from './fieldStyles';

export default function WhatsAppControls({ s }) {
  const {
    setActiveWaPersona, waName, setWaName, waStatus, setWaStatus, waDatePill,
    setWaDatePill, waTheme, setWaTheme, waShowHeader, setWaShowHeader, waShowFooter,
    setWaShowFooter, waShowDoodles, setWaShowDoodles, waMessages, activeWaMsgIndex, setActiveWaMsgIndex,
    handleAddWaMessage, handleUpdateWaMessage, handleRemoveWaMessage,
  } = s;

  return (
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
  );
}
