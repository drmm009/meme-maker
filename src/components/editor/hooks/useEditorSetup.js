import { useEffect } from 'react';
import { fetchOpenSourceMemes } from '../../../services/memeService';
import { isSocialCardCaption } from '../memeEditorUtils';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

// Editor start-up: load the template (a social-card template opens its card studio), start on
// the Text tab, and fetch the online template list for the image-layer picker.
export function useEditorSetup(template) {
  const setActiveTemplate = useMemeEditorStore((s) => s.setActiveTemplate);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);
  const setSocialModalPlatform = useEditorUiStore((s) => s.setSocialModalPlatform);
  const setShowStylesModal = useEditorUiStore((s) => s.setShowStylesModal);
  const setOpenSourceTemplates = useEditorUiStore((s) => s.setOpenSourceTemplates);
  const setLastUsedSettingButton = useEditorUiStore((s) => s.setLastUsedSettingButton);

  useEffect(() => {
    setActiveTemplate(template);
    const socialCap = template?.defaultCaptions?.find((c) => isSocialCardCaption(c));
    if (socialCap) {
      setActiveLayerId(socialCap.id);
      if (socialCap.isInstagramCard) setSocialModalPlatform('instagram');
      else if (socialCap.isWhatsAppCard) setSocialModalPlatform('whatsapp');
      else setSocialModalPlatform('tweet');
      setShowStylesModal(true);
    } else {
      setActiveLayerId(null);
    }
    setActiveTab('text');
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
