// Camera recording for video clips (MediaRecorder). MP4 first where the browser can make it (it
// seeks reliably and exports without guessing), else WebM; the recording keeps its type.

export type Facing = 'user' | 'environment';

const PREFERRED_TYPES = [
  'video/mp4;codecs=avc1,mp4a',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

const supported = (t: string) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t);

export const pickVideoType = (isSupported: (t: string) => boolean = supported): string =>
  PREFERRED_TYPES.find((t) => isSupported(t)) || '';

export const canRecordCamera = (): boolean =>
  typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';

// What to ask the camera for: the chosen side, up to 720p, with sound.
export const cameraConstraints = (facing: Facing): MediaStreamConstraints => ({
  video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: { echoCancellation: true, noiseSuppression: true },
});

export const openCamera = (facing: Facing): Promise<MediaStream> =>
  navigator.mediaDevices.getUserMedia(cameraConstraints(facing));

export const stopStream = (stream: MediaStream | null | undefined): void => {
  stream?.getTracks().forEach((t) => t.stop());
};

export interface CameraRecording { blob: Blob; type: string; durationMs: number }

// Starts recording `stream` (the caller owns it and stops it). stop() resolves to the recording.
export function startCameraRecording(stream: MediaStream): { stop: () => Promise<CameraRecording> } {
  const type = pickVideoType();
  const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
  const startedAt = performance.now();
  recorder.start(250);
  return {
    stop: () => new Promise((resolve) => {
      recorder.onstop = () => {
        const blobType = (recorder.mimeType || type || 'video/webm').split(';')[0];
        resolve({ blob: new Blob(chunks, { type: blobType }), type: blobType, durationMs: Math.round(performance.now() - startedAt) });
      };
      recorder.stop();
    }),
  };
}
