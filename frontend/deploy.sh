#!/bin/bash

# Ensure we are in the frontend directory or handle paths correctly
# This script assumes it's run from the frontend directory (via npm run copy)

echo "Cleaning old assets..."
rm -rf ../backend/static/assets/*

echo "Copying new assets..."
cp -r dist/assets/* ../backend/static/assets/

# Get the filenames of the generated assets
JS_FILE=$(ls dist/assets/*.js | head -n 1 | xargs basename)
CSS_FILE=$(ls dist/assets/*.css | head -n 1 | xargs basename)

echo "Found JS: $JS_FILE"
echo "Found CSS: $CSS_FILE"

# Update index.stpl with the new filenames
# We use sed to replace the src and href attributes
sed -i "s|src=\"\/assets\/.*\.js\"|src=\"\/assets\/$JS_FILE\"|" ../backend/templates/index.stpl
sed -i "s|href=\"\/assets\/.*\.css\"|href=\"\/assets\/$CSS_FILE\"|" ../backend/templates/index.stpl

echo "Template updated successfully."
