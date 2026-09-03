#!/bin/bash

# Start ngrok tunnel for Medusa development server
echo "Starting ngrok tunnel for Medusa server on port 9000..."
echo "🚀 Medusa server should be running on http://localhost:9000"
echo "📱 Admin panel will be available at: https://fine-currently-gazelle.ngrok-free.app/app"
echo ""

# Use your static ngrok URL with proper host header
echo "Using static ngrok URL: fine-currently-gazelle.ngrok-free.app"
ngrok http --url=fine-currently-gazelle.ngrok-free.app --host-header=localhost:9000 9000