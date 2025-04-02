/**
 * Build script for SoZayn Digital Era
 * 
 * This script builds the frontend application and ensures all necessary files
 * are properly copied to the deployment directory.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define directories
const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DEPLOYMENT_DIR = path.join(ROOT_DIR, 'deployment-package');
const DEPLOYMENT_DIST_DIR = path.join(DEPLOYMENT_DIR, 'dist');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== SoZayn Digital Era - Build Process ===${colors.reset}\n`);

// Ensure deployment directory exists
if (!fs.existsSync(DEPLOYMENT_DIR)) {
  console.log(`${colors.yellow}Creating deployment directory...${colors.reset}`);
  fs.mkdirSync(DEPLOYMENT_DIR, { recursive: true });
}

// Build frontend
try {
  console.log(`${colors.yellow}Building frontend application...${colors.reset}`);
  execSync('npm run build', { stdio: 'inherit' });
  console.log(`${colors.green}Frontend build completed successfully.${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}Failed to build frontend:${colors.reset}`, error);
  process.exit(1);
}

// Ensure the deployment dist directory exists
if (!fs.existsSync(DEPLOYMENT_DIST_DIR)) {
  fs.mkdirSync(DEPLOYMENT_DIST_DIR, { recursive: true });
}

// Copy all dist content to deployment directory
try {
  console.log(`${colors.yellow}Copying build files to deployment package...${colors.reset}`);
  
  // Get the list of all files in dist
  const copyDirectory = (source, destination) => {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    
    const entries = fs.readdirSync(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      
      if (entry.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyDirectory(DIST_DIR, DEPLOYMENT_DIST_DIR);
  console.log(`${colors.green}Successfully copied build files to deployment package.${colors.reset}\n`);
} catch (error) {
  console.error(`${colors.red}Failed to copy build files:${colors.reset}`, error);
  process.exit(1);
}

// Copy server files
const serverFilesToCopy = [
  'server.js',
  'health-check.js',
  'Procfile',
  'app.json',
  'package.json',
  'README.md',
  'DEPLOYMENT_GUIDE.md'
];

console.log(`${colors.yellow}Copying server files to deployment package...${colors.reset}`);
for (const file of serverFilesToCopy) {
  try {
    const sourcePath = path.join(ROOT_DIR, file);
    const destinationPath = path.join(DEPLOYMENT_DIR, file);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destinationPath);
      console.log(`Copied ${file}`);
    } else {
      console.log(`${colors.yellow}Warning: ${file} not found, skipping${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Failed to copy ${file}:${colors.reset}`, error);
  }
}

// Create the fallback.html file if it doesn't exist
const fallbackPath = path.join(DEPLOYMENT_DIST_DIR, 'fallback.html');
if (!fs.existsSync(fallbackPath)) {
  console.log(`${colors.yellow}Creating fallback.html...${colors.reset}`);
  const fallbackContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SoZayn Digital Era</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f0f4f8;
      color: #334155;
      line-height: 1.5;
      padding: 2rem;
      margin: 0;
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      padding: 2rem;
      width: 100%;
    }
    h1 {
      color: #0066FF;
      margin-top: 0;
      font-size: 2rem;
    }
    .status-box {
      background-color: #e6f2ff;
      border-left: 4px solid #0066FF;
      padding: 1rem;
      margin: 1.5rem 0;
    }
    .status-item {
      margin: 0.5rem 0;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>SoZayn Digital Era</h1>
    <p>The server is running correctly, but the frontend build is not available.</p>
    
    <div class="status-box">
      <div class="status-item">Server Status: Online</div>
      <div class="status-item">Node Version: <span id="node-version">Loading...</span></div>
      <div class="status-item">Environment: <span id="env-type">Loading...</span></div>
    </div>
    
    <p>If you're seeing this message on a production environment, please ensure the frontend application has been built properly.</p>
  </div>

  <script>
    // Fetch server information
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        document.getElementById('node-version').textContent = data.nodeVersion || 'Unknown';
        document.getElementById('env-type').textContent = data.environment || 'Unknown';
      })
      .catch(error => {
        console.error('Error fetching server info:', error);
        document.getElementById('node-version').textContent = 'Error';
        document.getElementById('env-type').textContent = 'Error';
      });
  </script>
</body>
</html>`;
  
  fs.writeFileSync(fallbackPath, fallbackContent);
  console.log(`${colors.green}Created fallback.html${colors.reset}`);
}

// Create a zip file for easy deployment
try {
  console.log(`${colors.yellow}Creating deployment zip file...${colors.reset}`);
  execSync('cd deployment-package && zip -r ../sozayn-deployment.zip .', { stdio: 'inherit' });
  console.log(`${colors.green}Created deployment zip file: sozayn-deployment.zip${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Failed to create zip file:${colors.reset}`, error);
}

console.log(`\n${colors.bright}${colors.green}✓ Build and deployment package creation complete!${colors.reset}`);
console.log(`\n${colors.cyan}You can now deploy the application using the deployment instructions in DEPLOYMENT_GUIDE.md${colors.reset}`);