#!/bin/bash

# Heroku build script
# This script helps ensure proper module resolution in the Heroku environment

echo "Starting Heroku build process..."

# Check if we're in a production environment
if [ "$NODE_ENV" != "production" ]; then
  echo "Not in production environment, skipping build steps"
  exit 0
fi

# Build the frontend application
echo "Building client application..."
npm run build

# Check if build was successful
if [ ! -d "./dist" ]; then
  echo "Error: Build directory not found!"
  exit 1
fi

echo "Build directory exists, listing contents:"
find ./dist -type f | sort

# Create any necessary server-side files for production
echo "Preparing server for production..."

# Create production server directory if it doesn't exist
if [ ! -d "./server-prod" ]; then
  mkdir -p ./server-prod
  echo "Created server-prod directory"
fi

# Print environment information for debugging
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Process environment: $NODE_ENV"

echo "Heroku build completed successfully!"
exit 0