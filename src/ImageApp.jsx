import React, { useState, useEffect } from 'react';
import TemplateDiscovery from './components/TemplateDiscovery';
import CustomLayoutBuilder from './components/CustomLayoutBuilder';
import MemeEditor from './components/MemeEditor';
import MyGallery from './components/MyGallery';
import AccountModal from './components/AccountModal';
import SettingsModal from './components/SettingsModal';
import { MEME_TEMPLATES } from './data/templates';
import { Sparkles, Grid, LayoutGrid, Image as ImageIcon, Settings, User, ChevronLeft } from 'lucide-react';
import './App.css';

function ImageApp({ onBackToHub }) {
  const [currentView, setCurrentView] = useState('templates'); // 'templates' | 'custom-builder' | 'editor' | 'gallery'
  const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);
  const [theme, setTheme] = useState('dark');

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

  // Handlers
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setCurrentView('editor');
  };

  const handleCustomLayoutComplete = (customTemplate) => {
    setSelectedTemplate(customTemplate);
    setCurrentView('editor');
  };

  const handleSaveToGallery = (newMeme) => {
    setSavedMemes((prev) => [newMeme, ...prev]);
  };

  const handleDeleteMeme = (id) => {
    setSavedMemes((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`app-root theme-${theme}`}>
      {/* Top Navbar Header */}
      <header className="app-header glass-card">
        <div className="header-container flex-between">
          <div className="flex items-center gap-4">
            <button onClick={onBackToHub} className="flex items-center text-gray-400 hover:text-white transition-colors" title="Back to Hub">
              <ChevronLeft size={24} />
            </button>
            <div className="app-brand flex-gap" onClick={() => setCurrentView('templates')}>
              <div className="brand-logo flex-center">
                <Sparkles className="icon-md text-cyan" />
              </div>
              <div>
                <h1 className="brand-title">Meme Creator</h1>
                <span className="brand-tagline">Mobile & Web Studio</span>
              </div>
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
              className={`nav-link ${currentView === 'custom-builder' ? 'active' : ''}`}
              onClick={() => setCurrentView('custom-builder')}
            >
              <LayoutGrid className="icon-xs" /> Custom Layouts
            </button>
            <button
              className={`nav-link ${currentView === 'gallery' ? 'active' : ''}`}
              onClick={() => setCurrentView('gallery')}
            >
              <ImageIcon className="icon-xs" /> My Memes ({savedMemes.length})
            </button>
          </nav>

          {/* User Controls */}
          <div className="user-controls flex-gap">
            <button className="btn btn-icon" onClick={() => setAccountModalOpen(true)} title="Account">
              <User className="icon-sm" />
            </button>
            <button className="btn btn-icon" onClick={() => setSettingsModalOpen(true)} title="Settings">
              <Settings className="icon-sm" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content-container">
        {currentView === 'templates' && (
          <TemplateDiscovery
            onSelectTemplate={handleSelectTemplate}
            onCreateCustom={() => setCurrentView('custom-builder')}
          />
        )}

        {currentView === 'custom-builder' && (
          <CustomLayoutBuilder
            onLayoutComplete={handleCustomLayoutComplete}
            onBack={() => setCurrentView('templates')}
          />
        )}

        {currentView === 'editor' && (
          <MemeEditor
            template={selectedTemplate}
            onBack={() => setCurrentView('templates')}
            onSaveToGallery={handleSaveToGallery}
          />
        )}

        {currentView === 'gallery' && (
          <MyGallery
            savedMemes={savedMemes}
            onDeleteMeme={handleDeleteMeme}
            onSelectMeme={handleSelectTemplate}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-bar glass-card">
        <button
          className={`mobile-nav-item ${currentView === 'templates' ? 'active' : ''}`}
          onClick={() => setCurrentView('templates')}
        >
          <Grid className="icon-sm" />
          <span>Browse</span>
        </button>
        <button
          className={`mobile-nav-item ${currentView === 'custom-builder' ? 'active' : ''}`}
          onClick={() => setCurrentView('custom-builder')}
        >
          <LayoutGrid className="icon-sm" />
          <span>Custom</span>
        </button>
        <button
          className={`mobile-nav-item ${currentView === 'editor' ? 'active' : ''}`}
          onClick={() => setCurrentView('editor')}
        >
          <Sparkles className="icon-sm" />
          <span>Editor</span>
        </button>
        <button
          className={`mobile-nav-item ${currentView === 'gallery' ? 'active' : ''}`}
          onClick={() => setCurrentView('gallery')}
        >
          <ImageIcon className="icon-sm" />
          <span>Gallery</span>
        </button>
      </nav>

      {/* Modals */}
      <AccountModal isOpen={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

export default ImageApp;
