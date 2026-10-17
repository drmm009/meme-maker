// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TemplatePickerBottomSheet from './TemplatePickerBottomSheet';

afterEach(() => cleanup());

const MOCK_TEMPLATES = [
  { id: 't1', name: 'Distracted Boyfriend', imageUrl: 'https://example.com/1.jpg', category: 'classics' },
  { id: 't2', name: 'Drake Hotline Bling', imageUrl: 'https://example.com/2.jpg', category: 'classics' },
  { id: 't3', name: 'Two Buttons', imageUrl: 'https://example.com/3.jpg', category: 'reaction' },
];

describe('TemplatePickerBottomSheet', () => {
  it('renders templates and calls onSelectTemplate on click', () => {
    const handleSelect = vi.fn();
    render(
      <TemplatePickerBottomSheet
        isOpen={true}
        onClose={() => {}}
        templates={MOCK_TEMPLATES}
        onSelectTemplate={handleSelect}
      />
    );

    expect(screen.getByText('Distracted Boyfriend')).toBeDefined();

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

    const input = screen.getByPlaceholderText(/Search 3\+ meme templates/i);
    fireEvent.change(input, { target: { value: 'Drake' } });

    expect(screen.getByText('Drake Hotline Bling')).toBeDefined();
    expect(screen.queryByText('Distracted Boyfriend')).toBeNull();
  });
});
