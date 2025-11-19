#!/bin/bash

# Railway Deployment Setup Script

echo "Setting up project for Railway deployment..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Install dependencies
echo "Installing dependencies..."
npm run install-all

# Build client
echo "Building client..."
cd client && npm run build && cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration"
echo "2. Commit your changes: git add . && git commit -m 'Initial commit'"
echo "3. Create GitHub repository and push:"
echo "   git remote add origin https://github.com/yourusername/operational-approach.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo "4. Deploy on Railway:"
echo "   - Go to https://railway.app"
echo "   - Create new project from GitHub repo"
echo "   - Add PostgreSQL database"
echo "   - Set environment variables (see DEPLOYMENT.md)"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
