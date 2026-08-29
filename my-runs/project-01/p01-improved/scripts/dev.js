// scripts/dev.js -- Build and launch Electron for development
'use strict';

const { execSync, spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

try {
  console.log('[1/3] Compiling main/preload/services...');
  execSync('npx tsc -p tsconfig.node.json', { cwd: root, stdio: 'inherit' });

  console.log('[2/3] Building renderer...');
  execSync('npx vite build', { cwd: root, stdio: 'inherit' });

  console.log('[3/3] Launching Electron...');
  const proc = spawn('npx', ['electron', '.'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  proc.on('close', (code) => process.exit(code ?? 0));
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}
