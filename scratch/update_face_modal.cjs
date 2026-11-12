const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'FaceMorphModal.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add getShortFaceName helper
const helperCode = `const getShortFaceName = (preset) => {
  if (!preset) return '';
  if (preset.id === 'user_face') return 'You';
  if (preset.id === 'gigachad') return 'Gigachad';
  if (preset.id === 'wojak') return 'Wojak';
  if (preset.id === 'trollface') return 'Trollface';
  if (preset.id === 'therock') return 'The Rock';
  if (preset.id === 'harold') return 'Harold';
  if (preset.id === 'nic_cage') return 'Nic Cage';
  if (preset.id === 'doge') return 'Doge';
  if (preset.id === 'crying_jordan') return 'Jordan';
  if (preset.id === 'pepe') return 'Pepe';
  return (preset.name || '').split('(')[0].trim();
};

`;

if (!content.includes('const getShortFaceName =')) {
  content = content.replace(
    /(import BottomSheet from '\.\/BottomSheet';[\r\n]+)/,
    `$1\n${helperCode}`
  );
}

// 2. Replace preset list
const oldPresetsRegex = /\{\/\* Quick Face Presets Strip \*\/\}[\s\S]*?<\/div>(?=\s*\{\/\* If multiple faces detected)/;

const newPresetsCode = `{/* Quick Face Presets Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '2px 4px 0',
                marginTop: '4px'
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                Choose Face
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--ui-accent, #ff5a36)'
                }}
              >
                {selectedPresetId === customFace?.id
                  ? 'Your Photo'
                  : getShortFaceName(MEME_FACE_PRESETS.find((p) => p.id === selectedPresetId) || { name: faceName })}
              </span>
            </div>

            <div
              className="horizontal-scroll-only"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                overflowX: 'auto',
                overflowY: 'hidden',
                padding: '6px 4px 10px',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {customFace && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPresetId(customFace.id);
                    setSelectedImageSrc(customFace.dataUrl);
                    setFaceName(customFace.name);
                  }}
                  style={{
                    flexShrink: 0,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'transform 0.16s ease'
                  }}
                  title="Your Uploaded Photo"
                >
                  <span
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      padding: 0,
                      overflow: 'hidden',
                      background: '#0d1017',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: selectedPresetId === customFace.id
                        ? '2.5px solid var(--ui-accent, #ff5a36)'
                        : '1.5px solid rgba(255, 255, 255, 0.16)',
                      boxShadow: selectedPresetId === customFace.id
                        ? '0 0 0 2px rgba(255, 90, 54, 0.35), 0 3px 12px rgba(255, 90, 54, 0.45)'
                        : 'none',
                      transform: selectedPresetId === customFace.id ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <img
                      src={customFace.dataUrl}
                      alt="Your Photo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        pointerEvents: 'none'
                      }}
                    />
                  </span>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: selectedPresetId === customFace.id ? 700 : 500,
                      color: selectedPresetId === customFace.id ? 'var(--ui-accent, #ff5a36)' : '#e2e8f0',
                      maxWidth: '64px',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.16s ease'
                    }}
                  >
                    Uploaded
                  </span>
                </button>
              )}

              {MEME_FACE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                const shortName = getShortFaceName(preset);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      flexShrink: 0,
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'transform 0.16s ease'
                    }}
                    title={preset.name}
                  >
                    <span
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        padding: 0,
                        overflow: 'hidden',
                        background: '#0d1017',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected
                          ? '2.5px solid var(--ui-accent, #ff5a36)'
                          : '1.5px solid rgba(255, 255, 255, 0.16)',
                        boxShadow: isSelected
                          ? '0 0 0 2px rgba(255, 90, 54, 0.35), 0 3px 12px rgba(255, 90, 54, 0.45)'
                          : 'none',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <img
                        src={getMemeFaceDataUrl(preset)}
                        alt={preset.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          pointerEvents: 'none'
                        }}
                      />
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--ui-accent, #ff5a36)' : '#e2e8f0',
                        maxWidth: '64px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.16s ease'
                      }}
                    >
                      {shortName}
                    </span>
                  </button>
                );
              })}
            </div>`;

if (oldPresetsRegex.test(content)) {
  content = content.replace(oldPresetsRegex, newPresetsCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated FaceMorphModal.jsx!');
} else {
  console.error('Failed to match oldPresetsRegex in FaceMorphModal.jsx');
  process.exit(1);
}
