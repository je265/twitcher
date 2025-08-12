# 🚨 Railway Deployment Fix

## 🔧 **Current Issue Fixed:**

The build was failing because:
- Railway was trying to use Docker instead of NIXPACKS
- Docker build context was incorrect for the monorepo structure
- Missing files in the build context
- **NEW**: Prisma client not generated during build

## ✅ **Solution Applied:**

1. **Removed .dockerignore** - This was interfering with Railway's build system
2. **Updated Railway Configuration** - Root level now handles the build
3. **Simplified App Configurations** - Individual apps no longer need complex build commands
4. **Added Prisma Generation** - `pnpm --filter prisma generate` during build

## 🚀 **Next Steps:**

### **1. Update Railway Service Configuration:**

In your Railway dashboard, for both services:

- **Web App Service**: Change Root Directory from `/apps/web` to `/` (root)
- **Worker Service**: Change Root Directory from `/apps/python-worker` to `/` (root)

### **2. Verify Railway Configuration:**

Your root `railway.json` should now look like this:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm --filter prisma generate && pnpm --filter web build"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "startCommand": "cd apps/web && pnpm start"
  }
}
```

### **3. Set Required Environment Variables:**

Make sure these are set in Railway dashboard for the web app:

```env
DATABASE_URL=postgresql://postgres:WsuWPjzbYzmCAOBAIZcOSMCepRzoUhhK@shortline.proxy.rlwy.net:54328/railway
REDIS_URL=redis://default:pvlvdPodENgUplUIIAMtTwvupDjNmBOe@interchange.proxy.rlwy.net:46754
S3_ENDPOINT=http://bucket.railway.internal:9000
S3_ACCESS_KEY=13c8aVFDLerUXdzj5QkziAZG4YR1uCJw
S3_SECRET_KEY=cc2pcnvG5ENuJpzYL8SUGjQFYNIBK5B49WI1YPoERQEKM1i0
S3_BUCKET_NAME=twitcher-videos
S3_REGION=us-east-1
NEXTAUTH_SECRET=twitcher-super-secret-key-change-in-production
NEXTAUTH_URL=https://your-web-app-domain.railway.app
WORKER_TOKEN=twitcher-worker-secret-token
STREAMKEY_ENC_KEY=dHdpdGNoZXItZGVmYXVsdC1rZXktMzItYnl0ZXMtbG9uZw==
NODE_ENV=production
```

### **4. Commit and Push Changes:**

```bash
git add .
git commit -m "Fix Railway configuration: add Prisma generation and use NIXPACKS"
git push
```

### **5. Redeploy:**

```bash
# From the root directory
railway up
```

## 🔑 **Key Changes Made:**

1. **Root Directory**: Both services now deploy from `/` (root) instead of individual app directories
2. **Build System**: Using NIXPACKS instead of Docker for better monorepo support
3. **Build Command**: `pnpm install && pnpm --filter prisma generate && pnpm --filter web build`
4. **Start Command**: `cd apps/web && pnpm start` navigates to the correct app directory
5. **Prisma Generation**: Client is generated during build process

## 📁 **Files Updated:**

- `railway.json` - Root configuration with build and start commands
- `apps/web/railway.json` - Simplified web app configuration
- `apps/python-worker/railway.json` - Simplified worker configuration
- `.railwayignore` - Excludes Docker files and unnecessary files
- **Removed**: `.dockerignore` (was interfering with Railway build)

## 🎯 **Why This Fixes the Issue:**

- **No More Docker**: Railway now uses NIXPACKS builder which handles monorepos better
- **Correct Build Context**: Root directory gives access to all workspace files
- **Proper Commands**: Build runs from root, start runs from app directory
- **Prisma Client**: Generated during build process, not at runtime
- **Clean Environment**: No Docker files to confuse Railway's build system

## 🚨 **Important Notes:**

- **Root Directory**: Must be `/` (root) for both services
- **Build Command**: Runs from root directory with pnpm workspace filters
- **Prisma Generation**: Must happen before web app build
- **Start Command**: Navigates to the correct app directory before starting
- **Environment Variables**: Still need to be set in Railway dashboard

## 🔍 **Expected Build Process:**

1. Railway clones your entire repository
2. Runs `pnpm install` to install all dependencies
3. Runs `pnpm --filter prisma generate` to create Prisma client
4. Runs `pnpm --filter web build` to build the Next.js app
5. Deploys the built application with generated Prisma client
