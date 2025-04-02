// Standalone Express server for Heroku deployment
// This file contains everything needed to run the application in production
// without relying on TypeScript or module resolution

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { Pool } from 'pg';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import cors from 'cors';
import compression from 'compression';

// Polyfill __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for Heroku
app.set('trust proxy', 1);

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
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'development_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
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

// Debug endpoint
app.get('/api/debug', async (req, res) => {
  try {
    const dbResponse = await testDatabaseConnection();
    
    res.json({
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      postgresConnected: dbResponse,
      sessionConfigured: !!sessionStore,
      currentTime: new Date().toISOString(),
      directories: {
        root: fs.existsSync('/app') ? 
          fs.readdirSync('/app').filter(f => !f.startsWith('.')).join(', ') : 
          'Not accessible',
        dist: fs.existsSync(path.join(__dirname, 'dist')) ? 
          fs.readdirSync(path.join(__dirname, 'dist')).filter(f => !f.startsWith('.')).join(', ') : 
          'Not accessible'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
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
    // Fallback to a simple HTML page if index.html doesn't exist
    res.sendFile(path.join(__dirname, 'heroku-index.html'));
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

export default app;