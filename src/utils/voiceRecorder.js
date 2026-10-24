// Microphone recording for voiceovers (MediaRecorder). Chrome and Android record WebM/Opus,
// Safari MP4/AAC; the recording keeps its type so the export can name the file correctly.

const PREFERRED_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export const pickRecordingType = (isSupported = (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) =>
  PREFERRED_TYPES.find((t) => isSupported(t)) || '';

// File extension FFmpeg should see for a recording type.
export const extensionForType = (type) => {
  if (/webm/i.test(type)) return 'webm';
  if (/mp4|aac|m4a/i.test(type)) return 'm4a';
  if (/ogg/i.test(type)) return 'ogg';
  if (/wav/i.test(type)) return 'wav';
  return 'mp3';
};

export const canRecordVoice = () =>
  typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';

// Starts recording from `stream` (default: the microphone). Resolves to { stop } once recording;
// stop() resolves to { blob, type, durationMs }.
export async function startVoiceRecording(stream) {
  const input = stream || await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const type = pickRecordingType();
  const recorder = new MediaRecorder(input, type ? { mimeType: type } : undefined);
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
  const startedAt = performance.now();
  recorder.start(250);
  return {
    stop: () => new Promise((resolve) => {
      recorder.onstop = () => {
        if (!stream) input.getTracks().forEach((t) => t.stop());
        const blobType = recorder.mimeType || type || 'audio/webm';
        resolve({ blob: new Blob(chunks, { type: blobType }), type: blobType, durationMs: Math.round(performance.now() - startedAt) });
      };
      recorder.stop();
    }),
  };
}
