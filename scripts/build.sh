#!/usr/bin/env bash
MODE=$1
# Clear out old build and recreate directory structure
rm -rf build
mkdir build
mkdir build/js
mkdir build/css
# Concatenate all js files into main.js. Order matters here!
cat js/lib/json2.js js/lib/uri.js js/lib/jquery.js js/lib/jquery-*.js js/lib/d3.js js/lib/moment.min.js js/lib/angular.js js/lib/angular-*.js js/lib/modernizr.js "js/config.$MODE.js" js/app/*.js js/app/controllers/*.js > build/js/main.js
# Run js through ngmin first, which is an angular-specific "pre-minifier"
node_modules/.bin/ngmin build/js/main.js build/js/main.js
# Minify all js
node_modules/.bin/minify build/js/main.js build/js/main.js
# Copy static files to build directory
cp -R fonts images templates *.html favicon.ico demo build
# Compile css from SASS code
node_modules/.bin/node-sass --output-style compressed --include-path css css/style.scss build/css/style.css