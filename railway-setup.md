# 🚂 Railway Setup for Twitcher (Matching Local Environment)

## 📋 **Your Local Environment Variables (from rebuild script):**

### **Web App Environment Variables:**
```env
DATABASE_URL=postgresql://twitch:twitch@db:5432/twitch
REDIS_URL=redis://redis:6379
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
S3_BUCKET_NAME=twitcher-videos
S3_REGION=us-east-1
NEXTAUTH_SECRET=twitcher-super-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
WORKER_TOKEN=twitcher-worker-secret-token
STREAMKEY_ENC_KEY=dHdpdGNoZXItZGVmYXVsdC1rZXktMzItYnl0ZXMtbG9uZw==
```

### **Python Worker Environment Variables:**
```env
API_BASE=http://web:3000
WORKER_TOKEN=twitcher-worker-secret-token
WORKER_ID=docker-worker-1
```

## 🚀 **Railway Setup Steps:**

### **1. Create Railway Project (Already Done ✅)**
```bash
railway init
# Project: twitcher
# Workspace: je265's Projects
```

### **2. Add PostgreSQL Database Service**
- Go to Railway Dashboard → "New Service" → "Database" → "PostgreSQL"
- Service Name: `twitcher-db`
- Copy the connection string for `DATABASE_URL`

### **3. Add Redis Service**
- Go to Railway Dashboard → "New Service" → "Database" → "Redis"
- Service Name: `twitcher-redis`
- Copy the connection string for `REDIS_URL`

### **4. Add S3-Compatible Storage**
- Go to Railway Dashboard → "New Service" → "Storage" → "S3"
- Service Name: `twitcher-storage`
- Or use external S3 (AWS, Cloudflare R2, etc.)

### **5. Add Web App Service**
- Go to Railway Dashboard → "New Service" → "GitHub Repo"
- Repository: `je265/twitcher`
- **Root Directory: `/` (root of repository)**
- Service Name: `twitcher-web`

#### **Web App Environment Variables (Railway Dashboard):**
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

### **6. Add Python Worker Service**
- Go to Railway Dashboard → "New Service" → "GitHub Repo"
- Repository: `je265/twitcher`
- **Root Directory: `/` (root of repository)**
- Service Name: `twitcher-worker`

#### **Worker Environment Variables (Railway Dashboard):**
```env
DATABASE_URL=postgresql://postgres:WsuWPjzbYzmCAOBAIZcOSMCepRzoUhhK@shortline.proxy.rlwy.net:54328/railway
REDIS_URL=redis://default:pvlvdPodENgUplUIIAMtTwvupDjNmBOe@interchange.proxy.rlwy.net:46754
API_BASE=https://your-web-app-domain.railway.app
WORKER_TOKEN=twitcher-worker-secret-token
WORKER_ID=railway-worker-1
NODE_ENV=production
```

## 🔧 **Railway Configuration Files:**

### **Root `railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **Web App `apps/web/railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm --filter web build"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "healthcheckInterval": 30
  }
}
```

### **Python Worker `apps/python-worker/railway.json`:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && cd apps/python-worker && pip install -r requirements.txt"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "startCommand": "cd apps/python-worker && python worker.py"
  }
}
```

## 🚀 **Deploy Commands:**

### **Deploy Web App:**
```bash
cd apps/web
railway up
```

### **Deploy Python Worker:**
```bash
cd apps/python-worker
railway up
```

## 📊 **Service Dependencies:**
```
Railway Project
├── PostgreSQL Database (twitcher-db)
├── Redis Cache (twitcher-redis)
├── S3 Storage (twitcher-storage)
├── Web App (twitcher-web) ← Depends on DB + Redis + Storage
└── Python Worker (twitcher-worker) ← Depends on Web App
```

## 🔑 **Key Differences from Local:**

1. **Database**: Railway managed PostgreSQL instead of local Docker
2. **Redis**: Railway managed Redis instead of local Docker
3. **Storage**: Railway S3 or external S3 instead of local MinIO
4. **Networking**: Services communicate via Railway's internal network
5. **Environment**: Production environment variables

## ✅ **What Railway Will Do (Matching Your Rebuild Script):**

1. **Install Dependencies**: `pnpm install` for web app, `pip install` for worker
2. **Generate Prisma Client**: `pnpm --filter prisma generate` (creates Prisma client)
3. **Build Web App**: `pnpm --filter web build` (Next.js production build)
4. **Start Services**: Automatic startup with health checks
5. **Database Setup**: Prisma will auto-connect and sync schema
6. **Storage Setup**: S3 bucket will be created automatically

## 🚨 **Important Notes:**

- **Environment Variables**: Must be set in Railway dashboard (not .env files)
- **Service URLs**: Use Railway's generated domains or add custom domains
- **Database**: Prisma will auto-generate client and sync schema
- **Storage**: S3 bucket creation happens automatically on first use
- **Worker Communication**: Worker will communicate with web app via Railway's internal network
- **Root Directory**: Both services should deploy from the root directory (`/`) to access `pnpm-lock.yaml` and workspace files
