/**
 * SoZayn Digital Era - Simple Server with Authentication Fix
 * 
 * This server serves static files and includes crucial fixes:
 * 1. Properly handles dashboard.html for authenticated users
 * 2. Routes auth pages correctly
 * 3. Ensures the authentication flow works properly
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from root
app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

// Add middleware to inject necessary scripts
app.get('/', (req, res) => {
  try {
    // Read the index.html file
    const indexPath = path.join(__dirname, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if scripts are already injected
    if (!indexContent.includes('fix-buttons.js') || !indexContent.includes('dashboard-redirect.js')) {
      // Add our scripts right before the closing body tag
      indexContent = indexContent.replace('</body>', 
        `<script src="/fix-buttons.js"></script>
        <script src="/dashboard-redirect.js"></script>
        </body>`);
      
      res.send(indexContent);
    } else {
      res.sendFile(indexPath);
    }
  } catch (error) {
    console.error('Error injecting scripts:', error);
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Special handling for auth page
app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

// Special handling for dashboard page
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Handle API routes or other routes
app.use('/api', express.json());

// Fallback - serve index.html for any other routes
app.get('*', (req, res) => {
  // Check if the requested file exists
  const requestedPath = path.join(__dirname, req.path);
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    res.sendFile(requestedPath);
  } else {
    // Send index.html for SPA routing
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});