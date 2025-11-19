# GitHub and Railway Deployment - Quick Reference

## Files Created/Modified for Deployment

### New Files
1. **railway.json** - Railway platform configuration
2. **Procfile** - Process definition for deployment
3. **.env.example** - Environment variable template
4. **DEPLOYMENT.md** - Comprehensive deployment guide
5. **DEPLOYMENT_CHECKLIST.md** - Step-by-step checklist
6. **deploy-setup.sh** - Automated setup script
7. **.github/workflows/ci-cd.yml** - GitHub Actions CI/CD pipeline
8. **server/uploads/.gitkeep** - Preserve uploads directory in git

### Modified Files
1. **package.json** - Added deployment scripts
2. **server/package.json** - Moved sqlite3 to dependencies
3. **server/index.js** - Added production static file serving
4. **README.md** - Already comprehensive

## Quick Start Commands

### 1. Prepare for Deployment
```bash
# Run setup script
./deploy-setup.sh

# Or manually:
npm run install-all
cd client && npm run build && cd ..
```

### 2. Initialize Git (if needed)
```bash
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

### 3. Push to GitHub
```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/operational-approach.git
git branch -M main
git push -u origin main
```

### 4. Deploy on Railway

**Option A: Railway Dashboard**
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects configuration from `railway.json`

**Option B: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### 5. Add PostgreSQL Database
1. In Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. DATABASE_URL automatically added to environment

### 6. Set Environment Variables
In Railway dashboard → Variables tab:
```
NODE_ENV=production
JWT_SECRET=<generate-secure-random-string>
CLIENT_URL=https://your-app.up.railway.app
```

### 7. Generate JWT Secret
```bash
# Use this command to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Environment Variables Reference

### Required for Production
- `NODE_ENV=production`
- `DATABASE_URL` (auto-set by Railway PostgreSQL)
- `JWT_SECRET` (must be secure random string)
- `CLIENT_URL` (your Railway app URL)
- `PORT` (auto-set by Railway)

### Optional
- `SESSION_SECRET` (if using sessions)

## Verify Deployment

### Check Health
```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Test Endpoints
- Health: `GET /api/health`
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Datasets: `GET /api/datasets` (requires auth)

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│            Railway Platform                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌────────────────┐  │
│  │              │      │                │  │
│  │   Node.js    │─────▶│  PostgreSQL   │  │
│  │   Express    │      │   Database    │  │
│  │   Server     │      │                │  │
│  │              │      └────────────────┘  │
│  └──────────────┘                          │
│         │                                   │
│         │ Serves                            │
│         ▼                                   │
│  ┌──────────────┐                          │
│  │              │                          │
│  │  React App   │                          │
│  │  (Built)     │                          │
│  │              │                          │
│  └──────────────┘                          │
│                                             │
└─────────────────────────────────────────────┘
              │
              ▼
        HTTPS Traffic
        (your-app.up.railway.app)
```

## Build Process

1. **Install Dependencies**
   ```
   npm install (root)
   npm install (server)
   npm install (client)
   ```

2. **Build Client**
   ```
   cd client
   npm run build
   → Creates client/build/
   ```

3. **Start Server**
   ```
   cd server
   npm start
   → Serves API + Static Files
   ```

## Troubleshooting

### Build Fails
- Check Railway build logs
- Verify package.json scripts
- Ensure all dependencies listed

### Database Connection Fails
- Verify PostgreSQL service running
- Check DATABASE_URL format
- Review connection logs

### App Won't Start
- Check server logs in Railway
- Verify PORT environment variable
- Ensure start command is correct

### Static Files 404
- Verify client built successfully
- Check client/build/ exists
- Review server static file configuration

## Monitoring

Railway provides:
- **Real-time logs**: View in dashboard
- **Metrics**: CPU, memory, network usage
- **Deployments**: History and rollback
- **Environment**: Variable management

## Costs

Railway Pricing:
- **Free Tier**: $5 credit/month
- **Pro Plan**: $20/month
- **Estimated Cost**: ~$5-10/month for small apps

PostgreSQL:
- Included in usage-based pricing
- ~$1-3/month for small databases

## Next Steps After Deployment

1. ✅ Test all functionality
2. ✅ Set up custom domain (optional)
3. ✅ Configure SSL (automatic on Railway)
4. ✅ Set up monitoring/alerts
5. ✅ Configure backup strategy
6. ✅ Update CLIENT_URL in environment
7. ✅ Test user registration and login
8. ✅ Verify CSV uploads work
9. ✅ Check visualization renders correctly
10. ✅ Document production URL for team

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **GitHub Issues**: [Your repo URL]
- **Deployment Guide**: See DEPLOYMENT.md
- **Checklist**: See DEPLOYMENT_CHECKLIST.md

---

**Quick Deploy Command**
```bash
./deploy-setup.sh && \
git add . && \
git commit -m "Ready for Railway deployment" && \
git push origin main
```

Then deploy via Railway dashboard.
