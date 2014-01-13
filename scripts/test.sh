#!/usr/bin/env bash
# Build the app
echo "Building application..."
scripts/build.sh test &>/dev/null
# Serve the application in the background
echo "Starting application server..."
node scripts/server build 3001 &>/dev/null &
# Start selenium
echo "Starting selenium..."
node_modules/.bin/start-selenium &>/dev/null &
# Wait for selenium to start
echo "Waiting for selenium to start..."
while ! nc -vz localhost 4444 &>/dev/null; do sleep 1; done
# Run tests with protractor
echo "Running tests..."
node_modules/.bin/protractor tests/e2e/protractor.conf.js
# Kill background processes
echo "Killing background processes..."
# pkill -P $$ &>/dev/null
# pkill -P 1 &>/dev/null # Kills orphan selenium process