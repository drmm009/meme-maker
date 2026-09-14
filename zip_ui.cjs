const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const sourceDir = __dirname;
const targetDir = path.join(__dirname, 'meme-maker-ui-temp');

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir);

const copyRecursiveSync = function(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    if (src.endsWith('.wav') || src.endsWith('.mp3') || src.endsWith('.wasm')) return;
    fs.copyFileSync(src, dest);
  }
};

copyRecursiveSync(path.join(sourceDir, 'src'), path.join(targetDir, 'src'));
copyRecursiveSync(path.join(sourceDir, 'public'), path.join(targetDir, 'public'));

const files = ['index.html', 'package.json', 'vite.config.js', 'eslint.config.js', 'README.md', '.gitignore'];
for (const file of files) {
  if (fs.existsSync(path.join(sourceDir, file))) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
  }
}

console.log('Files copied. Executing tar command...');
const zipFile = path.join(path.dirname(sourceDir), 'meme-maker-ui.zip');

try {
  // Use Windows built-in tar command to zip the folder
  // -a means auto-compress based on extension (.zip)
  cp.execSync(`tar -a -c -f "${zipFile}" *`, { cwd: targetDir });
  console.log('Zipped to ' + zipFile);
} catch (e) {
  console.error('Tar failed', e.message);
}

fs.rmSync(targetDir, { recursive: true, force: true });
