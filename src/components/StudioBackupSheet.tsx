// My Studio's Backup sheet (its header's backup button opens it). Saves live only in this browser,
// so clearing site data or a new phone loses them; this keeps them as one file. Two rows: Back up
// everything (one .memestudio file, shared on a phone through the share sheet so it can go to Drive
// or Files, downloaded elsewhere) and Restore from a backup (pick the file; its saves come back, one
// with the same id as a save here replacing it). A line under them says what happened. In the
// pages' iOS look (pages/iosLook.css, studioBackupSheet.css): from the bottom on a phone, centred on
// a wide screen; Escape or a tap outside closes it.
import { useEffect, useRef, useState } from 'react';
import { DatabaseBackup, HardDriveDownload, HardDriveUpload } from 'lucide-react';
import ModalPortal from './ModalPortal';
import { BACKUP_EXTENSION, BackupError } from '../model/studioBackup';
import { backUpStudio, restoreStudio } from '../utils/studioBackupStore';
import { canShareFile, downloadBlob, shareFile } from '../utils/shareFile';
import './pages/iosLook.css';
import './studioBackupSheet.css';

type Status = { tone: 'busy' | 'done' | 'error'; text: string } | null;

const saves = (n: number) => `${n} ${n === 1 ? 'save' : 'saves'}`;

// A phone hands the file to its share sheet (Drive, Files…); a computer just downloads it.
async function keepFile(blob: Blob, fileName: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], fileName, { type: 'application/octet-stream' });
  const touch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  if (touch && canShareFile(file)) {
    const result = await shareFile(file, { title: 'Meme Studio backup' }).catch(() => 'unsupported');
    if (result === 'shared') return 'shared';
    if (result === 'cancelled') return 'cancelled';
  }
  downloadBlob(blob, fileName);
  return 'downloaded';
}

export default function StudioBackupSheet({ open, onClose, saveCount, onRestored }: {
  open: boolean;
  onClose: () => void;
  // How many saves My Studio has now.
  saveCount: number;
  // After a restore, so My Studio lists what came back.
  onRestored: () => void;
}) {
  const [status, setStatus] = useState<Status>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const busy = status?.tone === 'busy';

  useEffect(() => {
    if (!open) return undefined;
    setStatus(null);
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const backUp = async () => {
    setStatus({ tone: 'busy', text: 'Making your backup…' });
    try {
      const { blob, fileName, count } = await backUpStudio();
      const kept = await keepFile(blob, fileName);
      setStatus(kept === 'cancelled'
        ? null
        : { tone: 'done', text: `Backed up ${saves(count)} to ${fileName}.` });
    } catch {
      setStatus({ tone: 'error', text: 'The backup could not be made. Try again.' });
    }
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    setStatus({ tone: 'busy', text: 'Restoring…' });
    try {
      const count = await restoreStudio(file);
      onRestored();
      setStatus({ tone: 'done', text: count ? `Restored ${saves(count)}.` : 'That backup has no saves in it.' });
    } catch (e) {
      setStatus({ tone: 'error', text: e instanceof BackupError ? e.message : 'The backup could not be restored. Try again.' });
    }
  };

  return (
    <ModalPortal>
      <div className="ios ios-layer sb-backdrop" onClick={busy ? undefined : onClose} role="presentation">
        <div
          className="sb-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sb-title"
          aria-describedby="sb-about"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sb-grabber" aria-hidden="true" />
          <span className="sb-mark" aria-hidden="true"><DatabaseBackup strokeWidth={2} /></span>
          <h2 className="sb-title" id="sb-title">Backup</h2>
          <p className="sb-about" id="sb-about">
            Your saves live only on this device. Keep a backup file somewhere safe, like Google Drive,
            to bring them back after clearing the browser or on a new phone.
          </p>
          <div className="sb-group">
            <button ref={firstRef} type="button" className="sb-row" onClick={backUp} disabled={busy || saveCount === 0}>
              <span className="sb-row-icon sb-row-icon--save" aria-hidden="true"><HardDriveDownload strokeWidth={2.1} /></span>
              <span className="sb-row-text">
                <span className="sb-row-label">Back up everything</span>
                <span className="sb-row-about">{saveCount ? `${saves(saveCount)} in one file` : 'Nothing saved yet'}</span>
              </span>
            </button>
            <button type="button" className="sb-row" onClick={() => fileRef.current?.click()} disabled={busy}>
              <span className="sb-row-icon sb-row-icon--restore" aria-hidden="true"><HardDriveUpload strokeWidth={2.1} /></span>
              <span className="sb-row-text">
                <span className="sb-row-label">Restore from a backup</span>
                <span className="sb-row-about">Bring back saves from a {BACKUP_EXTENSION} file</span>
              </span>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={`${BACKUP_EXTENSION},application/octet-stream`}
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              restore(file);
            }}
          />
          <p className={`sb-status${status ? ` sb-status--${status.tone}` : ''}`} role="status" aria-live="polite">
            {status?.text}
          </p>
        </div>
      </div>
    </ModalPortal>
  );
}
