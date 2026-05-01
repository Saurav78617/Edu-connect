const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const dir = path.dirname(filePath);
      const resolvedTarget = path.resolve(dir, importPath);
      // check if it exists with exact casing
      
      const dirName = path.dirname(resolvedTarget);
      const baseName = path.basename(resolvedTarget);
      
      if (!fs.existsSync(dirName)) continue;
      
      let found = false;
      let extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
      
      const files = fs.readdirSync(dirName);
      
      for (const ext of extensions) {
        if (files.includes(baseName + ext)) {
          found = true;
          break;
        }
      }
      
      if (!found && fs.existsSync(resolvedTarget)) {
         console.log(`Casing issue in ${filePath}: import "${importPath}"`);
      }
    }
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      checkFile(full);
    }
  }
}

walk('src');
console.log('Done checking casing');
