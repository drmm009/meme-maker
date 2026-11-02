import { Sparkles, Captions } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';

// The AI Meme maker's own tab: New meme reopens its prompt screen (AiMemeSheet), AI Caption adds
// another AI caption to this meme (the AI caption studio).
export default function AiStrip() {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const setShowAiModal = useEditorUiStore((s: { setShowAiModal: (v: boolean) => void }) => s.setShowAiModal);

  const items: StripItem[] = [
    { id: 'aiMeme', label: 'New meme', title: 'Another template, idea and caption', Icon: Sparkles, active: sheet === 'aiMeme' },
    { id: 'caption', label: 'AI Caption', title: 'Add another AI caption', Icon: Captions },
  ];

  const onSelect = (id: string) => {
    if (id === 'aiMeme') openSheet('aiMeme');
    else setShowAiModal(true);
  };

  return <ToolStrip ariaLabel="AI meme tools" layout="stacked" items={items} onSelect={onSelect} />;
}
