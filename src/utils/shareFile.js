// Share an exported file through the system share sheet (WhatsApp, Instagram…) or save it.

export const canShareFile = (file, nav = typeof navigator !== 'undefined' ? navigator : null) =>
  Boolean(nav?.canShare && nav.share && nav.canShare({ files: [file] }));

// 'shared', 'cancelled' (the user closed the sheet) or 'unsupported'.
export async function shareFile(file, { title } = {}, nav = typeof navigator !== 'undefined' ? navigator : null) {
  if (!canShareFile(file, nav)) return 'unsupported';
  try {
    await nav.share({ files: [file], title });
    return 'shared';
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
    throw e;
  }
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
