# SoZayn Digital Era

A middleware service connecting Shopify stores with third-party delivery services (UberDirect and JetGo), enabling seamless order fulfillment and delivery tracking.

![SoZayn Logo](public/logo.png)

## Features

- **Shopify Integration**: Receives orders via webhooks directly from Shopify stores
- **Multi-Service Delivery**: Integrates with UberDirect and JetGo APIs
- **Order Management**: Tracks order status from creation to delivery
- **Admin Dashboard**: Complete order monitoring and management interface
- **Client Portal**: Merchant-specific view for store owners
- **Automatic Status Updates**: Synchronizes delivery status back to Shopify

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js v18.19.1 (required)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens and session-based auth
- **Logging**: Winston for structured logging
- **Error Handling**: Comprehensive error capturing and reporting

## 🚨 Important: Node.js Version Requirements

**This application requires Node.js v18.19.1 specifically.**

Multiple compatibility mechanisms are in place to ensure this requirement:
- `.node-version` file for explicit version declaration
- `.nvmrc` for nvm users
- `engines` field in package.json
- Runtime version checks in server entry points
- Heroku-specific version constraints

Using an incompatible Node.js version will cause the application to fail.

## Environment Variables

The application requires the following environment variables:

```
# Core Application
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
NODE_ENV=production
APP_URL=https://your-app-url.herokuapp.com

# Delivery Service APIs
UBER_DIRECT_API_KEY=your_uber_direct_api_key
UBER_DIRECT_API_URL=https://api.uber.com/v1/direct
JETGO_API_KEY=your_jetgo_api_key
JETGO_API_URL=https://api.jetgo.com/v1
```

## Development

To run the application locally:

1. Install the correct Node.js version (18.19.1):
   ```bash
   nvm install 18.19.1
   nvm use 18.19.1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create and populate `.env` file with necessary environment variables

4. Run the development server:
   ```bash
   npm run dev
   ```

## Heroku Deployment (2025 Modern Approach)

SoZayn Digital Era has been specifically optimized for Heroku deployment with Node.js v18.19.1. The app implements multiple safeguards to ensure compatibility with Heroku's platform.

### Prerequisites

- Heroku CLI installed and authenticated
- Git repository initialized
- PostgreSQL addon for database storage

### Deployment Steps

1. **Create a new Heroku app**:
   ```bash
   heroku create sozayn-digital
   ```

2. **Set the correct Node.js version**:
   ```bash
   heroku config:set NODE_VERSION=18.19.1
   ```

3. **Add the PostgreSQL addon**:
   ```bash
   heroku addons:create heroku-postgresql:standard-0
   ```

4. **Set required environment variables**:
   ```bash
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set SESSION_SECRET=your_session_secret
   heroku config:set NODE_ENV=production
   heroku config:set UBER_DIRECT_API_KEY=your_uber_direct_api_key
   heroku config:set UBER_DIRECT_API_URL=https://api.uber.com/v1/direct
   heroku config:set JETGO_API_KEY=your_jetgo_api_key
   heroku config:set JETGO_API_URL=https://api.jetgo.com/v1
   heroku config:set APP_URL=$(heroku info -s | grep web_url | cut -d= -f2)
   ```

5. **Configure the buildpack to use Node.js v18**:
   ```bash
   heroku buildpacks:clear
   heroku buildpacks:set https://github.com/heroku/heroku-buildpack-nodejs#v200
   ```

6. **Set the correct stack**:
   ```bash
   heroku stack:set heroku-22
   ```

7. **Deploy to Heroku**:
   ```bash
   git push heroku main
   ```

8. **Verify the deployment and Node.js version**:
   ```bash
   heroku logs --tail
   ```
   Look for the line: "Running on Node.js v18.19.1"

9. **Scale to production dyno(s)**:
   ```bash
   heroku ps:scale web=1:standard-1x
   ```

10. **Run database migrations**:
    ```bash
    heroku run npm run db:push
    ```

### Alternative Deployment Options

If you encounter Node.js compatibility issues, use the standalone server approach:

1. **Modify the Procfile to use standalone-server-fix.js**:
   ```
   web: node standalone-server-fix.js
   ```

2. **Commit and push changes**:
   ```bash
   git add Procfile
   git commit -m "Switch to standalone server"
   git push heroku main
   ```

3. **Monitor logs for proper startup**:
   ```bash
   heroku logs --tail
   ```

## Troubleshooting Deployment Issues

### Module System Conflicts

This application has a module system configuration that can cause conflicts on Heroku. The main package.json has `"type": "module"` for the frontend, but the server requires CommonJS style `require()` statements.

If you see errors like `"require is not defined in ES module scope"`, follow these steps:

1. **Use the .cjs extension for server files**:
   ```bash
   # Rename the server file to use .cjs extension
   cp standalone-server-fix.js standalone-server-fix.cjs
   
   # Update Procfile to use the .cjs file
   echo "web: NODE_OPTIONS=--max_old_space_size=256 node standalone-server-fix.cjs" > Procfile
   
   git add standalone-server-fix.cjs Procfile
   git commit -m "Use .cjs extension for CommonJS compatibility"
   git push heroku main
   ```

2. **Copy the standalone package.json**:
   ```bash
   # This removes the "type": "module" setting
   cp package-standalone.json package.json
   git add package.json
   git commit -m "Use CommonJS-compatible package.json"
   git push heroku main
   ```

3. **Set NODE_OPTIONS to allow CommonJS**:
   ```bash
   heroku config:set NODE_OPTIONS="--no-warnings --experimental-modules"
   ```

### Node.js Version Issues

If you're experiencing Node.js version issues on Heroku, try these additional steps:

1. **Create/update the .heroku/node-version file**:
   ```bash
   mkdir -p .heroku
   echo "18.19.1" > .heroku/node-version
   git add .heroku/node-version
   git commit -m "Explicitly set Node.js version"
   ```

2. **Use heroku-build.sh to enforce version**:
   ```bash
   chmod +x heroku-build.sh
   git add heroku-build.sh
   git commit -m "Add build script with version enforcement"
   ```

3. **Use a custom bin directory for Node.js version management**:
   ```bash
   mkdir -p bin
   chmod +x bin/detect-engine
   git add bin
   git commit -m "Add custom Node.js version detection"
   ```

4. **Clear build cache and retry**:
   ```bash
   heroku builds:clear
   git commit --allow-empty -m "Force rebuild with correct Node.js version"
   git push heroku main
   ```

### Combined Quick Fix

For a complete fix addressing both Node.js version and module system issues:

```bash
# Set the correct Node.js version
heroku config:set NODE_VERSION=18.19.1

# Copy the standalone files
cp standalone-server-fix.js standalone-server-fix.cjs
cp package-standalone.json package.json

# Update the Procfile
echo "web: NODE_OPTIONS=--max_old_space_size=256 node standalone-server-fix.cjs" > Procfile

# Commit and push changes
git add standalone-server-fix.cjs package.json Procfile
git commit -m "Fix module system conflict and Node.js version"
git push heroku main

# Monitor logs for successful startup
heroku logs --tail
```

## Database Management

### Running Migrations

```bash
# Locally
npm run db:push

# On Heroku
heroku run npm run db:push
```

### Database Reset (If Needed)

```bash
heroku pg:reset DATABASE_URL --confirm your-app-name
heroku run npm run db:push
```

## API Documentation

### Shopify Webhook Endpoints

- `POST /api/webhooks/orders/create` - Receives new orders from Shopify
- `POST /api/webhooks/orders/update` - Handles order updates from Shopify
- `POST /api/webhooks/orders/cancelled` - Processes order cancellations

### Delivery Service Endpoints

- `POST /api/delivery/submit` - Submits order to delivery service
- `GET /api/delivery/status/:orderId` - Checks delivery status
- `POST /api/delivery/cancel/:orderId` - Cancels a delivery

### Authentication Endpoints

- `POST /api/login` - Authenticates users
- `POST /api/register` - Creates new user accounts
- `POST /api/logout` - Logs out current user

## Monitoring & Debugging

### Logs

View application logs:
```bash
heroku logs --tail
```

### Performance Monitoring

```bash
heroku addons:create newrelic:wayne
heroku addons:open newrelic
```

### Database Monitoring

```bash
heroku pg:info
heroku pg:diagnose
```

## License

Copyright © 2025 SoZayn Digital. All rights reserved.