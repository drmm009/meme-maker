import React from 'react';
import { createPortal } from 'react-dom';
import VideoTrimmer from '../VideoTrimmer';
import AiCaptionModal from '../AiCaptionModal';
import MemeStylesModal from '../MemeStylesModal';
import FaceMorphModal from '../FaceMorphModal';
import MemeStickersBottomSheet from './MemeStickersBottomSheet';
import EmojiBottomSheet from './EmojiBottomSheet';
import TemplatePickerBottomSheet from './TemplatePickerBottomSheet';
import PhotoFiltersBottomSheet from './PhotoFiltersBottomSheet';
import BubbleChatBottomSheet from './BubbleChatBottomSheet';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';

export default function EditorModals({
  activeCaption,
  activeImageLayer,
  currentEditingSocialCard,
  extractedMemeFace,
  faceTarget,
  handleAddGraphicSticker,
  handleAddImageLayer,
  handleAddInstagramCard,
  handleAddSticker,
  handleAddTweetCard,
  handleAddWhatsAppCard,
  handleApplyAiCaption,
  handleApplyBubbleStyle,
  handleApplyFaceMorph,
  handleUpdateSocialCard,
  morphTargetLayerId,
  morphTargetUrl,
  originalTemplateImgRef,
  sampledFaceLighting,
  setIsPinpointingFace,
  setMorphTargetLayerId,
  setMorphTargetUrl,
  setShowFaceMorphModal,
  showFaceMorphModal,
  template,
  updateActiveCaptionProps,
  updateActiveImageLayer,
  commitAddImageLayer,
}) {
  const pendingVideoLayer = useEditorUiStore((s) => s.pendingVideoLayer);
  const setPendingVideoLayer = useEditorUiStore((s) => s.setPendingVideoLayer);
  const imagePickerTarget = useEditorUiStore((s) => s.imagePickerTarget);
  const openSourceTemplates = useEditorUiStore((s) => s.openSourceTemplates);
  const setImagePickerTarget = useEditorUiStore((s) => s.setImagePickerTarget);
  const setShowAiModal = useEditorUiStore((s) => s.setShowAiModal);
  const setShowBubbleBottomSheet = useEditorUiStore((s) => s.setShowBubbleBottomSheet);
  const setShowEmojiModal = useEditorUiStore((s) => s.setShowEmojiModal);
  const setShowFiltersModal = useEditorUiStore((s) => s.setShowFiltersModal);
  const setShowMemeStickersModal = useEditorUiStore((s) => s.setShowMemeStickersModal);
  const setShowStylesModal = useEditorUiStore((s) => s.setShowStylesModal);
  const showAiModal = useEditorUiStore((s) => s.showAiModal);
  const showBubbleBottomSheet = useEditorUiStore((s) => s.showBubbleBottomSheet);
  const showEmojiModal = useEditorUiStore((s) => s.showEmojiModal);
  const showFiltersModal = useEditorUiStore((s) => s.showFiltersModal);
  const showMemeStickersModal = useEditorUiStore((s) => s.showMemeStickersModal);
  const showStylesModal = useEditorUiStore((s) => s.showStylesModal);
  const socialModalPlatform = useEditorUiStore((s) => s.socialModalPlatform);
  const slotImages = useMemeEditorStore((s) => s.slotImages);
  const setSlotImages = useMemeEditorStore((s) => s.setSlotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);
  const setSlotTransforms = useMemeEditorStore((s) => s.setSlotTransforms);
  const imageFilters = useMemeEditorStore((s) => s.imageFilters);
  const setImageFilters = useMemeEditorStore((s) => s.setImageFilters);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const stickers = useMemeEditorStore((s) => s.stickers);

  return (
    <>
      <MemeStickersBottomSheet
        isOpen={showMemeStickersModal}
        onClose={() => setShowMemeStickersModal(false)}
        onSelectSticker={(sticker) => handleAddGraphicSticker(sticker)}
      />

      {/* Emoji Stickers Bottom Sheet */}
      <EmojiBottomSheet
        isOpen={showEmojiModal}
        onClose={() => setShowEmojiModal(false)}
        onSelectEmoji={(emoji) => handleAddSticker(emoji)}
      />

      {/* Image Layer Template Picker Bottom Sheet */}
      <TemplatePickerBottomSheet
        isOpen={imagePickerTarget !== null}
        onClose={() => setImagePickerTarget(null)}
        templates={openSourceTemplates}
        onSelectTemplate={(tmpl) => {
          if (imagePickerTarget?.slot !== undefined) {
            const nextImages = [...slotImages];
            nextImages[imagePickerTarget.slot] = tmpl.imageUrl;
            setSlotImages(nextImages);

            const nextTransforms = [...slotTransforms];
            nextTransforms[imagePickerTarget.slot] = { offsetX: 0, offsetY: 0, scale: 1.5 };
            setSlotTransforms(nextTransforms);
          } else {
            handleAddImageLayer(tmpl.imageUrl);
          }
          setImagePickerTarget(null);
        }}
      />

      {/* Photo Filters Bottom Sheet */}
      <PhotoFiltersBottomSheet
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        activeImageLayer={activeImageLayer}
        imageFilters={imageFilters}
        setImageFilters={setImageFilters}
        updateActiveImageLayer={updateActiveImageLayer}
        previewImage={(() => {
          if (activeImageLayer) {
            return activeImageLayer.originalUrl || activeImageLayer.url || activeImageLayer.src;
          }
          if (imageLayers && imageLayers.length > 0) {
            return imageLayers[0].originalUrl || imageLayers[0].url || imageLayers[0].src;
          }
          return activeTemplate?.imageUrl || template?.imageUrl;
        })()}
      />

      {/* Bubble Chat & Speech Layouts Bottom Sheet */}
      <BubbleChatBottomSheet
        isOpen={showBubbleBottomSheet}
        onClose={() => setShowBubbleBottomSheet(false)}
        activeCaption={activeCaption}
        onApplyBubbleStyle={handleApplyBubbleStyle}
        onRemoveBubbleStyle={() => updateActiveCaptionProps({ bubbleStyle: null })}
      />


      {/* AI Meme Caption Generator Modal */}
      <AiCaptionModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyCaption={handleApplyAiCaption}
        templateName={template?.name}
      />

      {/* Meme Style Modal (Unified Social Cards Studio) */}
      <MemeStylesModal
        isOpen={showStylesModal}
        onClose={() => setShowStylesModal(false)}
        initialPlatform={socialModalPlatform}
        cardData={currentEditingSocialCard || null}
        onUpdateCard={handleUpdateSocialCard}
        onAddTweetCard={handleAddTweetCard}
        onAddInstagramCard={handleAddInstagramCard}
        onAddWhatsAppCard={handleAddWhatsAppCard}
      />

      {/* Face Morph & Swap Studio Modal */}
      {showFaceMorphModal && (
        <FaceMorphModal
          isOpen={showFaceMorphModal}
          onClose={() => {
            setShowFaceMorphModal(false);
            setMorphTargetLayerId(null);
            setMorphTargetUrl(null);
          }}
          onApplyFaceMorph={handleApplyFaceMorph}
          onOpenPinpoint={() => setIsPinpointingFace(true)}
          initialLighting={sampledFaceLighting}
          memeFacePatch={extractedMemeFace}
          memeTemplateUrl={
            morphTargetUrl ||
            (morphTargetLayerId
              ? (imageLayers.find((l) => l.id === morphTargetLayerId)?.url || stickers.find((s) => s.id === morphTargetLayerId)?.url)
              : (originalTemplateImgRef.current || activeTemplate?.originalUrl || activeTemplate?.imageUrl))
          }
          faceTarget={morphTargetLayerId ? null : faceTarget}
          targetLabel={morphTargetLayerId ? "Selected Image Layer" : null}
        />
      )}

      {/* Video trimmer: a portal so it escapes the canvas stacking context */}
      {pendingVideoLayer && createPortal(
        <VideoTrimmer
          videoUrl={pendingVideoLayer}
          trimStart={0}
          trimEnd={null}
          onApply={(start, end) => {
            commitAddImageLayer(pendingVideoLayer, start, end);
            setPendingVideoLayer(null);
          }}
          onClose={() => setPendingVideoLayer(null)}
        />,
        document.body
      )}
    </>
  );
}
