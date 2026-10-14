import React, { useState, useEffect, Suspense, lazy } from 'react';
import TemplateDiscovery from './components/TemplateDiscovery';
import ErrorBoundary from './components/ErrorBoundary';

// Code-split heavy views and editors so the initial bundle stays lean.
const CustomLayoutBuilder = lazy(() => import('./components/CustomLayoutBuilder'));
const VideoLayoutBuilder = lazy(() => import('./components/video-editor/VideoLayoutBuilder'));
const MyGallery = lazy(() => import('./components/MyGallery'));
const AccountModal = lazy(() => import('./components/AccountModal'));
const MemeEditor = lazy(() => import('./components/MemeEditor'));
const VideoEditor = lazy(() => import('./components/video-editor/VideoEditor'));
import { MEME_TEMPLATES } from './data/templates';
import { idbPutMeme, idbGetAllMemes, idbGetMeme, idbDeleteMeme, dataURLToBlob, createThumbnail, toMetadata } from './utils/galleryStore';
import { Sparkles, Grid, LayoutGrid, FolderHeart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('templates'); // 'templates' | 'custom-builder' | 'editor' | 'video-editor' | 'gallery'
  const [builderMode, setBuilderMode] = useState('image'); // 'image' | 'video'
  const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);

  // Hardcoded premium aesthetics, removing the color palette and theme toggle feature
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-palette', 'sunset-orange');
      if (document.body) {
        document.body.setAttribute('data-palette', 'sunset-orange');
      }
    } catch (e) {
      console.error('Failed to set fixed theme', e);
    }
  }, []);

  // Remembers the last builder page so the Builder nav button resumes it
  const [lastBuilderView, setLastBuilderView] = useState('custom-builder');

  // Custom Builder persisted state (retains step 2, slot images & framing when navigating back)
  const [customBuilderState, setCustomBuilderState] = useState(null);

  // Modals state
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  // Mobile & Android gesture / hardware back-button history navigation
  useEffect(() => {
    if (!window.history.state?.view) {
      window.history.replaceState({ view: 'templates' }, '', window.location.pathname);
    }

    const handlePopState = (event) => {
      if (accountModalOpen) {
        setAccountModalOpen(false);
        return;
      }
      const targetView = event.state?.view || 'templates';
      setCurrentView(targetView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [accountModalOpen]);

  useEffect(() => {
    if (window.history.state?.view !== currentView) {
      window.history.pushState({ view: currentView }, '', window.location.pathname);
    }
  }, [currentView]);

  useEffect(() => {
    if (accountModalOpen && window.history.state?.modal !== 'account') {
      window.history.pushState({ modal: 'account', view: currentView }, '', window.location.pathname);
    }
  }, [accountModalOpen, currentView]);

  // Saved Memes (IndexedDB for bytes + small metadata in state; avoids localStorage quota crashes)
  const [savedMemes, setSavedMemes] = useState([]);
  const [galleryReady, setGalleryReady] = useState(false);
  const fullUrlCache = React.useRef(new Map());

  // One-time load + migration from legacy localStorage key
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const records = await idbGetAllMemes();
        if (!cancelled && records.length > 0) {
          setSavedMemes(records.map(toMetadata));
        } else {
          // Migrate legacy localStorage gallery (full dataURLs) into IDB once, then free the key
          try {
            const stored = localStorage.getItem('meme_creator_saved');
            const legacy = stored ? JSON.parse(stored) : [];
            if (Array.isArray(legacy) && legacy.length > 0) {
              const migrated = [];
              for (const m of legacy.slice(0, 100)) {
                try {
                  const id = m.id || `meme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                  const imageUrl = m.imageUrl || m.thumbnailUrl || '';
                  const thumbnailUrl = imageUrl.startsWith('data:image')
                    ? await createThumbnail(imageUrl)
                    : imageUrl;
                  const record = {
                    id,
                    name: m.name || 'My Meme',
                    createdAt: m.createdAt || new Date().toISOString(),
                    thumbnailUrl,
                    imageBlob: imageUrl.startsWith('data:image') ? dataURLToBlob(imageUrl) : null,
                    rawImageUrl: m.rawImageUrl || null,
                    captions: m.captions || [],
                    stickers: m.stickers || m.defaultStickers || [],
                    imageLayers: m.imageLayers || [],
                    aspectRatio: m.aspectRatio,
                    imageFit: m.imageFit,
                    isNativeLayout: m.isNativeLayout,
                    layoutDef: m.layoutDef,
                    slotImages: m.slotImages,
                    slotTransforms: m.slotTransforms,
                  };
                  await idbPutMeme(record);
                  migrated.push(toMetadata(record));
                } catch { /* skip corrupt entry */ }
              }
              if (!cancelled) setSavedMemes(migrated);
            }
          } catch { /* ignore */ }
          try {
            localStorage.removeItem('meme_creator_saved');
          } catch { /* ignore */ }
        }
      } catch (e) {
        console.error('Failed to load gallery from IndexedDB', e);
      } finally {
        if (!cancelled) setGalleryReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll window to top on view or template changes so editor is instantly visible
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentView, selectedTemplate]);

  // Prevent background scrolling whenever any modal is open across the entire app
  useEffect(() => {
    const updateScrollLock = () => {
      const hasModal = document.querySelector('.modal-backdrop') !== null;
      if (hasModal) {
        document.body.classList.add('modal-open');
        document.documentElement.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      } else {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    };

    updateScrollLock();

    const observer = new MutationObserver(updateScrollLock);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, []);

  // Persistent session states for builders so layers & edits are never lost
  const [hasOpenedEditor, setHasOpenedEditor] = useState(false);
  const [hasOpenedVideoEditor, setHasOpenedVideoEditor] = useState(false);
  const [hasOpenedCustomBuilder, setHasOpenedCustomBuilder] = useState(false);
  const [editorSessionKey, setEditorSessionKey] = useState(0);
  const [videoSessionKey, setVideoSessionKey] = useState(0);
  const [customBuilderKey, setCustomBuilderKey] = useState(0);

  // Track the last builder-related view and ensure builders are initialized
  useEffect(() => {
    if (currentView === 'custom-builder' || currentView === 'editor' || currentView === 'video-editor') {
      setLastBuilderView(currentView);
      if (currentView === 'editor') setHasOpenedEditor(true);
      if (currentView === 'video-editor') setHasOpenedVideoEditor(true);
      if (currentView === 'custom-builder') setHasOpenedCustomBuilder(true);

      // Trigger resize event after DOM display update so canvas syncs dimensions accurately
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  // Handlers
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    if (template.type === 'video') {
      setVideoSessionKey((k) => k + 1);
      setHasOpenedVideoEditor(true);
      setCurrentView('video-editor');
    } else {
      setEditorSessionKey((k) => k + 1);
      setHasOpenedEditor(true);
      setCurrentView('editor');
    }
  };

  const handleCreateCustom = (mode) => {
    setBuilderMode(mode);
    setCustomBuilderKey((k) => k + 1);
    setCustomBuilderState(null);
    setHasOpenedCustomBuilder(true);
    setLastBuilderView('custom-builder');
    setCurrentView('custom-builder');
  };

  const handleCustomLayoutComplete = (customTemplate) => {
    setSelectedTemplate(customTemplate);
    if (builderMode === 'video') {
      setVideoSessionKey((k) => k + 1);
      setHasOpenedVideoEditor(true);
      setCurrentView('video-editor');
    } else {
      setEditorSessionKey((k) => k + 1);
      setHasOpenedEditor(true);
      setCurrentView('editor');
    }
  };

  const handleSaveToGallery = (newMeme) => {
    const baseName = (newMeme.name || 'My Meme').trim();
    setSavedMemes((prev) => {
      const existingNames = prev.map((m) => (m.name || '').toLowerCase());

      let finalName = baseName;
      if (existingNames.includes(baseName.toLowerCase())) {
        let counter = 1;
        while (existingNames.includes(`${baseName} (${counter})`.toLowerCase())) {
          counter++;
        }
        finalName = `${baseName} (${counter})`;
      }

      const id = newMeme.id || `meme-${Date.now()}`;
      const createdAt = newMeme.createdAt || new Date().toISOString();
      const meta = {
        ...newMeme,
        id,
        name: finalName,
        createdAt,
        thumbnailUrl: newMeme.thumbnailUrl || '',
        imageUrl: newMeme.thumbnailUrl || '',
      };
      const next = [meta, ...prev].slice(0, 100);

      // Persist bytes async (fire-and-forget); thumbnail first for instant UI
      (async () => {
        try {
          const imageUrl = newMeme.imageUrl || '';
          const thumbnailUrl = imageUrl.startsWith('data:image')
            ? await createThumbnail(imageUrl)
            : imageUrl;
          const record = {
            id,
            name: finalName,
            createdAt,
            thumbnailUrl,
            imageBlob: imageUrl.startsWith('data:image') ? dataURLToBlob(imageUrl) : null,
            rawImageUrl: newMeme.rawImageUrl || null,
            captions: newMeme.captions || [],
            stickers: newMeme.stickers || newMeme.defaultStickers || [],
            imageLayers: newMeme.imageLayers || [],
            aspectRatio: newMeme.aspectRatio,
            imageFit: newMeme.imageFit,
            isNativeLayout: newMeme.isNativeLayout,
            layoutDef: newMeme.layoutDef,
            slotImages: newMeme.slotImages,
            slotTransforms: newMeme.slotTransforms,
          };
          await idbPutMeme(record);
          setSavedMemes((cur) =>
            cur.map((m) =>
              m.id === id ? { ...m, thumbnailUrl, imageUrl: thumbnailUrl } : m
            )
          );
          // Prune oldest beyond 100
          const pruned = next.slice(100);
          for (const p of pruned) {
            try {
              await idbDeleteMeme(p.id);
            } catch { /* ignore */ }
          }
        } catch (e) {
          console.error('Failed to persist meme to IndexedDB', e);
        }
      })();

      return next;
    });
    setLastBuilderView('custom-builder');
    setCurrentView('gallery');
  };

  const handleDeleteMeme = (id) => {
    setSavedMemes((prev) => prev.filter((m) => m.id !== id));
    const cached = fullUrlCache.current.get(id);
    if (cached) {
      try {
        URL.revokeObjectURL(cached);
      } catch { /* ignore */ }
      fullUrlCache.current.delete(id);
    }
    idbDeleteMeme(id).catch((e) => console.error('Failed to delete meme from IndexedDB', e));
  };

  // Resolve full-resolution object URL for preview/download/edit (cached per id)
  const resolveMemeFullImage = async (meme) => {
    if (!meme) return '';
    const cached = fullUrlCache.current.get(meme.id);
    if (cached) return cached;
    try {
      const record = await idbGetMeme(meme.id);
      if (record?.imageBlob) {
        const url = URL.createObjectURL(record.imageBlob);
        fullUrlCache.current.set(meme.id, url);
        return url;
      }
    } catch (e) {
      console.error('Failed to resolve full meme image', e);
    }
    return meme.thumbnailUrl || meme.imageUrl || '';
  };

  const handleEditorBack = () => {
    setLastBuilderView('custom-builder');
    if (selectedTemplate?.category === 'custom' || selectedTemplate?.id?.startsWith('custom-')) {
      setCurrentView('custom-builder');
    } else {
      setCurrentView('templates');
    }
  };

  return (
    <div
      className="app-root theme-dark palette-sunset-orange"
      data-theme="dark"
      data-palette="sunset-orange"
    >
      {/* Hardware-accelerated static fixed background for seamless mobile & desktop rendering */}
      <div className="app-static-bg" aria-hidden="true" />

      {/* Top Navbar Header - HIDDEN ON EDITOR & BUILDER VIEWS FOR BIGGER CANVAS */}
      {currentView !== 'editor' && currentView !== 'video-editor' && currentView !== 'custom-builder' && (
        <header className="app-header glass-card">
          <div className="header-container flex-between">
            <div className="app-brand flex-gap" onClick={() => setCurrentView('templates')}>
              <motion.div className="brand-logo flex-center" whileHover={{ scale: 1.1, rotate: 10 }}>
                <Sparkles className="icon-md text-cyan" />
              </motion.div>
              <div>
                <h1 className="brand-title">Meme Creator</h1>
                <span className="brand-tagline">Mobile & Web Studio</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="desktop-nav flex-gap">
              <button
                className={`nav-link ${currentView === 'templates' ? 'active' : ''}`}
                onClick={() => setCurrentView('templates')}
              >
                <Grid className="icon-xs" /> Templates
              </button>
              <button
                className={`nav-link ${
                  currentView === 'custom-builder' || currentView === 'editor' || currentView === 'video-editor' ? 'active' : ''
                }`}
                onClick={() => setCurrentView(lastBuilderView)}
              >
                <LayoutGrid className="icon-xs" /> Builder
              </button>
              <button
                className={`nav-link ${currentView === 'gallery' ? 'active' : ''}`}
                onClick={() => setCurrentView('gallery')}
              >
                <FolderHeart className="icon-xs" style={{ color: currentView === 'gallery' ? 'var(--cyber-cyan)' : '#ffffff' }} /> My Memes ({savedMemes.length})
              </button>
            </nav>

            {/* User Controls */}
            <div className="user-controls flex-gap" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <motion.button
                className="account-header-btn"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAccountModalOpen(true)}
                title="Account & Sync"
              >
                <User className="icon-sm" />
              </motion.button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area with Animated Motion Transitions */}
      {/* Main Content Area with Animated Transitions & Persistent Builder Tabs */}
      <main className={`main-content-container ${currentView === 'editor' || currentView === 'video-editor' || currentView === 'custom-builder' ? 'editor-view-mode' : ''}`}>
        <AnimatePresence mode="wait">
          {currentView === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <TemplateDiscovery
                onSelectTemplate={handleSelectTemplate}
                onCreateCustom={handleCreateCustom}
              />
            </motion.div>
          )}

          {currentView === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <Suspense fallback={<div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>Loading gallery…</div>}>
                <MyGallery
                  savedMemes={savedMemes}
                  galleryReady={galleryReady}
                  onDeleteMeme={handleDeleteMeme}
                  onSelectMeme={handleSelectTemplate}
                  onResolveFullImage={resolveMemeFullImage}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Persistent Builder Views - Kept mounted in DOM so element layers, stickers & edits are preserved */}
        <div
          className={`persistent-builder-view ${currentView === 'custom-builder' ? 'active-view' : 'hidden-view'}`}
        >
          {hasOpenedCustomBuilder && (
            <Suspense fallback={<div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>Loading builder…</div>}>
              {builderMode === 'video' ? (
                <VideoLayoutBuilder
                  key={`video-builder-${customBuilderKey}`}
                  onLayoutComplete={handleCustomLayoutComplete}
                  onBack={() => setCurrentView('templates')}
                />
              ) : (
                <CustomLayoutBuilder
                  key={`custom-builder-${customBuilderKey}`}
                  savedState={customBuilderState}
                  onSaveState={setCustomBuilderState}
                  onLayoutComplete={handleCustomLayoutComplete}
                  onBack={() => setCurrentView('templates')}
                />
              )}
            </Suspense>
          )}
        </div>

        <div
          className={`persistent-builder-view ${currentView === 'editor' ? 'active-view' : 'hidden-view'}`}
        >
          {hasOpenedEditor && selectedTemplate && (
            <ErrorBoundary
              fallbackTitle="Editor crashed"
              fallbackMessage="Something went wrong in the meme editor. Try going back and selecting a different template."
              onBack={handleEditorBack}
              onReset={() => setEditorSessionKey((k) => k + 1)}
            >
              <Suspense fallback={<div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>Loading editor…</div>}>
                <MemeEditor
                  key={`${selectedTemplate?.id || 'editor'}-${editorSessionKey}`}
                  template={selectedTemplate}
                  onBack={handleEditorBack}
                  onSaveToGallery={handleSaveToGallery}
                  theme="dark"
                />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>

        <div
          className={`persistent-builder-view ${currentView === 'video-editor' ? 'active-view' : 'hidden-view'}`}
        >
          {hasOpenedVideoEditor && selectedTemplate && (
            <ErrorBoundary
              fallbackTitle="Video editor crashed"
              fallbackMessage="Something went wrong in the video editor. Try going back and selecting a different template."
              onBack={handleEditorBack}
              onReset={() => setVideoSessionKey((k) => k + 1)}
            >
              <Suspense fallback={<div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>Loading video editor…</div>}>
                <VideoEditor
                  key={`${selectedTemplate?.id || 'video-editor'}-${videoSessionKey}`}
                  template={selectedTemplate}
                  onBack={handleEditorBack}
                  theme="dark"
                />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      </main>

      {/* Mobile Floating Bottom Navigation Bar */}
      <nav className="mobile-bottom-bar glass-card">
        <button
          className={`mobile-nav-item ${currentView === 'templates' ? 'active' : ''}`}
          onClick={() => setCurrentView('templates')}
        >
          <Grid className="icon-sm" />
          <span>Templates</span>
        </button>
        <button
          className={`mobile-nav-item ${
            currentView === 'custom-builder' || currentView === 'editor' || currentView === 'video-editor' ? 'active' : ''
          }`}
          onClick={() => setCurrentView(lastBuilderView)}
        >
          <LayoutGrid className="icon-sm" />
          <span>Builder</span>
        </button>
        <button
          className={`mobile-nav-item ${currentView === 'gallery' ? 'active' : ''}`}
          onClick={() => setCurrentView('gallery')}
        >
          <FolderHeart className="icon-sm" />
          <span>My Memes</span>
        </button>
      </nav>

      {/* Account Modal */}
      {accountModalOpen && (
        <Suspense fallback={null}>
          <AccountModal isOpen={true} onClose={() => setAccountModalOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default App;
