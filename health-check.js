const { Pool } = require('pg');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Health check script for SoZayn Digital Era
 * Validates the application deployment on Heroku
 */

console.log('=========================================');
console.log('SoZayn Digital Era - Health Check');
console.log('=========================================');

// Check for required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET'
];

console.log('Checking environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
} else {
  console.log('✅ All required environment variables are set');
}

// Check for critical files
const criticalFiles = [
  'standalone-server.js',
  'Procfile',
  'package.json'
];

console.log('\nChecking critical files...');
const missingFiles = criticalFiles.filter(file => {
  try {
    fs.accessSync(file, fs.constants.F_OK);
    return false;
  } catch (err) {
    return true;
  }
});

if (missingFiles.length > 0) {
  console.warn(`⚠️ Missing critical files: ${missingFiles.join(', ')}`);
} else {
  console.log('✅ All critical files are present');
}

// Check database connection
async function checkDatabase() {
  console.log('\nChecking database connection...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`✅ Database connection successful - ${result.rows[0].now}`);
    
    // Check for required tables
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    const requiredTables = ['users', 'orders', 'logs'];
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.warn(`⚠️ Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log('✅ All required database tables exist');
    }
    
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

// Check API endpoints
function checkEndpoint(url, name) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, (res) => {
      const status = res.statusCode;
      if (status >= 200 && status < 500) {
        console.log(`✅ ${name} endpoint is available (${status})`);
        resolve(true);
      } else {
        console.warn(`⚠️ ${name} endpoint returned status ${status}`);
        resolve(false);
      }
    });
    
    request.on('error', (err) => {
      console.error(`❌ ${name} endpoint check failed:`, err.message);
      resolve(false);
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      console.warn(`⚠️ ${name} endpoint timed out`);
      resolve(false);
    });
  });
}

// Check Node.js version
function checkNodeVersion() {
  console.log('\nChecking Node.js environment...');
  console.log(`✅ Node.js version: ${process.version}`);
  console.log(`✅ Architecture: ${process.arch}`);
  console.log(`✅ Platform: ${process.platform}`);
}

// Run all checks
async function runHealthCheck() {
  // Check app URL from environment or default to localhost
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  
  await checkDatabase();
  console.log('\nChecking API endpoints...');
  await checkEndpoint(`${appUrl}/api/health`, 'Health');
  await checkEndpoint(`${appUrl}/api/debug`, 'Debug');
  checkNodeVersion();
  
  console.log('\n=========================================');
  console.log('Health check completed!');
  console.log('=========================================');
}

runHealthCheck().catch(err => {
  console.error('Health check failed with error:', err);
  process.exit(1);
});