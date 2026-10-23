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
const NotificationsModal = lazy(() => import('./components/NotificationsModal'));
const SocialFeed = lazy(() => import('./components/SocialFeed'));
const AiCaptionModal = lazy(() => import('./components/AiCaptionModal'));
const ExploreView = lazy(() => import('./components/ExploreView'));
import { MEME_TEMPLATES } from './data/templates';
import { INITIAL_NOTIFICATIONS } from './data/notifications';
import { idbPutMeme, idbGetAllMemes, idbGetMeme, idbDeleteMeme, dataURLToBlob, createThumbnail, toMetadata } from './utils/galleryStore';
import { LayoutGrid, FolderHeart, User, Sun, Moon, Bell, Plus, Users, Compass, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('templates'); // 'templates' | 'custom-builder' | 'editor' | 'video-editor' | 'gallery'
  const [builderMode, setBuilderMode] = useState('image');
  const [exploreCategory, setExploreCategory] = useState('all'); // 'image' | 'video'
  const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);

  // Dynamic world-class theme system (Dark default with sunset-orange palette)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('meme_studio_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-palette', 'sunset-orange');
      if (document.body) {
        document.body.setAttribute('data-theme', theme);
        document.body.setAttribute('data-palette', 'sunset-orange');
      }
      localStorage.setItem('meme_studio_theme', theme);
    } catch (e) {
      console.error('Failed to set theme', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Remembers the last builder page so the Builder nav button resumes it
  const [lastBuilderView, setLastBuilderView] = useState('custom-builder');

  // Custom Builder persisted state (retains step 2, slot images & framing when navigating back)
  const [customBuilderState, setCustomBuilderState] = useState(null);

  // Modals state
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [aiGeneratorModalOpen, setAiGeneratorModalOpen] = useState(false);

  // Notifications state with persistence
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('meme_studio_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('meme_studio_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Mobile & Android gesture / hardware back-button history navigation
  useEffect(() => {
    if (!window.history.state?.view) {
      window.history.replaceState({ view: 'templates' }, '', window.location.pathname);
    }

    const handlePopState = (event) => {
      if (notificationsModalOpen) {
        setNotificationsModalOpen(false);
        return;
      }
      if (aiGeneratorModalOpen) {
        setAiGeneratorModalOpen(false);
        return;
      }
      if (accountModalOpen) {
        setAccountModalOpen(false);
        return;
      }
      const targetView = event.state?.view || 'templates';
      setCurrentView(targetView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [accountModalOpen, notificationsModalOpen, aiGeneratorModalOpen]);

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

  // Cleanup object URLs on unmount/pagehide to prevent mobile Safari memory leaks
  useEffect(() => {
    const cleanupUrls = () => {
      fullUrlCache.current.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      });
      fullUrlCache.current.clear();
    };
    window.addEventListener('pagehide', cleanupUrls);
    return () => {
      window.removeEventListener('pagehide', cleanupUrls);
      cleanupUrls();
    };
  }, []);

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

  // Auto-scroll window to top on view or template changes and lock scroll in editor modes
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const isEditorView = currentView === 'editor' || currentView === 'video-editor';
    if (isEditorView) {
      document.body.classList.add('editor-view-locked');
      document.documentElement.classList.add('editor-view-locked');
    } else {
      document.body.classList.remove('editor-view-locked');
      document.documentElement.classList.remove('editor-view-locked');
    }

    return () => {
      document.body.classList.remove('editor-view-locked');
      document.documentElement.classList.remove('editor-view-locked');
    };
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
    if (builderMode === 'video' || customTemplate?.type === 'video') {
      setVideoSessionKey((k) => k + 1);
      setHasOpenedVideoEditor(true);
      setCurrentView('video-editor');
    } else {
      setEditorSessionKey((k) => k + 1);
      setHasOpenedEditor(true);
      setCurrentView('editor');
    }
  };

  const handleOpenAiGenerator = () => {
    setAiGeneratorModalOpen(true);
  };

  const handleApplyAiGeneratedMeme = (captionText) => {
    setAiGeneratorModalOpen(false);
    const baseTemplate = selectedTemplate || MEME_TEMPLATES[0];
    setSelectedTemplate({
      ...baseTemplate,
      defaultCaptions: [
        {
          text: captionText,
          x: 0.5,
          y: 0.15,
          color: '#ffffff',
          stroke: '#000000',
          fontSize: 38,
          align: 'center'
        }
      ]
    });
    setEditorSessionKey((k) => k + 1);
    setHasOpenedEditor(true);
    setCurrentView('editor');
  };

  const handleNotificationAction = (item) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setNotificationsModalOpen(false);

    if (item.action?.type === 'template') {
      const t = MEME_TEMPLATES.find((x) => String(x.id) === String(item.action.templateId)) || MEME_TEMPLATES[0];
      handleSelectTemplate(t);
    } else if (item.action?.type === 'custom-builder') {
      handleCreateCustom('image');
    } else if (item.action?.type === 'gallery') {
      setCurrentView('gallery');
    } else if (item.action?.type === 'ai-prompt') {
      handleOpenAiGenerator();
    }
  };

  const handleRemixCommunityMeme = (post) => {
    const matchedTemplate = MEME_TEMPLATES.find((t) => String(t.id) === String(post.templateId));
    if (matchedTemplate) {
      setSelectedTemplate({
        ...matchedTemplate,
        defaultCaptions: post.captions?.map((c) => ({
          text: c.text,
          x: 0.5,
          y: c.y,
          color: '#ffffff',
          stroke: '#000000',
          fontSize: 36,
          align: 'center'
        })) || matchedTemplate.defaultCaptions
      });
    } else {
      setSelectedTemplate({
        id: `remix-${post.id}-${Date.now()}`,
        name: `Remix: ${post.title}`,
        imageUrl: post.imageUrl,
        category: 'custom',
        defaultCaptions: post.captions?.map((c) => ({
          text: c.text,
          x: 0.5,
          y: c.y,
          color: '#ffffff',
          stroke: '#000000',
          fontSize: 36,
          align: 'center'
        })) || []
      });
    }
    setEditorSessionKey((k) => k + 1);
    setHasOpenedEditor(true);
    setCurrentView('editor');
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
        // Bound cache to 40 items max (LRU eviction for mobile/Safari memory)
        if (fullUrlCache.current.size >= 40) {
          const oldestKey = fullUrlCache.current.keys().next().value;
          const oldestUrl = fullUrlCache.current.get(oldestKey);
          if (oldestUrl) {
            try { URL.revokeObjectURL(oldestUrl); } catch { /* ignore */ }
          }
          fullUrlCache.current.delete(oldestKey);
        }
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
      className={`app-root theme-${theme}`}
      data-theme={theme}
    >
      {/* Hardware-accelerated static fixed background for seamless mobile & desktop rendering */}
      <div className="app-static-bg" aria-hidden="true" />

      {/* Top Navbar Header - HIDDEN ON EDITOR & BUILDER VIEWS FOR BIGGER CANVAS */}
      {currentView !== 'editor' && currentView !== 'video-editor' && (
        <header className="app-header glass-card">
          <div className="header-container flex-between">
            <div className="app-brand flex-gap" onClick={() => setCurrentView('templates')}>
              <motion.div className="brand-ribbon-logo" whileHover={{ scale: 1.08, rotate: 4 }}>
                <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff5e36" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="ribbonGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="ribbonGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff9100" />
                      <stop offset="100%" stopColor="#ff5e36" />
                    </linearGradient>
                  </defs>
                  <path d="M20 5L33 12.5V27.5L20 35L7 27.5V12.5L20 5Z" fill="url(#ribbonGrad1)" opacity="0.18" />
                  <path d="M20 5L33 12.5L26.5 16.25L20 12.5L13.5 16.25L7 12.5L20 5Z" fill="url(#ribbonGrad3)" />
                  <path d="M7 12.5L13.5 16.25V27.5L7 23.75V12.5Z" fill="url(#ribbonGrad1)" />
                  <path d="M33 12.5L26.5 16.25V27.5L33 23.75V12.5Z" fill="url(#ribbonGrad2)" />
                  <path d="M20 12.5L26.5 16.25L20 20L13.5 16.25L20 12.5Z" fill="#ff5e36" />
                  <path d="M13.5 16.25L20 20V31.25L13.5 27.5V16.25Z" fill="url(#ribbonGrad1)" />
                  <path d="M26.5 16.25L20 20V31.25L26.5 27.5V16.25Z" fill="url(#ribbonGrad2)" />
                </svg>
              </motion.div>
              <div className="brand-text-block">
                <div className="brand-title-row">
                  <h1 className="brand-title">MEME</h1>
                  <span className="brand-pro-badge">PRO</span>
                </div>
                <span className="brand-tagline">Studio</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="desktop-nav flex-gap">
              <button
                className={`nav-link ${currentView === 'templates' ? 'active' : ''}`}
                onClick={() => setCurrentView('templates')}
              >
                <Home className="icon-xs" /> Home
              </button>
              <button
                className={`nav-link ${currentView === 'explore' ? 'active' : ''}`}
                onClick={() => setCurrentView('explore')}
              >
                <Compass className="icon-xs" /> Explore
              </button>
              <button
                className={`nav-link ${currentView === 'social' ? 'active' : ''}`}
                onClick={() => setCurrentView('social')}
              >
                <Users className="icon-xs" /> Social
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
                <FolderHeart className="icon-xs" style={{ color: currentView === 'gallery' ? 'var(--primary-accent)' : 'inherit' }} /> My Studio ({savedMemes.length})
              </button>
            </nav>

            {/* User Controls */}
            <div className="user-controls flex-gap" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <motion.button
                className="header-icon-circle notif-btn"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotificationsModalOpen(true)}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="icon-sm" />
                {unreadNotifsCount > 0 && <span className="notif-dot" />}
              </motion.button>

              <motion.button
                className="header-icon-circle theme-toggle-header-btn"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                title={theme === 'light' ? 'Switch to Dark Obsidian Mode' : 'Switch to Light Pearl Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="icon-sm" /> : <Sun className="icon-sm" />}
              </motion.button>

              <motion.button
                className="header-icon-circle account-header-btn"
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
      <main className={`main-content-container ${currentView === 'editor' || currentView === 'video-editor' ? 'editor-view-mode' : ''}`}>
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
                onOpenAiGenerator={handleOpenAiGenerator}
                onNavigateExplore={(cat) => {
                  if (cat) setExploreCategory(cat);
                  setCurrentView('explore');
                }}
              />
            </motion.div>
          )}

                    {currentView === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <Suspense fallback={<div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>Loading explore templates…</div>}>
                <ExploreView
                  initialCategory={exploreCategory}
                  onSelectTemplate={handleSelectTemplate}
                  onCreateCustom={handleCreateCustom}
                />
              </Suspense>
            </motion.div>
          )}

          {currentView === 'social' && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <Suspense fallback={<div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>Loading community memes…</div>}>
                <SocialFeed
                  onRemixMeme={handleRemixCommunityMeme}
                  onCreateCustom={handleCreateCustom}
                />
              </Suspense>
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
                  onSelectTemplate={handleSelectTemplate}
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
                  theme={theme}
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
                  theme={theme}
                />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      </main>

      {/* Floating Island Capsule Dock - Hidden during editing for maximum canvas space */}
      {currentView !== 'editor' && currentView !== 'video-editor' && (
        <nav className="floating-island-dock">
          <button
            className={`dock-nav-item ${currentView === 'templates' ? 'active' : ''}`}
            onClick={() => setCurrentView('templates')}
          >
            <Home className="dock-icon" size={20} />
            <span className="dock-label">Home</span>
            {currentView === 'templates' && <span className="dock-active-dot" />}
          </button>

          <button
            className={`dock-nav-item ${currentView === 'explore' ? 'active' : ''}`}
            onClick={() => setCurrentView('explore')}
          >
            <Compass className="dock-icon" size={20} />
            <span className="dock-label">Explore</span>
            {currentView === 'explore' && <span className="dock-active-dot" />}
          </button>

          <div className="dock-creator-wrapper">
            <motion.button
              className={`dock-creator-squircle ${currentView === 'custom-builder' ? 'active' : ''}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setBuilderMode('image');
                setCurrentView('custom-builder');
              }}
              title="Create Custom Meme"
            >
              <Plus size={22} strokeWidth={2.8} />
            </motion.button>
            <span className="dock-creator-label">Creator</span>
            {currentView === 'custom-builder' && <span className="dock-active-dot" style={{ bottom: '-6px' }} />}
          </div>

          <button
            className={`dock-nav-item ${currentView === 'social' ? 'active' : ''}`}
            onClick={() => setCurrentView('social')}
          >
            <Users className="dock-icon" size={20} />
            <span className="dock-label">Social</span>
            {currentView === 'social' && <span className="dock-active-dot" />}
          </button>

          <button
            className={`dock-nav-item ${currentView === 'gallery' ? 'active' : ''}`}
            onClick={() => setCurrentView('gallery')}
          >
            <FolderHeart className="dock-icon" size={20} />
            <span className="dock-label">My Studio</span>
            {savedMemes.length > 0 && (
              <span className="dock-count-badge">{savedMemes.length}</span>
            )}
            {currentView === 'gallery' && <span className="dock-active-dot" />}
          </button>
        </nav>
      )}

      {/* Account Modal */}
      {accountModalOpen && (
        <Suspense fallback={null}>
          <AccountModal isOpen={true} onClose={() => setAccountModalOpen(false)} />
        </Suspense>
      )}

      {/* Notifications Modal */}
      {notificationsModalOpen && (
        <Suspense fallback={null}>
          <NotificationsModal
            isOpen={true}
            onClose={() => setNotificationsModalOpen(false)}
            notifications={notifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onNotificationAction={handleNotificationAction}
          />
        </Suspense>
      )}

      {/* Standalone AI Prompt Generator Modal */}
      {aiGeneratorModalOpen && (
        <Suspense fallback={null}>
          <AiCaptionModal
            isOpen={true}
            onClose={() => setAiGeneratorModalOpen(false)}
            onApplyCaption={handleApplyAiGeneratedMeme}
            templateName={selectedTemplate?.name || 'Popular Meme'}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
