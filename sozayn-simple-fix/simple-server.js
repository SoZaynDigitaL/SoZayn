/**
 * SoZayn Digital Era - Simple Robust Server for Heroku
 * 
 * This server is designed to work reliably in Heroku's environment
 * by checking multiple possible locations for static files.
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Helper function to safely list a directory without crashing if it doesn't exist
function safeListDir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch (e) {
    console.warn(`Warning: Could not read directory ${dir}`, e.message);
    return [];
  }
}

// Check for possible static file directories
const possibleDirs = [
  '.', // Current directory (like in Heroku)
  './dist', // Vite build output
  './public', // Common static files folder
  './build', // Create React App build output
  '../client/dist', // Vite output in monorepo
  '../dist' // Another common monorepo location
];

// Find the first directory that contains an index.html file
let staticDir = possibleDirs[0]; // Default to current directory
for (const dir of possibleDirs) {
  if (fs.existsSync(path.join(__dirname, dir, 'index.html'))) {
    staticDir = dir;
    console.log(`Found static files in ${path.join(__dirname, dir)}`);
    break;
  }
}

// Log which files we found for debugging purposes
console.log('Static directory:', path.join(__dirname, staticDir));
console.log('Static files:', safeListDir(path.join(__dirname, staticDir))
  .filter(f => !f.startsWith('.'))
  .slice(0, 10)
  .join(', ') + (safeListDir(path.join(__dirname, staticDir)).length > 10 ? '...' : ''));

// Serve static files
app.use(express.static(path.join(__dirname, staticDir)));

// Special handling for index.html to inject button fix script
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, staticDir, 'index.html');
  
  try {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Only inject the script if it's not already there
    if (!indexContent.includes('fix-buttons.js')) {
      indexContent = indexContent.replace('</body>', '<script src="/fix-buttons.js"></script></body>');
      console.log('Injected button fix script into index.html');
    }
    
    res.send(indexContent);
  } catch (error) {
    console.error('Error reading or modifying index.html:', error);
    res.sendFile(indexPath);
  }
});

// Auth route handler
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

// Handle all other routes - return index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, staticDir, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} at ${new Date().toISOString()}`);
  console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
});