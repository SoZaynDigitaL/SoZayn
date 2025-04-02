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

// Debug output to help diagnose the issue
console.log('Working directory:', process.cwd());
console.log('Directory listing:', fs.readdirSync('.'));

// Try multiple possible locations for the static files
const possibleDistDirs = [
  path.join(process.cwd(), 'dist'),
  process.cwd(),
  path.join(process.cwd(), '..', 'dist'),
  '/app/dist'
];

let DIST_DIR = null;
for (const dir of possibleDistDirs) {
  try {
    if (fs.existsSync(dir)) {
      console.log(`Found valid directory: ${dir}`);
      console.log(`Contents of ${dir}:`, fs.readdirSync(dir));
      
      if (fs.existsSync(path.join(dir, 'index.html'))) {
        console.log(`Found index.html in ${dir}`);
        DIST_DIR = dir;
        break;
      }
    }
  } catch (err) {
    console.error(`Error checking directory ${dir}:`, err);
  }
}

if (!DIST_DIR) {
  console.error('Could not find a valid dist directory with index.html');
  // Create a fallback directory with a basic page
  DIST_DIR = process.cwd();
  const fallbackHtml = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(fallbackHtml)) {
    try {
      fs.writeFileSync(fallbackHtml, `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SoZayn Digital Era</title>
          <style>
            body { font-family: -apple-system, sans-serif; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 20px; }
            h1 { color: #4361ee; }
            .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>SoZayn Digital Era</h1>
          <p>The server is running, but no static files were found.</p>
          <div class="info">
            <p><strong>Working directory:</strong> ${process.cwd()}</p>
            <p><strong>Files found:</strong> ${JSON.stringify(fs.readdirSync('.'))}</p>
            <p><strong>Server time:</strong> ${new Date().toISOString()}</p>
          </div>
        </body>
        </html>
      `);
      console.log('Created fallback index.html');
    } catch (err) {
      console.error('Failed to create fallback index.html:', err);
    }
  }
}

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  // Debug IP address information
  console.log('IP Address Debug:', {
    ip: req.ip,
    ips: req.ips,
    xForwardedFor: req.headers['x-forwarded-for'],
    xForwardedProto: req.headers['x-forwarded-proto'],
    originalUrl: req.originalUrl,
    protocol: req.protocol,
    isSecure: req.secure
  });
  next();
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    distDir: DIST_DIR,
    indexExists: fs.existsSync(path.join(DIST_DIR, 'index.html')),
    env: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  const info = {
    timestamp: new Date().toISOString(),
    workingDir: process.cwd(),
    distDir: DIST_DIR,
    node: process.version,
    env: process.env.NODE_ENV,
    platform: process.platform,
    directories: {}
  };
  
  // Check all possible directories
  for (const dir of possibleDistDirs) {
    try {
      if (fs.existsSync(dir)) {
        info.directories[dir] = {
          exists: true,
          isDirectory: fs.statSync(dir).isDirectory(),
          contents: fs.readdirSync(dir)
        };
      } else {
        info.directories[dir] = { exists: false };
      }
    } catch (err) {
      info.directories[dir] = { exists: false, error: err.message };
    }
  }
  
  res.json(info);
});

// Serve static files
app.use(express.static(DIST_DIR));

// Fallback for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found: ' + indexPath);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from: ${DIST_DIR}`);
});