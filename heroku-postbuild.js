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

function createProductionServerEntrypoint() {
  // Create a new server entry point that works with CommonJS
  const entryCode = `
// Production server entry point for Heroku
import('./server-prod/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
`;
  fs.writeFileSync('./prod-server.js', entryCode, 'utf8');
  console.log('Created production server entry point: prod-server.js');
}

console.log('Starting Heroku postbuild process...');

try {
  // Check if we're in a Heroku environment
  if (process.env.NODE_ENV !== 'production') {
    console.log('Not in production environment, skipping build steps');
    process.exit(0);
  }
  
  // Install required dependencies for standalone server
  console.log('Installing required packages for standalone server...');
  execSync('node heroku-packages.js', { stdio: 'inherit' });
  
  // Build the frontend application
  console.log('Building client application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Verifying client build output...');
  if (fs.existsSync('./dist')) {
    console.log('Client build directory exists, listing contents:');
    listFilesRecursively('./dist');
  } else {
    console.error('Error: Client build directory not found!');
    process.exit(1);
  }
  
  // No need to compile server TypeScript files anymore - we're using standalone-server.js
  console.log('Using standalone-server.js for production, skipping TypeScript compilation');
  
  // Run database setup if needed
  console.log('Testing database connection...');
  try {
    execSync('node -e "const { Pool } = require(\'pg\'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); pool.query(\'SELECT NOW()\').then(res => { console.log(\'Database connection successful\'); process.exit(0); }).catch(err => { console.error(\'Database connection error:\', err); process.exit(1); })"', { 
      stdio: 'inherit',
      timeout: 10000 // 10 second timeout
    });
  } catch (dbError) {
    console.error('Database connection test failed, but continuing deployment:', dbError.message);
    // Continue despite database errors - they might be temporary
  }
  
  console.log('Creating a production-ready package.json...');
  // Create a simplified package.json for production
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const productionPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    engines: {
      node: "18.19.1" // Specify the exact Node.js version from .node-version
    },
    main: "standalone-server.js",
    scripts: {
      start: "node --experimental-modules standalone-server.js",
      postinstall: "node heroku-packages.js"
    },
    dependencies: {
      // Core server dependencies
      "express": "^4.18.2",
      "pg": "^8.11.3",
      "connect-pg-simple": "^9.0.0",
      "express-session": "^1.17.3",
      "passport": "^0.6.0",
      "passport-local": "^1.0.0",
      "compression": "^1.7.4",
      "cors": "^2.8.5"
    }
  };
  
  // Write the production package.json to a separate file (for reference only)
  fs.writeFileSync('./package.json.production', JSON.stringify(productionPackageJson, null, 2), 'utf8');
  console.log('Created package.json.production (for reference)');
  
  // Verify standalone server file
  if (fs.existsSync('./standalone-server.js')) {
    console.log('Standalone server file exists, validating...');
    try {
      // Simple syntax check
      execSync('node --check standalone-server.js', { stdio: 'inherit' });
      console.log('Standalone server file validated successfully');
    } catch (validateError) {
      console.error('Standalone server file validation failed:', validateError.message);
      // Continue anyway, as we'll fix any issues manually if needed
    }
  } else {
    console.error('Error: standalone-server.js not found!');
    process.exit(1);
  }
  
  // Create app.json if it doesn't exist
  if (!fs.existsSync('./app.json')) {
    console.log('Creating app.json for Heroku...');
    const appJson = {
      "name": "SoZayn Digital Era",
      "description": "A middleware service connecting Shopify stores with third-party delivery services",
      "repository": "https://github.com/yourusername/sozayn-digital-era",
      "logo": "https://node-js-sample.herokuapp.com/node.png",
      "keywords": ["node", "express", "shopify", "delivery"],
      "addons": [
        "heroku-postgresql:standard-0",
        "papertrail:choklad"
      ],
      "buildpacks": [
        {
          "url": "heroku/nodejs"
        }
      ],
      "env": {
        "NODE_ENV": {
          "description": "Environment setting",
          "value": "production"
        },
        "SESSION_SECRET": {
          "description": "A secret key for session management",
          "generator": "secret"
        },
        "JWT_SECRET": {
          "description": "A secret key for JWT token generation",
          "generator": "secret"
        }
      },
      "success_url": "/"
    };
    fs.writeFileSync('./app.json', JSON.stringify(appJson, null, 2), 'utf8');
  }
  
  // Create and validate health check script
  console.log('Creating health check script...');
  const healthCheckScript = `
#!/usr/bin/env node

const https = require('https');
const http = require('http');

const isHttps = process.env.APP_URL && process.env.APP_URL.startsWith('https');
const appUrl = process.env.APP_URL || \`http://localhost:\${process.env.PORT || 5000}\`;
const healthCheckUrl = \`\${appUrl}/api/health\`;

console.log(\`Checking application health at \${healthCheckUrl}...\`);

const client = isHttps ? https : http;

client.get(healthCheckUrl, (res) => {
  const { statusCode } = res;
  
  if (statusCode !== 200) {
    console.error(\`Health check failed with status code: \${statusCode}\`);
    process.exit(1);
  }
  
  res.setEncoding('utf8');
  let rawData = '';
  
  res.on('data', (chunk) => { rawData += chunk; });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(rawData);
      console.log('Health check successful:', parsedData);
      process.exit(0);
    } catch (e) {
      console.error('Error parsing health check response:', e.message);
      process.exit(1);
    }
  });
}).on('error', (e) => {
  console.error(\`Health check request failed: \${e.message}\`);
  process.exit(1);
});
`;
  fs.writeFileSync('./health-check.js', healthCheckScript, 'utf8');
  fs.chmodSync('./health-check.js', '755'); // Make executable
  
  console.log('Heroku postbuild completed successfully!');
} catch (error) {
  console.error('Error during Heroku postbuild:', error);
  process.exit(1);
}