# Operational Approach Visualization Tool

An interactive web-based application for visualizing and refining operational approaches in joint military planning. This tool provides Gantt-style visualization of Operations, Activities, and Investments (OAIs) across all domains (Land, Air, Sea, Cyber, Space) aligned to Lines of Effort (LOEs) and Intermediate Military Objectives (IMOs).

## Features

### Core Capabilities
- **Multi-Domain Visualization**: View operations across Land, Air, Sea, Cyber, and Space domains
- **Gantt Timeline**: Interactive timeline showing OAIs evolving over time and space
- **Hierarchical Structure**: Objectives → LOEs → IMOs → Parent OAIs → Sub OAIs
- **Decision Points**: 
  - Decisive Points marked with ▲ DP# (yellow, numbered)
  - Decision Points marked with ★ DC# (yellow, numbered)
- **Interactive Elements**:
  - Expand/collapse sections for detail management
  - Drag-and-drop timeline adjustments
  - Pop-up detail boxes on selection
  - Branch and contingency plan identification

### View Modes
- **Commander View**: High-level summary focusing on IMOs and decisive/decision points
- **Planner View**: Full detail with all OAIs and domain-specific activities
- **Briefing Mode**: Tailorable visualization for different audiences

### Multi-User Support
- User authentication and session management
- Personal datasets per user
- CSV upload and management
- Export capabilities for refined plans

## Technology Stack

### Frontend
- **React 18** - UI framework
- **Material-UI (MUI)** - Component library for consistent design
- **React-DnD** - Drag and drop functionality
- **D3.js / Vis.js** - Gantt chart visualization
- **Axios** - API communication
- **React Router** - Navigation

### Backend
- **Node.js / Express** - Server framework
- **PostgreSQL** - Database (with SQLite option for development)
- **Sequelize** - ORM
- **Passport.js** - Authentication
- **Multer** - File upload handling
- **JWT** - Token-based authentication

## Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (or use SQLite for development)
- Git

### Quick Start

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd operational-approach
npm run install-all
```

2. **Set up environment variables**

Create `server/.env`:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/opapproach
JWT_SECRET=your-secret-key-change-in-production
SESSION_SECRET=your-session-secret
CLIENT_URL=http://localhost:3000
```

3. **Initialize database**
```bash
cd server
npm run db:migrate
npm run db:seed  # Optional: load sample data
```

4. **Start development servers**
```bash
cd ..
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

### For Military Planners

1. **Login/Register**: Create your account or log in
2. **Upload Data**: Import your operational approach CSV file
3. **Visualize**: View your operational approach in Gantt format
4. **Refine**: 
   - Expand/collapse sections to focus on specific areas
   - Drag timeline bars to adjust timing
   - Click on OAIs to view/edit details
   - Identify decisive and decision points
5. **Export**: Download refined approach for team collaboration

### CSV Format

Your CSV should include these columns:
- Objective
- LOE (Line of Effort)
- IMO (Intermediate Military Objective)
- Parent_OAI_ID
- Sub_OAI_ID
- OAI_Description
- Land, Sea, Air, Cyber, Space (domain-specific activities)
- Decisive_Point (boolean or description)
- Decision_Point (boolean or description)

See `/data/approach_data.csv` for example format.

## Architecture

```
operational-approach/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── services/      # API service layer
│   │   ├── contexts/      # React contexts (auth, theme)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── App.js
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   ├── uploads/          # File upload directory
│   └── index.js
├── data/                 # Sample data
└── package.json
```

## Deployment

### Docker Deployment

```bash
docker-compose up -d
```

### Production Build

```bash
npm run build
cd server
NODE_ENV=production npm start
```

## API Documentation

Key endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/datasets` - Get user's datasets
- `POST /api/datasets/upload` - Upload CSV
- `GET /api/datasets/:id` - Get dataset details
- `PUT /api/oais/:id` - Update OAI
- `GET /api/export/:datasetId` - Export refined approach

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository.
