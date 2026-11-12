const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'components', 'editor', 'panels', 'panels.css');
let css = fs.readFileSync(cssPath, 'utf8');

const oldRegex = /\/\* Text Sheet Category Tabs[\s\S]*?\.ie-text-tab-label\s*\{[^}]*\}/;

const newCss = `/* Text Sheet Category Tabs - Joined Segmented Multi-Toggle Switch Track */
.ie-text-tabs {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 3px !important;
  margin: 2px 0 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  gap: 0 !important;
  box-sizing: border-box;
}

.ie-text-tab {
  flex: 1 1 0;
  min-width: 0;
  height: 50px !important;
  padding: 5px 2px !important;
  border-radius: 13px !important;
  border: none !important;
  background: transparent !important;
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 3px !important;
  cursor: pointer;
  outline: none !important;
  -webkit-tap-highlight-color: transparent !important;
  box-shadow: none !important;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
  white-space: nowrap;
  position: relative;
}

/* Subtle separator between inactive adjacent segments */
.ie-text-tab + .ie-text-tab::before {
  content: '';
  position: absolute;
  left: 0;
  top: 25%;
  height: 50%;
  width: 1px;
  background: rgba(255, 255, 255, 0.12);
  transition: opacity 0.15s ease;
  pointer-events: none;
}

/* Hide separator when either neighbor is active */
.ie-text-tab.is-active::before,
.ie-text-tab.is-active + .ie-text-tab::before {
  opacity: 0;
}

.ie-text-tab:hover:not(.is-active) {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.06) !important;
}

.ie-text-tab:active {
  transform: scale(0.97) !important;
}

/* Active Segment in Switch */
.ie-text-tab.is-active {
  background: var(--ui-accent, #ff5a36) !important;
  background-color: var(--ui-accent, #ff5a36) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  box-shadow: 0 2px 8px rgba(255, 90, 54, 0.4) !important;
}

.ie-text-tab.is-active .ie-text-tab-icon {
  color: #ffffff !important;
  stroke: #ffffff !important;
}

.ie-text-tab-icon {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.16s ease;
}

.ie-text-tab-label {
  font-size: 11px;
  line-height: 1;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}`;

if (oldRegex.test(css)) {
  css = css.replace(oldRegex, newCss);
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Successfully updated joined toggle switch tabs CSS!');
} else {
  console.error('Regex match failed in panels.css');
}
