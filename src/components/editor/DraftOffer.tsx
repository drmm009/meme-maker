import { History, X } from 'lucide-react';
import type { DraftOfferInfo } from './hooks/useMemeDraft';
import './DraftOffer.css';

const timeAgo = (ms: number) => {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

// "Continue your last meme?" banner, shown under the top bar until the first edit.
export default function DraftOffer({ offer, onRestore, onDismiss }: { offer: DraftOfferInfo; onRestore: () => void; onDismiss: () => void }) {
  const details = [offer.name, `${offer.layers} ${offer.layers === 1 ? 'layer' : 'layers'}`, timeAgo(offer.savedAt)].filter(Boolean);
  return (
    <div className="meme-draft-offer" role="status">
      <History size={16} aria-hidden="true" />
      <span className="meme-draft-text">
        Continue your last meme?
        <small>{details.join(' · ')}</small>
      </span>
      <button type="button" className="meme-draft-restore" onClick={onRestore}>Restore</button>
      <button type="button" className="meme-draft-close" onClick={onDismiss} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}
