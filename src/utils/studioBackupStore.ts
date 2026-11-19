// Backs up My Studio to one file and restores it, joining the gallery's database (galleryStore) and
// the video editor's (videoDraftStore) through the backup format (model/studioBackup).
import { idbGetAllMemes, idbPutMeme } from './galleryStore';
import { exportSavedVideos, importSavedVideos } from './videoDraftStore';
import { migrateGalleryRecord } from '../model/galleryRecord';
import { backupFileName, packBackup, readBackup } from '../model/studioBackup';

export interface BackupFile {
  blob: Blob;
  fileName: string;
  count: number;
}

// Everything saved on this device, as a backup file.
export async function backUpStudio(now = new Date()): Promise<BackupFile> {
  const gallery = await idbGetAllMemes();
  const { videos, media } = await exportSavedVideos();
  const blob = packBackup({ createdAt: now.toISOString(), gallery, videos, media });
  return { blob, fileName: backupFileName(now), count: gallery.length + videos.length };
}

// Puts what's in a backup file back in My Studio (a save with the same id as one here replaces it)
// and says how many saves it restored. Throws a BackupError for a file that isn't a usable backup.
export async function restoreStudio(file: Blob): Promise<number> {
  const backup = await readBackup(file);
  let count = 0;
  for (const raw of backup.gallery) {
    const record = migrateGalleryRecord(raw);
    if (!record) continue;
    await idbPutMeme(record);
    count += 1;
  }
  count += await importSavedVideos(backup.videos, backup.media);
  return count;
}
