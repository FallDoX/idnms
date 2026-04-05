#!/bin/bash

echo "============================================"
echo "Building Trip Log Analyzer"
echo "============================================"
echo ""

echo "[1/2] Building..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi
echo ""

echo "[2/2] Build completed!"
echo ""
echo "Open dist/index.html in your browser"
echo "Or run: ./start.sh"
echo ""
