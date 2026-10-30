import React, { Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import VideoTrimmer from '../VideoTrimmer';
import AiCaptionModal from '../AiCaptionModal';
// The social card studio and the face swap studio load when first opened.
const MemeStylesModal = lazy(() => import('../MemeStylesModal'));
const FaceMorphModal = lazy(() => import('../FaceMorphModal'));
import PhotoCropSheet from './crop/PhotoCropSheet';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';

export default function EditorModals({
  currentEditingSocialCard,
  extractedMemeFace,
  faceTarget,
  handleAddInstagramCard,
  handleAddTweetCard,
  handleAddWhatsAppCard,
  handleApplyAiCaption,
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
  commitAddImageLayer,
  handleApplyMainPhotoCrop,
  handleRestoreMainPhoto,
}) {
  const pendingVideoLayer = useEditorUiStore((s) => s.pendingVideoLayer);
  const setPendingVideoLayer = useEditorUiStore((s) => s.setPendingVideoLayer);
  const setShowAiModal = useEditorUiStore((s) => s.setShowAiModal);
  const setShowStylesModal = useEditorUiStore((s) => s.setShowStylesModal);
  const showAiModal = useEditorUiStore((s) => s.showAiModal);
  const showStylesModal = useEditorUiStore((s) => s.showStylesModal);
  const socialModalPlatform = useEditorUiStore((s) => s.socialModalPlatform);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const showPhotoCrop = useEditorUiStore((s) => s.showPhotoCrop);
  const setShowPhotoCrop = useEditorUiStore((s) => s.setShowPhotoCrop);
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
