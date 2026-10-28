import { describe, it, expect } from 'vitest';
import { DRAFT_FIELDS, collectBlobUrls, documentFromState, layerCount, plainCopy, restoreDocument } from './memeDraftStore';

describe('meme drafts', () => {
  it('keeps the document fields and drops what IndexedDB can\'t store', () => {
    const img = new (class LoadedImage {})();
    const state = {
      captions: [{ id: 'c', text: 'HI', onClick: () => {} }],
      activeTemplate: { name: 'Drake', url: 'blob:http://x.test/t', image: img },
      aspectRatio: '1:1',
      activeLayerId: 'c',
      setCaptions: () => {},
    };
    const doc = documentFromState(state);
    expect(doc.captions).toEqual([{ id: 'c', text: 'HI' }]);
    expect(doc.activeTemplate).toEqual({ name: 'Drake', url: 'blob:http://x.test/t' });
    expect(doc.aspectRatio).toBe('1:1');
    expect(doc).not.toHaveProperty('activeLayerId');
    expect(doc).not.toHaveProperty('setCaptions');
    expect(DRAFT_FIELDS).toEqual(expect.arrayContaining(['captions', 'drawings', 'slotImages', 'imageFilters']));
  });

  it('keeps Blobs and nulls', () => {
    const blob = new Blob(['x']);
    expect(plainCopy({ a: blob, b: null, c: [1, 'two'] })).toEqual({ a: blob, b: null, c: [1, 'two'] });
  });

  it('finds every blob: URL, however deep', () => {
    const doc = { activeTemplate: { url: 'blob:http://x.test/a' }, imageLayers: [{ url: 'blob:http://x.test/b' }, { url: 'data:image/png;base64,AA' }], slotImages: ['blob:http://x.test/a'] };
    expect(collectBlobUrls(doc).sort()).toEqual(['blob:http://x.test/a', 'blob:http://x.test/b']);
  });

  it('gives stored pictures fresh URLs on restore, and drops missing ones', () => {
    const blob = new Blob(['x']);
    const draft = { document: { activeTemplate: { url: 'blob:http://x.test/old' }, imageLayers: [{ url: 'blob:null/gone' }], captions: [{ text: 'blob: is text' }] }, media: { 'blob:http://x.test/old': blob } };
    const doc = restoreDocument(draft, (b) => (b === blob ? 'blob:new' : 'blob:?'));
    expect(doc.activeTemplate.url).toBe('blob:new');
    expect(doc.imageLayers[0].url).toBeNull();
    expect(doc.captions[0].text).toBe('blob: is text');
  });

  it('counts layers', () => {
    expect(layerCount({ captions: [1, 2], stickers: [3], imageLayers: [] })).toBe(3);
    expect(layerCount({})).toBe(0);
  });
});
