#!/bin/bash

echo "Starting custom Heroku build process..."

# Run the standard build
echo "Running NPM build..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

# This helps with ESM module resolution issues
echo "Creating package.json in dist directory for proper module resolution..."
cp package.json dist/
cp package-lock.json dist/

# Display output directory structure for debugging
echo "Listing contents of dist directory:"
find dist -type f | sort

echo "Custom build process complete."