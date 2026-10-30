import { useEffect, useReducer, useState } from 'react';
import { X, FolderPlus, LayoutTemplate, Pencil } from 'lucide-react';
import { Sheet, Section, SegmentedControl } from '../../ui';
import { useMemeEditorStoreApi, HISTORY_FIELDS } from '../store/useMemeEditorStore';
import { historyTimeline } from './historyTimeline';
import { freeName } from './freeName';
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

type Kind = 'project' | 'template';

// Save the meme as a project (to come back to) or a template (to start new memes from), and open,
// rename or delete the ones saved before. Saving under a name already used asks first.
function SavedMemes({ actions }: { actions: EditorActions }) {
  const [name, setName] = useState(() => actions.memeName());
  const [list, setList] = useState<MemeProjectSummary[] | null>(null);
  const [note, setNote] = useState('');
  const [clash, setClash] = useState<{ kind: Kind; name: string } | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const reload = () => actions.listProjects().then(setList).catch(() => setList([]));
  useEffect(() => {
    reload();
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const namesOf = (kind: Kind) => (list || []).filter((p) => p.kind === kind).map((p) => p.name);
  const write = (kind: Kind, as: string) => {
    setNote('');
    setClash(null);
    actions.handleSaveProject(kind, as)
      .then((p: MemeProjectSummary) => {
        setNote(`Saved "${p.name}" to your ${kind === 'project' ? 'projects' : 'templates'}.`);
        reload();
      })
      .catch(() => setNote('Could not save here (private browsing, or the device is full).'));
  };
  const save = (kind: Kind) => {
    const wanted = name.trim() || 'My meme';
    if (namesOf(kind).includes(wanted)) setClash({ kind, name: wanted });
    else write(kind, wanted);
  };
  const remove = (id: string) => actions.handleDeleteProject(id).then(reload);
  const finishRename = () => {
    const r = renaming;
    setRenaming(null);
    const item = (list || []).find((p) => p.id === r?.id);
    const next = r?.name.trim();
    if (!r || !item || !next || next === item.name) return;
    actions.handleRenameProject(r.id, freeName(next, namesOf(item.kind).filter((n) => n !== item.name))).then(reload);
  };

  const grid = (kind: Kind, empty: string) => {
    const items = (list || []).filter((p) => p.kind === kind);
    if (list && !items.length) return <p className="ie-empty">{empty}</p>;
    return (
      <ul className="ie-saved-grid" aria-label={kind === 'project' ? 'Projects' : 'Templates'}>
        {items.map((p) => (
          <li key={p.id} className="ie-saved-item">
            {renaming?.id === p.id ? (
              <div className="ie-saved-open">
                {p.thumb ? <img src={p.thumb} alt="" /> : <span className="ie-saved-blank" />}
                <input
                  className="ui-field ie-saved-rename"
                  aria-label={`New name for ${p.name}`}
                  value={renaming.name}
                  autoFocus
                  onChange={(e) => setRenaming({ id: p.id, name: e.target.value })}
                  onBlur={finishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishRename();
                    if (e.key === 'Escape') setRenaming(null);
                  }}
                />
              </div>
            ) : (
              <button type="button" className="ie-saved-open" onClick={() => actions.handleOpenProject(p.id)} aria-label={`Open ${p.name}`}>
                {p.thumb ? <img src={p.thumb} alt="" /> : <span className="ie-saved-blank" />}
                <span className="ie-saved-name">{p.name}</span>
                <span className="ie-saved-date">{when(p.savedAt)}</span>
              </button>
            )}
            <button type="button" className="ie-style-remove" aria-label={`Delete ${p.name}`} onClick={() => remove(p.id)}><X size={12} /></button>
            <button type="button" className="ie-saved-edit" aria-label={`Rename ${p.name}`} onClick={() => setRenaming({ id: p.id, name: p.name })}><Pencil size={12} /></button>
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
        {clash && (
          <div className="ie-saved-clash" role="alertdialog" aria-label="Name already used">
            <p className="ie-empty">You already have a {clash.kind} called &quot;{clash.name}&quot;.</p>
            <div className="ie-layer-actions">
              <button type="button" className="ui-btn ui-btn--danger" onClick={() => write(clash.kind, clash.name)}>Replace it</button>
              <button type="button" className="ui-btn" onClick={() => write(clash.kind, freeName(clash.name, namesOf(clash.kind)))}>Keep both</button>
              <button type="button" className="ui-btn" onClick={() => setClash(null)}>Cancel</button>
            </div>
          </div>
        )}
        {note && <p className="ie-empty" role="status">{note}</p>}
      </Section>
      <Section title="Projects" rule>{grid('project', 'Saved projects show up here.')}</Section>
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
