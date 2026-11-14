// Home's carousel of feature slides (heroSlides.js): one card at a time, moving on by itself unless
// hovered or touched, with arrows, swipe and dots. A slide's buttons call `onAction` with what to
// open; its Upload button clicks the hidden file input here.
import { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { STUDIO_HERO_SLIDES, slidePicture } from './heroSlides';

export default function HeroCarousel({ onAction: handleFeatureClick, uploadInputRef: cutoutFileInputRef, onUploadSelected: handleCutoutImageSelected }) {
  // Carousel State & Touch/Autoplay controls for Hero Banner Studio Features
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const touchStartRef = useRef({ x: null, y: null });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__SET_HERO_SLIDE__ = (idx) => {
        setActiveSlideIndex(idx);
      };
    }
    if (isCarouselHovered) return;
    const timer = setInterval(() => {
      if (typeof window !== 'undefined' && window.__PAUSE_CAROUSEL__) return;
      setActiveSlideIndex((prev) => (prev + 1) % STUDIO_HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isCarouselHovered]);

  const handleNextSlide = (e) => {
    e?.stopPropagation?.();
    setActiveSlideIndex((prev) => (prev + 1) % STUDIO_HERO_SLIDES.length);
  };

  const handlePrevSlide = (e) => {
    e?.stopPropagation?.();
    setActiveSlideIndex((prev) => (prev - 1 + STUDIO_HERO_SLIDES.length) % STUDIO_HERO_SLIDES.length);
  };

  const handleDotClick = (index) => {
    setActiveSlideIndex(index);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current.x) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNextSlide();
      } else {
        handlePrevSlide();
      }
    }
    touchStartRef.current = { x: null, y: null };
  };
  const currentSlide = STUDIO_HERO_SLIDES[activeSlideIndex] || STUDIO_HERO_SLIDES[0];

  return (
    <section className="features-carousel-section" aria-label="Studio Features Showcase">
      {/* Flagship Hero Banner Carousel with Primary Orange Glow Glass Effect */}
      <div 
        className={`hero-banner-wrapper ${currentSlide.glowTheme}`}
        onMouseEnter={() => setIsCarouselHovered(true)}
        onMouseLeave={() => setIsCarouselHovered(false)}
        onTouchStart={(e) => { setIsCarouselHovered(true); handleTouchStart(e); }}
        onTouchEnd={(e) => { setIsCarouselHovered(false); handleTouchEnd(e); }}
      >
        {/* Carousel Left / Right Navigation Controls (Desktop hover arrows) */}
        <button 
          type="button"
          className="hero-carousel-nav hero-nav-prev" 
          onClick={handlePrevSlide} 
          aria-label="Previous feature banner"
        >
          <ChevronLeft size={16} />
        </button>

        <button 
          type="button"
          className="hero-carousel-nav hero-nav-next" 
          onClick={handleNextSlide} 
          aria-label="Next feature banner"
        >
          <ChevronRight size={16} />
        </button>

        <div className="hero-banner">
          <div className="hero-slides-viewport">
            <div
              className="hero-slides-track"
              style={{ transform: `translateX(-${activeSlideIndex * 100}%)` }}
            >
              {STUDIO_HERO_SLIDES.map((slide, idx) => {
                const isActive = idx === activeSlideIndex;
                const SlideIcon = slide.icon;
                const SecIcon = slide.secondaryIcon;
                return (
                  <div
                    key={slide.id}
                    className={`hero-slide-inner slide-${slide.id} ${isActive ? 'active' : ''}`}
                  >
                    {slidePicture(slide.picture) && (
                      <img
                        className={`hero-slide-pic${slide.mirror ? ' is-mirrored' : ''}`}
                        src={slidePicture(slide.picture)}
                        alt=""
                        style={slide.focus ? { objectPosition: slide.focus } : undefined}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        draggable={false}
                      />
                    )}
                    <span className="hero-slide-shade" aria-hidden="true" />
                    <div className="hero-card-header">
                      <div className="hero-text-content">
                        <div className={`hero-free-badge ${slide.badgeClass}`}>
                          <span className={`hero-free-dot ${slide.badgeDotClass}`} />
                          <span>{slide.badgeText}</span>
                        </div>
                        <h2 className="hero-title">
                          <span className="hero-title-line hero-title-line-1">
                            <span className="hero-title-main">{slide.titleMain}</span>
                          </span>
                          <br />
                          <span className="hero-title-line hero-title-line-2">
                            <span className={`hero-title-gradient ${slide.titleGradClass}`}>
                              {slide.titleGradient}
                            </span>
                          </span>
                        </h2>
                        <p className="hero-tagline">{slide.tagline}</p>
                      </div>
                    </div>

                    <div className="hero-actions">
                      {slide.id === 'customlayout' ? (
                        <button
                          type="button"
                          className="hero-pill-capsule-cta"
                          onClick={() => handleFeatureClick(slide)}
                          aria-label={slide.title}
                        >
                          <Sparkles size={17} className="hero-pill-capsule-icon" />
                          <span className="hero-pill-capsule-text">Start Creating</span>
                          <span className="hero-pill-capsule-knob" aria-hidden="true">
                            <ChevronRight size={17} strokeWidth={2.8} />
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`studio-pill-btn ${slide.primaryVariant}`}
                          onClick={() => handleFeatureClick(slide)}
                          aria-label={slide.title}
                        >
                          <SlideIcon size={17} className="studio-pill-icon" />
                          <span className="studio-pill-text">{slide.title}</span>
                        </button>
                      )}

                      {slide.secondaryLabel && (
                        <button
                          type="button"
                          className={`studio-pill-btn ${slide.secondaryVariant}`}
                          onClick={() => handleFeatureClick(slide.secondaryAction)}
                          aria-label={slide.secondaryLabel}
                        >
                          <SecIcon size={17} className="studio-pill-icon" />
                          <span className="studio-pill-text">{slide.secondaryLabel}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidden file input for Cutout Sticker upload */}
          <input
            type="file"
            ref={cutoutFileInputRef}
            style={{ display: 'none' }}
            accept="image/*,video/*"
            onChange={handleCutoutImageSelected}
          />

          {/* Carousel Dot / Pill Indicators */}
          <div className="hero-carousel-indicators" role="tablist" aria-label="Studio features navigation">
            {STUDIO_HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                className={`hero-indicator-dot ${idx === activeSlideIndex ? 'active' : ''}`}
                onClick={() => handleDotClick(idx)}
                aria-label={`Slide ${idx + 1}: ${slide.titleMain} ${slide.titleGradient}`}
                aria-selected={idx === activeSlideIndex}
                role="tab"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
