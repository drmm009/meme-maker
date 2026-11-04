import { Sheet } from '../../ui';
import type { EditorActions } from './selection';
import './socialCardSheet.css';

interface SocialCardOption {
  id: 'instagram' | 'tweet' | 'whatsapp';
  name: string;
  badge: string;
  desc: string;
  imageUrl: string;
  badgeBg: string;
  badgeColor: string;
  action: (actions: EditorActions) => void;
}

const SOCIAL_CARDS: SocialCardOption[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    badge: 'Instagram',
    desc: 'Feed Post',
    imageUrl: './images/social-instagram-card.svg',
    badgeBg: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    badgeColor: '#ffffff',
    action: (actions) => actions.handleAddInstagramCard?.(),
  },
  {
    id: 'tweet',
    name: 'X',
    badge: '𝕏 Post',
    desc: 'Tweet Card',
    imageUrl: './images/social-tweet-card.svg',
    badgeBg: 'rgba(29, 155, 240, 0.95)',
    badgeColor: '#ffffff',
    action: (actions) => actions.handleAddTweetCard?.(),
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    badge: 'WhatsApp',
    desc: 'Chat Card',
    imageUrl: './images/social-whatsapp-card.svg',
    badgeBg: 'rgba(37, 211, 102, 0.95)',
    badgeColor: '#000000',
    action: (actions) => actions.handleAddWhatsAppCard?.(),
  },
];

// Text > Social Card: Opens bottom sheet with 3 buttons: Instagram, X, and WhatsApp.
// Tapping any option adds that card directly onto the canvas.
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
            className={`ie-social-card-item ie-social-card--${opt.id}`}
            aria-label={`${opt.name} card`}
            title={`Add ${opt.name} card`}
            onClick={() => pick(opt)}
          >
            <div className="ie-social-card-stage">
              <img src={opt.imageUrl} alt={opt.name} className="ie-social-card-img" />
              <span className="ie-social-card-badge" style={{ background: opt.badgeBg, color: opt.badgeColor }}>
                {opt.badge}
              </span>
            </div>
            <div className="ie-social-card-label-row">
              <span className="ie-social-card-name">{opt.name}</span>
              <span className="ie-social-card-desc">{opt.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
