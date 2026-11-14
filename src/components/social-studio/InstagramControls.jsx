// The Instagram card's fields in Social Cards Studio (MemeStylesModal): username, caption, counts and the More options section.
// `s` is the modal's state and handlers.
import { User, Sparkles, Dices, MessageCircle, Repeat, Heart, Send, ChevronDown } from 'lucide-react';
import { InstagramVerifiedBadge } from './badges';
import { inputStyle, textareaStyle, inputFocusHandler, inputBlurHandler } from './fieldStyles';

export default function InstagramControls({ s }) {
  const {
    setActiveIgPersona, igUsername, setIgUsername, igSubtitle, setIgSubtitle, igText,
    setIgText, igVerified, setIgVerified, igHasStoryRing, setIgHasStoryRing, igLikesCount,
    setIgLikesCount, igCommentsCount, setIgCommentsCount, igRepostsCount, setIgRepostsCount, igSharesCount,
    setIgSharesCount, igTopCommentUser, setIgTopCommentUser, igTopCommentText, setIgTopCommentText, igTime,
    setIgTime, igShowTranslation, setIgShowTranslation, igTheme, setIgTheme, showIgMoreOptions,
    setShowIgMoreOptions, handleRandomIgCaption,
  } = s;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Row 1: Username & Subtitle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
            <User size={12} style={{ color: '#ff5e36' }} /> Username
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              value={igUsername}
              onChange={(e) => {
                setIgUsername(e.target.value);
                setActiveIgPersona('custom');
              }}
              placeholder="e.g. 3am.thoughts"
              style={{ ...inputStyle, paddingRight: '40px' }}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
            <button
              type="button"
              onClick={() => setIgVerified(!igVerified)}
              title={igVerified ? 'Verified (tap to toggle)' : 'Unverified (tap to toggle)'}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                opacity: igVerified ? 1 : 0.25,
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <InstagramVerifiedBadge size={16} />
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
            <Sparkles size={12} style={{ color: '#ff5e36' }} /> Subtitle
          </label>
          <input
            type="text"
            className="form-input"
            value={igSubtitle}
            onChange={(e) => {
              setIgSubtitle(e.target.value);
              setActiveIgPersona('custom');
            }}
            placeholder="e.g. Suggested for you"
            style={inputStyle}
            onFocus={inputFocusHandler}
            onBlur={inputBlurHandler}
          />
        </div>
      </div>

      {/* Row 2: Caption (Hero text) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
            Caption
          </label>
          <button
            type="button"
            onClick={handleRandomIgCaption}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.70rem',
              fontWeight: 700,
              color: '#ff5e36',
              background: '#16181f',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9999px',
              padding: '3px 10px',
              cursor: 'pointer'
            }}
          >
            <Dices size={12} strokeWidth={2.4} /> Surprise Me
          </button>
        </div>
        <textarea
          className="form-input"
          rows={2}
          value={igText}
          onChange={(e) => {
            setIgText(e.target.value);
            setActiveIgPersona('custom');
          }}
          placeholder="Write an Instagram caption..."
          style={{ ...textareaStyle, minHeight: '62px' }}
          onFocus={inputFocusHandler}
          onBlur={inputBlurHandler}
        />
      </div>

      {/* Row 3: Minimalist Inline Engagement Bar (4 icons + compact counts in 1 row) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
            Metrics
          </label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setIgTheme('light')}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 600,
                background: igTheme === 'light' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: igTheme === 'light' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                color: igTheme === 'light' ? '#ffffff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer'
              }}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setIgTheme('dark')}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 600,
                background: igTheme === 'dark' ? 'rgba(255, 94, 54, 0.25)' : 'transparent',
                border: igTheme === 'dark' ? '1px solid #ff5e36' : '1px solid transparent',
                color: igTheme === 'dark' ? '#ff5e36' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer'
              }}
            >
              Dark
            </button>
          </div>
        </div>

        {/* 4 compact metric inputs side-by-side in one sleek row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Heart size={13} style={{ position: 'absolute', left: '10px', color: '#ff3040', fill: '#ff3040', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              value={igLikesCount}
              onChange={(e) => setIgLikesCount(e.target.value)}
              placeholder="1,583"
              title="Likes Count"
              style={{ ...inputStyle, height: '38px', padding: '0 8px 0 28px', fontSize: '0.80rem', fontWeight: 600, textAlign: 'left' }}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MessageCircle size={13} style={{ position: 'absolute', left: '10px', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              value={igCommentsCount}
              onChange={(e) => setIgCommentsCount(e.target.value)}
              placeholder="15"
              title="Comments Count"
              style={{ ...inputStyle, height: '38px', padding: '0 8px 0 28px', fontSize: '0.80rem', fontWeight: 600, textAlign: 'left' }}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Repeat size={13} style={{ position: 'absolute', left: '10px', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              value={igRepostsCount}
              onChange={(e) => setIgRepostsCount(e.target.value)}
              placeholder="15"
              title="Reposts Count"
              style={{ ...inputStyle, height: '38px', padding: '0 8px 0 28px', fontSize: '0.80rem', fontWeight: 600, textAlign: 'left' }}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Send size={12} style={{ position: 'absolute', left: '10px', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text"
              value={igSharesCount}
              onChange={(e) => setIgSharesCount(e.target.value)}
              placeholder="295"
              title="Shares Count"
              style={{ ...inputStyle, height: '38px', padding: '0 8px 0 28px', fontSize: '0.80rem', fontWeight: 600, textAlign: 'left' }}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
          </div>
        </div>
      </div>

      {/* Row 4: More Options disclosure */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '2px' }}>
        <button
          type="button"
          onClick={() => setShowIgMoreOptions(!showIgMoreOptions)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: showIgMoreOptions ? '#ff5e36' : 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.70rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 4px'
          }}
        >
          <span>{showIgMoreOptions ? 'Fewer options' : 'More options'}</span>
          <ChevronDown
            size={12}
            style={{
              transform: showIgMoreOptions ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>
      </div>

      {/* Collapsible Advanced Section (Timestamp, Pinned Comment, Translation, Story Ring) */}
      {showIgMoreOptions && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Timestamp */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                Timestamp
              </label>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[
                  { short: '28 Sep', full: '28 September' },
                  { short: '5h', full: '5 hours ago' },
                  { short: '1d', full: '1 day ago' }
                ].map((t) => (
                  <button
                    key={t.short}
                    type="button"
                    onClick={() => setIgTime(t.full)}
                    style={{
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: igTime === t.full ? 'rgba(255, 94, 54, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: igTime === t.full ? '1px solid #ff5e36' : '1px solid transparent',
                      color: igTime === t.full ? '#ff5e36' : 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.62rem',
                      cursor: 'pointer'
                    }}
                  >
                    {t.short}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              className="form-input"
              value={igTime}
              onChange={(e) => setIgTime(e.target.value)}
              placeholder="e.g. 28 September"
              style={{ ...inputStyle, height: '38px', fontSize: '0.82rem' }}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
          </div>

          {/* Optional Pinned Comment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>
                Top Commenter (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                value={igTopCommentUser}
                onChange={(e) => setIgTopCommentUser(e.target.value)}
                placeholder="e.g. cristiano"
                style={{ ...inputStyle, height: '38px', fontSize: '0.82rem' }}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>
                Comment Text
              </label>
              <input
                type="text"
                className="form-input"
                value={igTopCommentText}
                onChange={(e) => setIgTopCommentText(e.target.value)}
                placeholder="e.g. AGI when? 😂👏"
                style={{ ...inputStyle, height: '38px', fontSize: '0.82rem' }}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              />
            </div>
          </div>

          {/* Secondary Toggles (Story Ring & Translation) */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
              <input
                type="checkbox"
                checked={igHasStoryRing}
                onChange={(e) => setIgHasStoryRing(e.target.checked)}
                style={{ accentColor: '#ff5e36', width: 14, height: 14 }}
              />
              <span>Story Ring</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
              <input
                type="checkbox"
                checked={igShowTranslation}
                onChange={(e) => setIgShowTranslation(e.target.checked)}
                style={{ accentColor: '#ff5e36', width: 14, height: 14 }}
              />
              <span>Show "See translation" link</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
