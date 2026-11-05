import React, { useEffect, useMemo, useState } from 'react';
import { Check, Download, FolderHeart, Share2, X } from 'lucide-react';
import { canShareFile, downloadBlob, shareFile } from '../../utils/shareFile';

// Shown when an export finishes: a preview, then share (phones) or download, and save to My Studio
// (the project and this file, to play, share or edit again later).
export default function ExportReadyCard({ result, onClose, onSaveToStudio }) {
  const { blob, fileName } = result;
  const isGif = blob.type === 'image/gif';
  const file = useMemo(() => new File([blob], fileName, { type: blob.type }), [blob, fileName]);
  const shareable = canShareFile(file);
  const [note, setNote] = useState(null);
  const [inStudio, setInStudio] = useState(false);

  // The preview URL is made and revoked in one effect (React may run effects twice in development).
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  const share = async () => {
    try {
      const outcome = await shareFile(file, { title: isGif ? 'My meme GIF' : 'My meme video' });
      if (outcome === 'unsupported') downloadBlob(blob, fileName);
    } catch {
      setNote('Sharing failed, so the file was saved instead.');
      downloadBlob(blob, fileName);
    }
  };

  const save = () => {
    downloadBlob(blob, fileName);
    setNote('Saved to your downloads.');
  };

  return (
    <div className="vt-ready" role="dialog" aria-label={isGif ? 'GIF ready' : 'Video ready'}>
      <div className="vt-ready-card">
        <button type="button" className="vt-ready-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="vt-ready-preview">
          {url && (isGif
            ? <img src={url} alt="Exported GIF" />
            : <video src={url} autoPlay muted loop playsInline />)}
        </div>
        <p className="vt-ready-title">{isGif ? 'Your GIF is ready' : 'Your video is ready'}</p>
        <p className="vt-ready-sub">{note || `${(blob.size / (1024 * 1024)).toFixed(1)} MB · ${fileName}`}</p>
        <div className="vt-ready-actions">
          {shareable && (
            <button type="button" className="vt-ready-btn is-primary" onClick={share}><Share2 size={17} /> Share</button>
          )}
          <button type="button" className={`vt-ready-btn${shareable ? '' : ' is-primary'}`} onClick={save}><Download size={17} /> Download</button>
        </div>
        {onSaveToStudio && (
          <button
            type="button"
            className="vt-ready-btn vt-ready-studio"
            disabled={inStudio}
            onClick={() => { setInStudio(true); onSaveToStudio(); }}
          >
            {inStudio ? <><Check size={17} /> In My Studio</> : <><FolderHeart size={17} /> Save to My Studio</>}
          </button>
        )}
      </div>
    </div>
  );
}
