#!/usr/bin/env node

// Set NODE_OPTIONS to enable ESM for Jest
process.env.NODE_OPTIONS = '--experimental-vm-modules';

// Run Jest with custom options
import { spawn } from 'child_process';

spawn(
  'npx', 
  ['jest', '--no-cache', '--config', './jest.config.js', ...process.argv.slice(2)], 
  { 
    stdio: 'inherit',
    shell: true
  }
); 