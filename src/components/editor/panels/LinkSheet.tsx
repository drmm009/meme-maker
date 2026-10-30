import { useState } from 'react';
import { Link2 } from 'lucide-react';
import { Sheet, Section } from '../../ui';
import { IMAGE_LINK_MESSAGES } from '../../../utils/imageFromLink';
import type { ImageLinkProblem } from '../../../utils/imageFromLink';
import type { EditorActions } from './selection';

// Media > Link: paste or type a picture's (or video's) web address to add it to the meme.
export default function LinkSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const add = () => {
    setBusy(true);
    setProblem('');
    actions.addMediaLink(link)
      .then(() => onClose())
      .catch((e: { problem?: ImageLinkProblem }) => setProblem(e?.problem ? IMAGE_LINK_MESSAGES[e.problem] : 'That link couldn\'t be added.'))
      .finally(() => setBusy(false));
  };

  return (
    <Sheet title="Add from a link" hideTitle onClose={onClose}>
      <Section>
        <input
          className="ui-field"
          type="url"
          inputMode="url"
          aria-label="Picture link"
          placeholder="https://… (a picture or video)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && link.trim() && !busy) add();
          }}
        />
        <div className="ie-layer-actions ie-saved-actions">
          <button type="button" className="ui-btn-accent" disabled={!link.trim() || busy} onClick={add}>
            <Link2 size={16} />{busy ? 'Adding…' : 'Add'}
          </button>
        </div>
        {problem && <p className="ie-empty" role="alert">{problem}</p>}
        <p className="ie-empty">You can also paste a link, or drop a picture or link on the meme.</p>
      </Section>
    </Sheet>
  );
}
