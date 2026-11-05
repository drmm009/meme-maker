import { useEffect, useRef, useState } from 'react';
import { SwitchCamera, X } from 'lucide-react';
import { canRecordCamera, openCamera, startCameraRecording, stopStream } from '../../utils/cameraRecorder';
import type { CameraRecording, Facing } from '../../utils/cameraRecorder';
import { formatClock } from './timeline/timelineMath';

// Recordings stop on their own after this long.
export const MAX_RECORDING_MS = 60000;

type Phase = 'opening' | 'ready' | 'recording' | 'saving' | 'error';

// Media > Video > Camera: a full-screen camera with a live preview, record/stop, a timer and a
// front/back switch. A finished recording is handed to onDone and the sheet closes.
export default function CameraSheet({ onDone, onClose }: { onDone: (rec: CameraRecording) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<{ stop: () => Promise<CameraRecording> } | null>(null);
  const [facing, setFacing] = useState<Facing>('user');
  const [phase, setPhase] = useState<Phase>('opening');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Open (or reopen, after a switch) the camera; let it go when leaving.
  useEffect(() => {
    let cancelled = false;
    if (!canRecordCamera()) {
      setError('This browser can’t record video.');
      setPhase('error');
      return undefined;
    }
    setPhase('opening');
    openCamera(facing).then((stream) => {
      if (cancelled) { stopStream(stream); return; }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setPhase('ready');
    }).catch((e: { name?: string }) => {
      if (cancelled) return;
      setError(e?.name === 'NotAllowedError'
        ? 'Camera access is blocked. Allow it in your browser settings to record.'
        : 'Couldn’t start the camera.');
      setPhase('error');
    });
    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [facing]);

  const finish = async () => {
    const rec = recRef.current;
    if (!rec) return;
    recRef.current = null;
    setPhase('saving');
    const result = await rec.stop();
    if (result.blob.size && result.durationMs >= 300) onDone(result);
    onClose();
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const start = () => {
    if (!streamRef.current) return;
    recRef.current = startCameraRecording(streamRef.current);
    setElapsed(0);
    setPhase('recording');
  };

  // Count up while recording; stop at the limit.
  useEffect(() => {
    if (phase !== 'recording') return undefined;
    const t0 = performance.now();
    const timer = setInterval(() => {
      const ms = performance.now() - t0;
      setElapsed(ms);
      if (ms >= MAX_RECORDING_MS) finishRef.current();
    }, 250);
    return () => clearInterval(timer);
  }, [phase]);

  const recording = phase === 'recording';
  return (
    <div className="vt-camera" role="dialog" aria-label="Record with camera">
      <video ref={videoRef} className={`vt-camera-view${facing === 'user' ? ' is-mirrored' : ''}`} autoPlay muted playsInline />
      <div className="vt-camera-top">
        <button type="button" className="vt-camera-icon" aria-label="Close camera" onClick={onClose} disabled={phase === 'saving'}>
          <X size={22} />
        </button>
        {recording && <span className="vt-camera-time">{formatClock(elapsed)}</span>}
        <button
          type="button"
          className="vt-camera-icon"
          aria-label="Switch camera"
          onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
          disabled={phase !== 'ready'}
        >
          <SwitchCamera size={22} />
        </button>
      </div>
      {error && <p className="vt-camera-error">{error}</p>}
      <div className="vt-camera-bottom">
        <button
          type="button"
          className={`vt-rec-btn${recording ? ' is-recording' : ''}`}
          onClick={recording ? finish : start}
          disabled={phase !== 'ready' && !recording}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          <span />
        </button>
        <span className="vt-camera-hint">{recording ? 'Tap to stop. It lands at the end of your video.' : `Up to ${MAX_RECORDING_MS / 1000}s`}</span>
      </div>
    </div>
  );
}
