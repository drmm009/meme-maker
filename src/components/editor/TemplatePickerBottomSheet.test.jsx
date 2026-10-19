// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TemplatePickerBottomSheet, { TEMPLATE_TAGS } from './TemplatePickerBottomSheet';

afterEach(() => cleanup());

const MOCK_TEMPLATES = [
  { id: 't1', name: 'Distracted Boyfriend', imageUrl: 'https://example.com/1.jpg', category: 'classics', trendingScore: 100 },
  { id: 't2', name: 'Drake Hotline Bling', imageUrl: 'https://example.com/2.jpg', category: 'classics', trendingScore: 90 },
  { id: 't3', name: 'Two Buttons', imageUrl: 'https://example.com/3.jpg', category: 'reaction', trendingScore: 80 },
  { id: 't4', name: 'Sample Video', imageUrl: 'https://example.com/v.mp4', type: 'video', category: 'reaction' }
];

describe('TemplatePickerBottomSheet', () => {
  it('renders templates, excludes videos, and calls onSelectTemplate on click', () => {
    const handleSelect = vi.fn();
    render(
      <TemplatePickerBottomSheet
        isOpen={true}
        onClose={() => {}}
        templates={MOCK_TEMPLATES}
        onSelectTemplate={handleSelect}
      />
    );

    expect(screen.getByText('Add Template')).toBeDefined();
    expect(screen.getByText('Distracted Boyfriend')).toBeDefined();
    // Video template should be strictly excluded
    expect(screen.queryByText('Sample Video')).toBeNull();

    fireEvent.click(screen.getByText('Distracted Boyfriend'));
    expect(handleSelect).toHaveBeenCalledWith(MOCK_TEMPLATES[0]);
  });

  it('filters by template name search', () => {
    render(
      <TemplatePickerBottomSheet
        isOpen={true}
        onClose={() => {}}
        templates={MOCK_TEMPLATES}
        onSelectTemplate={() => {}}
      />
    );

    const input = screen.getByPlaceholderText(/Search 4\+ meme templates/i);
    fireEvent.change(input, { target: { value: 'Drake' } });

    expect(screen.getByText('Drake Hotline Bling')).toBeDefined();
    expect(screen.queryByText('Distracted Boyfriend')).toBeNull();
  });

  it('filters by category tags matching homescreen', () => {
    render(
      <TemplatePickerBottomSheet
        isOpen={true}
        onClose={() => {}}
        templates={MOCK_TEMPLATES}
        onSelectTemplate={() => {}}
      />
    );

    // Verify all homescreen category tags exist
    expect(screen.getByRole('button', { name: /^All$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Images$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Reactions$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Favorites$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Classics$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Multi-Panel$/i })).toBeDefined();

    // Click 'Reactions'
    const reactionsBtn = screen.getByRole('button', { name: /^Reactions$/i });
    fireEvent.click(reactionsBtn);

    expect(screen.getByText('Two Buttons')).toBeDefined();
    expect(screen.queryByText('Distracted Boyfriend')).toBeNull();
  });
});
