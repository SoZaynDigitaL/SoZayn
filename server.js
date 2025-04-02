/**
 * SoZayn Digital Era - Server Entry Point
 * 
 * This is a wrapper script that checks the Node.js version before running
 * the actual server code. It ensures compatibility with Node.js v18.x.
 */

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

console.log('✅ Compatible Node.js version detected. Loading standalone server...');

// Load the actual server implementation
require('./standalone-server-fix.js');