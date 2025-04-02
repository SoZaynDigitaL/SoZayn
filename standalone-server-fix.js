// Standalone Express server for Heroku deployment (CommonJS version)
// This file contains everything needed to run the application in production
// using CommonJS modules for better compatibility with Node.js v18.x

// Check if this is a CommonJS environment
if (typeof require === 'undefined') {
  console.error('This script must be run in a CommonJS environment');
  process.exit(1);
}

// STRICT VERSION CHECK: Only allow Node.js v18.x to run this application
const nodeVersion = process.version;
console.log(`Running on Node.js ${nodeVersion}`);

// Extract the major version number
const majorVersion = parseInt(nodeVersion.match(/^v(\d+)/)[1], 10);

if (majorVersion !== 18) {
  console.error('❌ ERROR: This application requires Node.js v18.x');
  console.error(`Your current Node.js version is ${nodeVersion}`);
  console.error('Please ensure you have Node.js v18.x installed');
  console.error('If you are using Heroku, make sure your .nvmrc, .node-version, and runtime.txt files specify Node.js v18.x');
  
  // Exit with error code to prevent startup on wrong Node.js version
  process.exit(1);
}

console.log('✅ Compatible Node.js version detected. Continuing startup...');

// Show environment information
console.log('Current Working Directory:', process.cwd());
console.log('Environment Variables:');
Object.keys(process.env).forEach(key => {
  if (!key.includes('SECRET') && !key.includes('KEY') && !key.includes('PASSWORD')) {
    console.log(`  ${key}=${process.env[key]}`);
  } else {
    console.log(`  ${key}=[REDACTED]`);
  }
});

// Importing required modules
let express, path, fs, createServer, Pool, session, connectPg, passport;
let LocalStrategy, cors, compression, randomBytes, scrypt, timingSafeEqual, promisify;

// Try to require modules and show any errors
try {
  // Core Node.js modules
  express = require('express');
  path = require('path');
  fs = require('fs');
  createServer = require('http').createServer;
  const crypto = require('crypto');
  randomBytes = crypto.randomBytes;
  scrypt = crypto.scrypt;
  timingSafeEqual = crypto.timingSafeEqual;
  promisify = require('util').promisify;

  // Third-party modules
  Pool = require('pg').Pool;
  session = require('express-session');
  connectPg = require('connect-pg-simple');
  passport = require('passport');
  LocalStrategy = require('passport-local').Strategy;
  cors = require('cors');
  compression = require('compression');
  
  console.log('Successfully loaded all modules');
} catch (error) {
  console.error('Error loading modules:', error);
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for Heroku - very important for sessions to work
app.enable('trust proxy');
console.log('Trust proxy setting:', app.get('trust proxy'));

// Force HTTPS redirect on Heroku
app.use((req, res, next) => {
  // Skip for health checks and local development
  if (process.env.NODE_ENV === 'production' || process.env.FORCE_SSL === 'true') {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      console.log('Redirecting to HTTPS:', req.originalUrl);
      return res.redirect(`https://${req.hostname}${req.originalUrl}`);
    }
  }
  next();
});

// Log request information for debugging
app.use((req, res, next) => {
  // Log IP address details for every request
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

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(compression());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for Heroku Postgres
  } : undefined
});

// Test database connection
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
}

// Set up session store
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({
  pool,
  createTableIfMissing: true
});

// Configure session
console.log('Configuring session for environment:', process.env.NODE_ENV || 'development');

// Force secure cookies in production (Heroku), regardless of the request protocol
const isProduction = process.env.NODE_ENV === 'production';
const cookieSettings = {
  secure: isProduction,
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/',
  sameSite: isProduction ? 'none' : 'lax'
};

console.log('Cookie settings:', cookieSettings);

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'development_secret',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Force cookie to be set on every response
  cookie: cookieSettings,
  proxy: true // Important for Heroku
}));

// Password utilities
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Set up authentication
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [username]);
    const user = result.rows[0];
    
    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false);
    }
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err);
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await testDatabaseConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbConnected ? 'connected' : 'disconnected',
    nodeVersion: process.version
  });
});

// Auth routes
app.post('/api/register', async (req, res, next) => {
  try {
    const { username, password, name, email, shopifyDomain, shopifyApiKey, shopifyApiSecret } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, "shopifyDomain", "shopifyApiKey", "shopifyApiSecret", "isAdmin", "isActive", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, email, hashedPassword, shopifyDomain, shopifyApiKey, shopifyApiSecret, false, true, new Date()]
    );
    
    const user = result.rows[0];
    
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json({ user });
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json(req.user);
});

// Debug endpoint with enhanced Heroku diagnostics
app.get('/api/debug', async (req, res) => {
  try {
    const dbResponse = await testDatabaseConnection();
    
    // Get environment variables (excluding sensitive ones)
    const safeEnvVars = {};
    for (const key in process.env) {
      if (!key.includes('SECRET') && !key.includes('KEY') && !key.includes('PASSWORD')) {
        safeEnvVars[key] = process.env[key];
      } else {
        safeEnvVars[key] = '[REDACTED]';
      }
    }
    
    // Check for Heroku-specific environment variables
    const isHeroku = !!process.env.DYNO;
    
    // Capture request information
    const requestInfo = {
      ip: req.ip,
      ips: req.ips,
      originalUrl: req.originalUrl,
      protocol: req.protocol,
      secure: req.secure,
      headers: {
        ...req.headers,
        // Don't log authorization headers
        authorization: req.headers.authorization ? '[PRESENT]' : '[ABSENT]',
        cookie: req.headers.cookie ? '[PRESENT]' : '[ABSENT]'
      }
    };
    
    // Session info (safely)
    const sessionInfo = req.session ? {
      id: req.session.id,
      cookie: req.session.cookie ? {
        maxAge: req.session.cookie.maxAge,
        secure: req.session.cookie.secure,
        httpOnly: req.session.cookie.httpOnly,
        sameSite: req.session.cookie.sameSite,
        domain: req.session.cookie.domain,
        path: req.session.cookie.path
      } : 'No cookie',
      authenticated: req.isAuthenticated ? req.isAuthenticated() : 'Unknown'
    } : 'No session';
    
    // Server configuration
    const serverConfig = {
      trustProxy: app.get('trust proxy'),
      port: PORT,
      sessionSecret: process.env.SESSION_SECRET ? '[SET]' : '[NOT SET]'
    };
    
    res.json({
      environment: process.env.NODE_ENV || 'development',
      isHeroku,
      dyno: process.env.DYNO,
      serverConfig,
      nodeVersion: process.version,
      postgresConnected: dbResponse,
      sessionConfigured: !!sessionStore,
      sessionInfo,
      requestInfo,
      trustProxyEnabled: !!app.get('trust proxy'),
      currentTime: new Date().toISOString(),
      directories: {
        root: fs.existsSync('/app') ? 
          fs.readdirSync('/app').filter(f => !f.startsWith('.')).join(', ') : 
          'Not accessible',
        dist: fs.existsSync(path.join(__dirname, 'dist')) ? 
          fs.readdirSync(path.join(__dirname, 'dist')).filter(f => !f.startsWith('.')).join(', ') : 
          'Not accessible'
      },
      safeEnvVars
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      error: error.message, 
      stack: error.stack,
      message: 'An error occurred while gathering debug information'
    });
  }
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Catch all routes and serve the index.html file
app.get('*', (req, res) => {
  // For API requests that don't match any route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For all other requests, serve index.html
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback if index.html doesn't exist
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SoZayn Digital Era</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f7f9; color: #333; }
          .container { max-width: 800px; margin: 40px auto; padding: 20px; background: white; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #0066ff; }
          p { line-height: 1.6; }
          .status { padding: 10px; background: #e6f7ff; border-left: 4px solid #0066ff; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>SoZayn Digital Era</h1>
          <p>The server is running correctly, but the frontend build is not available.</p>
          <div class="status">
            <p><strong>Server Status:</strong> Online</p>
            <p><strong>Node Version:</strong> ${process.version}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          </div>
          <p>If you're seeing this message on a production environment, please ensure the frontend application has been built properly.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? null : err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Start the HTTP server
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Testing database connection...');
  
  testDatabaseConnection()
    .then(connected => {
      if (connected) {
        console.log('Database connection successful');
      } else {
        console.warn('Database connection failed, but server will continue running');
      }
    })
    .catch(err => {
      console.error('Error testing database connection:', err);
    });
});

// CommonJS exports
module.exports = app;