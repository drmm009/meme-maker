// A backup of everything in My Studio, as one file (.memestudio) to keep somewhere safe and restore
// from later, on this device or another. Its layout:
//
//   MAGIC (10 bytes) | header length (4 bytes, little-endian) | header (UTF-8 JSON) | files…
//
// The header holds the saved records with every Blob swapped for a reference to a file (its offset
// and size in the file part, and its type); the files follow the header byte for byte, so a big
// video is never turned into text. A backup is read back with Blob.slice, so it isn't loaded whole.
import type { GalleryRecord } from './galleryRecord';
import type { VideoProject } from './videoProject';

// Bump when the header's shape changes, and teach readBackup the previous version.
export const BACKUP_VERSION = 1;
export const BACKUP_EXTENSION = '.memestudio';
const MAGIC = 'MEMESTUDIO';
const PREFIX = MAGIC.length + 4;

// A video saved to My Studio, as videoDraftStore keeps it.
export interface BackupVideo {
  id: string;
  version?: number;
  name: string;
  savedAt: number;
  durationMs: number;
  thumbnail: string;
  project: VideoProject;
  mediaKeys: string[];
  exportBlob?: Blob | null;
}

// What goes into a backup and comes back out of one.
export interface StudioBackup {
  createdAt: string;
  gallery: GalleryRecord[];
  videos: BackupVideo[];
  // The videos' uploaded files, by the key their projects use.
  media: { key: string; blob: Blob }[];
}

interface FileRef {
  file: number;
}

interface FileEntry {
  offset: number;
  size: number;
  type: string;
}

interface Header {
  app: typeof MAGIC;
  version: number;
  createdAt: string;
  files: FileEntry[];
  gallery: (Omit<GalleryRecord, 'imageBlob'> & { imageBlob: FileRef | null })[];
  videos: (Omit<BackupVideo, 'exportBlob'> & { exportBlob: FileRef | null })[];
  media: { key: string; blob: FileRef }[];
}

export class BackupError extends Error {}

const isBlob = (v: unknown): v is Blob => typeof Blob !== 'undefined' && v instanceof Blob;

// The backup as one Blob.
export function packBackup(backup: StudioBackup): Blob {
  const blobs: Blob[] = [];
  const files: FileEntry[] = [];
  let offset = 0;
  const ref = (blob: Blob | null | undefined): FileRef | null => {
    if (!isBlob(blob)) return null;
    files.push({ offset, size: blob.size, type: blob.type });
    blobs.push(blob);
    offset += blob.size;
    return { file: files.length - 1 };
  };
  const header: Header = {
    app: MAGIC,
    version: BACKUP_VERSION,
    createdAt: backup.createdAt,
    files,
    gallery: backup.gallery.map((r) => ({ ...r, imageBlob: ref(r.imageBlob) })),
    videos: backup.videos.map((v) => ({ ...v, exportBlob: ref(v.exportBlob) })),
    media: backup.media.flatMap((m) => {
      const blob = ref(m.blob);
      return blob ? [{ key: m.key, blob }] : [];
    }),
  };
  const json = new TextEncoder().encode(JSON.stringify(header));
  const prefix = new Uint8Array(PREFIX);
  prefix.set(new TextEncoder().encode(MAGIC));
  new DataView(prefix.buffer).setUint32(MAGIC.length, json.byteLength, true);
  return new Blob([prefix, json, ...blobs], { type: 'application/octet-stream' });
}

async function bytesOf(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

// The backup in a file made by packBackup. Throws a BackupError when it isn't one, or is from a
// newer version of the app.
export async function readBackup(file: Blob): Promise<StudioBackup> {
  if (file.size < PREFIX) throw new BackupError('This is not a Meme Studio backup.');
  const prefix = await bytesOf(file.slice(0, PREFIX));
  if (new TextDecoder().decode(prefix.subarray(0, MAGIC.length)) !== MAGIC) {
    throw new BackupError('This is not a Meme Studio backup.');
  }
  const length = new DataView(prefix.buffer, prefix.byteOffset, prefix.byteLength).getUint32(MAGIC.length, true);
  const start = PREFIX + length;
  if (start > file.size) throw new BackupError('This backup is damaged or incomplete.');
  let header: Header;
  try {
    header = JSON.parse(new TextDecoder().decode(await bytesOf(file.slice(PREFIX, start))));
  } catch {
    throw new BackupError('This backup is damaged or incomplete.');
  }
  if (header?.app !== MAGIC || typeof header.version !== 'number') {
    throw new BackupError('This is not a Meme Studio backup.');
  }
  if (header.version > BACKUP_VERSION) {
    throw new BackupError('This backup was made by a newer version of the app. Update the app, then try again.');
  }
  const files = Array.isArray(header.files) ? header.files : [];
  const blobOf = (r: FileRef | null | undefined): Blob | null => {
    const entry = r && files[r.file];
    if (!entry) return null;
    if (start + entry.offset + entry.size > file.size) throw new BackupError('This backup is damaged or incomplete.');
    const part = file.slice(start + entry.offset, start + entry.offset + entry.size);
    return new Blob([part], { type: entry.type });
  };
  return {
    createdAt: String(header.createdAt || ''),
    gallery: (header.gallery || []).map((r) => ({ ...r, imageBlob: blobOf(r.imageBlob) })),
    videos: (header.videos || []).map((v) => ({ ...v, exportBlob: blobOf(v.exportBlob) })),
    media: (header.media || []).flatMap((m) => {
      const blob = blobOf(m.blob);
      return blob ? [{ key: m.key, blob }] : [];
    }),
  };
}

// The file name for a backup made at `date`: meme-studio-backup-2026-11-19.memestudio.
export const backupFileName = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `meme-studio-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}${BACKUP_EXTENSION}`;
};
