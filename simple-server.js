import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 5000;

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// Simple route for the home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DeliverConnect - Simple Test</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        h1 {
          color: #4f46e5;
        }
        .card {
          margin-top: 20px;
          padding: 15px;
          background-color: #f0f9ff;
          border-radius: 6px;
          border-left: 4px solid #4f46e5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>DeliverConnect</h1>
        <p>This is a simple test page to verify the server is working correctly.</p>
        
        <div class="card">
          <h3>Server Status</h3>
          <p>The Express server is running successfully.</p>
          <p>Current time: ${new Date().toLocaleString()}</p>
        </div>

        <div class="card">
          <h3>Next Steps</h3>
          <p>If you can see this page, the server is working but there may be issues with the React application or its configuration.</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Simple test server running at http://0.0.0.0:${port}`);
});