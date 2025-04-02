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

// Add middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to safely list a directory without crashing if it doesn't exist
function safeListDir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch (e) {
    console.warn(`Warning: Could not read directory ${dir}`, e.message);
    return [];
  }
}

// Check for possible static file directories
const possibleDirs = [
  '.', // Current directory (like in Heroku)
  './dist', // Vite build output
  './public', // Common static files folder
  './build', // Create React App build output
  '../client/dist', // Vite output in monorepo
  '../dist' // Another common monorepo location
];

// Find the first directory that contains an index.html file
let staticDir = possibleDirs[0]; // Default to current directory
for (const dir of possibleDirs) {
  if (fs.existsSync(path.join(__dirname, dir, 'index.html'))) {
    staticDir = dir;
    console.log(`Found static files in ${path.join(__dirname, dir)}`);
    break;
  }
}

// Log which files we found for debugging purposes
console.log('Static directory:', path.join(__dirname, staticDir));
console.log('Static files:', safeListDir(path.join(__dirname, staticDir))
  .filter(f => !f.startsWith('.'))
  .slice(0, 10)
  .join(', ') + (safeListDir(path.join(__dirname, staticDir)).length > 10 ? '...' : ''));

// Serve static files
app.use(express.static(path.join(__dirname, staticDir)));

// Special handling for index.html to inject button fix script
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, staticDir, 'index.html');
  
  try {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Only inject the script if it's not already there
    if (!indexContent.includes('fix-buttons.js')) {
      indexContent = indexContent.replace('</body>', '<script src="/fix-buttons.js"></script></body>');
      console.log('Injected button fix script into index.html');
    }
    
    res.send(indexContent);
  } catch (error) {
    console.error('Error reading or modifying index.html:', error);
    res.sendFile(indexPath);
  }
});

// API endpoints for authentication
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  // Simple validation logic
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }
  
  // Check for test accounts
  if (email === 'admin@sozayn.com' || 
      email === 'test_direct@example.com' || 
      email === 'kalamama@gmail.com' || 
      email === 'admin@deliverconnect.com') {
    
    // Create a simple user object for the response
    const user = {
      id: email === 'admin@sozayn.com' ? 1 : (email === 'test_direct@example.com' ? 2 : 3),
      email,
      name: email.split('@')[0],
      isAdmin: email.includes('admin'),
      isActive: true,
      createdAt: new Date()
    };
    
    return res.status(200).json(user);
  }
  
  // If not a test account, return unauthorized
  return res.status(401).send('Invalid email or password');
});

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  
  console.log('Registration attempt:', email);
  
  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).send('Name, email and password are required');
  }
  
  // Check if user exists (always say yes for this mock implementation)
  if (email === 'admin@sozayn.com' || 
      email === 'test_direct@example.com' || 
      email === 'kalamama@gmail.com' || 
      email === 'admin@deliverconnect.com') {
    return res.status(400).send('User already exists');
  }
  
  // Create a user object
  const user = {
    id: Math.floor(Math.random() * 1000) + 10, // Random ID
    name,
    email,
    isAdmin: false,
    isActive: true,
    createdAt: new Date()
  };
  
  return res.status(201).json(user);
});

// Auth route handler
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

// Handle all other routes - return index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, staticDir, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} at ${new Date().toISOString()}`);
  console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
});