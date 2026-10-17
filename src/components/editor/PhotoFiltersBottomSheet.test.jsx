// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PhotoFiltersBottomSheet from './PhotoFiltersBottomSheet';
import { PHOTO_FILTERS } from '../../data/photoFilters';

beforeEach(() => {
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    });
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  }
});

afterEach(() => cleanup());

describe('PhotoFiltersBottomSheet', () => {
  it('renders photo filters with visuals and triggers setImageFilters when clicked', () => {
    const handleSetFilters = vi.fn();
    const handleClose = vi.fn();

    render(
      <PhotoFiltersBottomSheet
        isOpen={true}
        onClose={handleClose}
        imageFilters={{ preset: 'original', filterScope: 'background' }}
        setImageFilters={handleSetFilters}
      />
    );

    expect(screen.getByText('Original')).toBeDefined();
    expect(screen.getByText('Deep Fried 🔥')).toBeDefined();

    const deepFriedBtn = screen.getByText('Deep Fried 🔥').closest('button');
    expect(deepFriedBtn).toBeDefined();
    fireEvent.click(deepFriedBtn);

    expect(handleSetFilters).toHaveBeenCalledTimes(1);
  });

  it('updates active image layer when activeImageLayer is provided', () => {
    const handleUpdateLayer = vi.fn();
    const activeLayer = { id: 'img-1', url: 'https://test.com/photo.png', filterId: 'original' };

    render(
      <PhotoFiltersBottomSheet
        isOpen={true}
        onClose={() => {}}
        activeImageLayer={activeLayer}
        updateActiveImageLayer={handleUpdateLayer}
      />
    );

    expect(screen.getByText('Image Layer')).toBeDefined();
    const punchyBtn = screen.getByText('Punchy Contrast').closest('button');
    fireEvent.click(punchyBtn);

    expect(handleUpdateLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        filterId: 'punchy'
      })
    );
  });

  it('renders reset button when a non-original filter is active', () => {
    const handleSetFilters = vi.fn();

    render(
      <PhotoFiltersBottomSheet
        isOpen={true}
        onClose={() => {}}
        imageFilters={{ preset: 'punchy', filterScope: 'background' }}
        setImageFilters={handleSetFilters}
      />
    );

    const resetBtn = screen.getByText('Reset');
    expect(resetBtn).toBeDefined();
    fireEvent.click(resetBtn);

    expect(handleSetFilters).toHaveBeenCalledTimes(1);
  });
});
