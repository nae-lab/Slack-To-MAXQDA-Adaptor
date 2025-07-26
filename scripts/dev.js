#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Start Vite dev server
const vite = spawn('pnpm', ['vite'], {
  stdio: 'inherit',
  shell: true
});

// Wait for Vite to start, then launch Electron
const waitForVite = () => {
  const http = require('http');
  
  const checkServer = () => {
    http.get('http://localhost:5173', (res) => {
      console.log('Vite server is ready, launching Electron...');
      launchElectron();
    }).on('error', () => {
      console.log('Waiting for Vite server...');
      setTimeout(checkServer, 1000);
    });
  };
  
  setTimeout(checkServer, 2000);
};

const launchElectron = () => {
  const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
  const electron = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electron.on('close', () => {
    vite.kill();
    process.exit();
  });
};

waitForVite();

vite.on('close', () => {
  process.exit();
});