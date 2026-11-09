// The video editor's Paste link: a link to a video file loads straight in the browser (when its
// site allows it); a social media post (TikTok, Instagram, YouTube, X…) is a web page, not a file,
// and its real video is hidden and blocked to other sites, so the local helper
// (video_link_server.py on :5175, using yt-dlp) fetches it. That's reached through the dev server's
// /api/video-link proxy (so a phone on the same Wi-Fi gets it too), or else straight at 127.0.0.1.

export type LinkKind = 'file' | 'site';

export interface VideoLink {
  url: string;
  kind: LinkKind;
  // The social site's name, or null for any other.
  site: string | null;
}

export type LinkErrorCode = 'server-off' | 'private' | 'too-long' | 'too-big' | 'unsupported' | 'unplayable' | 'failed';

export class LinkError extends Error {
  code: LinkErrorCode;
  constructor(code: LinkErrorCode, message?: string) {
    super(message || LINK_MESSAGES[code]);
    this.code = code;
    this.name = 'LinkError';
  }
}

export const LINK_MAX_BYTES = 200 * 1024 * 1024;
export const LINK_MAX_MINUTES = 10;
export const LINK_SERVER_COMMAND = 'python video_link_server.py';
// How long the helper may take to fetch a video before the app gives up on it.
export const LINK_ANSWER_MS = 150_000;

export const LINK_MESSAGES: Record<LinkErrorCode, string> = {
  'server-off': 'Social media links need the video link helper running on your computer.',
  private: 'This post is private or needs a login, so it can\'t be loaded.',
  'too-long': `That video is over ${LINK_MAX_MINUTES} minutes. Try a shorter one.`,
  'too-big': 'That video is too big (over 200 MB).',
  unsupported: 'There\'s no video at that link.',
  unplayable: 'That video can\'t play in this browser.',
  failed: 'Couldn\'t load that video. Check the link and try again.',
};

const SITES: [RegExp, string][] = [
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'],
  [/(^|\.)(x\.com|twitter\.com)$/, 'X'],
  [/(^|\.)(facebook\.com|fb\.watch)$/, 'Facebook'],
  [/(^|\.)(reddit\.com|redd\.it)$/, 'Reddit'],
  [/(^|\.)snapchat\.com$/, 'Snapchat'],
  [/(^|\.)threads\.(net|com)$/, 'Threads'],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, 'Pinterest'],
  [/(^|\.)vimeo\.com$/, 'Vimeo'],
  [/(^|\.)twitch\.tv$/, 'Twitch'],
];

const FILE_EXT = /\.(mp4|m4v|webm|mov|ogv)$/i;

// The first link in pasted text (apps share "Look at this! https://…"), or null. A link without
// https:// in front gets it.
export function parseVideoLink(text: string): VideoLink | null {
  const raw = (text || '').match(/https?:\/\/[^\s<>"']+/i)?.[0]
    ?? (text || '').match(/(?<![\w:/.@-])(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\/[^\s<>"']*/i)?.[0];
  if (!raw) return null;
  const trimmed = raw.replace(/[.,!?)\]}]+$/, '');
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const site = SITES.find(([re]) => re.test(host))?.[1] ?? null;
  return { url: url.href, kind: FILE_EXT.test(url.pathname) ? 'file' : 'site', site };
}

// Text pasted onto the video editor (its paste listener), for the Link sheet to start on as it opens.
let offered: string | null = null;
export const offerLinkText = (text: string) => { offered = text; };
export const takeOfferedLink = (): string | null => {
  const text = offered;
  offered = null;
  return text;
};

type Progress = (loaded: number, total: number | null) => void;

// A response's body, counting as it comes and stopping past the size limit.
async function readBody(res: Response, onProgress?: Progress): Promise<Blob> {
  const header = Number(res.headers.get('content-length'));
  const total = Number.isFinite(header) && header > 0 ? header : null;
  if (total && total > LINK_MAX_BYTES) throw new LinkError('too-big');
  const type = res.headers.get('content-type') || '';
  if (!res.body) {
    const blob = await res.blob();
    onProgress?.(blob.size, blob.size);
    return blob;
  }
  const reader = res.body.getReader();
  const parts: BlobPart[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    loaded += value.byteLength;
    if (loaded > LINK_MAX_BYTES) {
      reader.cancel().catch(() => {});
      throw new LinkError('too-big');
    }
    parts.push(value as BlobPart);
    onProgress?.(loaded, total);
  }
  return new Blob(parts, { type: type.split(';')[0] });
}

const SERVER_URLS = ['./api/video-link', 'http://127.0.0.1:5175/api/video-link'];

const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

// Fetched by the local helper; the first address that answers as the helper wins.
async function viaServer(url: string, signal: AbortSignal | undefined, onProgress?: Progress): Promise<{ blob: Blob; title: string | null }> {
  for (const endpoint of SERVER_URLS) {
    let res: Response;
    // The helper downloads the whole video before answering; one that never answers (it stopped
    // mid-way, the site hangs) gives up after LINK_ANSWER_MS.
    const timer = new AbortController();
    const stop = () => timer.abort();
    signal?.addEventListener('abort', stop);
    const timeout = setTimeout(stop, LINK_ANSWER_MS);
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: timer.signal,
      });
    } catch (e) {
      if (signal?.aborted) throw e;
      if (isAbort(e)) throw new LinkError('failed', 'That took too long. Try again, or try another link.');
      continue;
    } finally {
      // (Cancel still stops the download that follows: `stop` stays on `signal`.)
      clearTimeout(timeout);
    }
    if (res.ok && (res.headers.get('content-type') || '').startsWith('video/')) {
      const title = res.headers.get('x-video-title');
      return { blob: await readBody(res, onProgress), title: title ? decodeURIComponent(title) : null };
    }
    // The helper's own errors say what went wrong; anything else (no proxy, the proxy finding no
    // helper) means it isn't there: try the next address.
    const body = await res.json().catch(() => null) as { detail?: { code?: string; message?: string } } | null;
    const code = body?.detail?.code;
    if (code && code in LINK_MESSAGES) throw new LinkError(code as LinkErrorCode, body?.detail?.message);
  }
  throw new LinkError('server-off');
}

async function direct(url: string, signal: AbortSignal | undefined, onProgress?: Progress): Promise<Blob> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new LinkError('failed');
  const type = res.headers.get('content-type') || '';
  if (type && !type.startsWith('video/') && !type.startsWith('application/octet-stream')) throw new LinkError('unsupported');
  return readBody(res, onProgress);
}

const fileName = (link: VideoLink, title: string | null) => {
  if (title) return title.slice(0, 80);
  if (link.kind === 'file') {
    const last = new URL(link.url).pathname.split('/').pop();
    if (last) return decodeURIComponent(last);
  }
  return link.site ? `${link.site} video` : 'Video from link';
};

// The link's video as a File, ready to add like one picked from the phone. A file link the site
// won't hand to the browser goes to the helper instead.
export async function loadVideoLink(link: VideoLink, { signal, onProgress }: { signal?: AbortSignal; onProgress?: Progress } = {}): Promise<File> {
  let blob: Blob | null = null;
  let title: string | null = null;
  if (link.kind === 'file') {
    try {
      blob = await direct(link.url, signal, onProgress);
    } catch (e) {
      if (isAbort(e) || (e instanceof LinkError && e.code === 'too-big')) throw e;
    }
  }
  if (!blob) ({ blob, title } = await viaServer(link.url, signal, onProgress));
  return new File([blob], fileName(link, title), { type: blob.type || 'video/mp4' });
}
