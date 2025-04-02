#!/usr/bin/env node

/**
 * SoZayn Digital Era - Health Check Utility
 * 
 * This script checks the health of your deployed application.
 * It can be run locally or on Heroku with:
 *   heroku run node health-check.js
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Print header
console.log(`${colors.blue}==================================================================${colors.reset}`);
console.log(`${colors.blue}SoZayn Digital Era - Health Check Utility${colors.reset}`);
console.log(`${colors.blue}==================================================================${colors.reset}`);
console.log(`${colors.cyan}Date:${colors.reset} ${new Date().toISOString()}`);
console.log(`${colors.cyan}Node.js version:${colors.reset} ${process.version}`);

// Helper function to get server URL
function getServerUrl() {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    return appUrl.replace(/\/$/, '');
  }
  return 'http://localhost:' + (process.env.PORT || 5000);
}

// Helper function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    console.log(`${colors.cyan}Checking ${url}...${colors.reset}`);
    const req = client.get(url, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', err => reject(err));
    req.setTimeout(10000, () => reject(new Error('Request timed out')));
    req.end();
  });
}

// Check heroku settings if available
function checkHerokuSettings() {
  return new Promise((resolve) => {
    if (!process.env.DYNO) {
      console.log(`${colors.yellow}Not running on Heroku${colors.reset}`);
      return resolve(false);
    }
    
    console.log(`\n${colors.blue}Heroku Environment:${colors.reset}`);
    console.log(`${colors.cyan}Dyno:${colors.reset} ${process.env.DYNO}`);
    console.log(`${colors.cyan}Stack:${colors.reset} ${process.env.STACK || 'Unknown'}`);
    console.log(`${colors.cyan}Release Version:${colors.reset} ${process.env.HEROKU_RELEASE_VERSION || 'Unknown'}`);
    console.log(`${colors.cyan}Slug Commit:${colors.reset} ${process.env.HEROKU_SLUG_COMMIT || 'Unknown'}`);
    
    // Check Heroku buildpack settings
    console.log(`\n${colors.blue}Heroku Build Info:${colors.reset}`);
    
    // Check if we have the Node.js version enforcement files
    const fs = require('fs');
    const nodePath = require('path');
    
    // Check for version files
    const fileChecks = [
      { path: '.node-version', name: '.node-version file' },
      { path: '.nvmrc', name: '.nvmrc file' },
      { path: '.heroku/node-version', name: '.heroku/node-version file' },
      { path: 'bin/detect-engine', name: 'detect-engine script' },
      { path: 'bin/nodejs-engine-override', name: 'nodejs-engine-override script' },
      { path: 'heroku-build.sh', name: 'heroku-build.sh script' },
      { path: 'Procfile', name: 'Procfile' },
      { path: 'runtime.txt', name: 'runtime.txt file' }
    ];
    
    fileChecks.forEach(check => {
      try {
        if (fs.existsSync(check.path)) {
          const content = fs.readFileSync(check.path, 'utf8').trim();
          console.log(`${colors.cyan}${check.name}:${colors.reset} ${colors.green}✅ Present${colors.reset} - ${content.substring(0, 40)}${content.length > 40 ? '...' : ''}`);
        } else {
          console.log(`${colors.cyan}${check.name}:${colors.reset} ${colors.red}❌ Missing${colors.reset}`);
        }
      } catch (err) {
        console.log(`${colors.cyan}${check.name}:${colors.reset} ${colors.red}❌ Error checking: ${err.message}${colors.reset}`);
      }
    });
    
    // Check if package.json has the correct engines field
    try {
      const packageJson = require(nodePath.join(process.cwd(), 'package.json'));
      if (packageJson.engines && packageJson.engines.node) {
        console.log(`${colors.cyan}package.json engines.node:${colors.reset} ${colors.green}✅ Set to ${packageJson.engines.node}${colors.reset}`);
      } else {
        console.log(`${colors.cyan}package.json engines.node:${colors.reset} ${colors.red}❌ Not set${colors.reset}`);
      }
    } catch (err) {
      console.log(`${colors.cyan}package.json:${colors.reset} ${colors.red}❌ Error reading: ${err.message}${colors.reset}`);
    }
    
    // Try to get more Heroku env variables
    exec('printenv | grep HEROKU', (error, stdout, stderr) => {
      if (!error && stdout) {
        console.log(`\n${colors.blue}Additional Heroku Variables:${colors.reset}`);
        const envVars = stdout.split('\n').filter(line => line.trim() !== '');
        envVars.forEach(line => {
          // Hide sensitive values
          if (line.includes('SECRET') || line.includes('KEY') || line.includes('TOKEN') || line.includes('PASSWORD')) {
            const [key] = line.split('=');
            console.log(`${colors.cyan}${key}:${colors.reset} [REDACTED]`);
          } else {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');
            console.log(`${colors.cyan}${key}:${colors.reset} ${value}`);
          }
        });
      }
      
      resolve(true);
    });
    
    // Check NODE_VERSION environment variable
    if (process.env.NODE_VERSION) {
      console.log(`${colors.cyan}NODE_VERSION env:${colors.reset} ${colors.green}✅ Set to ${process.env.NODE_VERSION}${colors.reset}`);
    } else {
      console.log(`${colors.cyan}NODE_VERSION env:${colors.reset} ${colors.red}❌ Not set${colors.reset}`);
    }
  });
}

// Check database connection if available
function checkDatabase() {
  return new Promise((resolve) => {
    if (!process.env.DATABASE_URL) {
      console.log(`${colors.yellow}No DATABASE_URL found${colors.reset}`);
      return resolve(false);
    }
    
    console.log(`\n${colors.blue}Database Connection Info:${colors.reset}`);
    
    // Parse DATABASE_URL to show non-sensitive parts
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log(`${colors.cyan}Database type:${colors.reset} ${url.protocol.replace(':', '')}`);
      console.log(`${colors.cyan}Database host:${colors.reset} ${url.hostname}`);
      console.log(`${colors.cyan}Database port:${colors.reset} ${url.port}`);
      console.log(`${colors.cyan}Database name:${colors.reset} ${url.pathname.replace('/', '')}`);
      console.log(`${colors.cyan}SSL required:${colors.reset} ${process.env.NODE_ENV === 'production' ? 'Yes' : 'No'}`);
    } catch (e) {
      console.log(`${colors.red}Could not parse DATABASE_URL: ${e.message}${colors.reset}`);
    }
    
    // First try direct connection test using the API
    console.log(`\n${colors.blue}Database Connection Test:${colors.reset}`);
    
    // Try to make an API call to the database status endpoint
    const baseUrl = getServerUrl();
    
    // Try multiple endpoints that might provide database status
    const endpoints = [
      '/api/health',
      '/api/debug',
      '/api/status'
    ];
    
    let checkedCount = 0;
    let foundStatus = false;
    
    endpoints.forEach(endpoint => {
      makeRequest(`${baseUrl}${endpoint}`)
        .then(response => {
          checkedCount++;
          if (response.statusCode !== 200) {
            console.log(`${colors.yellow}Endpoint ${endpoint} returned: ${response.statusCode}${colors.reset}`);
            if (checkedCount === endpoints.length && !foundStatus) {
              console.log(`${colors.red}❌ Could not determine database status from any endpoint${colors.reset}`);
              resolve(false);
            }
            return;
          }
          
          try {
            const data = JSON.parse(response.data);
            // Different possible response formats
            const dbStatus = 
              data.database?.connected || 
              data.postgresConnected || 
              data.status === 'ok' ||
              data.dbStatus === 'connected';
            
            if (dbStatus && !foundStatus) {
              foundStatus = true;
              console.log(`${colors.green}✅ Database connected (via ${endpoint})${colors.reset}`);
              
              // Extract additional info if available
              if (data.database?.version) {
                console.log(`${colors.cyan}Database version:${colors.reset} ${data.database.version}`);
              }
              
              if (data.database?.tables) {
                console.log(`${colors.cyan}Database tables:${colors.reset} ${data.database.tables.length} tables found`);
              }
              
              resolve(true);
            }
          } catch (e) {
            console.log(`${colors.yellow}Could not parse response from ${endpoint}: ${e.message}${colors.reset}`);
          }
          
          if (checkedCount === endpoints.length && !foundStatus) {
            console.log(`${colors.red}❌ Could not determine database status from any endpoint${colors.reset}`);
            
            // If we can't determine status from endpoints, provide connection string details
            console.log(`\n${colors.blue}Database Connection String Analysis:${colors.reset}`);
            console.log(`${colors.cyan}Environment:${colors.reset} ${process.env.NODE_ENV || 'development'}`);
            
            if (process.env.HEROKU_POSTGRESQL_COLOR_URL) {
              console.log(`${colors.cyan}Heroku PostgreSQL:${colors.reset} ${colors.green}✅ Addon detected${colors.reset}`);
            }
            
            // Additional database variables that might exist
            const dbVars = [
              'PGHOST', 'PGUSER', 'PGDATABASE', 'PGPORT', 
              'DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME', 'DATABASE_PORT'
            ];
            
            const presentDbVars = dbVars.filter(v => process.env[v]);
            if (presentDbVars.length > 0) {
              console.log(`${colors.cyan}Additional database variables:${colors.reset} ${presentDbVars.join(', ')}`);
            } else {
              console.log(`${colors.yellow}No additional database variables found${colors.reset}`);
            }
            
            resolve(false);
          }
        })
        .catch(err => {
          checkedCount++;
          console.log(`${colors.yellow}Error checking ${endpoint}: ${err.message}${colors.reset}`);
          
          if (checkedCount === endpoints.length && !foundStatus) {
            console.log(`${colors.red}❌ All database status endpoints failed${colors.reset}`);
            resolve(false);
          }
        });
    });
  });
}

// Main health check function
async function checkHealth() {
  const baseUrl = getServerUrl();
  console.log(`${colors.cyan}Server URL:${colors.reset} ${baseUrl}`);
  
  try {
    // Check root endpoint
    console.log(`\n${colors.blue}Checking application health...${colors.reset}`);
    const rootResp = await makeRequest(baseUrl);
    console.log(`${colors.cyan}Root endpoint:${colors.reset} ${rootResp.statusCode === 200 ? 
      `${colors.green}✅ OK [${rootResp.statusCode}]${colors.reset}` : 
      `${colors.red}❌ FAILED [${rootResp.statusCode}]${colors.reset}`}`);
    
    // Check API health endpoint
    const healthResp = await makeRequest(`${baseUrl}/api/health`);
    console.log(`${colors.cyan}Health endpoint:${colors.reset} ${healthResp.statusCode === 200 ? 
      `${colors.green}✅ OK [${healthResp.statusCode}]${colors.reset}` : 
      `${colors.red}❌ FAILED [${healthResp.statusCode}]${colors.reset}`}`);
    
    // Check environment
    console.log(`\n${colors.blue}Checking environment...${colors.reset}`);
    console.log(`${colors.cyan}Node.js version:${colors.reset} ${process.version}`);
    console.log(`${colors.cyan}Environment:${colors.reset} ${process.env.NODE_ENV || 'development'}`);
    console.log(`${colors.cyan}PORT:${colors.reset} ${process.env.PORT || '(not set)'}`);
    console.log(`${colors.cyan}DATABASE_URL:${colors.reset} ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`${colors.cyan}JWT_SECRET:${colors.reset} ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
    console.log(`${colors.cyan}SESSION_SECRET:${colors.reset} ${process.env.SESSION_SECRET ? '✅ Set' : '❌ Not set'}`);
    
    // Check Heroku settings if available
    await checkHerokuSettings();
    
    // Check database connection if available
    await checkDatabase();
    
    if (healthResp.statusCode === 200) {
      try {
        const healthData = JSON.parse(healthResp.data);
        console.log(`\n${colors.blue}Server health details:${colors.reset}`);
        Object.keys(healthData).forEach(key => {
          if (typeof healthData[key] === 'object') {
            console.log(`${colors.cyan}${key}:${colors.reset}`);
            Object.keys(healthData[key]).forEach(subKey => {
              console.log(`  ${colors.cyan}${subKey}:${colors.reset} ${healthData[key][subKey]}`);
            });
          } else {
            console.log(`${colors.cyan}${key}:${colors.reset} ${healthData[key]}`);
          }
        });
      } catch (e) {
        console.log(`${colors.yellow}Could not parse health response: ${e.message}${colors.reset}`);
      }
    }
    
    // Check memory usage
    console.log(`\n${colors.blue}Memory usage:${colors.reset}`);
    const memoryUsage = process.memoryUsage();
    console.log(`${colors.cyan}RSS:${colors.reset} ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
    console.log(`${colors.cyan}Heap total:${colors.reset} ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
    console.log(`${colors.cyan}Heap used:${colors.reset} ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
    
    // Overall status summary
    console.log(`\n${colors.blue}Overall status:${colors.reset}`);
    if (rootResp.statusCode === 200 && healthResp.statusCode === 200) {
      console.log(`${colors.green}✅ Application appears to be running correctly${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️ Application may have issues. Check logs for details.${colors.reset}`);
    }
    
    // Node.js version recommendation
    if (process.version.startsWith('v18.')) {
      console.log(`${colors.green}✅ Using compatible Node.js version: ${process.version}${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Using incompatible Node.js version: ${process.version}${colors.reset}`);
      console.log(`${colors.red}This application requires Node.js v18.19.1${colors.reset}`);
    }
    
  } catch (err) {
    console.error(`${colors.red}❌ Health check failed: ${err.message}${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.blue}==================================================================${colors.reset}`);
}

// Run the check
checkHealth();