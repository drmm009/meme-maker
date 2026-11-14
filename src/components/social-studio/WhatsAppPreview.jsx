// The WhatsApp chat card as it will look on the meme (Social Cards Studio's preview, MemeStylesModal).
// `s` is the modal's state and handlers.
import { Plus, Phone, ChevronLeft, Paperclip, Camera, Mic } from 'lucide-react';
import { WHATSAPP_DOODLE_CSS_BG } from './personas';

export default function WhatsAppPreview({ s }) {
  const {
    waName, waStatus, waDatePill, waTheme, waShowHeader, waShowFooter,
    waShowDoodles, waAvatarBg, waMessages, activeWaMsgIndex, setActiveWaMsgIndex,
  } = s;

  return (
    <div
      style={{
        background: waTheme === 'light' ? '#efeae2' : '#0b141a',
        backgroundImage: waShowDoodles ? WHATSAPP_DOODLE_CSS_BG : 'none',
        backgroundRepeat: 'repeat',
        color: waTheme === 'light' ? '#111b21' : '#e9edef',
        border: waTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.10)',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {/* Authentic WhatsApp Header Bar */}
      {waShowHeader && (
        <div
          style={{
            background: waTheme === 'light' ? '#f0f2f5' : '#121b22',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: waTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Clean White Back Chevron */}
            <ChevronLeft size={18} color={waTheme === 'light' ? '#111b21' : '#ffffff'} style={{ cursor: 'pointer', flexShrink: 0 }} />

            {/* Contact Avatar */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: waAvatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#ffffff',
                fontSize: '0.84rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                border: waTheme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)',
                flexShrink: 0
              }}
            >
              {(waName || 'W').replace(/^\+91\s*/, '').charAt(0).toUpperCase() || 'W'}
            </div>

            {/* Name and Status */}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: '0.84rem', color: waTheme === 'light' ? '#111b21' : '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {waName || 'Contact Name'}
              </span>
              <span style={{ fontSize: '0.67rem', color: waStatus === 'online' ? '#25d366' : (waTheme === 'light' ? '#667781' : '#8696a0'), fontWeight: waStatus === 'online' ? 600 : 400 }}>
                {waStatus}
              </span>
            </div>
          </div>

          {/* White Outline Phone Call Icon */}
          <Phone size={16} color={waTheme === 'light' ? '#111b21' : '#ffffff'} style={{ flexShrink: 0 }} />
        </div>
      )}

      {/* Conversation Stream */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '170px', overflowY: 'auto' }}>
        {/* Centered WhatsApp Date Badge */}
        <div
          style={{
            alignSelf: 'center',
            background: waTheme === 'light' ? 'rgba(255, 255, 255, 0.92)' : '#182229',
            padding: '2px 10px',
            borderRadius: '6px',
            border: waTheme === 'light' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
            marginBottom: '2px'
          }}
        >
          <span style={{ fontSize: '0.65rem', fontWeight: 500, color: waTheme === 'light' ? '#54656f' : '#8696a0' }}>
            {waDatePill || 'Yesterday'}
          </span>
        </div>

        {/* Multi-Message Sequence with authentic speech bubble tails */}
        {waMessages.map((msg, index) => {
          const isSent = msg.direction === 'sent';
          const prevMsg = waMessages[index - 1];
          const isConsecutive = prevMsg && prevMsg.direction === msg.direction;
          const hasTail = !isConsecutive;
          const isSelected = activeWaMsgIndex === index;

          return (
            <div
              key={msg.id || index}
              onClick={() => setActiveWaMsgIndex(index)}
              style={{
                alignSelf: isSent ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                background: isSent
                  ? (waTheme === 'light' ? '#d9fdd3' : '#005c4b')
                  : (waTheme === 'light' ? '#ffffff' : '#202c33'),
                color: waTheme === 'light' ? '#111b21' : '#e9edef',
                padding: '6px 10px 4px 10px',
                borderRadius: isSent
                  ? (hasTail ? '8px 2px 8px 8px' : '8px')
                  : (hasTail ? '2px 8px 8px 8px' : '8px'),
                boxShadow: isSelected
                  ? '0 0 0 1.5px #25d366, 0 2px 6px rgba(0, 0, 0, 0.25)'
                  : '0 1px 2px rgba(0, 0, 0, 0.16)',
                position: 'relative',
                marginTop: isConsecutive ? '-2px' : '3px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={`Click to edit Message ${index + 1}`}
            >
              <div style={{ fontSize: '0.82rem', lineHeight: 1.35, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {msg.text || '...'}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  fontSize: '0.60rem',
                  color: waTheme === 'light' ? '#667781' : '#8696a0',
                  marginTop: '2px'
                }}
              >
                <span>{msg.time || '11:42 PM'}</span>
                {isSent && (
                  <span style={{ color: msg.ticks === 'grey' ? '#8696a0' : '#53bdeb', fontWeight: 700, fontSize: '0.70rem', lineHeight: 1 }}>
                    {msg.ticks === 'single' ? '✓' : '✓✓'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Authentic Modern Bottom Input Bar */}
      {waShowFooter && (
        <div
          style={{
            background: waTheme === 'light' ? '#f0f2f5' : '#0b141a',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderTop: waTheme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <Plus size={18} color={waTheme === 'light' ? '#54656f' : '#8696a0'} />
          <div
            style={{
              flex: 1,
              background: waTheme === 'light' ? '#ffffff' : '#202c33',
              borderRadius: '20px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px',
              color: '#8696a0',
              fontSize: '0.75rem'
            }}
          >
            <span>Message</span>
            <Paperclip size={13} color="#8696a0" />
          </div>
          <Camera size={16} color={waTheme === 'light' ? '#54656f' : '#8696a0'} />
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: waTheme === 'light' ? '#00a884' : '#202c33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '0.80rem'
            }}
          >
            <Mic size={13} color="#ffffff" />
          </div>
        </div>
      )}
    </div>
  );
}
