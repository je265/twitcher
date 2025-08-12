@echo off
echo 🚀 TWITCHER PRO - Complete System Startup
echo ========================================

echo 1. Starting infrastructure...
docker-compose -f docker-compose.infra.yml up -d

echo.
echo 2. Waiting for services to be ready...
powershell -Command "Start-Sleep -Seconds 5"

echo.
echo 3. Setting up database...
set DATABASE_URL=postgresql://twitch:twitch@localhost:5433/twitch
cd packages\prisma
call pnpm db:push >nul 2>&1
call pnpm generate >nul 2>&1
cd ..\..

echo.
echo 4. Starting web application with full environment...
start "TWITCHER WEB" cmd /k "set DATABASE_URL=postgresql://twitch:twitch@localhost:5433/twitch&& set REDIS_URL=redis://localhost:6380&& set S3_ENDPOINT=http://localhost:9010&& set S3_ACCESS_KEY=minio&& set S3_SECRET_KEY=minio123&& set S3_BUCKET_NAME=twitcher-videos&& set S3_REGION=us-east-1&& set NEXTAUTH_SECRET=twitcher-dev-secret&& set WORKER_TOKEN=twitcher-worker-secret-token&& cd apps\web&& pnpm dev"

echo.
echo 5. Waiting for web app to start...
powershell -Command "Start-Sleep -Seconds 10"

echo.
echo 6. Setting up MinIO storage...
echo    - Ensuring twitcher-videos bucket exists...
curl -s -X POST "http://localhost:3000/api/storage/setup" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ MinIO storage ready
) else (
    echo    ⚠️ MinIO setup issue - will auto-create on first upload
)

echo.
echo 7. Starting Python worker...
start "TWITCHER WORKER" cmd /k "set API_BASE=http://localhost:3000&& set WORKER_TOKEN=twitcher-worker-secret-token&& set WORKER_ID=local-worker-1&& cd apps\python-worker&& python worker.py"

echo.
echo 🎉 TWITCHER PRO System Started!
echo ===============================
echo.
echo 📱 Web Dashboard: http://localhost:3000
echo 🗃️ Database: postgresql://twitch:twitch@localhost:5433/twitch
echo 💾 MinIO Console: http://localhost:9011 (minio/minio123)
echo.
echo Both web app and worker should be running in separate windows.
echo Check those windows for any error messages.
echo.
pause
