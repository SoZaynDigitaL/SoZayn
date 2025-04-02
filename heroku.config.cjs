// Heroku-specific runtime configuration
module.exports = {
  // Define runtime settings for Node.js
  // This helps with ESM compatibility issues
  module_resolution: {
    fallbacks: {
      // Add any module resolution fallbacks here
      // This is particularly helpful for Node.js built-in modules
      // that might be missing in the browser context
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      fs: false, // Not needed in the browser
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
    }
  },

  // Any other Heroku-specific settings can go here
  environment: process.env.NODE_ENV || 'production',
  port: process.env.PORT || 5000,
};