import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { fetchOpenSourceMemes } from '../../services/memeService';
import EmojiBottomSheet from '../editor/EmojiBottomSheet';
import MemeStickersBottomSheet from '../editor/MemeStickersBottomSheet';
import TemplatePickerBottomSheet from '../editor/TemplatePickerBottomSheet';
import AudioModal from './AudioModal';
import VideoClipsBottomSheet from './VideoClipsBottomSheet';
import GifBottomSheet from './GifBottomSheet';

const addItem = (item) => useEditorStore.getState().addItem(item);

// One frame from ~1s in, used as the clip's filmstrip on the timeline.
const generateThumbnail = (url) => new Promise((resolve) => {
  let done = false;
  const finish = (val) => { if (!done) { done = true; resolve(val); } };
  const video = document.createElement('video');
  video.src = url;
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  setTimeout(() => finish(null), 2000);
  const capture = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      finish(canvas.toDataURL('image/jpeg', 0.5));
    } catch {
      finish(null);
    }
  };
  video.onseeked = capture;
  video.onerror = () => finish(null);
  video.onloadeddata = () => {
    if (video.duration > 1) video.currentTime = 1;
    else capture();
  };
});

const addUploadedFile = (file, type) => {
  const url = URL.createObjectURL(file);
  if (type === 'image') {
    addItem({ type, url, name: file.name });
    return;
  }
  const media = document.createElement(type);
  media.src = url;
  media.onloadedmetadata = async () => {
    const durationMs = Math.round(media.duration * 1000);
    const thumbnailUrl = type === 'video' ? await generateThumbnail(url) : null;
    addItem({ type, url, durationMs, width: media.videoWidth, height: media.videoHeight, name: file.name, thumbnailUrl });
  };
};

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

// Everything that adds to the timeline: file pickers, sheets and modals. The tool rail
// calls ref.open(kind) with one of: text, stickers, emoji, gifs, templates, photo, video, clips, sounds, audio.
const AddMedia = forwardRef(function AddMedia(_props, ref) {
  const [sheet, setSheet] = useState(null);
  const [templates, setTemplates] = useState(undefined);
  const inputs = { photo: useRef(null), video: useRef(null), audio: useRef(null) };

  useEffect(() => {
    let alive = true;
    fetchOpenSourceMemes().then((data) => {
      if (alive && Array.isArray(data) && data.length > 0) setTemplates(data);
    });
    return () => { alive = false; };
  }, []);

  useImperativeHandle(ref, () => ({
    open(kind) {
      if (kind === 'text') {
        addItem({ type: 'text', text: 'NEW TEXT', durationMs: 3000, name: 'Text Block', color: '#ffffff', stroke: '#000000', fontSize: 100 });
      } else if (inputs[kind]) {
        inputs[kind].current?.click();
      } else {
        setSheet(kind);
      }
    }
  }));

  const close = () => setSheet(null);
  const onFile = (type) => (e) => {
    const file = e.target.files?.[0];
    if (file) addUploadedFile(file, type);
    e.target.value = '';
  };

  return (
    <>
      <input type="file" ref={inputs.photo} hidden accept="image/*" onChange={onFile('image')} />
      <input type="file" ref={inputs.video} hidden accept="video/*" onChange={onFile('video')} />
      <input type="file" ref={inputs.audio} hidden accept="audio/*" onChange={onFile('audio')} />

      <EmojiBottomSheet
        isOpen={sheet === 'emoji'}
        onClose={close}
        onSelectEmoji={(s) => { addItem({ type: 'sticker', url: emojiToDataUrl(s.emoji), name: `${s.emoji} Emoji` }); close(); }}
      />
      <MemeStickersBottomSheet
        isOpen={sheet === 'stickers'}
        onClose={close}
        onSelectSticker={(s) => { addItem({ type: 'sticker', url: s.url, name: s.name || 'Sticker' }); close(); }}
      />
      <TemplatePickerBottomSheet
        isOpen={sheet === 'templates'}
        onClose={close}
        templates={templates}
        onSelectTemplate={(t) => { addItem({ type: 'image', url: t.imageUrl, name: t.name }); close(); }}
      />
      <GifBottomSheet
        isOpen={sheet === 'gifs'}
        onClose={close}
        onSelect={(g) => { addItem({ type: 'sticker', url: g.url, name: g.title, isGif: true }); close(); }}
      />
      <AudioModal isOpen={sheet === 'sounds'} onClose={close} />
      <VideoClipsBottomSheet
        isOpen={sheet === 'clips'}
        onClose={close}
        onSelect={(t) => {
          addItem({ type: 'video', url: t.videoUrl, thumbnailUrl: t.thumbnailUrl, name: t.name, durationMs: t.durationMs, width: t.width, height: t.height });
          close();
        }}
      />
    </>
  );
});

export default AddMedia;
