/**
 * SoZayn Digital Era - Heroku Server Entry Point (CommonJS Version)
 * 
 * This script serves as both a version checker and fallback server for
 * the SoZayn application on Heroku. It ensures Node.js compatibility
 * and provides a graceful fallback if the main server fails to start.
 * 
 * Enhanced with comprehensive diagnostics for deployment troubleshooting.
 */

// Set up global error handlers to prevent crash
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥');
  console.error(err.name, err.message);
  console.error('Stack:', err.stack);
  console.error('The server will continue running in fallback mode, but please fix the error!');
  // We don't exit the process so the fallback server can run
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥');
  console.error(err);
  console.error('The server will continue running in fallback mode, but please fix the error!');
  // We don't exit the process so the fallback server can run
});

// Print banner
console.log('=================================================================');
console.log('SoZayn Digital Era - Heroku Deployment [Version 3.0.0]');
console.log('=================================================================');

// STRICT VERSION CHECK: Only allow Node.js v18.x to run this application
const nodeVersion = process.version;
console.log(`Running on Node.js ${nodeVersion}`);

// Extract the major version number
const majorVersion = parseInt(nodeVersion.match(/^v(\d+)/)[1], 10);

if (majorVersion !== 18) {
  console.error('❌ ERROR: This application requires Node.js v18.x');
  console.error(`Your current Node.js version is ${nodeVersion}`);
  console.error('Please ensure you have Node.js v18.x installed');
  console.error('If you are using Heroku, make sure to set NODE_VERSION=18.19.1 in your config vars');
  
  // We'll continue execution but warn about potential issues
  console.warn('Attempting to proceed with incompatible Node.js version...');
} else {
  console.log('✅ Compatible Node.js version detected. Continuing startup...');
}

// Required CommonJS modules
let path, express, fs, http, compression, cors;

try {
  path = require('path');
  express = require('express');
  fs = require('fs');
  http = require('http');
  compression = require('compression');
  cors = require('cors');
  
  console.log('✅ Successfully loaded all required modules');
} catch (err) {
  console.error('❌ Error loading required modules:', err.message);
  console.error('This may be due to missing dependencies. Make sure to run npm install');
  
  // Try to continue with built-in modules at minimum
  path = path || require('path');
  fs = fs || require('fs');
  http = http || require('http');
  express = express || function() {
    console.error('Express module is missing, using a minimal replacement');
    return {
      use: () => {},
      get: (_, handler) => {},
      listen: (port, cb) => { cb && cb(); }
    };
  };
  
  compression = compression || function() { return (req, res, next) => next(); };
  cors = cors || function() { return (req, res, next) => next(); };
}

// Create a fallback server in case the main application fails to start
const app = express();
const PORT = process.env.PORT || 5000;

// Print server configuration
console.log('=================================================================');
console.log('SERVER CONFIGURATION:');
console.log('=================================================================');
console.log('Port:', PORT);
console.log('Node.js Version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Heroku:', process.env.DYNO ? 'Yes' : 'No');
if (process.env.DYNO) {
  console.log('Dyno:', process.env.DYNO);
  console.log('Release Version:', process.env.HEROKU_RELEASE_VERSION || 'Unknown');
  console.log('Slug Commit:', process.env.HEROKU_SLUG_COMMIT || 'Unknown');
}
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Memory Usage:', Math.round(process.memoryUsage().rss / (1024 * 1024)), 'MB');
console.log('=================================================================');

// Show file system information
console.log('FILESYSTEM INFORMATION:');
console.log('Current Working Directory:', process.cwd());

// Function to safely read directory contents
function safeListDir(dir) {
  try {
    return fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  } catch (err) {
    return [`Error reading directory: ${err.message}`];
  }
}

// List root directory
console.log('Root directory contents:', safeListDir(process.cwd()).join(', '));

// Check for important directories
const directories = ['dist', 'node_modules', 'bin'];
directories.forEach(dir => {
  if (fs.existsSync(path.join(process.cwd(), dir))) {
    console.log(`✅ ${dir} directory found with ${safeListDir(path.join(process.cwd(), dir)).length} files`);
  } else {
    console.error(`❌ ${dir} directory not found!`);
  }
});

// Check for critical files
console.log('=================================================================');
console.log('CRITICAL FILES CHECK:');
console.log('=================================================================');
const criticalFiles = [
  'standalone-server-fix.js', 
  'server.js', 
  'Procfile', 
  'package.json',
  'package-lock.json',
  '.node-version',
  '.nvmrc',
  'health-check.js',
  'heroku-index.html'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`✅ ${file} found`);
    
    // For package.json, check engines
    if (file === 'package.json') {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
        if (pkg.engines && pkg.engines.node) {
          console.log(`  - engines.node: ${pkg.engines.node}`);
        } else {
          console.warn('  - ⚠️ No engines.node field found in package.json');
        }
      } catch (err) {
        console.error(`  - ❌ Error reading package.json: ${err.message}`);
      }
    }
  } else {
    console.error(`❌ ${file} not found!`);
  }
});

// Check environment variables
console.log('=================================================================');
console.log('ENVIRONMENT VARIABLES:');
console.log('=================================================================');
const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET', 'NODE_ENV'];
const optionalVars = ['UBER_DIRECT_API_KEY', 'UBER_DIRECT_API_URL', 'JETGO_API_KEY', 'JETGO_API_URL'];

requiredVars.forEach(v => {
  if (process.env[v]) {
    if (v.includes('SECRET') || v.includes('KEY') || v.includes('URL') || v.includes('PASSWORD')) {
      console.log(`✅ ${v}: [REDACTED]`);
    } else {
      console.log(`✅ ${v}: ${process.env[v]}`);
    }
  } else {
    console.error(`❌ Required environment variable ${v} is missing!`);
  }
});

console.log('Optional environment variables:');
optionalVars.forEach(v => {
  if (process.env[v]) {
    console.log(`✅ ${v}: [REDACTED]`);
  } else {
    console.warn(`⚠️ Optional variable ${v} is not set`);
  }
});

// Configure application middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Try to load the actual server implementation
console.log('=================================================================');
console.log('LOADING MAIN SERVER:');
console.log('=================================================================');
let mainServerLoaded = false;

try {
  if (fs.existsSync(path.join(process.cwd(), 'standalone-server-fix.js'))) {
    console.log('Attempting to load standalone-server-fix.js...');
    require('./standalone-server-fix.js');
    console.log('✅ Main server loaded successfully via standalone-server-fix.js');
    mainServerLoaded = true;
  } else if (fs.existsSync(path.join(process.cwd(), 'server.js'))) {
    console.log('Attempting to load server.js...');
    require('./server.js');
    console.log('✅ Main server loaded successfully via server.js');
    mainServerLoaded = true;
  } else {
    throw new Error('Neither standalone-server-fix.js nor server.js could be found');
  }
} catch (error) {
  console.error('❌ Error loading main server:', error.message);
  console.error('Stack trace:', error.stack);
  console.log('Starting fallback server instead...');
  startFallbackServer();
}

// Basic API routes for diagnosis
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: mainServerLoaded ? 'normal' : 'fallback',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    heroku: {
      isDyno: Boolean(process.env.DYNO),
      dynoName: process.env.DYNO || 'N/A',
      releaseVersion: process.env.HEROKU_RELEASE_VERSION || 'N/A'
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024))
    }
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    application: 'SoZayn Digital Era',
    version: '3.0.0',
    nodeVersion: process.version,
    mode: mainServerLoaded ? 'normal' : 'fallback',
    distAvailable: fs.existsSync(path.join(process.cwd(), 'dist'))
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the heroku-index.html file if available, or fallback to an inline HTML
app.get('*', (req, res) => {
  // Try to serve the built app from dist
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  const herokuIndexPath = path.join(__dirname, 'heroku-index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log(`Serving ${indexPath}`);
    res.sendFile(indexPath);
  } else if (fs.existsSync(herokuIndexPath)) {
    console.log(`Serving fallback ${herokuIndexPath}`);
    res.sendFile(herokuIndexPath);
  } else {
    // Fallback to a simple HTML response
    console.log('Serving inline fallback HTML');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SoZayn Digital Era</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f7f9; color: #333; line-height: 1.6; }
          .container { max-width: 800px; margin: 40px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #0066ff; margin-bottom: 20px; }
          h2 { color: #0052cc; margin-top: 30px; margin-bottom: 15px; font-size: 1.5rem; }
          p { margin-bottom: 15px; }
          .status { padding: 15px; background: #e6f7ff; border-left: 4px solid #0066ff; margin: 20px 0; border-radius: 0 4px 4px 0; }
          .error { padding: 15px; background: #fff5f5; border-left: 4px solid #e53e3e; margin: 20px 0; border-radius: 0 4px 4px 0; }
          .code { font-family: monospace; background: #f1f1f1; padding: 2px 5px; border-radius: 3px; font-size: 0.9em; }
          ul { padding-left: 25px; }
          li { margin-bottom: 10px; }
          .brand { display: flex; align-items: center; justify-content: center; margin-bottom: 30px; }
          .brand h1 { margin: 0; font-size: 2.2rem; background: linear-gradient(45deg, #0066ff, #00a3ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
          .button { display: inline-block; background: #0066ff; color: white; padding: 10px 15px; border-radius: 4px; text-decoration: none; margin-top: 20px; }
          .button:hover { background: #0052cc; }
          footer { text-align: center; margin-top: 40px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">
            <h1>SoZayn Digital Era</h1>
          </div>
          
          <div class="status">
            <p><strong>Server Status:</strong> Fallback Mode Active</p>
            <p><strong>Node.js Version:</strong> ${process.version}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
          
          <div class="error">
            <p><strong>Issue Detected:</strong> The main application could not be started properly.</p>
          </div>
          
          <h2>Potential Causes</h2>
          <ul>
            <li><strong>Node.js Version Mismatch:</strong> This application requires Node.js v18.19.1</li>
            <li><strong>Missing Dependencies:</strong> Required modules could not be loaded</li>
            <li><strong>Configuration Issues:</strong> Environment variables might be missing or incorrect</li>
            <li><strong>Build Failure:</strong> The frontend application might not have been built correctly</li>
          </ul>
          
          <h2>Troubleshooting Steps</h2>
          <ol>
            <li>Check Heroku logs using <span class="code">heroku logs --tail</span></li>
            <li>Verify Node.js version with <span class="code">heroku config:set NODE_VERSION=18.19.1</span></li>
            <li>Ensure all required environment variables are set</li>
            <li>Try rebuilding and redeploying the application</li>
          </ol>
          
          <p>For additional help, run the health check utility with <span class="code">heroku run node health-check.js</span></p>
          
          <div style="text-align: center;">
            <a href="/api/health" class="button">Check API Health</a>
            <a href="/" class="button">Refresh Page</a>
          </div>
        </div>
        
        <footer>
          <p>&copy; 2025 SoZayn Digital. All rights reserved.</p>
        </footer>
        
        <script>
          // Add dynamic content
          document.addEventListener('DOMContentLoaded', function() {
            // Try to fetch health info
            fetch('/api/health')
              .then(response => response.json())
              .then(data => {
                console.log('Health data:', data);
              })
              .catch(err => {
                console.error('Error fetching health data:', err);
              });
          });
        </script>
      </body>
      </html>
    `);
  }
});

function startFallbackServer() {
  // Start the HTTP server
  const server = http.createServer(app);
  
  server.listen(PORT, () => {
    console.log(`Fallback server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} or your app URL to see the status page`);
    console.log('=================================================================');
  });
  
  // Handle server errors
  server.on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. The main server might be running.`);
    }
  });
}

// If the main server didn't load and start listening on its own
if (!mainServerLoaded) {
  startFallbackServer();
}

// Export the app for testing
module.exports = app;