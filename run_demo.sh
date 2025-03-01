#!/bin/bash

echo "Starting the OAuth Demo..."
echo "Frontend: Opening http://localhost:8000"
echo "Backend: Flask server should be running on http://localhost:5000"
echo ""
echo "IMPORTANT: Make sure your Flask server is running in another terminal with:"
echo "cd server && python app.py"
echo ""
echo "Press Ctrl+C to stop the server"

# Start a simple HTTP server in the current directory
python3 -m http.server 8000 