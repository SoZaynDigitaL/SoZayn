/**
 * SoZayn Digital Era - Enhanced Server
 * 
 * This enhanced server includes:
 * - Better error handling
 * - Support for SPA routing
 * - Health check endpoint
 * - Static file serving with proper MIME types
 * - Fallback for when frontend build fails
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const os = require('os');
const crypto = require('crypto');

// Configuration
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');
const FALLBACK_HTML = path.join(DIST_DIR, 'fallback.html');

// Create application
const app = express();

// Database connection (if DATABASE_URL is provided)
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

// Function to test database connection
async function testDatabaseConnection() {
  if (!pool) return { connected: false, error: 'No DATABASE_URL provided' };
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return { 
      connected: true, 
      timestamp: result.rows[0].now,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') ? 'Enabled' : 'Disabled'
    };
  } catch (err) {
    console.error('Database connection error:', err);
    return { connected: false, error: err.message };
  }
}

// Log available files in dist
function logDistFiles() {
  try {
    console.log('Checking dist directory contents:');
    const distExists = fs.existsSync(DIST_DIR);
    console.log(`- Dist directory exists: ${distExists}`);
    
    if (distExists) {
      const files = fs.readdirSync(DIST_DIR);
      console.log(`- Files in dist: ${files.join(', ')}`);
      
      const indexExists = fs.existsSync(INDEX_HTML);
      console.log(`- index.html exists: ${indexExists}`);
      
      if (indexExists) {
        const indexStats = fs.statSync(INDEX_HTML);
        console.log(`- index.html size: ${indexStats.size} bytes`);
      }
    }
  } catch (err) {
    console.error('Error checking dist directory:', err);
  }
}

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await testDatabaseConnection();
  
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    database: dbStatus,
    hostname: os.hostname()
  });
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
  logDistFiles();
  
  // Get information about the environment
  const envInfo = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    dyno: process.env.DYNO,
    databaseUrl: process.env.DATABASE_URL ? '✓ Set (value hidden)' : '✗ Not set',
    herokuAppName: process.env.HEROKU_APP_NAME,
    distDirExists: fs.existsSync(DIST_DIR),
    indexHtmlExists: fs.existsSync(INDEX_HTML),
    fallbackHtmlExists: fs.existsSync(FALLBACK_HTML),
    cwd: process.cwd(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    uptime: process.uptime()
  };
  
  // List files in dist directory if it exists
  let distFiles = [];
  if (envInfo.distDirExists) {
    distFiles = fs.readdirSync(DIST_DIR);
  }
  
  // List directories at the current level
  const currentDirFiles = fs.readdirSync('.');
  
  // Check if we can read the index.html file
  let indexHtmlContent = '';
  if (envInfo.indexHtmlExists) {
    try {
      indexHtmlContent = fs.readFileSync(INDEX_HTML, 'utf8').substring(0, 500) + '... (truncated)';
    } catch (err) {
      indexHtmlContent = `Error reading file: ${err.message}`;
    }
  }
  
  res.json({
    envInfo,
    distFiles,
    currentDirFiles,
    indexHtmlPreview: indexHtmlContent
  });
});

// Serve static files from the dist directory with proper caching
app.use(express.static(DIST_DIR, {
  maxAge: '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.html') {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// For all other requests, send either the index.html or fallback
app.get('*', (req, res) => {
  console.log(`Handling SPA route: ${req.url}`);
  
  // Check if index.html exists
  if (fs.existsSync(INDEX_HTML)) {
    console.log('Serving index.html');
    res.sendFile(INDEX_HTML);
  } else {
    console.error('ERROR: index.html not found, serving fallback.html instead');
    
    // Check if fallback exists, otherwise render inline
    if (fs.existsSync(FALLBACK_HTML)) {
      res.sendFile(FALLBACK_HTML);
    } else {
      console.error('ERROR: fallback.html not found, serving inline fallback');
      
      // Generate a simple fallback page inline
      const title = 'SoZayn Digital Era';
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; }
            h1 { color: #0066cc; border-bottom: 1px solid #eaeaea; padding-bottom: 10px; }
            .info-box { background-color: #f0f7ff; border-left: 5px solid #0066cc; padding: 15px; margin: 20px 0; }
            .server-info { background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 30px; }
            .server-info h2 { margin-top: 0; font-size: 1.2em; }
            .server-info dl { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; }
            .server-info dt { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>The server is running correctly, but the frontend build is not available.</p>
          
          <div class="info-box">
            <strong>Server Status:</strong> Online<br>
            <strong>Node Version:</strong> ${process.version}<br>
            <strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}<br>
          </div>
          
          <p>If you're seeing this message on a production environment, please ensure the frontend application has been built properly.</p>
          
          <div class="server-info">
            <h2>Debug Information</h2>
            <dl>
              <dt>Timestamp:</dt>
              <dd>${new Date().toISOString()}</dd>
              
              <dt>Port:</dt>
              <dd>${PORT}</dd>
              
              <dt>Working Directory:</dt>
              <dd>${process.cwd()}</dd>
              
              <dt>Dist Directory:</dt>
              <dd>${fs.existsSync(DIST_DIR) ? 'Exists' : 'Missing'}</dd>
              
              <dt>Index HTML:</dt>
              <dd>${fs.existsSync(INDEX_HTML) ? 'Exists' : 'Missing'}</dd>
              
              <dt>Request URL:</dt>
              <dd>${req.url}</dd>
              
              <dt>Instance ID:</dt>
              <dd>${crypto.randomBytes(4).toString('hex')}</dd>
            </dl>
          </div>
        </body>
        </html>
      `);
    }
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  
  // Log environment info
  console.log('\nEnvironment Information:');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`- Working directory: ${process.cwd()}`);
  
  // Check for dist directory and index.html
  logDistFiles();
});