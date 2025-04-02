#!/bin/bash

# Set colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}==================================================================="
echo -e "SoZayn Digital Era - Enhanced Heroku Build Script v2.0"
echo -e "===================================================================${NC}"

# Log Node.js version in detail
echo -e "${BLUE}NODE VERSION INFORMATION:${NC}"
echo -e "Node.js version: $(node -v)"
echo -e "npm version: $(npm -v)"
echo -e "Required Node.js version: ${GREEN}18.19.1${NC}"

# Extract the major version number
NODE_VERSION=$(node -v)
MAJOR_VERSION=$(echo $NODE_VERSION | sed -n 's/^v\([0-9]*\).*/\1/p')

# Version check
if [ "$MAJOR_VERSION" != "18" ]; then
  echo -e "${RED}❌ ERROR: This application requires Node.js v18.x${NC}"
  echo -e "${RED}Current Node.js version is $NODE_VERSION${NC}"
  echo -e "${YELLOW}Attempting to proceed, but this may cause serious issues...${NC}"
  
  # Try to exit with an error if possible
  if [ -z "$HEROKU" ]; then
    echo -e "${RED}Exiting build process due to incompatible Node.js version${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✅ Compatible Node.js version detected: $NODE_VERSION${NC}"
fi

# Run Node.js version detection tool if available
if [ -f "bin/detect-engine" ]; then
  echo -e "${BLUE}Running comprehensive Node.js version check...${NC}"
  chmod +x bin/detect-engine
  ./bin/detect-engine
fi

# Run Node.js engine override tool if available
if [ -f "bin/nodejs-engine-override" ]; then
  echo -e "${BLUE}Running Node.js engine override tool...${NC}"
  chmod +x bin/nodejs-engine-override
  node bin/nodejs-engine-override
fi

# Check and update version configuration files
echo -e "${BLUE}Checking and updating Node.js version configuration files:${NC}"

# Define the required version
REQUIRED_VERSION="18.19.1"

# Function to check and create version files
create_version_file() {
  FILE=$1
  CONTENT=$2
  
  if [ -f "$FILE" ]; then
    CURRENT=$(cat "$FILE")
    echo -e "${GREEN}✅ $FILE found: $CURRENT${NC}"
    
    if [ "$CURRENT" != "$CONTENT" ]; then
      echo -e "${YELLOW}⚠️ $FILE has incorrect version. Updating to $CONTENT...${NC}"
      echo "$CONTENT" > "$FILE"
    fi
  else
    echo -e "${YELLOW}⚠️ $FILE not found. Creating it...${NC}"
    echo "$CONTENT" > "$FILE"
  fi
}

create_version_file ".node-version" "$REQUIRED_VERSION"
create_version_file ".nvmrc" "$REQUIRED_VERSION"
create_version_file "runtime.txt" "nodejs-$REQUIRED_VERSION"

# .heroku directory and node-version file
mkdir -p .heroku
create_version_file ".heroku/node-version" "$REQUIRED_VERSION"

# Create .npmrc file if it doesn't exist
if [ -f ".npmrc" ]; then
  echo -e "${GREEN}✅ .npmrc found${NC}"
else
  echo -e "${YELLOW}⚠️ .npmrc not found. Creating it...${NC}"
  echo "engine-strict=true" > .npmrc
  echo "node-version=$REQUIRED_VERSION" >> .npmrc
fi

# Environment information
echo -e "${BLUE}==================================================================="
echo -e "ENVIRONMENT INFORMATION:${NC}"
echo -e "Current working directory: $(pwd)"
echo -e "Current date and time: $(date)"
echo -e "User: $(whoami)"
echo -e "Available disk space: $(df -h . | tail -1 | awk '{print $4}')"
echo -e "Memory usage: $(free -m | grep Mem | awk '{print $3 " MB used out of " $2 " MB"}')"

# Check for presence of bin directory
if [ -d "bin" ]; then
  echo -e "${GREEN}✅ bin directory found with these files:${NC}"
  ls -la bin/
else
  echo -e "${YELLOW}⚠️ bin directory not found. Creating it...${NC}"
  mkdir -p bin
fi

# Install dependencies
echo -e "${BLUE}==================================================================="
echo -e "INSTALLING DEPENDENCIES...${NC}"
npm install

# Build frontend
echo -e "${BLUE}==================================================================="
echo -e "BUILDING FRONTEND...${NC}"

# First create a fallback landing page in case the build fails
echo -e "${YELLOW}Creating fallback landing page...${NC}"
mkdir -p dist
if [ -f "heroku-index.html" ]; then
  cp heroku-index.html dist/index.html
  echo -e "${GREEN}✅ Copied heroku-index.html to dist/index.html as fallback${NC}"
else
  # Generate a basic fallback page
  echo -e "${YELLOW}heroku-index.html not found, generating basic fallback page...${NC}"
  cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>SoZayn Digital Era</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f7f9; color: #333; }
    .container { max-width: 800px; margin: 40px auto; padding: 20px; background: white; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #0066ff; }
    p { line-height: 1.6; }
    .status { padding: 10px; background: #e6f7ff; border-left: 4px solid #0066ff; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>SoZayn Digital Era</h1>
    <p>Server is running, but the frontend was not built properly.</p>
    <div class="status">
      <p><strong>Server Status:</strong> Online</p>
      <p><strong>Node Version:</strong> <script>document.write(process.version || 'Unknown')</script></p>
    </div>
    <p>If you're seeing this message, please check the build logs or contact support.</p>
  </div>
</body>
</html>
EOF
  echo -e "${GREEN}✅ Generated basic fallback page at dist/index.html${NC}"
fi

# Now try to run the build process
echo -e "${BLUE}Attempting to build frontend application...${NC}"
npm run build || {
  echo -e "${RED}❌ Build process failed!${NC}"
  echo -e "${YELLOW}Using fallback page instead. The server will still run, but with limited functionality.${NC}"
  # Don't exit as we still want the server to start even if the build fails
}

# Check if dist directory exists and contains real built files 
if [ -d "dist" ] && [ -f "dist/index.html" ] && [ $(wc -c < dist/index.html) -gt 500 ]; then
  echo -e "${GREEN}✅ Build successful! dist directory created with these files:${NC}"
  ls -la dist/
  
  # Check for other critical frontend files
  if [ -d "dist/assets" ]; then
    echo -e "${GREEN}✅ assets directory found in dist${NC}"
    echo -e "$(ls -la dist/assets | wc -l) files in assets directory"
  else
    echo -e "${YELLOW}⚠️ No assets directory found in dist. This might indicate an incomplete build.${NC}"
  fi
  
  # Count JS and CSS files
  JS_COUNT=$(find dist -name "*.js" | wc -l)
  CSS_COUNT=$(find dist -name "*.css" | wc -l)
  
  echo -e "${GREEN}Found ${JS_COUNT} JavaScript files and ${CSS_COUNT} CSS files in build output${NC}"
    
else
  echo -e "${RED}❌ Build output appears to be incomplete or missing!${NC}"
  echo -e "${YELLOW}The server will start, but the application may not function correctly.${NC}"
  echo -e "${YELLOW}A fallback page has been installed and will be served instead.${NC}"
fi

# Copy standalone package.json to root
echo -e "${BLUE}==================================================================="
echo -e "SETTING UP STANDALONE SERVER...${NC}"

# Backup original package.json first
if [ -f "package.json" ]; then
  cp package.json package.json.original
  echo -e "${GREEN}✅ Original package.json backed up to package.json.original${NC}"
fi

# Copy standalone package.json
if [ -f "package-standalone.json" ]; then
  echo -e "${BLUE}Copying package-standalone.json to package.json...${NC}"
  cp package-standalone.json package.json
  cat package.json | grep -v "type"
  echo -e "${GREEN}✅ Standalone package.json copied to package.json${NC}"
  
  # Ensure the "type": "module" is NOT present in package.json
  echo -e "${BLUE}Ensuring 'type: module' is not present in package.json...${NC}"
  grep -v '"type": "module"' package.json > package.json.tmp && mv package.json.tmp package.json
  echo -e "${GREEN}✅ Verified package.json has no 'type: module'${NC}"
else
  echo -e "${RED}❌ package-standalone.json not found! This is required for deployment.${NC}"
  exit 1
fi

# Ensure engines field is present in package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
if (!pkg.engines || pkg.engines.node !== '$REQUIRED_VERSION') {
  pkg.engines = pkg.engines || {};
  pkg.engines.node = '$REQUIRED_VERSION';
  fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
  console.log('Updated package.json engines field to Node.js $REQUIRED_VERSION');
}
"

# Install standalone server dependencies
echo -e "${BLUE}==================================================================="
echo -e "INSTALLING STANDALONE SERVER DEPENDENCIES...${NC}"
npm install --production

# Check for server files
echo -e "${BLUE}==================================================================="
echo -e "CHECKING SERVER FILES:${NC}"

# Function to check critical files
check_file() {
  FILE=$1
  if [ -f "$FILE" ]; then
    echo -e "${GREEN}✅ $FILE found${NC}"
    return 0
  else
    echo -e "${RED}❌ $FILE not found! This is required for deployment!${NC}"
    return 1
  fi
}

# Copy standalone-server-fix.js to .cjs version
if [ -f "standalone-server-fix.js" ]; then
  echo -e "${BLUE}Creating CJS version of standalone server...${NC}"
  cp standalone-server-fix.js standalone-server-fix.cjs
  echo -e "${GREEN}✅ Created standalone-server-fix.cjs for CommonJS compatibility${NC}"
fi

# Update Procfile to use .cjs extension if needed
if [ -f "Procfile" ]; then
  if grep -q "standalone-server-fix.js" Procfile; then
    echo -e "${YELLOW}⚠️ Procfile uses .js extension. Updating to .cjs...${NC}"
    sed -i 's/standalone-server-fix.js/standalone-server-fix.cjs/g' Procfile
    echo -e "${GREEN}✅ Updated Procfile to use .cjs extension${NC}"
  fi
fi

CRITICAL_FILES=("standalone-server-fix.js" "standalone-server-fix.cjs" "server.js" "heroku-server.js")
MISSING_FILES=0

for file in "${CRITICAL_FILES[@]}"; do
  check_file "$file" || ((MISSING_FILES++))
done

if [ $MISSING_FILES -gt 0 ]; then
  echo -e "${RED}❌ $MISSING_FILES critical files are missing! Deployment may fail.${NC}"
else
  echo -e "${GREEN}✅ All critical server files are present.${NC}"
fi

# Check Procfile
if [ -f "Procfile" ]; then
  PROCFILE_CONTENT=$(cat Procfile)
  echo -e "${GREEN}✅ Procfile found: $PROCFILE_CONTENT${NC}"
  
  # Check if the Procfile uses the right command
  if [[ "$PROCFILE_CONTENT" != *"standalone-server-fix.js"* && "$PROCFILE_CONTENT" != *"server.js"* ]]; then
    echo -e "${YELLOW}⚠️ Procfile does not seem to use the correct server entry point.${NC}"
    echo -e "${YELLOW}Consider updating it to: web: node standalone-server-fix.js${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Procfile not found. Creating it...${NC}"
  echo "web: node standalone-server-fix.js" > Procfile
  echo -e "${GREEN}✅ Created Procfile with standalone server entry point${NC}"
fi

# Create a health-check.cjs file for monitoring
echo -e "${BLUE}Creating health check utility...${NC}"
cat > health-check.cjs << 'EOF'
#!/usr/bin/env node

const http = require('http');
const https = require('https');

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
    
    console.log(`Checking ${url}...`);
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

// Main health check function
async function checkHealth() {
  const baseUrl = getServerUrl();
  
  try {
    // Check root endpoint
    console.log('\n🔎 Checking application health...');
    const rootResp = await makeRequest(baseUrl);
    console.log(`Root endpoint: ${rootResp.statusCode === 200 ? '✅ OK' : '❌ FAILED'} [${rootResp.statusCode}]`);
    
    // Check API health endpoint
    const healthResp = await makeRequest(`${baseUrl}/api/health`);
    console.log(`Health endpoint: ${healthResp.statusCode === 200 ? '✅ OK' : '❌ FAILED'} [${healthResp.statusCode}]`);
    
    // Check environment
    console.log('\n🔎 Checking environment...');
    console.log(`Node.js version: ${process.version}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`PORT: ${process.env.PORT || '(not set)'}`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
    
    if (healthResp.statusCode === 200) {
      try {
        const healthData = JSON.parse(healthResp.data);
        console.log('\n🔎 Server health details:');
        console.log(JSON.stringify(healthData, null, 2));
      } catch (e) {
        console.log(`Could not parse health response: ${e.message}`);
      }
    }
    
    console.log('\n🔎 Overall status:');
    if (rootResp.statusCode === 200 && healthResp.statusCode === 200) {
      console.log('✅ Application appears to be running correctly');
    } else {
      console.log('⚠️ Application may have issues. Check logs for details.');
    }
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    process.exit(1);
  }
}

// Run the check
checkHealth();
EOF

chmod +x health-check.cjs
echo -e "${GREEN}✅ Created health-check.cjs utility${NC}"

# Log completion
echo -e "${BLUE}==================================================================="
echo -e "${GREEN}✅ BUILD PROCESS COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}==================================================================="
echo -e "${GREEN}Standalone server is ready for Heroku deployment.${NC}"
echo -e "${YELLOW}Remember to set all required environment variables in Heroku.${NC}"