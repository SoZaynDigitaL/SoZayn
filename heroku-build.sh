#!/bin/bash

# Log Node.js version
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Check if dist directory exists
if [ -d "dist" ]; then
  echo "Build successful! dist directory created."
  ls -la dist
else
  echo "Build failed! dist directory not found."
  exit 1
fi

# Copy standalone package.json to root
echo "Setting up standalone server..."
cp package-standalone.json package.json

# Install standalone server dependencies
echo "Installing standalone server dependencies..."
npm install --production

# Log completion
echo "Build process completed successfully!"