// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Type, Sticker } from 'lucide-react';
import { TopBar, SegmentedControl, ToolDock, ToolStrip, FloatingToolbar, Sheet, SwatchRow, Slider, Switch, Tile, Toggle } from './index';

afterEach(cleanup);

describe('UI kit', () => {
  it('TopBar: title, back and actions', () => {
    const onBack = vi.fn();
    render(<TopBar title="Meme Editor" onBack={onBack}><button type="button">Export</button></TopBar>);
    expect(screen.getByRole('heading', { name: 'Meme Editor' })).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalled();
    expect(screen.getByText('Export')).toBeTruthy();
  });

  it('SegmentedControl: an option with an icon keeps its label as its name', () => {
    const onChange = vi.fn();
    render(<SegmentedControl ariaLabel="Corner" value="tl" onChange={onChange} options={[{ value: 'tl', label: 'Top left', Icon: Type }, { value: 'tr', label: 'Top right', Icon: Sticker }]} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Top right' }));
    expect(onChange).toHaveBeenCalledWith('tr');
    expect(screen.queryByText('Top left')).toBeNull();
  });

  it('SegmentedControl: one checked option, picks another', () => {
    const onChange = vi.fn();
    render(<SegmentedControl ariaLabel="Aspect" value="1:1" onChange={onChange} options={[{ value: '1:1', label: '1:1' }, { value: '9:16', label: '9:16' }]} />);
    expect(screen.getByRole('radio', { name: '1:1' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: '9:16' }));
    expect(onChange).toHaveBeenCalledWith('9:16');
  });

  it('ToolDock: marks the active section and reports picks', () => {
    const onSelect = vi.fn();
    render(<ToolDock ariaLabel="Tools" active="text" onSelect={onSelect} items={[{ id: 'text', label: 'Text', Icon: Type }, { id: 'sticker', label: 'Sticker', Icon: Sticker }]} />);
    expect(screen.getByTitle('Text').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByTitle('Sticker'));
    expect(onSelect).toHaveBeenCalledWith('sticker');
  });

  it('ToolStrip: marks the picked tool and reports picks', () => {
    const onSelect = vi.fn();
    render(<ToolStrip ariaLabel="Draw tools" active="glow" onSelect={onSelect} items={[{ id: 'brush', label: 'Brush', Icon: Type }, { id: 'glow', label: 'Glow', Icon: Sticker }]} />);
    expect(screen.getByRole('button', { name: 'Glow' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Brush' }));
    expect(onSelect).toHaveBeenCalledWith('brush');
  });

  it('FloatingToolbar: labelled tools with active state', () => {
    const onBold = vi.fn();
    render(<FloatingToolbar ariaLabel="Layer tools" items={[{ id: 'bold', label: 'Bold', active: true, onClick: onBold }]} />);
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(bold);
    expect(onBold).toHaveBeenCalled();
  });

  it('Sheet: header action, and closing from the handle', () => {
    const onClose = vi.fn();
    const onAdd = vi.fn();
    render(<Sheet title="Text" badge="New" onClose={onClose} action={{ label: 'Add Text', onClick: onAdd }}><p>body</p></Sheet>);
    expect(screen.getByRole('dialog', { name: 'Text' })).toBeTruthy();
    expect(screen.getByText('New')).toBeTruthy();
    fireEvent.click(screen.getByText('Add Text'));
    expect(onAdd).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Close Text'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Sheet: hideTitle drops the heading but keeps the name and the action', () => {
    const onAdd = vi.fn();
    const { rerender } = render(<Sheet title="Text" hideTitle onClose={vi.fn()} action={{ label: 'Add Text', onClick: onAdd }}><p>body</p></Sheet>);
    expect(screen.getByRole('dialog', { name: 'Text' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Text' })).toBeNull();
    fireEvent.click(screen.getByText('Add Text'));
    expect(onAdd).toHaveBeenCalled();
    rerender(<Sheet title="Text" hideTitle onClose={vi.fn()}><p>body</p></Sheet>);
    expect(document.querySelector('.ui-sheet-head')).toBeNull();
  });

  it('Sheet: plain header action without icon and disabled state', () => {
    const onClear = vi.fn();
    const { rerender } = render(<Sheet title="Brush" onClose={vi.fn()} action={{ label: 'Clear drawing', variant: 'plain', disabled: true, onClick: onClear }}><p>body</p></Sheet>);
    const btn = screen.getByText('Clear drawing').closest('button')!;
    expect(btn.disabled).toBe(true);
    expect(btn.querySelector('.ui-sheet-action-icon')).toBeNull();
    fireEvent.click(btn);
    expect(onClear).not.toHaveBeenCalled();

    rerender(<Sheet title="Brush" onClose={vi.fn()} action={{ label: 'Clear drawing', variant: 'plain', disabled: false, onClick: onClear }}><p>body</p></Sheet>);
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('SwatchRow: picks a swatch or a custom colour', () => {
    const onChange = vi.fn();
    render(<SwatchRow ariaLabel="Colour" colors={['#ffffff', '#000000']} value="#FFFFFF" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: '#ffffff' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: '#000000' }));
    expect(onChange).toHaveBeenCalledWith('#000000');
    fireEvent.change(screen.getByLabelText('Custom colour').querySelector('input')!, { target: { value: '#123456' } });
    expect(onChange).toHaveBeenLastCalledWith('#123456');
  });

  it('Slider shows its value and reports numbers; Switch flips', () => {
    const onSlide = vi.fn();
    const onSwitch = vi.fn();
    render(<><Slider label="Size" min={0} max={100} value={25} onChange={onSlide} format={(v) => `${v}px`} /><Switch label="Stroke" checked={false} onChange={onSwitch} /></>);
    const slider = screen.getByLabelText('Size') as HTMLInputElement;
    expect(slider.style.getPropertyValue('--pct')).toBe('25%');
    expect(screen.getByText('25px')).toBeTruthy();
    fireEvent.change(slider, { target: { value: '60' } });
    expect(onSlide).toHaveBeenCalledWith(60);
    fireEvent.click(screen.getByRole('switch', { name: 'Stroke' }));
    expect(onSwitch).toHaveBeenCalledWith(true);
  });

  it('Tile is a button, or a file picker with onFile; Toggle reports pressed', () => {
    const onFile = vi.fn();
    const { container } = render(<><Tile label="Upload" accept="image/*" onFile={onFile} /><Toggle label="Italic" active onClick={() => {}}>I</Toggle></>);
    const input = container.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.png')] } });
    expect(onFile).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Italic' }).getAttribute('aria-pressed')).toBe('true');
  });
});
