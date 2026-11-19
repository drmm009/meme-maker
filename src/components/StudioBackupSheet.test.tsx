// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import StudioBackupSheet from './StudioBackupSheet';

describe('StudioBackupSheet', () => {
  afterEach(cleanup);

  it('offers backing up and restoring, and says how many saves go in the file', () => {
    render(<StudioBackupSheet open onClose={() => {}} saveCount={3} onRestored={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Backup' })).toBeTruthy();
    const backUp = screen.getByRole('button', { name: /Back up everything/ });
    expect(backUp.textContent).toContain('3 saves in one file');
    expect((backUp as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('button', { name: /Restore from a backup/ })).toBeTruthy();
  });

  it('has nothing to back up with no saves, but can still restore', () => {
    render(<StudioBackupSheet open onClose={() => {}} saveCount={0} onRestored={() => {}} />);
    expect((screen.getByRole('button', { name: /Back up everything/ }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Restore from a backup/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('closes on Escape and on a tap outside', () => {
    const onClose = vi.fn();
    render(<StudioBackupSheet open onClose={onClose} saveCount={1} onRestored={() => {}} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(document.querySelector('.sb-backdrop') as Element);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows nothing when closed', () => {
    render(<StudioBackupSheet open={false} onClose={() => {}} saveCount={1} onRestored={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
