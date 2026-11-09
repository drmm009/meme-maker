import { SquarePlay, Image as ImageIcon, Clapperboard, Link2 } from 'lucide-react';
import CanvasStartPrompt from '../ui/CanvasStartPrompt';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { inkFor } from '../../utils/inkFor';

type StartKind = 'video' | 'photo' | 'clips' | 'link';

// The empty video's first step, inside the canvas (CanvasPreview's children): add a video, or start
// from a video link, a photo or a meme clip.
export default function StartPrompt({ onPick }: { onPick: (kind: StartKind) => void }) {
  const ink = inkFor(useEditorStore((s: { backgroundColor?: string }) => s.backgroundColor));
  return (
    <CanvasStartPrompt
      title="Start your video"
      ink={ink}
      primary={{ id: 'video', label: 'Add a video', Icon: SquarePlay, onPick: () => onPick('video') }}
      hint="Then layer text, stickers and sounds on it."
      secondary={[
        { id: 'link', label: 'Link', Icon: Link2, onPick: () => onPick('link') },
        { id: 'photo', label: 'Photo', Icon: ImageIcon, onPick: () => onPick('photo') },
        { id: 'clips', label: 'Meme clip', Icon: Clapperboard, onPick: () => onPick('clips') },
      ]}
    />
  );
}
