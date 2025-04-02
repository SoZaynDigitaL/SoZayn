const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to list files recursively
function listFilesRecursively(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      console.log(`Directory: ${relativePath}/`);
      listFilesRecursively(fullPath, relativePath);
    } else {
      console.log(`File: ${relativePath}`);
    }
  }
}

console.log('Starting Heroku postbuild process...');

try {
  // Check if we're in a Heroku environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('Not in production environment, skipping build steps');
    process.exit(0);
  }
  
  console.log('Building client application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Verifying build output...');
  if (fs.existsSync('./dist')) {
    console.log('Build directory exists, listing contents:');
    listFilesRecursively('./dist');
  } else {
    console.error('Error: Build directory not found!');
    process.exit(1);
  }
  
  console.log('Preparing server for production...');
  
  // Create a production version of the server entry point if needed
  if (!fs.existsSync('./server-prod')) {
    fs.mkdirSync('./server-prod', { recursive: true });
    console.log('Created server-prod directory');
  }
  
  console.log('Heroku postbuild completed successfully!');
} catch (error) {
  console.error('Error during Heroku postbuild:', error);
  process.exit(1);
}