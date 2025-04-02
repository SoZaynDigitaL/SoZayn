# SoZayn Digital Era

A middleware service connecting Shopify stores with third-party delivery services (UberDirect and JetGo).

## Features

- Shopify integration via webhooks
- Multi-delivery service integration (UberDirect, JetGo)
- Order tracking and management
- Admin dashboard
- Client portal for merchants

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens and session-based auth

## Environment Setup

The application requires the following environment variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
PORT=5000 (default)
```

## Development

To run the application locally:

```bash
npm install
npm run dev
```

## Heroku Deployment

This application is optimized for deployment on Heroku using a standalone server approach. Follow these steps to deploy:

### Standard Deployment

1. Create a new Heroku app
   ```
   heroku create your-app-name
   ```

2. Add required addons
   ```
   heroku addons:create heroku-postgresql:standard-0
   heroku addons:create papertrail:choklad
   heroku addons:create newrelic:wayne
   ```

3. Set environment variables
   ```
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set SESSION_SECRET=your_session_secret
   heroku config:set NODE_ENV=production
   ```

4. Deploy to Heroku
   ```
   git push heroku main
   ```

5. Scale to at least 2 dynos for redundancy
   ```
   heroku ps:scale web=2:standard-1x
   ```

6. Run database migrations
   ```
   heroku run npm run db:push
   ```

7. Enable Heroku SSL
   ```
   heroku certs:auto:enable
   ```

### For Module Resolution Issues (ERR_MODULE_NOT_FOUND)

If you encounter module resolution errors, we've provided a standalone server implementation that eliminates TypeScript dependency issues in production:

1. Check that the following files exist:
   - `standalone-server.js` - All-in-one JavaScript server
   - `heroku-packages.js` - Dependency installer
   - `health-check.js` - Server health verifier

2. Update your Procfile to use the standalone server:
   ```
   web: node --experimental-modules --enable-source-maps standalone-server.js
   ```

3. Ensure you're using a stable Node.js version:
   ```
   heroku config:set NODE_VERSION=18.19.1
   ```

4. Force a clean rebuild:
   ```
   heroku builds:clear
   git commit --allow-empty -m "Force rebuild with standalone server"
   git push heroku main
   ```

5. Verify deployment:
   ```
   heroku logs --tail
   heroku open
   ```

6. Check the application health:
   ```
   heroku run node health-check.js
   ```

This standalone server implementation:
- Eliminates TypeScript compilation issues
- Provides complete server functionality in a single JavaScript file
- Includes built-in fallback mechanisms
- Handles database connections automatically with error recovery
- Serves the frontend React application seamlessly

## Troubleshooting Heroku Deployment

### Module Resolution Errors (ERR_MODULE_NOT_FOUND)

If you encounter the `ERR_MODULE_NOT_FOUND` error for TypeScript files (e.g., server/routes.ts), follow these steps:

1. **Run the enhanced Heroku postbuild script manually**:
   ```
   heroku run "node heroku-postbuild.js"
   ```
   This script will:
   - Compile TypeScript to JavaScript
   - Create correct production paths
   - Fix import references

2. **Update Node.js version** if needed:
   ```
   heroku config:set NODE_ENGINE=18.x
   ```

3. **Check production TypeScript compilation**:
   ```
   heroku run "ls -la server-prod/"
   ```
   Verify that compiled JavaScript files exist for your TypeScript files.

4. **Force a clean rebuild**:
   ```
   heroku builds:clear
   git commit --allow-empty -m "Force rebuild"
   git push heroku main
   ```

5. **Enable verbose Node.js ESM debugging**:
   ```
   heroku config:set NODE_OPTIONS="--experimental-modules --experimental-json-modules --trace-warnings --verbose"
   ```

6. **Manually copy TypeScript files to JavaScript** (emergency solution):
   ```
   heroku run bash
   > cd server
   > for f in *.ts; do cp "$f" "../server-prod/${f%.ts}.js"; done
   > exit
   ```

7. **Check the Procfile configuration** (should be):
   ```
   web: node --experimental-modules --enable-source-maps prod-server.js
   ```

### Database Connection Issues

1. **Verify PostgreSQL connection**:
   ```
   heroku pg:info
   heroku pg:credentials:url
   ```

2. **Check database migrations**:
   ```
   heroku run "npm run db:push"
   ```

3. **For connection failures, try**:
   ```
   heroku pg:reset DATABASE_URL --confirm your-app-name
   heroku pg:credentials:rotate DATABASE_URL --confirm your-app-name
   ```

### Logging & Monitoring

1. **View application logs**:
   ```
   heroku logs --tail
   ```

2. **Check resource usage**:
   ```
   heroku ps:utilization
   ```

3. **Monitor application metrics**:
   ```
   heroku addons:open newrelic
   ```

4. **View database metrics**:
   ```
   heroku addons:open postgresql
   ```

## License

MIT