# Database Seeding Guide

## Overview

This project includes seed data that populates the database with initial users, datasets, and OAIs.

## Seed Data Contents

- **1 User**: Pre-configured admin/demo user
- **3 Datasets**: Sample operational approach datasets
- **38 OAIs**: Complete operational approach items with dates, domains, and decision points

## Local Development

The seed data is automatically available in the SQLite database during development.

## Production Deployment (Railway)

### One-Time Seeding After Deployment

After deploying to Railway:

1. **Connect to your Railway project**:
   ```bash
   railway login
   railway link
   ```

2. **Run the seed command**:
   ```bash
   railway run npm run seed --service server
   ```

   Or manually in the Railway dashboard:
   - Go to your project
   - Click on the server service
   - Go to "Settings" → "Deploy"
   - Add a one-time command: `npm run seed`

### Alternative: Seed via Railway CLI

```bash
# Export local data
cd server
node export-data.js

# This creates seed-data.json which is already committed
# Deploy and run seed
git push
railway run npm run seed
```

## Seed Data File

The seed data is stored in:
```
server/seed-data.json
```

This file contains:
- User credentials (passwords are hashed during seeding)
- Dataset metadata
- All OAI records with complete data

## Updating Seed Data

To update the seed data with your current local database:

```bash
cd server
node export-data.js
git add seed-data.json
git commit -m "Update seed data"
git push
```

## Seed Script Details

**Location**: `server/seed.js`

**Features**:
- Checks if database already has data (won't duplicate)
- Hashes user passwords before seeding
- Creates all necessary records in order (Users → Datasets → OAIs)
- Maintains referential integrity

## Database Schema

The seed script works with these models:
- **User**: Authentication and user profiles
- **Dataset**: Operational approach datasets
- **OAI**: Operational Approach Items (the main data)

## Troubleshooting

### "Database already has data"
This is expected - the seed script won't overwrite existing data. To force re-seed:
1. Delete all records via the app
2. Or reset the database and run seed again

### Connection Errors
Ensure `DATABASE_URL` environment variable is set in Railway.

### Missing Dependencies
Make sure `bcryptjs` is installed:
```bash
npm install bcryptjs
```

## Security Note

⚠️ **Important**: The seed data includes a demo user with a known password. In production:
1. Change the demo user password after first login
2. Or delete the demo user and create proper admin accounts
3. Never commit real user passwords to git

## Default Demo User

After seeding, you can login with:
- Check `seed-data.json` for the email
- Password is hashed in the seed file (original password is not stored)
- **Recommended**: Create a new admin user and delete the demo account

---

For more deployment information, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [RAILWAY_SETUP.md](./RAILWAY_SETUP.md)
