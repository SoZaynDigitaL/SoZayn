// Minimal debug server to test connectivity
import express from 'express';
import http from 'http';

const app = express();
const port = 5000;

// Basic route to test server health
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Server Debug</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          h1 { color: #4f46e5; }
          .success { color: green; }
          pre { background: #f5f5f5; padding: 10px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Server Debug Page</h1>
          <p class="success">✅ Server running successfully on port ${port}</p>
          <p>If you're seeing this page, your server is correctly binding to port ${port} and responding to HTTP requests.</p>
          <p>Current time: ${new Date().toLocaleString()}</p>
          
          <h2>Server Information</h2>
          <pre>
Node version: ${process.version}
Platform: ${process.platform}
Process ID: ${process.pid}
Environment: ${process.env.NODE_ENV || 'development'}
          </pre>
          
          <p><a href="/api/health">Check API Health →</a></p>
        </div>
      </body>
    </html>
  `);
});

// Health check API endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'API is responding correctly'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Listen on all interfaces
server.listen(port, '0.0.0.0', () => {
  console.log(`Debug server running on http://0.0.0.0:${port}`);
});