// The tweet card's fields in Social Cards Studio (MemeStylesModal): name, handle, text, verified, theme.
// `s` is the modal's state and handlers.
import { User, AtSign, Dices } from 'lucide-react';
import { inputStyle, textareaStyle, inputFocusHandler, inputBlurHandler } from './fieldStyles';

export default function TweetControls({ s }) {
  const {
    setActivePersona, tweetName, setTweetName, tweetHandle, setTweetHandle, tweetText,
    setTweetText, tweetVerified, setTweetVerified, tweetTheme, setTweetTheme, handleRandomTweet,
  } = s;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
            <User size={13} style={{ color: '#ff5e36' }} /> Display Name
          </label>
          <input
            type="text"
            className="form-input"
            value={tweetName}
            onChange={(e) => {
              setTweetName(e.target.value);
              setActivePersona('custom');
            }}
            placeholder="e.g. Elon Musk"
            style={inputStyle}
            onFocus={inputFocusHandler}
            onBlur={inputBlurHandler}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
            <AtSign size={13} style={{ color: '#ff5e36' }} /> Handle
          </label>
          <input
            type="text"
            className="form-input"
            value={tweetHandle}
            onChange={(e) => {
              setTweetHandle(e.target.value);
              setActivePersona('custom');
            }}
            placeholder="e.g. @elonmusk"
            style={inputStyle}
            onFocus={inputFocusHandler}
            onBlur={inputBlurHandler}
          />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
            Tweet Text <span style={{ fontWeight: 400, opacity: 0.7 }}>{tweetText.length}/280</span>
          </label>
          <button
            type="button"
            onClick={handleRandomTweet}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#ff5e36',
              background: '#16181f',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '9999px',
              padding: '4px 12px',
              cursor: 'pointer'
            }}
          >
            <Dices size={13} strokeWidth={2.4} /> Surprise Me
          </button>
        </div>
        <textarea
          className="form-input"
          rows={3}
          value={tweetText}
          onChange={(e) => {
            setTweetText(e.target.value);
            setActivePersona('custom');
          }}
          placeholder="What's happening?"
          style={textareaStyle}
          onFocus={inputFocusHandler}
          onBlur={inputBlurHandler}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#ffffff' }}>
          <input
            type="checkbox"
            checked={tweetVerified}
            onChange={(e) => setTweetVerified(e.target.checked)}
            style={{ accentColor: '#ff5e36', width: 16, height: 16 }}
          />
          <span>Blue Verified Badge</span>
        </label>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['dark', 'dim', 'light'].map((th) => (
            <button
              key={th}
              type="button"
              className={`bs-category-btn ${tweetTheme === th ? 'active' : ''}`}
              onClick={() => setTweetTheme(th)}
              style={{ height: 28, padding: '0 10px', fontSize: '0.72rem', textTransform: 'capitalize' }}
            >
              {th}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
