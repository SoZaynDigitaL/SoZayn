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

// Serve static files - try multiple possible locations
const possiblePaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, 'public'),
  path.join(__dirname, 'build'),
  __dirname
];

// Find the first path that exists and contains an index.html file
let staticPath = possiblePaths.find(p => {
  try {
    return fs.existsSync(path.join(p, 'index.html'));
  } catch (err) {
    return false;
  }
});

if (!staticPath) {
  // If no valid path found, default to dist
  staticPath = path.join(__dirname, 'dist');
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(staticPath)) {
    fs.mkdirSync(staticPath, { recursive: true });
  }
  
  // Create a basic index.html file
  const basicHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SoZayn Digital Era</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #4F46E5; }
      </style>
    </head>
    <body>
      <h1>SoZayn Digital Era</h1>
      <p>Welcome to SoZayn Digital Era! The application is running, but the static files could not be found.</p>
      <p>This is a fallback page. Please ensure your static files are properly deployed.</p>
      <p><a href="/auth">Go to Authentication</a></p>
    </body>
    </html>
  `;
  
  fs.writeFileSync(path.join(staticPath, 'index.html'), basicHtml);
}

console.log(`Serving static files from: ${staticPath}`);
app.use(express.static(staticPath));

// API routes could be added here

// For all other routes, send the index.html file
// This supports SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});