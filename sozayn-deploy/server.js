const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'https://sozayndigital-e2112b66b875.herokuapp.com';

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
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`API requests proxied to: ${API_URL}`);
});