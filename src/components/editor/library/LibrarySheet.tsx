import { useEffect, useReducer, useState } from 'react';
import { X, FolderPlus, LayoutTemplate } from 'lucide-react';
import { Sheet, Section, SegmentedControl } from '../../ui';
import { useMemeEditorStoreApi, HISTORY_FIELDS } from '../store/useMemeEditorStore';
import { historyTimeline } from './historyTimeline';
import type { EditorActions } from '../panels/selection';
import type { MemeProjectSummary } from '../../../utils/memeDraftStore';
import './library.css';

type DocState = Record<string, unknown>;
interface EditorApi {
  getState(): DocState & { undo: () => void; redo: () => void };
  subscribe(fn: () => void): () => void;
  temporal: { getState(): { pastStates: DocState[]; futureStates: DocState[] }; subscribe(fn: () => void): () => void };
}

const pick = (state: DocState) => Object.fromEntries((HISTORY_FIELDS as string[]).map((k) => [k, state[k]]));
const when = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

// Every undo step, newest first: tap one to go back (or forward) to it.
function HistoryList() {
  const api = useMemeEditorStoreApi() as unknown as EditorApi;
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const a = api.temporal.subscribe(refresh);
    const b = api.subscribe(refresh);
    return () => {
      a();
      b();
    };
  }, [api]);
  const { pastStates, futureStates } = api.temporal.getState();
  const entries = historyTimeline(pastStates, pick(api.getState()), futureStates).reverse();
  const jump = (offset: number) => {
    for (let i = 0; i < Math.abs(offset); i++) {
      if (offset < 0) api.getState().undo();
      else api.getState().redo();
    }
  };

  if (entries.length < 2) return <p className="ie-empty">Nothing to go back to yet: your edits show up here.</p>;
  return (
    <ol className="ie-history" aria-label="History">
      {entries.map((e) => (
        <li key={e.offset}>
          <button
            type="button"
            className={`ie-history-step${e.offset === 0 ? ' is-now' : ''}${e.offset > 0 ? ' is-undone' : ''}`}
            aria-current={e.offset === 0 ? 'step' : undefined}
            onClick={() => jump(e.offset)}
          >
            <span>{e.label}</span>
            {e.offset === 0 && <span className="ie-history-now">Now</span>}
          </button>
        </li>
      ))}
    </ol>
  );
}

// Save the meme as a project (to come back to) or a template (to start new memes from), and open
// or delete the ones saved before.
function SavedMemes({ actions }: { actions: EditorActions }) {
  const [name, setName] = useState(() => actions.memeName());
  const [list, setList] = useState<MemeProjectSummary[] | null>(null);
  const [note, setNote] = useState('');
  const reload = () => actions.listProjects().then(setList).catch(() => setList([]));
  useEffect(() => {
    reload();
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (kind: 'project' | 'template') => {
    setNote('');
    actions.handleSaveProject(kind, name)
      .then((p: MemeProjectSummary) => {
        setNote(`Saved "${p.name}" to your ${kind === 'project' ? 'projects' : 'templates'}.`);
        reload();
      })
      .catch(() => setNote('Could not save here (private browsing, or the device is full).'));
  };
  const remove = (id: string) => actions.handleDeleteProject(id).then(reload);

  const grid = (kind: 'project' | 'template', empty: string) => {
    const items = (list || []).filter((p) => p.kind === kind);
    if (list && !items.length) return <p className="ie-empty">{empty}</p>;
    return (
      <ul className="ie-saved-grid" aria-label={kind === 'project' ? 'Projects' : 'Templates'}>
        {items.map((p) => (
          <li key={p.id} className="ie-saved-item">
            <button type="button" className="ie-saved-open" onClick={() => actions.handleOpenProject(p.id)} aria-label={`Open ${p.name}`}>
              {p.thumb ? <img src={p.thumb} alt="" /> : <span className="ie-saved-blank" />}
              <span className="ie-saved-name">{p.name}</span>
              <span className="ie-saved-date">{when(p.savedAt)}</span>
            </button>
            <button type="button" className="ie-style-remove" aria-label={`Delete ${p.name}`} onClick={() => remove(p.id)}><X size={12} /></button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <Section>
        <input className="ui-field" aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this meme" />
        <div className="ie-layer-actions ie-saved-actions">
          <button type="button" className="ui-btn" onClick={() => save('project')}><FolderPlus size={16} />Save project</button>
          <button type="button" className="ui-btn" onClick={() => save('template')}><LayoutTemplate size={16} />Save as template</button>
        </div>
        {note && <p className="ie-empty" role="status">{note}</p>}
      </Section>
      <Section title="Projects" rule>{grid('project', 'Saved projects show up here. Saving again with the same name updates it.')}</Section>
      <Section title="My templates" rule>{grid('template', 'Save a meme as a template to start new ones from its photo and layout.')}</Section>
    </>
  );
}

// History and saved memes, from the top bar: go back to any step, or save, open and delete memes.
export default function LibrarySheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [tab, setTab] = useState<'history' | 'saved'>('history');
  return (
    <Sheet title="History & saved" onClose={onClose}>
      <SegmentedControl ariaLabel="Show" variant="fill" value={tab} options={[{ value: 'history', label: 'History' }, { value: 'saved', label: 'My memes' }]} onChange={setTab} />
      <div className="ie-library-body">{tab === 'history' ? <HistoryList /> : <SavedMemes actions={actions} />}</div>
    </Sheet>
  );
}
