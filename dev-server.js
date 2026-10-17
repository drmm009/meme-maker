// Wrapper to prevent Vite from exiting on background stdin EOF
process.env.CI = 'true';
import('./node_modules/vite/bin/vite.js');
