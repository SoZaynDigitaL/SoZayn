const { execSync } = require('child_process');
const fs = require('fs');

console.log('Installing required production dependencies for standalone server...');

try {
  // List of required packages for the standalone server
  const requiredPackages = [
    'express',
    'pg',
    'connect-pg-simple',
    'express-session',
    'passport',
    'passport-local',
    'compression',
    'cors'
  ];
  
  // Check if packages are already installed
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  // Filter out already installed packages
  const packagesToInstall = requiredPackages.filter(pkg => !dependencies[pkg]);
  
  if (packagesToInstall.length > 0) {
    console.log(`Installing missing packages: ${packagesToInstall.join(', ')}`);
    execSync(`npm install --no-save ${packagesToInstall.join(' ')}`, { stdio: 'inherit' });
    console.log('Package installation complete');
  } else {
    console.log('All required packages are already installed');
  }
} catch (error) {
  console.error('Error installing packages:', error);
  process.exit(1);
}