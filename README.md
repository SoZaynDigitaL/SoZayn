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

This application is optimized for deployment on Heroku. Follow these steps to deploy:

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

8. Configure custom maintenance pages
   ```
   heroku config:set MAINTENANCE_PAGE_URL=https://your-static-site.com/maintenance.html
   ```

## Troubleshooting Heroku Deployment

If you encounter the `ERR_MODULE_NOT_FOUND` error, try the following:

1. Check that the `Procfile` is using the correct path to the server entry point
2. Ensure that the application's Node.js version specified in `.node-version` is compatible with Heroku
3. Verify that all module imports use the correct file extensions (`.js` for ESM imports)
4. Try restarting the Heroku dyno after deployment:
   ```
   heroku dyno:restart
   ```

5. Check that the PostgreSQL database is properly provisioned and connected:
   ```
   heroku pg:info
   ```

6. Check the application logs for specific errors:
   ```
   heroku logs --tail
   ```

7. For database connection issues:
   ```
   heroku pg:credentials:url
   ```
   Then use these credentials to test the connection using a PostgreSQL client.

## License

MIT