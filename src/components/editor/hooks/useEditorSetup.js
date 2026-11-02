import { useEffect } from 'react';
import { fetchOpenSourceMemes } from '../../../services/memeService';
import { isSocialCardCaption } from '../memeEditorUtils';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

// Editor start-up: load the template (a social-card template opens its card studio, though not in
// the Social Card maker, which opens on its Details form), start on the Text tab, and fetch the
// online template list for the image-layer picker.
export function useEditorSetup(template) {
  const setActiveTemplate = useMemeEditorStore((s) => s.setActiveTemplate);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);
  const setSocialModalPlatform = useEditorUiStore((s) => s.setSocialModalPlatform);
  const setShowStylesModal = useEditorUiStore((s) => s.setShowStylesModal);
  const setOpenSourceTemplates = useEditorUiStore((s) => s.setOpenSourceTemplates);
  const setLastUsedSettingButton = useEditorUiStore((s) => s.setLastUsedSettingButton);
  const mode = useEditorUiStore((s) => s.mode);

  useEffect(() => {
    setActiveTemplate(template);
    const socialCap = template?.defaultCaptions?.find((c) => isSocialCardCaption(c));
    if (socialCap && mode !== 'social') {
      setActiveLayerId(socialCap.id);
      if (socialCap.isInstagramCard) setSocialModalPlatform('instagram');
      else if (socialCap.isWhatsAppCard) setSocialModalPlatform('whatsapp');
      else setSocialModalPlatform('tweet');
      setShowStylesModal(true);
    } else if (!socialCap) {
      setActiveLayerId(null);
    }
    setActiveTab('text');
    // The mode only matters as the session opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, setActiveTemplate, setActiveLayerId, setActiveTab, setSocialModalPlatform, setShowStylesModal]);

  useEffect(() => {
    let isMounted = true;
    fetchOpenSourceMemes().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setOpenSourceTemplates(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [setOpenSourceTemplates]);

  // Ensure Text tab is active by default when user reaches editor and no layer is auto-selected
  useEffect(() => {
    setActiveLayerId(null);
    setActiveTab('text');
  }, [setActiveLayerId, setActiveTab]);

  // Reset tweet toolbar submenus on active layer change
  useEffect(() => {
    setLastUsedSettingButton(null);
  }, [activeLayerId, setLastUsedSettingButton]);
}
