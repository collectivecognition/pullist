#!/usr/bin/env bash

# Start HTTP server
node scripts/server site 3000 &

# Recompile CSS when SASS file is saved
node_modules/.bin/node-sass --watch site/css/style.scss site/css/style.scss site/css/style.css

# Kill any outstanding background processes when script exits (I'm lookin' at you, prefixr)
# trap "pkill -f node_modules/.bin/" SIGINT SIGTERM EXIT

wait