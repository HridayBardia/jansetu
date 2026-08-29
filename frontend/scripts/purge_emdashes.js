const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function sanitizeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('—') || content.includes('–')) {
    // Replace em-dash (—) and en-dash (–) with standard hyphen (-)
    const updated = content.replace(/—/g, '-').replace(/–/g, '-');
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Sanitized: ${filePath}`);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(js|jsx|ts|tsx|json|css|md)$/.test(entry.name)) {
      sanitizeFile(fullPath);
    }
  }
}

walkDir(srcDir);
console.log('Em-dash purge complete.');
