@echo off
echo 🔄 TWITCHER PRO - Complete System Rebuild
echo ========================================

echo 1. Stopping all services...
echo    - Stopping Docker containers...
docker-compose -f docker-compose.infra.yml down -v >nul 2>&1

echo    - Killing any running processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

echo.
echo 2. Cleaning build artifacts...
if exist "apps\web\.next" (
    echo    - Removing Next.js build cache...
    rmdir /s /q "apps\web\.next"
)

if exist "node_modules\.cache" (
    echo    - Removing Node.js cache...
    rmdir /s /q "node_modules\.cache"
)

echo.
echo 3. Installing dependencies...
echo    - Installing root dependencies...
call pnpm install >nul 2>&1

echo    - Installing web app dependencies...
cd apps\web
call pnpm install >nul 2>&1
cd ..\..

echo    - Installing worker dependencies...
cd apps\python-worker
pip install -r requirements.txt >nul 2>&1
cd ..\..

echo.
echo 4. Starting fresh infrastructure...
docker-compose -f docker-compose.infra.yml up -d

echo.
echo 5. Waiting for services to be ready...
powershell -Command "Start-Sleep -Seconds 8"

echo.
echo 6. Setting up fresh database...
set DATABASE_URL=postgresql://twitch:twitch@localhost:5433/twitch
cd packages\prisma
echo    - Pushing database schema...
call pnpm db:push
echo    - Generating Prisma client...
call pnpm generate
cd ..\..

echo.
echo 7. Building web application...
cd apps\web
echo    - Building Next.js application...
call pnpm build >nul 2>&1
cd ..\..

echo.
echo 8. Starting web application with full environment...
start "TWITCHER WEB" cmd /k "set DATABASE_URL=postgresql://twitch:twitch@localhost:5433/twitch&& set REDIS_URL=redis://localhost:6380&& set S3_ENDPOINT=http://localhost:9010&& set S3_ACCESS_KEY=minio&& set S3_SECRET_KEY=minio123&& set S3_BUCKET_NAME=twitcher-videos&& set S3_REGION=us-east-1&& set NEXTAUTH_SECRET=twitcher-dev-secret&& set WORKER_TOKEN=twitcher-worker-secret-token&& cd apps\web&& pnpm dev"

echo.
echo 9. Waiting for web app to start...
powershell -Command "Start-Sleep -Seconds 15"

echo.
echo 10. Setting up MinIO storage...
echo    - Creating twitcher-videos bucket...
curl -s -X POST "http://localhost:3000/api/storage/setup" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ MinIO bucket created successfully
) else (
    echo    ⚠️ MinIO bucket creation may have failed - will auto-create on first upload
)

echo.
echo 11. Starting Python worker...
start "TWITCHER WORKER" cmd /k "set API_BASE=http://localhost:3000&& set WORKER_TOKEN=twitcher-worker-secret-token&& set WORKER_ID=local-worker-1&& cd apps\python-worker&& python worker.py"

echo.
echo 🎉 TWITCHER PRO System Rebuilt and Started!
echo ============================================
echo.
echo 📱 Web Dashboard: http://localhost:3000
echo 🗃️ Database: postgresql://twitch:twitch@localhost:5433/twitch
echo 💾 MinIO Console: http://localhost:9011 (minio/minio123)
echo 🔄 Redis: redis://localhost:6380
echo.
echo ✅ Fresh installation complete with:
echo    - Clean database schema
echo    - Updated dependencies
echo    - Fresh build artifacts
echo    - New Docker volumes
echo.
echo Both web app and worker should be running in separate windows.
echo Check those windows for any error messages.
echo.
pause
