#!/bin/bash

# Operational Approach Visualization - Setup Script

echo "=================================="
echo "Operational Approach Setup"
echo "=================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "Node.js version: $(node --version)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    exit 1
fi

echo "npm version: $(npm --version)"

# Install root dependencies
echo ""
echo "Installing root dependencies..."
npm install

# Install server dependencies
echo ""
echo "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo ""
echo "Installing client dependencies..."
cd client
npm install
cd ..

# Setup environment file
echo ""
echo "Setting up environment file..."
if [ ! -f server/.env ]; then
    cp server/.env.example server/.env
    echo "Created server/.env from example. Please update with your settings."
else
    echo "server/.env already exists."
fi

# Create uploads directory
mkdir -p server/uploads

echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "To start the application:"
echo "  1. Update server/.env with your configuration"
echo "  2. Run: npm run dev"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
