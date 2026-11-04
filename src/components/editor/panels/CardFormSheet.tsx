import { CheckCheck, Check, Clock, Heart, Plus, X } from 'lucide-react';
import { Sheet, SegmentedControl } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import CardControls from './CardControls';
import { useCard, platformOf } from './socialCard';
import type { Caption, Platform } from './socialCard';
import type { EditorActions } from './selection';
import './cardForm.css';

interface Message {
  id: string;
  text: string;
  direction: 'sent' | 'received';
  time?: string;
  ticks?: string;
}

const PLATFORM_NAMES: Record<Platform, string> = {
  tweet: 'X post',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
};

const POST_LIMIT = 280;

// Every keystroke goes straight onto the card, one undo step once typing stops (patchLayer).
function usePatchCard(card: Caption | null) {
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  return (patch: Partial<Caption>) => card && patchLayer('captions', card.id, patch);
}

// A round avatar with the name's first letter, as the card draws a missing photo.
function Avatar({ name, ring }: { name: string; ring?: boolean }) {
  return (
    <span className={`ie-cf-avatar${ring ? ' ie-cf-avatar--ring' : ''}`} aria-hidden="true">
      <span>{(name.trim()[0] || '?').toUpperCase()}</span>
    </span>
  );
}

// A borderless field that reads like the card's own text; `kind` sets its weight.
function Bare({
  label,
  value,
  onChange,
  placeholder,
  kind = 'body',
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  kind?: 'name' | 'sub' | 'body' | 'meta';
  rows?: number;
}) {
  const className = `ie-cf-input ie-cf-input--${kind}`;
  return rows ? (
    <textarea className={className} rows={rows} aria-label={label} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <input className={className} aria-label={label} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  );
}

// X: the post as the composer shows it, name and handle beside the avatar, the post under them.
function TweetForm({ card, set }: { card: Caption; set: (patch: Partial<Caption>) => void }) {
  const text = card.text || '';
  return (
    <div className="ie-cf-card ie-cf-card--tweet" data-theme={card.tweetTheme || 'dark'}>
      <div className="ie-cf-who">
        <Avatar name={card.tweetName || ''} />
        <div className="ie-cf-who-text">
          <Bare label="Name" kind="name" placeholder="Name" value={card.tweetName || ''} onChange={(tweetName) => set({ tweetName })} />
          <Bare label="Handle" kind="sub" placeholder="@handle" value={card.tweetHandle || ''} onChange={(tweetHandle) => set({ tweetHandle })} />
        </div>
      </div>
      <Bare label="Post" rows={3} placeholder="What's happening?" value={text} onChange={(t) => set({ text: t })} />
      <div className="ie-cf-foot">
        <label className="ie-cf-meta">
          <Clock size={15} strokeWidth={2} aria-hidden="true" />
          <Bare label="Time" kind="meta" placeholder="10:42 PM · Oct 8, 2026" value={card.tweetTime || ''} onChange={(tweetTime) => set({ tweetTime })} />
        </label>
        <span className={`ie-cf-count${text.length > POST_LIMIT ? ' is-over' : ''}`}>{text.length}/{POST_LIMIT}</span>
      </div>
    </div>
  );
}

// Instagram: the post's header (avatar in its story ring, username, subtitle), caption, then likes and date.
function InstagramForm({ card, set }: { card: Caption; set: (patch: Partial<Caption>) => void }) {
  return (
    <div className="ie-cf-card ie-cf-card--instagram" data-theme={card.igTheme || 'dark'}>
      <div className="ie-cf-who">
        <Avatar name={card.igUsername || ''} ring={card.igHasStoryRing !== false} />
        <div className="ie-cf-who-text">
          <Bare label="Username" kind="name" placeholder="username" value={card.igUsername || ''} onChange={(igUsername) => set({ igUsername })} />
          <Bare label="Subtitle" kind="sub" placeholder="Location or Sponsored" value={card.igSubtitle || ''} onChange={(igSubtitle) => set({ igSubtitle })} />
        </div>
      </div>
      <Bare label="Caption" rows={3} placeholder="Write a caption..." value={card.text || ''} onChange={(text) => set({ text })} />
      <div className="ie-cf-foot">
        <label className="ie-cf-meta">
          <Heart size={15} strokeWidth={2} aria-hidden="true" />
          <Bare label="Likes" kind="meta" placeholder="1,420 likes" value={card.igLikesCount || ''} onChange={(igLikesCount) => set({ igLikesCount })} />
        </label>
        <label className="ie-cf-meta">
          <Clock size={15} strokeWidth={2} aria-hidden="true" />
          <Bare label="Date" kind="meta" placeholder="2 hours ago" value={card.igTime || ''} onChange={(igTime) => set({ igTime })} />
        </label>
      </div>
    </div>
  );
}

// WhatsApp: the chat's header, then the messages as bubbles on the chat wallpaper, yours on the right.
function WhatsAppForm({ card, set }: { card: Caption; set: (patch: Partial<Caption>) => void }) {
  const messages: Message[] = card.waMessages?.length
    ? card.waMessages
    : [{ id: 'm1', text: card.text || '', direction: card.waDirection || 'received', time: card.waTime || '11:42 PM', ticks: card.waTicks || 'blue' }];
  // The card's text follows its first message, as the studio keeps it.
  const save = (next: Message[]) => set({ waMessages: next, text: next[0]?.text || '' });
  const edit = (id: string, patch: Partial<Message>) => save(messages.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const add = () => {
    const last = messages[messages.length - 1];
    save([
      ...messages,
      {
        id: `m_${Date.now()}`,
        text: '',
        direction: last?.direction === 'sent' ? 'received' : 'sent',
        time: last?.time || '11:45 PM',
        ticks: 'blue',
      },
    ]);
  };
  const ticks = card.waTicks || 'blue';
  const Tick = ticks === 'single' ? Check : CheckCheck;

  return (
    <div className="ie-cf-card ie-cf-card--whatsapp" data-theme={card.waTheme || 'dark'}>
      <div className="ie-cf-who ie-cf-who--chat">
        <Avatar name={card.waContactName || ''} />
        <div className="ie-cf-who-text">
          <Bare label="Contact" kind="name" placeholder="Contact name" value={card.waContactName || ''} onChange={(waContactName) => set({ waContactName })} />
          <Bare label="Status" kind="sub" placeholder="online" value={card.waStatus || ''} onChange={(waStatus) => set({ waStatus })} />
        </div>
      </div>
      <ol className="ie-cf-chat" aria-label="Messages">
        {messages.map((m, i) => (
          <li key={m.id} className={`ie-cf-msg ie-cf-msg--${m.direction}`}>
            <div className="ie-cf-bubble">
              <Bare label={`Message ${i + 1}`} rows={2} placeholder="Message" value={m.text} onChange={(text) => edit(m.id, { text })} />
              <span className="ie-cf-bubble-meta">
                <Bare label={`Message ${i + 1} time`} kind="meta" placeholder="11:42 PM" value={m.time || ''} onChange={(time) => edit(m.id, { time })} />
                {m.direction === 'sent' && <Tick size={15} strokeWidth={2.2} className={`ie-cf-tick ie-cf-tick--${ticks}`} aria-hidden="true" />}
              </span>
            </div>
            <div className="ie-cf-msg-tools">
              <SegmentedControl
                ariaLabel={`Message ${i + 1} from`}
                value={m.direction}
                options={[
                  { value: 'received', label: 'Them' },
                  { value: 'sent', label: 'You' },
                ]}
                onChange={(direction) => edit(m.id, { direction: direction as Message['direction'] })}
              />
              {messages.length > 1 && (
                <button
                  type="button"
                  className="ie-card-message-remove"
                  aria-label={`Remove message ${i + 1}`}
                  title="Remove message"
                  onClick={() => save(messages.filter((x) => x.id !== m.id))}
                >
                  <X size={14} strokeWidth={2.4} aria-hidden="true" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="ie-card-add-msg-btn" onClick={add}>
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
        Add message
      </button>
    </div>
  );
}

// The Social Card maker's Details: the card's words, names and time laid out like the app itself,
// in the card's theme, each change drawn on the card straight away.
export default function CardFormSheet({ actions: _actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const card = useCard();
  const set = usePatchCard(card);
  const platform = card ? platformOf(card) : null;
  const title = platform ? PLATFORM_NAMES[platform] : 'Card details';

  return (
    <Sheet
      className="ie-card-sheet ie-tool-sheet"
      title={title}
      ariaLabel="Card details"
      badge={card ? 'Details' : undefined}
      onClose={onClose}
    >
      {!card && <p className="ie-empty">No social card on this meme. Add one from the Text &gt; Social Card menu.</p>}
      {card?.isTweetCard && <TweetForm card={card} set={set} />}
      {card?.isInstagramCard && <InstagramForm card={card} set={set} />}
      {card?.isWhatsAppCard && <WhatsAppForm card={card} set={set} />}
    </Sheet>
  );
}

// The Social Card maker's Look: the card's theme, badges and extras (the Text sheet's card settings).
export function CardLookSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const card = useCard();
  const set = usePatchCard(card);
  const platform = card ? platformOf(card) : null;
  const title = platform ? PLATFORM_NAMES[platform] : 'Card look';

  return (
    <Sheet
      className="ie-card-sheet ie-card-look-sheet ie-tool-sheet"
      title={title}
      ariaLabel="Card look"
      badge={card ? 'Look' : undefined}
      onClose={onClose}
    >
      {card ? (
        <CardControls caption={card} actions={actions} onChange={set} isSheet />
      ) : (
        <p className="ie-empty">No social card on this meme.</p>
      )}
    </Sheet>
  );
}
