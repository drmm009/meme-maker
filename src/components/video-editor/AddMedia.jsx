import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import EmojiSheet from '../editor/panels/EmojiSheet';
import StickersSheet from '../editor/panels/StickersSheet';
import { TemplatesBrowser } from '../editor/panels/TemplatesSheet';
import { MEME_TEMPLATES } from '../../data/templates';
import ClipsSheet from './ClipsSheet';
import SoundsSheet from './SoundsSheet';
import { addMediaFile } from './mediaFile';

const addItem = (item) => useEditorStore.getState().addItem(item);

const emojiToDataUrl = (emoji) => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '96px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 64);
  return canvas.toDataURL();
};

// The image editor's library sheets add to the image editor's layers; these add to the timeline.
const LIBRARY_ACTIONS = {
  handleAddSticker: (e) => addItem({ type: 'sticker', url: emojiToDataUrl(e.emoji), name: `${e.emoji} Emoji` }),
  handleAddGraphicSticker: (s) => addItem({ type: 'sticker', url: s.url, name: s.name || 'Sticker', isGif: s.isGif || undefined }),
};

// Every library, as the image editor's full-height browse sheets over the editor.
const LIBRARIES = {
  stickers: (close) => <StickersSheet actions={LIBRARY_ACTIONS} onClose={close} only="stickers" />,
  gifs: (close) => <StickersSheet actions={LIBRARY_ACTIONS} onClose={close} only="gifs" />,
  emoji: (close) => <EmojiSheet actions={LIBRARY_ACTIONS} onClose={close} />,
  templates: (close) => <TemplatesBrowser templates={MEME_TEMPLATES} actions={LIBRARY_ACTIONS} onClose={close} onPick={(t) => addItem({ type: 'image', url: t.imageUrl, name: t.name })} />,
  clips: (close) => (
    <ClipsSheet
      onClose={close}
      onPick={(t) => addItem({ type: 'video', url: t.videoUrl, thumbnailUrl: t.thumbnailUrl, name: t.name, durationMs: t.durationMs, width: t.width, height: t.height })}
    />
  ),
  sounds: (close) => (
    <SoundsSheet onClose={close} onPick={(s) => addItem({ type: 'audio', url: s.url, name: s.name, durationMs: s.durationMs || 3000, icon: s.icon })} />
  ),
};

// Everything that adds to the timeline: file pickers and the library sheets. The tool rail
// calls ref.open(kind) with one of: text, stickers, emoji, gifs, templates, photo, video, clips, sounds, audio.
const AddMedia = forwardRef(function AddMedia(_props, ref) {
  const [sheet, setSheet] = useState(null);
  const inputs = { photo: useRef(null), video: useRef(null), audio: useRef(null) };

  useImperativeHandle(ref, () => ({
    open(kind) {
      if (kind === 'text') {
        addItem({ type: 'text', text: 'NEW TEXT', durationMs: 3000, name: 'Text Block', color: '#ffffff', stroke: '#000000', fontSize: 100 });
      } else if (inputs[kind]) {
        inputs[kind].current?.click();
      } else if (LIBRARIES[kind]) {
        setSheet(kind);
      }
    }
  }));

  const close = () => setSheet(null);
  const onFile = (type) => (e) => {
    const file = e.target.files?.[0];
    if (file) addMediaFile(file, type);
    e.target.value = '';
  };

  return (
    <>
      <input type="file" ref={inputs.photo} hidden accept="image/*" onChange={onFile('image')} />
      <input type="file" ref={inputs.video} hidden accept="video/*" onChange={onFile('video')} />
      <input type="file" ref={inputs.audio} hidden accept="audio/*" onChange={onFile('audio')} />
      {sheet && <div className="vt-library ie-panels--full">{LIBRARIES[sheet](close)}</div>}
    </>
  );
});

export default AddMedia;
