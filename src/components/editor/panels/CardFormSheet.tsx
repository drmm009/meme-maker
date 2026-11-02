import type { ReactNode } from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { Sheet, Section, SegmentedControl, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { MEME_TEMPLATES } from '../../../data/templates';
import CardControls from './CardControls';
import { useCard, platformOf } from './socialCard';
import type { Caption, Platform } from './socialCard';
import type { EditorActions } from './selection';
import './cardForm.css';

interface Message { id: string; text: string; direction: 'sent' | 'received'; time?: string; ticks?: string }

const PLATFORMS: { value: Platform; label: string; template: string }[] = [
  { value: 'tweet', label: 'X post', template: 'social-tweet-card' },
  { value: 'instagram', label: 'Instagram', template: 'social-instagram-card' },
  { value: 'whatsapp', label: 'WhatsApp', template: 'social-whatsapp-card' },
];

// Every keystroke goes straight onto the card, one undo step once typing stops (patchLayer).
function usePatchCard(card: Caption | null) {
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  return (patch: Partial<Caption>) => card && patchLayer('captions', card.id, patch);
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`ie-card-field${wide ? ' ie-card-field--wide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextField({ label, value, onChange, wide, rows }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; rows?: number }) {
  return (
    <Field label={label} wide={wide}>
      {rows
        ? <textarea className="ui-field" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className="ui-field" value={value} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

function ChatMessages({ card, set }: { card: Caption; set: (patch: Partial<Caption>) => void }) {
  const messages: Message[] = card.waMessages?.length
    ? card.waMessages
    : [{ id: 'm1', text: card.text || '', direction: card.waDirection || 'received', time: card.waTime || '11:42 PM', ticks: card.waTicks || 'blue' }];
  // The card's text follows its first message, as the studio keeps it.
  const save = (next: Message[]) => set({ waMessages: next, text: next[0]?.text || '' });
  const edit = (id: string, patch: Partial<Message>) => save(messages.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const add = () => {
    const last = messages[messages.length - 1];
    save([...messages, { id: `m_${Date.now()}`, text: '', direction: last?.direction === 'sent' ? 'received' : 'sent', time: last?.time || '11:45 PM', ticks: 'blue' }]);
  };

  return (
    <>
      <ol className="ie-card-messages" aria-label="Messages">
        {messages.map((m, i) => (
          <li key={m.id} className={`ie-card-message ie-card-message--${m.direction}`}>
            <div className="ie-card-message-head">
              <SegmentedControl
                ariaLabel={`Message ${i + 1} from`}
                variant="fill"
                value={m.direction}
                options={[{ value: 'received', label: 'Them' }, { value: 'sent', label: 'You' }]}
                onChange={(direction) => edit(m.id, { direction: direction as Message['direction'] })}
              />
              <input className="ui-field ie-card-message-time" aria-label={`Message ${i + 1} time`} value={m.time || ''} onChange={(e) => edit(m.id, { time: e.target.value })} />
              {messages.length > 1 && (
                <button type="button" className="ie-card-message-remove" aria-label={`Remove message ${i + 1}`} onClick={() => save(messages.filter((x) => x.id !== m.id))}>
                  <X size={16} />
                </button>
              )}
            </div>
            <textarea className="ui-field" rows={2} aria-label={`Message ${i + 1}`} placeholder="Type a message" value={m.text} onChange={(e) => edit(m.id, { text: e.target.value })} />
          </li>
        ))}
      </ol>
      <TileGrid columns={2}>
        <Tile label="Add message" Icon={MessageSquarePlus} onClick={add} />
      </TileGrid>
    </>
  );
}

// The Social Card maker's Details: the kind of card, then its words, names and time as a form, each
// change drawn on the card straight away. Another kind starts the maker afresh on that card.
export default function CardFormSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const card = useCard();
  const set = usePatchCard(card);
  const platform = card ? platformOf(card) : null;

  const pickPlatform = (value: string) => {
    if (value === platform) return;
    const template = MEME_TEMPLATES.find((t: { id: string }) => t.id === PLATFORMS.find((p) => p.value === value)?.template);
    if (template) actions.handleChangeMeme(template);
  };

  return (
    <Sheet className="ie-card-sheet ie-tool-sheet" title="Card details" onClose={onClose} hideTitle>
      <Section>
        <SegmentedControl ariaLabel="Card type" variant="fill" value={platform ?? ''} options={PLATFORMS} onChange={pickPlatform} />
      </Section>

      {!card && <p className="ie-empty">No social card on this meme. Pick a card type above.</p>}

      {card?.isTweetCard && (
        <Section>
          <div className="ie-card-fields">
            <TextField label="Name" value={card.tweetName || ''} onChange={(tweetName) => set({ tweetName })} />
            <TextField label="Handle" value={card.tweetHandle || ''} onChange={(tweetHandle) => set({ tweetHandle })} />
            <TextField label="Post" wide rows={3} value={card.text || ''} onChange={(text) => set({ text })} />
            <TextField label="Time" wide value={card.tweetTime || ''} onChange={(tweetTime) => set({ tweetTime })} />
          </div>
        </Section>
      )}

      {card?.isInstagramCard && (
        <Section>
          <div className="ie-card-fields">
            <TextField label="Username" value={card.igUsername || ''} onChange={(igUsername) => set({ igUsername })} />
            <TextField label="Subtitle" value={card.igSubtitle || ''} onChange={(igSubtitle) => set({ igSubtitle })} />
            <TextField label="Caption" wide rows={3} value={card.text || ''} onChange={(text) => set({ text })} />
            <TextField label="Likes" value={card.igLikesCount || ''} onChange={(igLikesCount) => set({ igLikesCount })} />
            <TextField label="Date" value={card.igTime || ''} onChange={(igTime) => set({ igTime })} />
          </div>
        </Section>
      )}

      {card?.isWhatsAppCard && (
        <Section>
          <div className="ie-card-fields">
            <TextField label="Contact" value={card.waContactName || ''} onChange={(waContactName) => set({ waContactName })} />
            <TextField label="Status" value={card.waStatus || ''} onChange={(waStatus) => set({ waStatus })} />
          </div>
          <ChatMessages card={card} set={set} />
        </Section>
      )}
    </Sheet>
  );
}

// The Social Card maker's Look: the card's theme, badges and extras (the Text sheet's card settings).
export function CardLookSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const card = useCard();
  const set = usePatchCard(card);
  return (
    <Sheet className="ie-card-sheet ie-tool-sheet" title="Card look" onClose={onClose} hideTitle>
      {card ? <CardControls caption={card} actions={actions} onChange={set} /> : <p className="ie-empty">No social card on this meme.</p>}
    </Sheet>
  );
}
