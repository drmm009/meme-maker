import type { ChangeEvent } from 'react';
import { Settings, ImagePlus, MessageSquarePlus } from 'lucide-react';
import { Section, Row, ChipRow, Chip, Switch, SegmentedControl, TileGrid, Tile } from '../../ui';
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
const TICKS = [
  { value: 'blue', label: 'Read' },
  { value: 'grey', label: 'Delivered' },
  { value: 'single', label: 'Sent' },
];

// A selected social card's settings in the Text sheet (the full editor is the social card studio).
export default function CardControls({ caption, actions }: { caption: Caption; actions: EditorActions }) {
  const set = (patch: Partial<Caption>) => actions.updateActiveCaptionProps(patch);
  const platform = caption.isTweetCard ? 'tweet' : caption.isInstagramCard ? 'instagram' : 'whatsapp';

  const addMessage = () => {
    const current = caption.waMessages?.length
      ? caption.waMessages
      : [{ id: 'm1', text: caption.text || '', direction: caption.waDirection || 'received', time: caption.waTime || '11:42 PM', ticks: caption.waTicks || 'blue' }];
    const direction = current[current.length - 1]?.direction === 'sent' ? 'received' : 'sent';
    set({ waMessages: [...current, { id: `m_${Date.now()}`, text: direction === 'sent' ? 'Sounds great!' : 'Check this out!', direction, time: '11:45 PM', ticks: 'blue' }] });
  };

  const uploadPostImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set({ igPostImage: ev.target?.result });
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Section rule>
        <button type="button" className="ui-btn ie-wide-btn" onClick={() => actions.handleOpenSocialModalForActiveCard(platform)}>
          <Settings size={16} />Edit card details
        </button>
      </Section>

      <Section title="Look" rule>
        {caption.isTweetCard && (
          <>
            <Row label="Theme">
              <SegmentedControl ariaLabel="Tweet theme" variant="fill" value={caption.tweetTheme || 'dark'} options={[{ value: 'dark', label: 'Dark' }, { value: 'dim', label: 'Dim' }, { value: 'light', label: 'Light' }]} onChange={(tweetTheme) => set({ tweetTheme })} />
            </Row>
            <Row label="Verified" end>
              <Switch label="Verified badge" checked={caption.tweetVerified !== false} onChange={(on) => set({ tweetVerified: on })} />
            </Row>
            <Row label="Trend">
              <ChipRow ariaLabel="Trend">
                {TRENDS.map((t) => {
                  const preset = (TWEET_TREND_PRESETS as unknown as Record<string, { text: string; topic: string | null }>)[t.value];
                  return (
                    <Chip key={t.value} label={t.label} active={(caption.tweetTrendRank || 'viral') === t.value} onClick={() => preset && set({ tweetTrendRank: t.value, tweetMetrics: preset.text, tweetTopic: preset.topic })} />
                  );
                })}
              </ChipRow>
            </Row>
          </>
        )}

        {caption.isInstagramCard && (
          <>
            <Row label="Theme">
              <SegmentedControl ariaLabel="Instagram theme" variant="fill" value={caption.igTheme || 'dark'} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} onChange={(igTheme) => set({ igTheme, color: igTheme === 'light' ? '#262626' : '#f5f5f5' })} />
            </Row>
            <Row label="Verified" end>
              <Switch label="Verified badge" checked={caption.igVerified !== false} onChange={(on) => set({ igVerified: on })} />
            </Row>
            <Row label="Story ring" end>
              <Switch label="Story ring" checked={caption.igHasStoryRing !== false} onChange={(on) => set({ igHasStoryRing: on })} />
            </Row>
            <TileGrid columns={2}>
              <Tile label="Post photo" Icon={ImagePlus} accept="image/*" onFile={uploadPostImage} />
            </TileGrid>
          </>
        )}

        {caption.isWhatsAppCard && (
          <>
            <Row label="Theme">
              <SegmentedControl ariaLabel="WhatsApp theme" variant="fill" value={caption.waTheme || 'dark'} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} onChange={(waTheme) => set({ waTheme })} />
            </Row>
            <Row label="Ticks">
              <SegmentedControl ariaLabel="Message ticks" variant="fill" value={caption.waTicks || 'blue'} options={TICKS} onChange={(waTicks) => set({ waTicks })} />
            </Row>
            <Row label="Header" end>
              <Switch label="Chat header" checked={caption.waShowHeader !== false} onChange={(on) => set({ waShowHeader: on })} />
            </Row>
            <TileGrid columns={2}>
              <Tile label="Add message" Icon={MessageSquarePlus} onClick={addMessage} />
            </TileGrid>
          </>
        )}
      </Section>
    </>
  );
}
