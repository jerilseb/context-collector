#!/bin/bash

# Context Collector Extension Build Script
# Packages the extension into a versioned zip file

set -e

# Extract version from manifest.json
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')

if [ -z "$VERSION" ]; then
    echo "Error: Could not extract version from manifest.json"
    exit 1
fi

# Define output filename
OUTPUT_FILE="context_collector_${VERSION}.zip"

echo "Building Context Collector v${VERSION}..."

# Remove existing zip if it exists
if [ -f "$OUTPUT_FILE" ]; then
    rm "$OUTPUT_FILE"
    echo "Removed existing $OUTPUT_FILE"
fi

# Create zip file including only extension files
zip "$OUTPUT_FILE" \
    *.js \
    *.css \
    *.html \
    icons/*.png \
    manifest.json 

echo "Extension packaged successfully: $OUTPUT_FILE"
echo "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"