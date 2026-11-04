import type { ReactNode } from 'react';
import { Sheet } from '../../ui';
import type { EditorActions } from './selection';
import './socialCardSheet.css';

interface SocialCardOption {
  id: 'instagram' | 'tweet' | 'whatsapp';
  name: string;
  desc: string;
  // The app's own mark, white on its tile.
  glyph: ReactNode;
  action: (actions: EditorActions) => void;
}

const SOCIAL_CARDS: SocialCardOption[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    desc: 'Feed post',
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
    action: (actions) => actions.handleAddInstagramCard?.(),
  },
  {
    id: 'tweet',
    name: 'X',
    desc: 'Post',
    glyph: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    action: (actions) => actions.handleAddTweetCard?.(),
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    desc: 'Chat',
    glyph: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
        <path d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z" />
        <path
          d="M9.1 7.9c.25-.35.7-.35.9-.05l.95 1.45c.15.25.1.6-.1.8l-.5.5c.55 1.05 1.35 1.85 2.4 2.4l.5-.5c.2-.2.55-.25.8-.1l1.45.95c.3.2.3.65-.05.9-.85.7-2 .85-3 .35a8.4 8.4 0 0 1-3.65-3.65c-.5-1-.35-2.15.3-3z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    ),
    action: (actions) => actions.handleAddWhatsAppCard?.(),
  },
];

// Text > Social Card: the three apps as their icons, as in a share sheet; a tap adds that app's
// card to the meme.
export default function SocialCardSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const pick = (opt: SocialCardOption) => {
    opt.action(actions);
    onClose();
  };

  return (
    <Sheet className="ie-social-sheet ie-tool-sheet" title="Social Cards" onClose={onClose}>
      <div className="ie-social-grid" role="group" aria-label="Social card options">
        {SOCIAL_CARDS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`ie-social-app ie-social-app--${opt.id}`}
            aria-label={`${opt.name} card`}
            title={`Add ${opt.name} card`}
            onClick={() => pick(opt)}
          >
            <span className="ie-social-app-icon" aria-hidden="true">{opt.glyph}</span>
            <span className="ie-social-app-name">{opt.name}</span>
            <span className="ie-social-app-desc">{opt.desc}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
