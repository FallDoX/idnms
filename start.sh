#!/bin/bash

echo "============================================"
echo "Trip Log Analyzer - Local Server"
echo "============================================"
echo ""
echo "Starting server on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

npx serve dist -l 3000
