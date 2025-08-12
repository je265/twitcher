@echo off
echo 🚀 TWITCHER PRO - Quick Infrastructure Setup
echo ==========================================

echo ✅ Starting infrastructure services...
docker-compose -f docker-compose.infra.yml up -d

echo ⏳ Waiting for services...
timeout /t 10 /nobreak >nul

echo 📊 Setting up database...
set DATABASE_URL=postgresql://twitch:twitch@localhost:5433/twitch
cd packages\prisma
call pnpm db:push
call pnpm generate
cd ..\..

echo 🌐 Starting web application...
cd apps\web
start cmd /k "pnpm dev"
cd ..\..

echo.
echo 🎉 TWITCHER PRO is ready!
echo =========================
echo.
echo 📱 Web Dashboard: http://localhost:3000
echo 🗃️ Database: postgresql://twitch:twitch@localhost:5433/twitch
echo 💾 MinIO Console: http://localhost:9011 (minio/minio123)
echo.
echo 🛑 To stop infrastructure: docker-compose -f docker-compose.infra.yml down
echo.
pause
