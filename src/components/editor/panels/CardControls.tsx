import type { ChangeEvent } from 'react';
import { Settings, ImagePlus, X } from 'lucide-react';
import { Section, Row, ChipRow, Chip, Switch, SegmentedControl } from '../../ui';
import { TWEET_TREND_PRESETS } from '../../canvas/draw/socialCards/tweet';
import type { EditorActions } from './selection';
import type { MemeCaption } from '../../../model/memeDocument';

type Caption = MemeCaption & Record<string, any>;

const TRENDS = [
  { value: 'viral', label: '#1 Trending' },
  { value: 'tech', label: 'Technology' },
  { value: 'meme', label: 'Memes' },
  { value: 'casual', label: 'Casual' },
];
// Each card's themes with the colours it draws them in, for the theme picker's previews.
interface ThemeOption { value: string; label: string; bg: string; fg: string }
const TWEET_THEMES: ThemeOption[] = [
  { value: 'dark', label: 'Dark', bg: '#000000', fg: '#e7e9ea' },
  { value: 'dim', label: 'Dim', bg: '#15202b', fg: '#f7f9f9' },
  { value: 'light', label: 'Light', bg: '#ffffff', fg: '#0f1419' },
];
const IG_THEMES: ThemeOption[] = [
  { value: 'dark', label: 'Dark', bg: '#000000', fg: '#f5f5f5' },
  { value: 'light', label: 'Light', bg: '#ffffff', fg: '#262626' },
];
const WA_THEMES: ThemeOption[] = [
  { value: 'dark', label: 'Dark', bg: '#0b141a', fg: '#005c4b' },
  { value: 'light', label: 'Light', bg: '#efeae2', fg: '#d9fdd3' },
];

// The card's theme as small previews of the card in each one; the picked one ringed in orange.
function ThemePicker({ ariaLabel, options, value, onChange }: { ariaLabel: string; options: ThemeOption[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="ie-card-themes" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`ie-card-theme${o.value === value ? ' is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          <span className="ie-card-theme-swatch" style={{ background: o.bg }} aria-hidden="true">
            <i style={{ background: o.fg }} />
            <i style={{ background: o.fg }} />
          </span>
          <span className="ie-card-theme-name">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

const TICKS = [
  { value: 'blue', label: 'Read' },
  { value: 'grey', label: 'Delivered' },
  { value: 'single', label: 'Sent' },
];

// A selected social card's settings in the Text sheet (the full editor is the social card studio),
// and the Social Card maker's Look, which passes `onChange` for a card that needn't be selected
// (and has its own Studio button, so no Edit card details).
export default function CardControls({
  caption,
  actions,
  onChange,
  isSheet = false,
}: {
  caption: Caption;
  actions: EditorActions;
  onChange?: (patch: Partial<Caption>) => void;
  isSheet?: boolean;
}) {
  const set = onChange ?? ((patch: Partial<Caption>) => actions.updateActiveCaptionProps(patch));
  const platform = caption.isTweetCard ? 'tweet' : caption.isInstagramCard ? 'instagram' : 'whatsapp';

  const uploadPostImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set({ igPostImage: ev.target?.result });
    reader.readAsDataURL(file);
  };

  const controls = (
    <div className="ie-card-controls">
      {caption.isTweetCard && (
        <>
          <ThemePicker ariaLabel="Tweet theme" options={TWEET_THEMES} value={caption.tweetTheme || 'dark'} onChange={(tweetTheme) => set({ tweetTheme })} />
          <div className="ie-card-controls-group">
            <Row label="Verified" end>
              <Switch
                label="Verified badge"
                checked={caption.tweetVerified !== false}
                onChange={(on) => set({ tweetVerified: on })}
              />
            </Row>
          </div>

          <div className="ie-card-controls-group">
            <Row label="Trend">
              <ChipRow ariaLabel="Trend">
                {TRENDS.map((t) => {
                  const preset = (TWEET_TREND_PRESETS as unknown as Record<string, { text: string; topic: string | null }>)[t.value];
                  return (
                    <Chip
                      key={t.value}
                      label={t.label}
                      active={(caption.tweetTrendRank || 'viral') === t.value}
                      onClick={() => preset && set({ tweetTrendRank: t.value, tweetMetrics: preset.text, tweetTopic: preset.topic })}
                    />
                  );
                })}
              </ChipRow>
            </Row>
          </div>
        </>
      )}

      {caption.isInstagramCard && (
        <>
          <ThemePicker
            ariaLabel="Instagram theme"
            options={IG_THEMES}
            value={caption.igTheme || 'dark'}
            onChange={(igTheme) => set({ igTheme, color: igTheme === 'light' ? '#262626' : '#f5f5f5' })}
          />
          <div className="ie-card-controls-group">
            <Row label="Verified" end>
              <Switch
                label="Verified badge"
                checked={caption.igVerified !== false}
                onChange={(on) => set({ igVerified: on })}
              />
            </Row>
            <Row label="Story ring" end>
              <Switch
                label="Story ring"
                checked={caption.igHasStoryRing !== false}
                onChange={(on) => set({ igHasStoryRing: on })}
              />
            </Row>
          </div>

          <div className="ie-card-photo-box">
            {caption.igPostImage ? (
              <div className="ie-card-photo-preview">
                <img className="ie-card-photo-thumb" src={caption.igPostImage} alt="Post preview" />
                <div className="ie-card-photo-meta">
                  <span className="ie-card-photo-title">Post photo</span>
                  <span className="ie-card-photo-desc">Attached to card</span>
                </div>
                <div className="ie-card-photo-actions">
                  <label className="ie-card-photo-replace" title="Replace photo">
                    Change
                    <input type="file" accept="image/*" className="ie-card-photo-input" onChange={uploadPostImage} />
                  </label>
                  <button
                    type="button"
                    className="ie-card-photo-remove"
                    aria-label="Remove post photo"
                    title="Remove post photo"
                    onClick={() => set({ igPostImage: null })}
                  >
                    <X size={15} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="ie-card-photo-uploader" title="Upload post photo">
                <ImagePlus size={18} strokeWidth={2} aria-hidden="true" />
                Upload post photo
                <input type="file" accept="image/*" className="ie-card-photo-input" onChange={uploadPostImage} />
              </label>
            )}
          </div>
        </>
      )}

      {caption.isWhatsAppCard && (
        <>
          <ThemePicker ariaLabel="WhatsApp theme" options={WA_THEMES} value={caption.waTheme || 'dark'} onChange={(waTheme) => set({ waTheme })} />
          <div className="ie-card-controls-group">
            <Row label="Ticks">
              <SegmentedControl
                ariaLabel="Message ticks"
                variant="fill"
                value={caption.waTicks || 'blue'}
                options={TICKS}
                onChange={(waTicks) => set({ waTicks })}
              />
            </Row>
            <Row label="Header" end>
              <Switch
                label="Chat header"
                checked={caption.waShowHeader !== false}
                onChange={(on) => set({ waShowHeader: on })}
              />
            </Row>
          </div>
        </>
      )}
    </div>
  );

  if (isSheet) {
    return controls;
  }

  return (
    <>
      {!onChange && (
        <Section rule>
          <button type="button" className="ui-btn ie-wide-btn" onClick={() => actions.handleOpenSocialModalForActiveCard(platform)}>
            <Settings size={16} />Edit card details
          </button>
        </Section>
      )}
      <Section title="Look" rule>
        {controls}
      </Section>
    </>
  );
}
