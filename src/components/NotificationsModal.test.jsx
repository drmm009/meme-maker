// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import NotificationsModal from './NotificationsModal';

afterEach(() => cleanup());

const MOCK_NOTIFS = [
  {
    id: 'n1',
    type: 'trending',
    title: 'Trending Meme Alert',
    message: 'Check out the latest trending template',
    timestamp: '5m ago',
    read: false,
    action: { label: 'Open Template', type: 'template', templateId: '123' }
  },
  {
    id: 'n2',
    type: 'feature',
    title: 'Studio Update',
    message: 'Curved text is live',
    timestamp: '1h ago',
    read: true,
    action: null
  }
];

describe('NotificationsModal', () => {
  it('renders notifications and badge counts correctly', () => {
    render(
      <NotificationsModal
        isOpen={true}
        onClose={() => {}}
        notifications={MOCK_NOTIFS}
        onMarkAllRead={() => {}}
        onNotificationAction={() => {}}
      />
    );

    expect(screen.getByText('Notifications')).toBeDefined();
    expect(screen.getByText('1 new')).toBeDefined();
    expect(screen.getByText('Trending Meme Alert')).toBeDefined();
    expect(screen.getByText('Studio Update')).toBeDefined();
    expect(screen.getByText('Open Template')).toBeDefined();
  });

  it('triggers onNotificationAction when action button is clicked', () => {
    const handleAction = vi.fn();
    render(
      <NotificationsModal
        isOpen={true}
        onClose={() => {}}
        notifications={MOCK_NOTIFS}
        onMarkAllRead={() => {}}
        onNotificationAction={handleAction}
      />
    );

    fireEvent.click(screen.getByText('Open Template'));
    expect(handleAction).toHaveBeenCalledWith(MOCK_NOTIFS[0]);
  });

  it('triggers onMarkAllRead when Mark all read is clicked', () => {
    const handleMarkAllRead = vi.fn();
    render(
      <NotificationsModal
        isOpen={true}
        onClose={() => {}}
        notifications={MOCK_NOTIFS}
        onMarkAllRead={handleMarkAllRead}
        onNotificationAction={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Mark all read'));
    expect(handleMarkAllRead).toHaveBeenCalled();
  });
});
