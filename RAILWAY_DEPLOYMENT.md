# 🚨 Railway Deployment Fix

## 🔧 **Current Issue Fixed:**

The build was failing because:
- Railway was trying to deploy from `/apps/web` directory
- But `pnpm-lock.yaml` exists in the root directory
- The Dockerfile expected root-level access

## ✅ **Solution Applied:**

1. **Updated Railway Configuration**: Both services now deploy from root directory (`/`)
2. **Fixed Build Commands**: Using proper pnpm workspace commands
3. **Added .railwayignore**: Excludes unnecessary files from deployment

## 🚀 **Next Steps:**

### **1. Update Railway Service Configuration:**

In your Railway dashboard, for both services:

- **Web App Service**: Change Root Directory from `/apps/web` to `/`
- **Worker Service**: Change Root Directory from `/apps/python-worker` to `/`

### **2. Redeploy:**

```bash
# From the root directory
railway up
```

### **3. Verify Environment Variables:**

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

### **4. Expected Build Process:**

1. Railway will clone your entire repository
2. Run `pnpm install` to install all dependencies
3. Run `pnpm --filter web build` to build the web app
4. Deploy the built application

## 📁 **Key Files Updated:**

- `apps/web/railway.json` - Fixed build command
- `apps/python-worker/railway.json` - Fixed build command  
- `.railwayignore` - Added to exclude unnecessary files
- `railway-setup.md` - Updated documentation

## 🎯 **Why This Fixes the Issue:**

- **Root Directory Access**: Now Railway can access `pnpm-lock.yaml` and workspace files
- **Proper Build Commands**: Using pnpm workspace filters instead of directory navigation
- **Clean Deployment**: `.railwayignore` ensures only necessary files are included
