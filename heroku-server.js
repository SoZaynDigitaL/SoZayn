// Special entry point for Heroku deployment
// This file helps resolve module loading issues

// Import required modules with file extensions to avoid ERR_MODULE_NOT_FOUND
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import fs from 'fs';

// Import server-related files
import './server/index.js';

// Polyfill __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a fallback server in case the main application fails to start
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the fallback page if the main app fails to start
app.get('*', (req, res) => {
  // Try to serve the built app
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback to the static HTML
    res.sendFile(path.join(__dirname, 'heroku-index.html'));
  }
});

// Start the fallback server only if the main application fails
setTimeout(() => {
  // Check if our main server is running
  fetch(`http://localhost:${PORT}/api/health`)
    .then(response => {
      if (!response.ok) {
        startFallbackServer();
      }
    })
    .catch(() => {
      startFallbackServer();
    });
}, 10000);

function startFallbackServer() {
  app.listen(PORT, () => {
    console.log(`Fallback server running on port ${PORT}`);
  });
}

// Export the app for testing
export default app;