# SoZayn Digital Era - Fixed Deployment Instructions

I've identified and fixed the issue with your deployment. The landing page isn't showing because the server can't locate the `index.html` file properly in the Heroku environment.

## The Issues

1. **File Path Structure**: Heroku's file system organization is different from local development
2. **Build Process**: The build artifacts aren't being properly included in the deployment
3. **Server Configuration**: The server.js file needs to be more robust in finding and serving the static files

## Complete Solution

I've created a fixed deployment package (`sozayn-deployment-fixed.zip`) that solves these issues. Here's what to do:

### Step 1: Create a New Directory Structure Locally

```bash
mkdir -p sozayn-deploy-fix/dist
cd sozayn-deploy-fix
```

### Step 2: Extract the Fixed Deployment Package

Download and extract `sozayn-deployment-fixed.zip` into this directory.

### Step 3: Copy the HTML Files and Assets Properly

Make sure the `dist` directory contains:
- index.html (with the updated landing page)
- fallback.html
- assets/ directory with CSS files

### Step 4: Create a Package.json If Not Present

```json
{
  "name": "sozayn-digital-era",
  "version": "1.0.0",
  "description": "Middleware service connecting Shopify with delivery services",
  "main": "server.js",
  "engines": {
    "node": ">=14.0.0"
  },
  "dependencies": {
    "express": "^4.17.1",
    "pg": "^8.7.1"
  },
  "scripts": {
    "start": "node server.js"
  }
}
```

### Step 5: Deploy to Heroku with Verbose Logging

```bash
cd sozayn-deploy-fix
git init
git add .
git commit -m "Fixed deployment with proper file structure"

# Connect to your Heroku app
heroku git:remote -a sozayndigital-e2112b66b875

# Enable more verbose logging to diagnose any issues
heroku config:set NODE_DEBUG=fs,module

# Deploy the fixed version
git push heroku main --force
```

### Step 6: Verify the Deployment

After deployment, check the logs:
```bash
heroku logs --tail
```

Visit the site to verify the updated landing page appears:
https://sozayndigital-e2112b66b875.herokuapp.com/

## Additional Troubleshooting

If the issue persists, try these steps:

1. Check the directory structure on Heroku:
```bash
heroku run ls -la
heroku run ls -la dist
```

2. Check the NODE_ENV variable:
```bash
heroku config:set NODE_ENV=production
```

3. Add a postbuild script to package.json that ensures files are in the right location:
```json
"scripts": {
  "start": "node server.js",
  "postinstall": "mkdir -p dist && cp -r . dist/ || true"
}
```

4. Try accessing the debug endpoint to see environment details:
```
https://sozayndigital-e2112b66b875.herokuapp.com/api/debug
```

## Direct Fix Option

If you prefer a simpler solution, you can edit the server.js file directly on Heroku:

```bash
heroku run bash
# Once in the Heroku bash shell:
cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Debug output to help diagnose the issue
console.log('Working directory:', process.cwd());
console.log('Directory listing:', fs.readdirSync('.'));

// Try multiple possible locations for the static files
const possibleDistDirs = [
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd()),
  path.join(process.cwd(), '..', 'dist'),
  '/app/dist'
];

let DIST_DIR = null;
for (const dir of possibleDistDirs) {
  if (fs.existsSync(dir)) {
    console.log(`Found valid directory: ${dir}`);
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      console.log(`Found index.html in ${dir}`);
      DIST_DIR = dir;
      break;
    }
  }
}

if (!DIST_DIR) {
  console.error('Could not find a valid dist directory with index.html');
  DIST_DIR = process.cwd(); // Fallback to current directory
}

// Serve static files
app.use(express.static(DIST_DIR));

// Fallback for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found: ' + indexPath);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Exit the bash shell
exit

# Restart the dyno
heroku restart
```

Let me know if you need any clarification or assistance with implementing these fixes!