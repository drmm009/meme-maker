import React, { useState, useEffect } from 'react';
import TemplateDiscovery from './components/TemplateDiscovery';
import CustomLayoutBuilder from './components/CustomLayoutBuilder';
import VideoLayoutBuilder from './components/video-editor/VideoLayoutBuilder';
import MemeEditor from './components/MemeEditor';
import VideoEditor from './components/video-editor/VideoEditor';
import MyGallery from './components/MyGallery';
import AccountModal from './components/AccountModal';
import SettingsModal from './components/SettingsModal';
import { MEME_TEMPLATES } from './data/templates';
import { Sparkles, Grid, LayoutGrid, FolderHeart, Settings, User, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('templates'); // 'templates' | 'custom-builder' | 'editor' | 'video-editor' | 'gallery'
  const [builderMode, setBuilderMode] = useState('image'); // 'image' | 'video'
  const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('meme_creator_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('meme_creator_theme', theme);
    } catch (e) {
      console.error('Failed to set theme', e);
    }
  }, [theme]);

  // Remembers the last builder page so the Builder nav button resumes it
  const [lastBuilderView, setLastBuilderView] = useState('custom-builder');

  // Custom Builder persisted state (retains step 2, slot images & framing when navigating back)
  const [customBuilderState, setCustomBuilderState] = useState(null);

  // Modals state
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Saved Memes (persisted in LocalStorage)
  const [savedMemes, setSavedMemes] = useState(() => {
    try {
      const stored = localStorage.getItem('meme_creator_saved');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('meme_creator_saved', JSON.stringify(savedMemes));
    } catch (e) {
      console.error('Failed to save memes to storage', e);
    }
  }, [savedMemes]);

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
    setEditorSessionKey((k) => k + 1);
    setHasOpenedEditor(true);
    setCurrentView('editor');
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
    setSavedMemes((prev) => {
      const baseName = (newMeme.name || 'My Meme').trim();
      const existingNames = prev.map((m) => (m.name || '').toLowerCase());
      
      let finalName = baseName;
      if (existingNames.includes(baseName.toLowerCase())) {
        let counter = 1;
        while (existingNames.includes(`${baseName} (${counter})`.toLowerCase())) {
          counter++;
        }
        finalName = `${baseName} (${counter})`;
      }

      return [{ ...newMeme, name: finalName }, ...prev];
    });
    setLastBuilderView('custom-builder');
    setCurrentView('gallery');
  };

  const handleDeleteMeme = (id) => {
    setSavedMemes((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
    <div className={`app-root theme-${theme}`}>
      {/* Top Navbar Header - HIDDEN ON EDITOR & BUILDER VIEWS FOR BIGGER CANVAS */}
      {currentView !== 'editor' && currentView !== 'video-editor' && currentView !== 'custom-builder' && (
        <header className="app-header glass-card">
          <div className="header-container flex-between">
            <div className="app-brand flex-gap" onClick={() => setCurrentView('templates')}>
              <motion.div className="brand-logo flex-center" whileHover={{ scale: 1.1, rotate: 10 }}>
                <Sparkles className="icon-md text-cyan" />
              </motion.div>
              <div>
                <h1 className="brand-title">Meme Creator v24</h1>
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
            <div className="user-controls flex-gap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.button
                className="theme-toggle-header-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Light/Dark Mode"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: theme === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : '#ffffff',
                  border: theme === 'dark'
                    ? '1.5px solid var(--glass-border)'
                    : '2px solid #171310',
                  color: 'var(--text-main)',
                  boxShadow: theme === 'dark'
                    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                    : '2px 2px 0 #171310',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="icon-sm" style={{ width: '18px', height: '18px', color: '#ffc93c' }} />
                    <span className="theme-toggle-text">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="icon-sm" style={{ width: '18px', height: '18px', color: '#ff6b2c' }} />
                    <span className="theme-toggle-text">Dark Mode</span>
                  </>
                )}
              </motion.button>

              <motion.button
                className="account-header-btn"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAccountModalOpen(true)}
                title="Account & Sync"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(226, 38, 90, 0.18) 0%, rgba(168, 85, 247, 0.22) 100%)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 4px 12px rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  color: 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                <User className="icon-sm" style={{ width: '20px', height: '20px', color: theme === 'dark' ? '#ffffff' : '#7c3aed' }} />
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
              <MyGallery
                savedMemes={savedMemes}
                onDeleteMeme={handleDeleteMeme}
                onSelectMeme={handleSelectTemplate}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Persistent Builder Views - Kept mounted in DOM so element layers, stickers & edits are preserved */}
        <div
          className={`persistent-builder-view ${currentView === 'custom-builder' ? 'active-view' : 'hidden-view'}`}
        >
          {hasOpenedCustomBuilder && (
            builderMode === 'video' ? (
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
            )
          )}
        </div>

        <div
          className={`persistent-builder-view ${currentView === 'editor' ? 'active-view' : 'hidden-view'}`}
        >
          {hasOpenedEditor && selectedTemplate && (
            <MemeEditor
              key={`${selectedTemplate?.id || 'editor'}-${editorSessionKey}`}
              template={selectedTemplate}
              onBack={handleEditorBack}
              onSaveToGallery={handleSaveToGallery}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
        </div>

        <div
          className={`persistent-builder-view ${currentView === 'video-editor' ? 'active-view' : 'hidden-view'}`}
        >
          {hasOpenedVideoEditor && selectedTemplate && (
            <VideoEditor
              key={`${selectedTemplate?.id || 'video-editor'}-${videoSessionKey}`}
              template={selectedTemplate}
              onBack={handleEditorBack}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
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

      {/* Account & Settings Modals */}
      {accountModalOpen && (
        <AccountModal isOpen={true} onClose={() => setAccountModalOpen(false)} />
      )}
      {settingsModalOpen && (
        <SettingsModal
          isOpen={true}
          onClose={() => setSettingsModalOpen(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}

export default App;
