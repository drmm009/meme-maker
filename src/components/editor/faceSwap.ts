// The Face Swap maker's side of the local face swap server (face_swap_server.py on :5174): reached
// through the dev server's /api/face-swap proxy, or else straight at 127.0.0.1:5174.
const DIRECT = 'http://127.0.0.1:5174';
// Pictures sent to the server are scaled down to this longest side (it takes 12MB at most).
const MAX_SIDE = 1600;

export interface Picture {
  src: string;
  name: string;
  width?: number;
  height?: number;
  // A template's captions, kept on the swapped meme.
  captions?: unknown[];
}

export interface TargetFace {
  index: number;
  thumb: string;
}

// The person's face and the picture it went into, kept on a swapped meme so Swap again starts there.
export interface FaceSwapInputs {
  face: Picture;
  target: Picture;
}

// The last face picked, so picking another meme (a fresh session) keeps it.
let rememberedFace: Picture | null = null;
export const getRememberedFace = () => rememberedFace;
export const rememberFace = (face: Picture | null) => {
  rememberedFace = face;
};

// Sample portraits to try the swap with: real photos the server can find a face in (cut from the
// meme pictures in public/images).
export const SAMPLE_FACES: Picture[] = [
  { src: './user_face.jpg', name: 'Sample' },
  { src: './faces/drake.jpg', name: 'Drake' },
  { src: './faces/doakes.jpg', name: 'Doakes' },
  { src: './faces/arjun.jpg', name: 'Arjun' },
  { src: './faces/akshay.jpg', name: 'Akshay' },
  { src: './faces/wifi.jpg', name: 'Wi-Fi hair' },
];

// The editor's Face Swap sheet (FaceMorphModal): the faces from our meme templates only, each a
// square portrait cut from its picture in public/images, with a short label under it.
export const TEMPLATE_FACES: (Picture & { label: string })[] = [
  { src: './faces/drake.jpg', name: 'Drake', label: 'Drake' },
  { src: './faces/doakes.jpg', name: 'James Doakes', label: 'Doakes' },
  { src: './faces/srk.jpg', name: 'Shah Rukh Khan (Kaash)', label: 'SRK' },
  { src: './faces/akshay.jpg', name: 'Akshay Kumar', label: 'Akshay' },
  { src: './faces/amitabh.jpg', name: 'Amitabh Bachchan', label: 'Amitabh' },
  { src: './faces/arjun.jpg', name: 'Arjun Kapoor', label: 'Arjun' },
  { src: './faces/darr.jpg', name: 'Shah Rukh Khan (Darr)', label: 'Darr' },
  { src: './faces/wifi.jpg', name: 'Wi-Fi hairstyle', label: 'Wi-Fi hair' },
];

async function call(path: string, body?: unknown): Promise<Record<string, unknown>> {
  const init: RequestInit | undefined = body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
  for (const base of ['', DIRECT]) {
    try {
      const res = await fetch(`${base}${path}`, init);
      return await res.json();
    } catch {
      // Not there, or a page instead of the server's answer (no proxy): try the server itself.
    }
  }
  throw new Error('offline');
}

// Whether the server is running with its swap model.
export async function serverReady(): Promise<boolean> {
  try {
    const data = await call('/api/face-swap/status');
    return data.status === 'online' && data.model_available !== false;
  } catch {
    return false;
  }
}

// The faces the server finds in a picture, top to bottom.
export async function detectFaces(image: string): Promise<TargetFace[]> {
  const data = await call('/api/face-swap/detect-faces', { image });
  const faces = Array.isArray(data.faces) ? data.faces as { index: number; thumb: string }[] : [];
  return faces.map((f) => ({ index: f.index, thumb: f.thumb }));
}

// The target with the face swapped in: into every face, or one of them; strength 0.5..1 blends it
// with the original. Throws with the server's own explanation when it can't.
export async function swapFace({ face, target, faces, strength }: { face: string; target: string; faces: number | 'all'; strength: number }): Promise<string> {
  const data = await call('/api/face-swap', {
    source_image: face,
    target_image: target,
    swap_all: faces === 'all',
    target_face_index: faces === 'all' ? null : faces,
    blend_ratio: strength,
    crop_only: false,
  });
  if (data.success && typeof data.image === 'string') return data.image;
  const detail = typeof data.detail === 'string' ? data.detail : null;
  throw new Error(String(data.error || detail || 'The swap didn\'t work. Try a clearer photo.'));
}

// A picture as a data URL the server can read, no bigger than MAX_SIDE, with its size. A picture
// the browser can't copy (another site's, without CORS) is sent as its address for the server to fetch.
export function loadPicture(src: string): Promise<{ src: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve({ src });
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = Math.min(1, MAX_SIDE / Math.max(w, h, 1));
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ src: canvas.toDataURL('image/jpeg', 0.92), width: canvas.width, height: canvas.height });
      } catch {
        resolve({ src, width: w, height: h });
      }
    };
    img.onerror = () => resolve({ src });
    img.src = src;
  });
}

// A picture's size, once it has loaded (none if it can't).
export function pictureSize(src: string): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve({});
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({});
    img.src = src;
  });
}

// A file the person picked, as a data URL.
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// The meme a swap makes: the swapped picture (the target's size), the target's captions, and the
// inputs, so Swap again opens on them.
export function faceSwapTemplate(image: string, inputs: FaceSwapInputs) {
  const { target } = inputs;
  const width = target.width || 1080;
  const height = target.height || 1080;
  return {
    id: `faceswap-${Date.now()}`,
    name: `${target.name} face swap`,
    imageUrl: image,
    rawImageUrl: image,
    width,
    height,
    category: 'custom',
    defaultCaptions: target.captions || [],
    faceSwap: inputs,
  };
}
