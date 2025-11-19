# Quick Start Guide

## Development Setup (Fastest)

### Prerequisites
- Node.js 18+ and npm
- Git

### Steps

1. **Clone and setup**
```bash
cd /home/vitalpointai/projects/operational-approach
chmod +x setup.sh
./setup.sh
```

2. **Configure environment**
```bash
cd server
cp .env.example .env
# Edit .env if needed (defaults work for development)
cd ..
```

3. **Start development servers**
```bash
npm run dev
```

This starts both frontend (http://localhost:3000) and backend (http://localhost:5000) concurrently.

4. **Create your first account**
- Navigate to http://localhost:3000
- Click "Register"
- Fill in your information
- Upload your CSV file from /data/approach_data.csv

## Docker Setup (Production-like)

### Prerequisites
- Docker and Docker Compose

### Steps

1. **Set environment variables**
```bash
export JWT_SECRET=$(openssl rand -base64 32)
export SESSION_SECRET=$(openssl rand -base64 32)
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Access application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Manual Installation

### Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

### Frontend (in separate terminal)

```bash
cd client
npm install
npm start
```

## Testing the Application

1. **Register a user account**
2. **Upload the sample CSV**: `/data/approach_data.csv`
3. **View the visualization**
4. **Try different view modes**: Commander vs Planner
5. **Use filters** to show/hide domains
6. **Click on timeline items** to see details
7. **Drag timeline bars** to adjust timing

## Common Commands

```bash
# Install all dependencies
npm run install-all

# Start development mode
npm run dev

# Start only client
npm run client

# Start only server
npm run server

# Build for production
npm run build

# Start production build
npm start
```

## Troubleshooting

### Port already in use
- Frontend (3000): Change in client/package.json proxy setting
- Backend (5000): Change PORT in server/.env

### Database connection error
- Using SQLite by default (no setup needed)
- For PostgreSQL, ensure DATABASE_URL is correct in .env

### CSV upload fails
- Check file format matches example
- Ensure file is under 10MB
- Verify all required columns are present

## Next Steps

- Read USER_MANUAL.md for detailed usage instructions
- Review README.md for architecture details
- Customize domain colors in client/src/utils/helpers.js
- Add more sample data or use your own operational approaches
