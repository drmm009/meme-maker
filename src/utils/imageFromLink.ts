// Pictures (and videos) added from a web link: pasted, dropped or typed into Media > Link. The file
// is fetched and kept as a data URL like an uploaded one, so the meme doesn't depend on the site
// later. Many sites don't let other pages read their pictures (CORS); that is reported, not hidden.
import { blobToDataURL } from './galleryStore';

export type ImageLinkProblem = 'not-a-link' | 'blocked' | 'not-a-picture';

export class ImageLinkError extends Error {
  problem: ImageLinkProblem;
  constructor(problem: ImageLinkProblem) {
    super(problem);
    this.name = 'ImageLinkError';
    this.problem = problem;
  }
}

// What to tell the person for each problem.
export const IMAGE_LINK_MESSAGES: Record<ImageLinkProblem, string> = {
  'not-a-link': 'That isn\'t a web link (it should start with http:// or https://).',
  blocked: 'That site doesn\'t let other apps use its pictures. Save the picture, then add it with Photo.',
  'not-a-picture': 'That link isn\'t a picture or a video.',
};

// The link in some pasted or dropped text, if it is one (a single http(s) URL).
export function linkIn(text: string | null | undefined): string | null {
  const t = (text || '').trim().split(/\s+/)[0] || '';
  try {
    const url = new URL(t);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export async function fetchMediaLink(text: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const url = linkIn(text);
  if (!url) throw new ImageLinkError('not-a-link');
  let blob: Blob;
  try {
    const res = await fetchImpl(url, { mode: 'cors' });
    if (!res.ok) throw new Error(String(res.status));
    blob = await res.blob();
  } catch {
    throw new ImageLinkError('blocked');
  }
  if (!/^(image|video)\//.test(blob.type)) throw new ImageLinkError('not-a-picture');
  return blobToDataURL(blob);
}
