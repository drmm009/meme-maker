import React, { Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import VideoTrimmer from '../VideoTrimmer';
import AiCaptionModal from '../AiCaptionModal';
// The social card studio and the face swap studio load when first opened.
const MemeStylesModal = lazy(() => import('../MemeStylesModal'));
const FaceMorphModal = lazy(() => import('../FaceMorphModal'));
import MemeStickersBottomSheet from './MemeStickersBottomSheet';
import EmojiBottomSheet from './EmojiBottomSheet';
import TemplatePickerBottomSheet from './TemplatePickerBottomSheet';
import BubbleChatBottomSheet from './BubbleChatBottomSheet';
import PhotoCropSheet from './crop/PhotoCropSheet';
import GifBottomSheet from '../video-editor/GifBottomSheet';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';

export default function EditorModals({
  activeCaption,
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
  commitAddImageLayer,
  handleApplyMainPhotoCrop,
  handleRestoreMainPhoto,
}) {
  const pendingVideoLayer = useEditorUiStore((s) => s.pendingVideoLayer);
  const setPendingVideoLayer = useEditorUiStore((s) => s.setPendingVideoLayer);
  const imagePickerTarget = useEditorUiStore((s) => s.imagePickerTarget);
  const openSourceTemplates = useEditorUiStore((s) => s.openSourceTemplates);
  const setImagePickerTarget = useEditorUiStore((s) => s.setImagePickerTarget);
  const setShowAiModal = useEditorUiStore((s) => s.setShowAiModal);
  const setShowBubbleBottomSheet = useEditorUiStore((s) => s.setShowBubbleBottomSheet);
  const setShowEmojiModal = useEditorUiStore((s) => s.setShowEmojiModal);
  const setShowMemeStickersModal = useEditorUiStore((s) => s.setShowMemeStickersModal);
  const setShowStylesModal = useEditorUiStore((s) => s.setShowStylesModal);
  const showAiModal = useEditorUiStore((s) => s.showAiModal);
  const showBubbleBottomSheet = useEditorUiStore((s) => s.showBubbleBottomSheet);
  const showEmojiModal = useEditorUiStore((s) => s.showEmojiModal);
  const showMemeStickersModal = useEditorUiStore((s) => s.showMemeStickersModal);
  const showStylesModal = useEditorUiStore((s) => s.showStylesModal);
  const socialModalPlatform = useEditorUiStore((s) => s.socialModalPlatform);
  const slotImages = useMemeEditorStore((s) => s.slotImages);
  const setSlotImages = useMemeEditorStore((s) => s.setSlotImages);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);
  const setSlotTransforms = useMemeEditorStore((s) => s.setSlotTransforms);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const showPhotoCrop = useEditorUiStore((s) => s.showPhotoCrop);
  const setShowPhotoCrop = useEditorUiStore((s) => s.setShowPhotoCrop);
  const showGifSheet = useEditorUiStore((s) => s.showGifSheet);
  const setShowGifSheet = useEditorUiStore((s) => s.setShowGifSheet);
  const mainPhoto = activeTemplate?.rawImageUrl || activeTemplate?.imageUrl;

  return (
    <>
      {showPhotoCrop && mainPhoto && (
        <PhotoCropSheet
          url={mainPhoto}
          uncroppedUrl={activeTemplate?.uncroppedUrl}
          onApply={(url) => { handleApplyMainPhotoCrop(url); setShowPhotoCrop(false); }}
          onRestore={(url) => { handleRestoreMainPhoto(url); setShowPhotoCrop(false); }}
          onClose={() => setShowPhotoCrop(false)}
        />
      )}

      {/* A Giphy GIF or animated sticker, added as a sticker (it plays: canvas/media). */}
      <GifBottomSheet
        isOpen={showGifSheet}
        onClose={() => setShowGifSheet(false)}
        onSelect={(gif) => handleAddGraphicSticker({ name: gif.title, url: gif.url })}
      />

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
      {showStylesModal && (
      <Suspense fallback={null}>
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
      </Suspense>
      )}

      {/* Face Morph & Swap Studio Modal */}
      {showFaceMorphModal && (
        <Suspense fallback={null}>
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
        </Suspense>
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
