@echo off
echo 🔧 Fixing Current Session Environment
echo ====================================

echo The web app is running but missing WORKER_TOKEN.
echo You have two options:

echo.
echo Option 1: Restart everything properly
echo .\start-complete-system.bat

echo.
echo Option 2: Quick fix - restart just the web app with correct environment
echo.
echo In the terminal where your web app is running:
echo 1. Press Ctrl+C to stop it
echo 2. Run this command:
echo.
echo $env:DATABASE_URL="postgresql://twitch:twitch@localhost:5433/twitch"; $env:REDIS_URL="redis://localhost:6380"; $env:S3_ENDPOINT="http://localhost:9010"; $env:S3_ACCESS_KEY="minio"; $env:S3_SECRET_KEY="minio123"; $env:S3_BUCKET_NAME="twitcher-videos"; $env:S3_REGION="us-east-1"; $env:NEXTAUTH_SECRET="twitcher-dev-secret"; $env:WORKER_TOKEN="twitcher-worker-secret-token"; cd apps/web; pnpm dev
echo.
echo 3. Then run: .\start-worker.bat
echo.

pause
