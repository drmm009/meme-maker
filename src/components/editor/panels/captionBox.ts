// A caption's box presets (the Box swatches): white or black behind the words, a full-width
// banner, or none, each with the text colour and outline that go with it. Picking the box a caption
// already has takes it off. Shared by the image editor's captions and the video editor's text.
export type CaptionBg = 'none' | 'white' | 'black' | 'banner';

interface BoxLook {
  bgColor?: string;
  bgStyle?: string;
  color?: string;
}

export function captionBgPatch(caption: BoxLook, bg: CaptionBg): Record<string, string> {
  if (bg === 'none' || (caption.bgColor === bg && caption.bgStyle !== 'banner')) {
    // Black words would vanish without their box: they turn white, with the usual black outline.
    const dark = caption.color === '#000000' || caption.color === 'black';
    return { bgColor: 'none', bgStyle: 'box', color: dark ? '#ffffff' : caption.color || '#ffffff', stroke: '#000000' };
  }
  if (bg === 'banner') return { bgColor: 'white', color: '#000000', stroke: 'transparent', bgStyle: 'banner', align: 'center' };
  return { bgColor: bg, color: bg === 'white' ? '#000000' : '#ffffff', stroke: 'transparent', bgStyle: 'box' };
}
