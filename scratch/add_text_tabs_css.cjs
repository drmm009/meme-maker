const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'components', 'editor', 'panels', 'panels.css');
let css = fs.readFileSync(cssPath, 'utf8');

const tabCss = `
/* Text Sheet Category Tabs (Font, Style, Color, Align) */
.ie-text-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 0 12px;
  margin-bottom: 2px;
}

.ie-text-tab {
  flex: 1 1 0;
  min-width: 0;
  height: 38px !important;
  padding: 0 8px !important;
  border-radius: 9999px !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  background: transparent !important;
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.75) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  cursor: pointer;
  outline: none !important;
  -webkit-tap-highlight-color: transparent !important;
  box-shadow: none !important;
  transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1) !important;
  white-space: nowrap;
}

.ie-text-tab:hover:not(.is-active) {
  border-color: rgba(255, 255, 255, 0.45) !important;
  background: transparent !important;
  background-color: transparent !important;
  color: #ffffff !important;
}

.ie-text-tab:active {
  transform: scale(0.97) !important;
}

.ie-text-tab.is-active {
  background: var(--ui-accent, #ff5a36) !important;
  background-color: var(--ui-accent, #ff5a36) !important;
  border-color: var(--ui-accent, #ff5a36) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  box-shadow: 0 2px 10px rgba(255, 90, 54, 0.4) !important;
}

.ie-text-tab.is-active .ie-text-tab-icon {
  color: #ffffff !important;
  stroke: #ffffff !important;
}

.ie-text-tab-icon {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.75);
  transition: color 0.16s ease;
}

.ie-text-tab-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`;

if (!css.includes('.ie-text-tabs')) {
  css += '\n' + tabCss;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Successfully appended text tabs CSS!');
} else {
  console.log('text tabs CSS already exists.');
}
