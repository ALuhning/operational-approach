# Operational Approach Visualization Tool - Deployment Guide

## Railway Deployment

### Prerequisites
- GitHub account
- Railway account (https://railway.app)
- PostgreSQL database (Railway provides this)

### Environment Variables

Set these in Railway dashboard:

```env
# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-here

# Client URL (your Railway app URL)
CLIENT_URL=https://your-app-name.up.railway.app

# Port (Railway sets this automatically)
PORT=5000
```

### Deployment Steps

#### 1. Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for Railway deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/operational-approach.git

# Push to GitHub
git push -u origin main
```

#### 2. Deploy on Railway

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `operational-approach` repository
5. Railway will automatically detect the configuration

#### 3. Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically add `DATABASE_URL` to your environment variables

#### 4. Configure Environment Variables

1. Click on your service
2. Go to "Variables" tab
3. Add the required environment variables listed above
4. Railway will automatically redeploy

#### 5. Verify Deployment

1. Once deployed, click "View Logs" to monitor the deployment
2. Visit your app URL (found in the "Settings" tab under "Domains")
3. The API health endpoint should be accessible at: `https://your-app.up.railway.app/api/health`

### Database Migration

Railway will automatically run the database migrations when the app starts. The Sequelize models will create the necessary tables.

### Client Build

The client React app will be built during deployment and served by the Express server from the `client/build` directory.

### Troubleshooting

**Database Connection Issues:**
- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL service is running
- Review logs for connection errors

**Build Failures:**
- Check build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

**CORS Errors:**
- Update `CLIENT_URL` environment variable
- Check CORS configuration in `server/index.js`

### Monitoring

Railway provides:
- Real-time logs
- Metrics dashboard
- Automatic deployments on git push
- Custom domains
- Environment variable management

### Cost

Railway offers:
- Free tier: $5 credit/month
- Pay-as-you-go pricing
- Estimated cost: ~$5-10/month for small apps

## Alternative: Docker Deployment

You can also deploy using Docker with the included `docker-compose.yml`:

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Local Development

```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev

# Access the app
# Client: http://localhost:3000
# Server: http://localhost:5000
```

## Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure PostgreSQL database
- [ ] Set NODE_ENV=production
- [ ] Update CLIENT_URL to production domain
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy for database
- [ ] Test all API endpoints
- [ ] Verify file uploads work
- [ ] Check authentication flows

## Support

For issues or questions:
- Check Railway documentation: https://docs.railway.app
- Review application logs in Railway dashboard
- Check GitHub repository issues
