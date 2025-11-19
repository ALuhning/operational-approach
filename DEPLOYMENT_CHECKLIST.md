# Railway Deployment Checklist

## Pre-Deployment

- [ ] All code committed and pushed to GitHub
- [ ] `.env.example` file is up to date
- [ ] Database migrations are working
- [ ] Client builds successfully (`cd client && npm run build`)
- [ ] Server starts successfully (`cd server && npm start`)
- [ ] All environment variables documented in DEPLOYMENT.md

## GitHub Setup

- [ ] Repository created on GitHub
- [ ] Local repo connected to GitHub remote
- [ ] Code pushed to main branch
- [ ] README.md updated with project details
- [ ] .gitignore properly configured

## Railway Configuration

### 1. Create New Project
- [ ] Logged into Railway (https://railway.app)
- [ ] Created new project from GitHub repo
- [ ] Selected correct repository and branch

### 2. Add PostgreSQL Database
- [ ] Added PostgreSQL database to project
- [ ] Verified `DATABASE_URL` environment variable is set

### 3. Environment Variables
Set these in Railway dashboard:

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` (generate secure random string)
- [ ] `CLIENT_URL` (Railway app URL)
- [ ] `PORT=5000` (Railway sets this automatically)
- [ ] `DATABASE_URL` (auto-set by PostgreSQL service)

### 4. Build Configuration
- [ ] `railway.json` present in root directory
- [ ] Build command configured: `npm run postinstall && npm run deploy:build`
- [ ] Start command configured: `npm start`

### 5. Domain Setup
- [ ] Custom domain added (optional)
- [ ] SSL certificate verified
- [ ] CLIENT_URL updated to match domain

## Post-Deployment Testing

- [ ] App accessible at Railway URL
- [ ] Health check endpoint works: `/api/health`
- [ ] User registration works
- [ ] User login works
- [ ] File upload works
- [ ] CSV import works
- [ ] Data visualization renders correctly
- [ ] All API endpoints responding
- [ ] Database persisting data correctly

## Monitoring Setup

- [ ] Railway logs reviewed
- [ ] No error messages in deployment logs
- [ ] Database connection successful
- [ ] Build completed without errors

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] DATABASE_URL is secure
- [ ] No sensitive data in repository
- [ ] .env files in .gitignore
- [ ] CORS configured correctly
- [ ] HTTPS enforced

## Performance

- [ ] Client bundle size optimized
- [ ] Images optimized
- [ ] API response times acceptable
- [ ] Database queries optimized

## Documentation

- [ ] DEPLOYMENT.md reviewed
- [ ] README.md updated
- [ ] API documentation current
- [ ] User manual updated

## Rollback Plan

- [ ] Previous deployment snapshot available
- [ ] Database backup strategy in place
- [ ] Rollback procedure documented

## Common Issues & Solutions

### Build Fails
- Check build logs in Railway dashboard
- Verify all dependencies in package.json
- Ensure Node.js version compatibility

### Database Connection Errors
- Verify DATABASE_URL is set correctly
- Check PostgreSQL service is running
- Review database connection logs

### CORS Errors
- Update CLIENT_URL environment variable
- Verify CORS configuration in server/index.js
- Check Railway app URL matches CLIENT_URL

### Static Files Not Loading
- Ensure build directory exists: client/build
- Verify static file serving in server/index.js
- Check production routes configuration

## Support Resources

- Railway Documentation: https://docs.railway.app
- Project GitHub Issues: [Your repo URL]
- Railway Discord: https://discord.gg/railway

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Railway URL:** _____________
**Status:** [ ] Success [ ] Failed [ ] In Progress
