
/**
 * Post web-build helper:
 * - Creates docs/404.html as a copy of docs/index.html for SPA routing on GitHub Pages
 * - Creates docs/.nojekyll to prevent GitHub Pages from ignoring files that start with underscores
 */
const fs = require('fs');
const path = require('path');

const docsDir = path.resolve(__dirname, '..', 'docs');
const indexFile = path.join(docsDir, 'index.html');
const notFoundFile = path.join(docsDir, '404.html');
const noJekyllFile = path.join(docsDir, '.nojekyll');

function ensureFileCopied(src, dest) {
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${path.basename(src)} -> ${path.basename(dest)}`);
    } else {
      console.warn(`Source file not found: ${src}`);
    }
  } catch (err) {
    console.error('Error copying file:', err);
    process.exitCode = 1;
  }
}

function ensureNoJekyll(filePath) {
  try {
    fs.writeFileSync(filePath, '\n', 'utf8');
    console.log('Created .nojekyll in docs/');
  } catch (err) {
    console.error('Error writing .nojekyll:', err);
    process.exitCode = 1;
  }
}

(function run() {
  console.log('Running postbuild steps for GitHub Pages...');
  if (!fs.existsSync(docsDir)) {
    console.warn('docs/ directory not found. Did the web build complete?');
    process.exit(0);
  }
  ensureFileCopied(indexFile, notFoundFile);
  ensureNoJekyll(noJekyllFile);
})();
