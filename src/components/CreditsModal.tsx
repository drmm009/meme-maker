import { useEffect } from 'react';
import { ExternalLink, Heart } from 'lucide-react';
import ModalPortal from './ModalPortal';
import { CREDIT_GROUPS, CREDITS_NOTE } from '../data/credits';
import './CreditsModal.css';

interface CreditsModalProps {
  onClose: () => void;
}

// Credits & licences: the packs, services, libraries and fonts behind the app (src/data/credits.ts).
export default function CreditsModal({ onClose }: CreditsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <ModalPortal>
      <div className="modal-backdrop animate-fade-in" onClick={onClose}>
        <div
          className="modal-content modal-md animate-scale-up credits-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="credits-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header flex-between align-center">
            <h3 id="credits-title" className="credits-title">
              <Heart className="icon-sm" aria-hidden="true" />
              <span>Credits &amp; licences</span>
            </h3>
            <button type="button" className="btn-close" onClick={onClose} title="Close" aria-label="Close">✕</button>
          </div>

          <p className="credits-lead">Meme Creator Studio is built on these free projects and services. Thank you to everyone who made them.</p>

          {CREDIT_GROUPS.map((group) => (
            <section key={group.title} className="credits-group ui-theme" aria-label={group.title}>
              <h4>{group.title}</h4>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <span className="credits-name">{item.name}<ExternalLink aria-hidden="true" /></span>
                      <span className="credits-what">{item.what}</span>
                    </a>
                    <span className="credits-license">{item.license}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <p className="credits-note">{CREDITS_NOTE}</p>
        </div>
      </div>
    </ModalPortal>
  );
}
