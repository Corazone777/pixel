#!/bin/bash

# Start the server in the background
python3 -m http.server 8000 > /dev/null 2>&1 &
SERVER_PID=$!

# Trap to ensure the server is killed on exit
trap "kill $SERVER_PID" EXIT

# Wait for the server to start
sleep 2

URL="http://localhost:8000/index.html"
RESPONSE=$(curl -s $URL)

if [ -z "$RESPONSE" ]; then
  echo "FAIL: Could not fetch index.html"
  exit 1
fi

echo "Checking requirements..."

# Requirement: Three.js
if echo "$RESPONSE" | grep -q "three.module.js"; then
  echo "PASS: Three.js found"
else
  echo "FAIL: Three.js not found"
  exit 1
fi

# Requirement: Title
if echo "$RESPONSE" | grep -q "NEON HORIZON"; then
  echo "PASS: Title found"
else
  echo "FAIL: Title not found"
  exit 1
fi

# Requirement: Canvas container
if echo "$RESPONSE" | grep -q "canvas-container"; then
  echo "PASS: Canvas container found"
else
  echo "FAIL: Canvas container not found"
  exit 1
fi

# Requirement: Color palette (checking for CSS variables)
if echo "$RESPONSE" | grep -q "#ff2975" && echo "$RESPONSE" | grep -q "#00f0ff"; then
  echo "PASS: Color palette found"
else
  echo "FAIL: Color palette not found"
  exit 1
fi

echo "ALL TESTS PASSED!"
exit 0