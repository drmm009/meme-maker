const fs = require('fs');
const path = require('path');

const testPath = path.join(__dirname, '..', 'src', 'components', 'MemeEditor.test.jsx');
let content = fs.readFileSync(testPath, 'utf8');

// 1. Remove shadow size check in Color test
content = content.replace(
  `    // Color: colour, outline and shadow.\r\n    fireEvent.click(within(layerToolbar()).getByText('Color'));\r\n    const color = sheet('Color');\r\n    expect(within(color).getByLabelText('Text colour')).toBeTruthy();\r\n    expect(within(color).getByLabelText('Stroke')).toBeTruthy();\r\n    fireEvent.change(within(color).getByLabelText('Shadow size'), { target: { value: '12' } });\r\n    expect(canvas.props.captions[2].shadowSize).toBe(12);\r\n    closeSheet();`,
  `    // Color: colour and outline.\r\n    fireEvent.click(within(layerToolbar()).getByText('Color'));\r\n    const color = sheet('Color');\r\n    expect(within(color).getByLabelText('Text colour')).toBeTruthy();\r\n    expect(within(color).getByLabelText('Stroke')).toBeTruthy();\r\n    closeSheet();`
);

// If with LF
content = content.replace(
  `    // Color: colour, outline and shadow.\n    fireEvent.click(within(layerToolbar()).getByText('Color'));\n    const color = sheet('Color');\n    expect(within(color).getByLabelText('Text colour')).toBeTruthy();\n    expect(within(color).getByLabelText('Stroke')).toBeTruthy();\n    fireEvent.change(within(color).getByLabelText('Shadow size'), { target: { value: '12' } });\n    expect(canvas.props.captions[2].shadowSize).toBe(12);\n    closeSheet();`,
  `    // Color: colour and outline.\n    fireEvent.click(within(layerToolbar()).getByText('Color'));\n    const color = sheet('Color');\n    expect(within(color).getByLabelText('Text colour')).toBeTruthy();\n    expect(within(color).getByLabelText('Stroke')).toBeTruthy();\n    closeSheet();`
);

// 2. Remove shadow in test 771
const oldTest771 = /it\('Text sheet: outline thickness, gradient, letter spacing, line height and shadow',[\s\S]*?\n  \}, 30000\);/;
const newTest771 = `it('Text sheet: outline thickness, gradient, letter spacing and line height', () => {
    renderEditor();
    openTextSheet();
    const panel = sheet('Text');
    fireEvent.change(within(panel).getByLabelText('Outline thickness'), { target: { value: '12' } });
    expect(canvas.props.captions[0].strokeWidth).toBe(12);
    fireEvent.click(within(panel).getByRole('radio', { name: 'Gold gradient' }));
    expect(canvas.props.captions[0].gradient).toEqual(['#f7971e', '#ffd200']);
    fireEvent.change(within(sheet('Text')).getByLabelText('Letter spacing'), { target: { value: '0.2' } });
    fireEvent.change(within(sheet('Text')).getByLabelText('Line height'), { target: { value: '1.5' } });
    expect(canvas.props.captions[0]).toMatchObject({ letterSpacing: 0.2, lineHeight: 1.5 });
    expect(within(sheet('Text')).getByLabelText('Upload your own font')).toBeTruthy();
    // Turning the outline off hides its thickness.
    fireEvent.click(within(sheet('Text')).getByRole('switch', { name: 'Stroke' }));
    expect(within(sheet('Text')).queryByLabelText('Outline thickness')).toBeNull();
  }, 30000);`;

if (oldTest771.test(content)) {
  content = content.replace(oldTest771, newTest771);
}

fs.writeFileSync(testPath, content, 'utf8');
console.log('Successfully updated tests for shadow removal!');
