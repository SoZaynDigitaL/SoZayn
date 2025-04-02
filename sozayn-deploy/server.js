const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'https://sozayndigital-e2112b66b875.herokuapp.com';

// Add a health check endpoint
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    date: new Date().toISOString(),
    status: 'online',
    nodeVersion: process.version,
    memory: process.memoryUsage(),
    hostname: require('os').hostname()
  };
  res.status(200).json(health);
});

// Proxy API requests to the backend API server
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // path rewrite is not needed if the paths match
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log proxy requests for debugging
    console.log(`Proxying ${req.method} ${req.path} to ${API_URL}${req.path}`);
  },
  onError: (err, req, res) => {
    console.error(`Proxy error: ${err.message}`);
    res.status(500).json({ error: 'Proxy Error', message: err.message });
  }
}));

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Redirect /login and /register to /auth for backward compatibility
app.get(['/login', '/register', '/signin', '/signup'], (req, res) => {
  res.redirect('/auth');
});

// Serve the frontend for all other requests (client-side routing)
app.get('*', (req, res) => {
  // Don't handle API requests with this catch-all
  if (req.path.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }
  
  console.log(`Serving index.html for path: ${req.path}`);
  
  // Use try-catch to handle potential errors when serving index.html
  const indexPath = path.join(__dirname, 'dist/index.html');
  const fallbackPath = path.join(__dirname, 'dist/fallback.html');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`ERROR: Failed to serve index.html: ${err.message}`);
      
      // Check if the fallback exists and use it
      if (require('fs').existsSync(fallbackPath)) {
        console.log('Using fallback.html instead');
        res.sendFile(fallbackPath);
      } else {
        // Last resort - send a simple error message if even the fallback is missing
        res.status(500).send(`
          <html>
            <head><title>SoZayn Digital Era</title></head>
            <body style="font-family: sans-serif; padding: 40px; text-align: center;">
              <h1>SoZayn Digital Era</h1>
              <p>The server is running but we're having trouble loading the application.</p>
              <p>Please try again in a few minutes.</p>
            </body>
          </html>
        `);
      }
    }
  });
});

// Add a specific route for debugging
app.get('/api/debug', (req, res) => {
  const staticFilesPath = path.join(__dirname, 'dist');
  const fileExists = require('fs').existsSync(path.join(staticFilesPath, 'index.html'));
  const cssExists = require('fs').existsSync(path.join(staticFilesPath, 'assets/css/main.css'));
  
  // Check directory contents
  let directoryContents;
  try {
    directoryContents = require('fs').readdirSync(staticFilesPath);
  } catch (err) {
    directoryContents = `Error reading directory: ${err.message}`;
  }
  
  res.json({
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || 'development',
      port: PORT,
      staticPath: staticFilesPath,
      apiUrl: API_URL
    },
    fileSystem: {
      indexHtmlExists: fileExists,
      cssExists: cssExists,
      directoryContents,
      workingDirectory: __dirname
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`API requests proxied to: ${API_URL}`);
  console.log(`For debugging, visit: http://localhost:${PORT}/api/debug`);
  
  // Check if dist directory exists
  const distPath = path.join(__dirname, 'dist');
  if (!require('fs').existsSync(distPath)) {
    console.error(`WARNING: Static files directory '${distPath}' does not exist!`);
  } else {
    console.log(`Static directory '${distPath}' exists.`);
    
    // Check if index.html exists
    const indexPath = path.join(distPath, 'index.html');
    if (!require('fs').existsSync(indexPath)) {
      console.error(`WARNING: Main file '${indexPath}' does not exist!`);
    } else {
      console.log(`Main file '${indexPath}' exists.`);
    }
  }
});